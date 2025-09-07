"""
Capabilities service for UnifiedOrchestrator.

Defines the orchestrator as the single source of truth for available models
and providers by combining runtime provider readiness with configured model
allow lists and defaults.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import os
import json

import yaml  # type: ignore

from ..llm_services import llm_manager


def _split_provider_model(name: str) -> Tuple[str, str]:
    if ":" in name:
        p, m = name.split(":", 1)
        return p.strip(), m.strip()
    # Default to openai provider if missing
    return "openai", name.strip()


@dataclass(frozen=True)
class ModelInfo:
    """Model capability descriptor."""
    name: str
    provider: str
    ready: bool
    default: bool = False


class Capabilities:
    """Compute orchestrator capabilities from config and service readiness."""

    def __init__(self) -> None:
        self._providers = self._load_providers()
        self._allowed, self._default_cfg = self._load_allowed_models()

    def _load_providers(self) -> Dict[str, bool]:
        status = llm_manager.get_service_status()
        return {
            "openai": bool(status.get("openai")),
            "gemini": bool(status.get("gemini")),
            "anthropic": bool(status.get("anthropic")),
            "deepseek": bool(status.get("deepseek")),
        }

    def _load_allowed_models(self) -> Tuple[List[str], Optional[str]]:
        # Try agentic/config.yaml
        cfg_path_yaml = Path("agentic/config.yaml")
        allowed: List[str] = []
        default_model: Optional[str] = None
        if cfg_path_yaml.exists():
            try:
                cfg = yaml.safe_load(cfg_path_yaml.read_text()) or {}
                models_cfg = (cfg or {}).get("models") or {}
                allowed = list(models_cfg.get("allowed") or [])
                default_model = models_cfg.get("default")
            except Exception:
                pass

        # Env fallbacks
        env_allowed = os.getenv("AGENTIC_MODELS", "").strip()
        if not allowed and env_allowed:
            allowed = [m.strip() for m in env_allowed.split(",") if m.strip()]

        if default_model is None:
            # Provider-specific default fallbacks
            for env_key, provider in [
                ("OPENAI_MODEL", "openai"),
                ("GEMINI_MODEL", "gemini"),
                ("ANTHROPIC_MODEL", "anthropic"),
                ("DEEPSEEK_MODEL", "deepseek"),
            ]:
                val = os.getenv(env_key)
                if val:
                    default_model = f"{provider}:{val}"
                    break

        return allowed, default_model

    def list_providers(self) -> Dict[str, bool]:
        """Return providers readiness map."""
        return dict(self._providers)

    def list_models(self) -> List[ModelInfo]:
        """Return allowed models annotated with readiness and default flag."""
        providers = self._providers
        allowed = self._allowed
        default_effective = self.get_default_model()
        out: List[ModelInfo] = []
        for name in allowed:
            provider, _ = _split_provider_model(name)
            ready = bool(providers.get(provider, False))
            out.append(ModelInfo(name=name, provider=provider, ready=ready, default=(name == default_effective)))
        # If no allowed models configured, expose nothing
        return out

    def validate_model(self, name: str) -> bool:
        """Validate that model is allowed and provider is ready."""
        if not name:
            return False
        provider, _ = _split_provider_model(name)
        if name not in self._allowed:
            return False
        return bool(self._providers.get(provider))

    def get_default_model(self) -> str:
        """Return the effective default model.

        Resolution:
        - Configured default if valid
        - Else first allowed model with ready provider
        - Else raise ValueError
        """
        if self._default_cfg and self.validate_model(self._default_cfg):
            return self._default_cfg
        # Fallback to first allowed+ready
        for name in self._allowed:
            if self.validate_model(name):
                return name
        raise ValueError("No valid default model: no allowed models with ready providers")

