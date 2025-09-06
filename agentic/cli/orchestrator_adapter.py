import asyncio
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, Iterable, List, Optional, Tuple

import importlib


@dataclass
class ModelInfo:
    name: str
    provider: str
    description: str = ""


def _split_provider_model(name: str) -> Tuple[str, str]:
    if ":" in name:
        p, m = name.split(":", 1)
        return p, m
    # Default to pydantic-ai style openai:*
    return "openai", name


class OrchestratorAdapter:
    """Tiny adapter that normalizes interactions with UnifiedOrchestrator.

    This provides:
    - Model listing/selection (static registry, provider:model style)
    - Session lifecycle (user_id, session_id)
    - Persona switching (uses orchestrator's switch and in-memory sys-injection)
    - System-prompt injection by temporarily patching persona prompts
    - Streaming emulation for non-streaming underlying calls
    """

    # Curated registry; keep small and editable via env overrides
    DEFAULT_MODELS: List[ModelInfo] = [
        ModelInfo("openai:gpt-4o", "openai", "OpenAI Omni general model"),
        ModelInfo("openai:gpt-4.1", "openai", "OpenAI GPT-4.1"),
        ModelInfo("anthropic:claude-3-5-sonnet-20240620", "anthropic", "Claude 3.5 Sonnet"),
        ModelInfo("gemini:gemini-2.5-pro", "gemini", "Google Gemini 2.5 Pro"),
        ModelInfo("deepseek:deepseek-chat", "deepseek", "DeepSeek chat model"),
    ]

    def __init__(self,
                 model: str,
                 user_id: str = "cli-user",
                 persona_key: Optional[str] = None,
                 system_override: str = "") -> None:
        self.user_id = user_id
        self.model = model
        self.session_id: Optional[str] = None
        self.persona_key = persona_key or "system"
        self.system_override = system_override or ""

        # Orchestrator deps from env
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.mongodb_url = os.getenv("MONGODB_URL", os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        self.graphql_endpoint = os.getenv("GRAPHQL_ENDPOINT", "http://localhost:8000/graphql")

        # Lazy-init orchestrator instance
        self._orch = None

    @property
    def orch(self):
        if self._orch is None:
            core_mod = importlib.import_module('agentic.orchestrator.core')
            UnifiedOrchestrator = getattr(core_mod, 'UnifiedOrchestrator')
            self._orch = UnifiedOrchestrator(
                redis_url=self.redis_url,
                mongodb_url=self.mongodb_url,
                graphql_endpoint=self.graphql_endpoint,
                model_name=self.model,
            )
        return self._orch

    # --- Models ---
    @classmethod
    def list_models(cls) -> List[ModelInfo]:
        # Allow env override (comma-separated provider:model)
        extra = os.getenv("AGENTIC_EXTRA_MODELS", "").strip()
        models = list(cls.DEFAULT_MODELS)
        if extra:
            for token in extra.split(","):
                name = token.strip()
                if not name:
                    continue
                provider, _ = _split_provider_model(name)
                models.append(ModelInfo(name=name, provider=provider, description="custom"))
        return models

    # --- Personas ---
    async def list_orchestrator_personas(self) -> List[str]:
        try:
            return self.orch.persona_manager.list_available_personas()
        except Exception:
            return ["system"]

    # --- Session ---
    async def start_session(self) -> str:
        # Create a no-op request to get a session_id, or create via SessionManager
        core_mod = importlib.import_module('agentic.orchestrator.core')
        OrchestratorRequest = getattr(core_mod, 'OrchestratorRequest')

        req = OrchestratorRequest(
            user_id=self.user_id,
            message="/start",
            requested_persona=None,
        )
        resp = await self.orch.process_request(req)
        self.session_id = resp.session_id
        # If system override provided, make it effective by patching persona prompt
        await self._apply_sys_override(self.persona_key, self.system_override)
        return self.session_id

    async def _apply_sys_override(self, persona_key: str, sys_text: str) -> None:
        if not sys_text:
            return
        try:
            pm = self.orch.persona_manager
            cfg = pm.get_persona_config(persona_key)
            if cfg is None:
                # fallback to system persona
                cfg = pm.get_persona_config("system")
                persona_key = "system"
            if cfg is None:
                return
            base = cfg.system_prompt or ""
            merged = base.rstrip() + "\n\nAdditional system instruction (live):\n" + sys_text.strip()
            cfg.system_prompt = merged
            self.persona_key = persona_key
        except Exception:
            pass

    async def switch_persona(self, persona_key: str) -> bool:
        core_mod = importlib.import_module('agentic.orchestrator.core')
        PersonaType = getattr(core_mod, 'PersonaType')

        # Only switch if persona exists in orchestrator; else keep SYSTEM and apply sys injection
        personas = await self.list_orchestrator_personas()
        if persona_key in personas:
            if not self.session_id:
                await self.start_session()
            ok = await self.orch.switch_persona(self.session_id, PersonaType(persona_key))
            if ok:
                self.persona_key = persona_key
            return ok
        else:
            # treat as CLI-only persona by applying sys injection
            self.persona_key = "system"
            return True

    async def switch_model(self, model: str) -> None:
        # Recreate orchestrator with new model; re-apply sys override
        self.model = model
        self._orch = None
        # On next access, orch is recreated
        await self._apply_sys_override(self.persona_key, self.system_override)

    async def clear(self) -> None:
        # Clear session context by creating a new session id
        self.session_id = None

    # --- Messaging ---
    async def send_message(self, text: str, stream: bool = True) -> Tuple[Iterable[str], Dict[str, Any]]:
        """Send a message; returns a token iterator (emulated) and metadata."""
        core_mod = importlib.import_module('agentic.orchestrator.core')
        OrchestratorRequest = getattr(core_mod, 'OrchestratorRequest')

        if not self.session_id:
            await self.start_session()

        # Ensure override is applied for the current persona key
        await self._apply_sys_override(self.persona_key, self.system_override)

        req = OrchestratorRequest(
            user_id=self.user_id,
            session_id=self.session_id,
            message=text,
            requested_persona=None,  # persona determined internally unless specified
        )

        start = datetime.now(timezone.utc)
        resp = await self.orch.process_request(req)
        end = datetime.now(timezone.utc)

        self.session_id = resp.session_id

        final_text = resp.response or ""

        async def _streamer() -> AsyncGenerator[str, None]:
            if not stream:
                yield final_text
                return
            # Emulate streaming by yielding small chunks
            chunk = []
            for token in final_text.split():
                chunk.append(token)
                if len(chunk) >= 8:
                    yield " ".join(chunk) + " "
                    chunk = []
                    await asyncio.sleep(0)
            if chunk:
                yield " ".join(chunk)

        meta = {
            "success": resp.success,
            "model": self.model,
            "persona": self.persona_key,
            "active_persona": getattr(resp, "active_persona", None),
            "latency_ms": int((end - start).total_seconds() * 1000),
            "error": resp.error,
        }
        return _streamer(), meta
