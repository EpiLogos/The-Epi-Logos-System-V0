"""
Orchestrator Session models and Redis-backed manager.

This module defines the `OrchestratorSession` data model and a lightweight
`OrchestratorSessionManager` that persists session metadata in Redis Cloud.

Environment:
- `REDIS_URL` is used by the shared Redis client.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any, Dict, Optional
from datetime import datetime, timezone
import json
import os
import uuid

from shared.database.redis_client import RedisClient
from agentic.agents.orchestrator.types import PersonaType


SESSION_TTL_SECONDS = int(os.getenv("ORCHESTRATOR_SESSION_TTL", "86400"))  # default 24h


@dataclass
class OrchestratorSession:
    """Represents an agentic orchestrator session bound to a user."""

    session_id: str
    user_id: str
    created_at: str
    updated_at: str
    active_persona: str = "system"
    model_name: Optional[str] = None
    system_instructions: Optional[str] = None
    metadata: Dict[str, Any] = None

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc).isoformat()

    @classmethod
    def new(
        cls,
        user_id: str,
        persona: PersonaType | str = PersonaType.SYSTEM,
        model_name: Optional[str] = None,
        system_instructions: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> "OrchestratorSession":
        now = datetime.now(timezone.utc).isoformat()
        return cls(
            session_id=str(uuid.uuid4()),
            user_id=user_id,
            created_at=now,
            updated_at=now,
            active_persona=(persona.value if isinstance(persona, PersonaType) else str(persona or "system")).lower(),
            model_name=model_name,
            system_instructions=system_instructions,
            metadata=metadata or {},
        )


class OrchestratorSessionManager:
    """Redis-backed session manager for orchestrator sessions."""

    def __init__(self, redis_client: Optional[RedisClient] = None) -> None:
        self._redis = redis_client or RedisClient()

    def _key(self, session_id: str) -> str:
        return f"orch:session:{session_id}"

    def create_session(
        self,
        user_id: str,
        persona: PersonaType | str = PersonaType.SYSTEM,
        model_name: Optional[str] = None,
        system_instructions: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> OrchestratorSession:
        sess = OrchestratorSession.new(
            user_id=user_id,
            persona=persona,
            model_name=model_name,
            system_instructions=system_instructions,
            metadata=metadata,
        )
        self.save_session(sess)
        return sess

    def save_session(self, session: OrchestratorSession) -> bool:
        payload = json.dumps(asdict(session))
        return self._redis.setex(self._key(session.session_id), SESSION_TTL_SECONDS, payload)

    def get_session(self, session_id: str) -> Optional[OrchestratorSession]:
        raw = self._redis.get(self._key(session_id))
        if not raw:
            return None
        data = json.loads(raw)
        return OrchestratorSession(**data)

    def touch(self, session_id: str) -> bool:
        sess = self.get_session(session_id)
        if not sess:
            return False
        sess.touch()
        return self.save_session(sess)

    def update_session(
        self,
        session_id: str,
        *,
        persona: Optional[PersonaType | str] = None,
        model_name: Optional[str] = None,
        system_instructions: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[OrchestratorSession]:
        sess = self.get_session(session_id)
        if not sess:
            return None
        if persona is not None:
            sess.active_persona = (persona.value if isinstance(persona, PersonaType) else str(persona)).lower()
        if model_name is not None:
            sess.model_name = model_name
        if system_instructions is not None:
            sess.system_instructions = system_instructions
        if metadata is not None:
            sess.metadata = {**(sess.metadata or {}), **metadata}
        sess.touch()
        self.save_session(sess)
        return sess

    def delete_session(self, session_id: str) -> bool:
        return bool(self._redis.delete(self._key(session_id)))
