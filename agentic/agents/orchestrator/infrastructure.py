"""
Lightweight factories for orchestrator infrastructure components.

Provides helpers to obtain a Redis-backed session manager and a Mongo-backed
conversation service using environment configuration.
"""

from __future__ import annotations

from typing import Tuple

from agentic.agents.orchestrator.session.session import OrchestratorSessionManager
from shared.database.conversation_service import ConversationService


def get_default_managers() -> Tuple[OrchestratorSessionManager, ConversationService]:
    """Return default session and conversation service using env-configured clients."""
    return OrchestratorSessionManager(), ConversationService()
