import asyncio
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, Iterable, List, Optional, Tuple

import importlib
from uuid import uuid4

from .agui_payload import build_run_agent_input
from .diagnostics import DiagnosticsRecorder
import logging

logger = logging.getLogger(__name__)

class OrchestratorAdapter:
    """Tiny adapter that normalizes interactions with UnifiedOrchestrator.

    This provides:
    - Model listing/selection (static registry, provider:model style)
    - Session lifecycle (user_id, session_id)
    - Persona switching (uses orchestrator's switch and in-memory sys-injection)
    - System-prompt injection by temporarily patching persona prompts
    - Streaming emulation for non-streaming underlying calls
    """

    # Thin client; no local model registry

    def __init__(self,
                 model: str,
                 user_id: str = "cli-user",
                 persona_key: Optional[str] = None,
                 system_override: str = "",
                 diagnostics: Optional[DiagnosticsRecorder] = None,
                 trace_id_override: Optional[str] = None,
                 ) -> None:
        self.user_id = user_id
        self.model = model
        self.session_id: Optional[str] = None
        self.persona_key = persona_key or "system"
        self.system_override = system_override or ""

        # Orchestrator deps from env
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.mongodb_url = os.getenv("MONGODB_URL", os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        self.graphql_endpoint = os.getenv("GRAPHQL_ENDPOINT", "http://localhost:8000/graphql")

        # Diagnostics
        self.diag = diagnostics or DiagnosticsRecorder()
        self.trace_id_override = trace_id_override

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

    # --- Capabilities ---
    async def get_capabilities(self) -> Dict[str, Any]:
        return self.orch.get_capabilities()

    # 🎭 PERSONA MODEL MANAGEMENT
    async def set_persona_model(self, persona: str, model: str) -> bool:
        """Set model for a specific persona"""
        try:
            core_mod = importlib.import_module('agentic.orchestrator.core')
            PersonaType = getattr(core_mod, 'PersonaType')
            persona_type = PersonaType(persona.upper())
            return self.orch.set_persona_model(persona_type, model)
        except Exception as e:
            logger.error(f"Error setting persona model: {e}")
            return False

    async def get_persona_models(self) -> Dict[str, str]:
        """Get current model assignments for all personas"""
        try:
            assignments = self.orch.get_persona_models()
            return {persona.value.lower(): model for persona, model in assignments.items()}
        except Exception as e:
            logger.error(f"Error getting persona models: {e}")
            return {}

    async def validate_persona_models(self) -> Dict[str, bool]:
        """Validate all persona model assignments"""
        try:
            validation = self.orch.validate_persona_models()
            return {persona.value.lower(): valid for persona, valid in validation.items()}
        except Exception as e:
            logger.error(f"Error validating persona models: {e}")
            return {}

    # --- Personas ---
    async def list_orchestrator_personas(self) -> List[str]:
        try:
            return self.orch.persona_manager.list_available_personas()
        except Exception:
            return ["system"]

    # --- Session ---
    async def start_session(self) -> str:
        # Create a session by sending a no-op start message
        core_mod = importlib.import_module('agentic.orchestrator.core')
        OrchestratorRequest = getattr(core_mod, 'OrchestratorRequest')

        req = OrchestratorRequest(
            user_id=self.user_id,
            message="/start",
        )
        resp = await self.orch.process_request(req)
        self.session_id = resp.session_id
        # Apply system override via official method if provided
        if self.system_override:
            await self.orch.update_session_instructions(self.session_id, self.system_override)
        return self.session_id

    async def switch_persona(self, persona_key: str) -> bool:
        core_mod = importlib.import_module('agentic.orchestrator.core')
        PersonaType = getattr(core_mod, 'PersonaType')

        # Only switch if persona exists in orchestrator
        personas = await self.list_orchestrator_personas()
        if persona_key in personas:
            if not self.session_id:
                await self.start_session()
            ok = await self.orch.switch_persona(self.session_id, PersonaType(persona_key))
            if ok:
                self.persona_key = persona_key
            return ok
        return False

    async def update_model_in_session(self, model: str) -> bool:
        if not self.session_id:
            await self.start_session()
        return await self.orch.update_session_model(self.session_id, model)

    async def update_sys_override(self, text: Optional[str]) -> bool:
        if not self.session_id:
            await self.start_session()
        self.system_override = text or ""
        return await self.orch.update_session_instructions(self.session_id, text)

    async def clear(self) -> None:
        # Clear session context by creating a new session id
        self.session_id = None

    # --- Messaging ---
    async def send_message(self, text: str, stream: bool = True, strict: bool = False, timeout_s: float | None = None) -> Tuple[Iterable[str], Dict[str, Any]]:
        """Send a message; returns AG-UI event stream or fallback to non-streaming."""
        core_mod = importlib.import_module('agentic.orchestrator.core')
        OrchestratorRequest = getattr(core_mod, 'OrchestratorRequest')

        if not self.session_id:
            await self.start_session()

        req = OrchestratorRequest(
            user_id=self.user_id,
            session_id=self.session_id,
            message=text,
            requested_persona=None,
        )

        start = datetime.now(timezone.utc)

        if stream:
            # Use AG-UI streaming if available
            try:
                stream_iter, meta = await self._stream_ag_ui_events(req, start, timeout_s=timeout_s)

                async def _guarded_stream() -> AsyncGenerator[str, None]:
                    had_output = False
                    async for chunk in stream_iter:
                        had_output = True
                        self.diag.record_chunk(chunk)
                        yield chunk
                    if not had_output:
                        # No output from stream; fallback to non-streaming
                        if strict:
                            raise RuntimeError("No stream events within timeout; strict streaming is enabled")
                        else:
                            fb_iter, _ = await self._fallback_non_streaming(req, start)
                            async for c in fb_iter:
                                self.diag.record_chunk(c)
                                yield c
                return _guarded_stream(), meta
            except Exception as e:
                # Fallback to non-streaming if AG-UI fails at setup
                if strict:
                    raise
                else:
                    print(f"AG-UI streaming failed, falling back to non-streaming: {e}")
                    return await self._fallback_non_streaming(req, start)
        else:
            # Non-streaming mode
            return await self._fallback_non_streaming(req, start)

    async def _stream_ag_ui_events(self, req, start_time, timeout_s: float | None = None) -> Tuple[AsyncGenerator[str, None], Dict[str, Any]]:
        """Stream real AG-UI events from the orchestrator."""
        collected_text = []
        error_msg = None
        success = True
        active_persona = None
        trace_id = self.trace_id_override or str(uuid4())

        async def _ag_ui_streamer() -> AsyncGenerator[str, None]:
            nonlocal collected_text, error_msg, success, active_persona

            try:
                # Build canonical AG-UI payload and stream from orchestrator
                thread_id = self.session_id or str(uuid4())
                # Ask orchestrator for session status to populate model hint
                status = await self.orch.get_session_status(self.session_id) if self.session_id else None
                model_hint = status.get("model_name") if status else None
                agui = build_run_agent_input(
                    thread_id=thread_id,
                    user_text=req.message,
                    persona=self.persona_key,
                    system_override=self.system_override or None,
                    tools=[],
                    state={},
                    forwarded_props={"model": model_hint},
                )
                # Diagnostics
                self.diag.dump_payload_shape(trace_id=trace_id, kind="agui.run_input", payload=agui)
                self.diag.start_turn(trace_id=trace_id, session_id=self.session_id, model=model_hint, persona_key=self.persona_key)

                stream_gen = self.orch.process_ag_ui_input_stream(agui)

                async def next_event_with_timeout():
                    # Timeout protects against silent hangs
                    to = timeout_s if (timeout_s and timeout_s > 0) else 5.0
                    return await asyncio.wait_for(stream_gen.__anext__(), timeout=to)

                while True:
                    try:
                        event_str = await next_event_with_timeout()
                    except StopAsyncIteration:
                        break
                    
                    # Parse AG-UI event - enhanced SSE parsing
                    if event_str.startswith('data: ') or '\n' in event_str:
                        try:
                            # Support multi-line SSE "data:" frames
                            data_lines = []
                            for line in event_str.splitlines():
                                if line.startswith('data: '):
                                    data_lines.append(line[6:])
                            payload = "\n".join(data_lines) if data_lines else event_str[6:] if event_str.startswith('data: ') else event_str
                            event_data = json.loads(payload.strip())
                            event_type = event_data.get('type', '')

                            # Extract text content from AG-UI events
                            if event_type == 'text_message_content':
                                content = event_data.get('content', '')
                                if content:
                                    self.diag.record_first_token()
                                    collected_text.append(content)
                                    yield content
                            elif event_type == 'run_error':
                                error_msg = event_data.get('message', 'Unknown error')
                                success = False
                                yield f"Error: {error_msg}"
                                break
                            elif event_type == 'run_started':
                                # Extract persona info if available
                                active_persona = event_data.get('persona', active_persona)
                            elif event_type == 'run_finished':
                                # Mark completion
                                success = True

                        except json.JSONDecodeError as e:
                            # If it's plain text content, yield as chunk
                            self.diag.record_first_token()
                            yield payload
                            continue
                        except Exception as e:
                            logger.warning(f"Error processing AG-UI event: {e}")
                            continue
                    elif event_str.startswith('event: '):
                        # ✅ Handle SSE event type metadata
                        event_type = event_str[7:].rstrip('\n')
                        logger.debug(f"AG-UI event type: {event_type}")
                        continue
                    elif event_str.startswith('id: '):
                        # ✅ Handle SSE event ID
                        event_id = event_str[4:].rstrip('\n')
                        logger.debug(f"AG-UI event ID: {event_id}")
                        continue
                    elif event_str.strip() == '':
                        # ✅ Handle SSE event separators
                        continue
                # End of stream

            except Exception as e:
                error_msg = str(e)
                success = False
                yield f"Error: {e}"

            # ✅ Capture end time AFTER streaming completes
            finally:
                nonlocal end_time
                end_time = datetime.now(timezone.utc)
                self.diag.end_turn()

        # Initialize end_time in case streaming never starts
        end_time = start_time

        # Query session status for current model
        status = await self.orch.get_session_status(self.session_id)
        meta = {
            "success": success,
            "model": status.get("model_name") if status else None,
            "persona": self.persona_key,
            "active_persona": active_persona,
            "latency_ms": int((end_time - start_time).total_seconds() * 1000),
            "first_token_ms": self.diag.turn.first_token_ms if self.diag.turn else None,
            "error": error_msg,
            "streaming_mode": "ag_ui"
        }

        return _ag_ui_streamer(), meta

    async def _fallback_non_streaming(self, req, start_time) -> Tuple[AsyncGenerator[str, None], Dict[str, Any]]:
        """Fallback to non-streaming mode using original process_request."""
        resp = await self.orch.process_request(req)
        end_time = datetime.now(timezone.utc)

        self.session_id = resp.session_id
        final_text = resp.response or ""

        async def _fallback_streamer() -> AsyncGenerator[str, None]:
            # Emulate streaming by yielding small chunks for compatibility
            chunk = []
            for token in final_text.split():
                chunk.append(token)
                if len(chunk) >= 8:
                    yield " ".join(chunk) + " "
                    chunk = []
                    await asyncio.sleep(0)
            if chunk:
                yield " ".join(chunk)

        # Query session status for current model
        status = await self.orch.get_session_status(self.session_id)
        meta = {
            "success": resp.success,
            "model": status.get("model_name") if status else None,
            "persona": self.persona_key,
            "active_persona": getattr(resp, "active_persona", None),
            "latency_ms": int((end_time - start_time).total_seconds() * 1000),
            "error": resp.error,
            "streaming_mode": "fallback"
        }
        return _fallback_streamer(), meta

    # --- Optional persona-model helpers (stubs for now) ---
    async def get_persona_models(self) -> Dict[str, str]:
        """Return persona->model mapping if supported; otherwise empty."""
        return {}

    async def validate_persona_models(self) -> Dict[str, bool]:
        """Return persona->bool readiness validation; otherwise empty."""
        return {}

    async def set_persona_model(self, persona: str, model: str) -> bool:
        """Attempt to set a persona's model; returns False if unsupported."""
        return False
