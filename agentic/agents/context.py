"""
A2A Context Management

Three-layer context hierarchy for Agent-to-Agent communication:
- Layer 1: session_id (user session in Redis)
- Layer 2: thread_id (AG-UI conversation, Pydantic AI native)
- Layer 3: context_id (A2A agent collaboration lineage)

Story 02.24 - AC: 4 (A2A Communication Infrastructure)
"""

import uuid
import logging
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


@dataclass
class A2AContext:
    """
    Context package for agent-to-agent delegation.

    Follows three-layer hierarchy:
    - session_id: User session identifier
    - thread_id: Conversation thread identifier (Pydantic AI native)
    - context_id: Agent collaboration lineage identifier
    """
    session_id: str
    user_id: str
    context_id: str
    thread_id: Optional[str] = None
    user_context: Dict[str, Any] = field(default_factory=dict)
    conversation_memory: List[Dict[str, Any]] = field(default_factory=list)
    wisdom_packets: List[Dict[str, Any]] = field(default_factory=list)
    coordinate_activations: List[str] = field(default_factory=list)
    agent_handoffs: List[Dict[str, Any]] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: Dict[str, Any] = field(default_factory=dict)

    def add_handoff(self, from_agent: str, to_agent: str, reason: str) -> None:
        """Record agent handoff in lineage"""
        self.agent_handoffs.append({
            "from": from_agent,
            "to": to_agent,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "context_id": self.context_id
        })


class A2AContextManager:
    """
    Manages A2A context creation, propagation, and lineage tracking.

    Implements three-layer context hierarchy for agent collaboration.
    """

    @staticmethod
    def generate_context_id() -> str:
        """
        Generate unique context_id for A2A agent collaboration.

        Returns:
            UUID-based context identifier
        """
        context_id = f"a2a_{uuid.uuid4().hex[:16]}"
        logger.debug(f"Generated context_id: {context_id}")
        return context_id

    @staticmethod
    def create_context(
        session_id: str,
        user_id: str,
        thread_id: Optional[str] = None,
        **kwargs
    ) -> A2AContext:
        """
        Create new A2A context for agent delegation.

        Args:
            session_id: User session identifier
            user_id: User identifier
            thread_id: Optional conversation thread identifier
            **kwargs: Additional context fields

        Returns:
            A2AContext instance with unique context_id
        """
        context_id = A2AContextManager.generate_context_id()

        context = A2AContext(
            session_id=session_id,
            user_id=user_id,
            context_id=context_id,
            thread_id=thread_id,
            **kwargs
        )

        logger.info(
            f"Created A2A context: session={session_id}, "
            f"thread={thread_id}, context={context_id}"
        )

        return context

    @staticmethod
    def build_context_package(
        session_id: str,
        user_id: str,
        thread_id: Optional[str] = None,
        user_context: Optional[Dict[str, Any]] = None,
        conversation_memory: Optional[List[Dict[str, Any]]] = None,
        wisdom_packets: Optional[List[Dict[str, Any]]] = None,
        coordinate_activations: Optional[List[str]] = None,
        agent_handoffs: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Build complete context package for agent delegation.

        Assembles all necessary context for subagent to operate effectively.

        Args:
            session_id: User session identifier
            user_id: User identifier
            thread_id: Conversation thread identifier
            user_context: User-specific context data
            conversation_memory: Conversation history
            wisdom_packets: Accumulated insights
            coordinate_activations: Active coordinates in session
            agent_handoffs: Agent collaboration history
            metadata: Additional metadata

        Returns:
            Complete context package as dict
        """
        context = A2AContextManager.create_context(
            session_id=session_id,
            user_id=user_id,
            thread_id=thread_id,
            user_context=user_context or {},
            conversation_memory=conversation_memory or [],
            wisdom_packets=wisdom_packets or [],
            coordinate_activations=coordinate_activations or [],
            agent_handoffs=agent_handoffs or [],
            metadata=metadata or {}
        )

        package = {
            "session_id": context.session_id,
            "thread_id": context.thread_id,
            "context_id": context.context_id,
            "user_id": context.user_id,
            "user_context": context.user_context,
            "conversation_memory": context.conversation_memory,
            "wisdom_packets": context.wisdom_packets,
            "coordinate_activations": context.coordinate_activations,
            "agent_handoffs": context.agent_handoffs,
            "created_at": context.created_at,
            "metadata": context.metadata
        }

        logger.debug(f"Built context package for context_id: {context.context_id}")
        return package

    @staticmethod
    def extract_lineage(context_package: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract agent collaboration lineage from context package.

        Args:
            context_package: Context package dict

        Returns:
            List of agent handoff records
        """
        return context_package.get("agent_handoffs", [])

    @staticmethod
    def propagate_context(
        existing_package: Dict[str, Any],
        from_agent: str,
        to_agent: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Propagate context to next agent in delegation chain.

        Creates new context_id while maintaining session/thread continuity.

        Args:
            existing_package: Current context package
            from_agent: Source agent identifier
            to_agent: Target agent identifier
            reason: Reason for handoff

        Returns:
            Updated context package with new context_id
        """
        # Generate new context_id for this delegation
        new_context_id = A2AContextManager.generate_context_id()

        # Record handoff
        handoff = {
            "from": from_agent,
            "to": to_agent,
            "reason": reason,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "context_id": new_context_id,
            "parent_context_id": existing_package.get("context_id")
        }

        # Update package
        updated_package = existing_package.copy()
        updated_package["context_id"] = new_context_id
        updated_package["agent_handoffs"] = (
            existing_package.get("agent_handoffs", []) + [handoff]
        )

        logger.info(f"Propagated context: {from_agent} → {to_agent} (reason: {reason})")

        return updated_package
