"""
Lightweight factories for orchestrator infrastructure components.

Provides helpers to obtain a Redis-backed session manager and a Mongo-backed
conversation manager using environment configuration.
"""

from __future__ import annotations

from typing import Tuple

from agentic.agents.orchestrator.session.session import OrchestratorSessionManager
from agentic.agents.orchestrator.conversation.conversation import ConversationManager


def get_default_managers() -> Tuple[OrchestratorSessionManager, ConversationManager]:
    """Return default session and conversation managers using env-configured clients."""
    return OrchestratorSessionManager(), ConversationManager()
