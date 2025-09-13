"""
Minimal orchestrator core: exposes PersonaType for downstream modules.

Note: Full UnifiedOrchestrator implementation is out of scope here; this
module exists to avoid import errors for components that only need the enum.
"""

from agentic.agents.orchestrator.types import PersonaType

__all__ = ["PersonaType"]
