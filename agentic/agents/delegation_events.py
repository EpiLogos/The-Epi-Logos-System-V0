"""
Delegation Event Emission System

Provides observability for multi-agent delegation without blocking CLI.
Events can be captured for rich console display or logging.

Story 02.24 - CLI Observability Enhancement
"""

import logging
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum

logger = logging.getLogger(__name__)


class DelegationEventType(Enum):
    """Types of delegation events"""
    ROUTER_CLASSIFY = "router_classify"
    ROUTER_SELECT_TARGET = "router_select_target"
    PRAKASA_INIT_START = "prakasa_init_start"
    PRAKASA_BIMBA_QUERY = "prakasa_bimba_query"
    PRAKASA_CACHE_HIT = "prakasa_cache_hit"
    PRAKASA_CACHE_MISS = "prakasa_cache_miss"
    PRAKASA_PROMPT_COMPOSED = "prakasa_prompt_composed"
    CONTEXT_PACKAGE_BUILD = "context_package_build"
    CONTEXT_HANDOFF = "context_handoff"
    DELEGATION_START = "delegation_start"
    DELEGATION_COMPLETE = "delegation_complete"
    AGENT_PROCESSING = "agent_processing"
    USAGE_AGGREGATED = "usage_aggregated"


@dataclass
class DelegationEvent:
    """Single delegation event"""
    event_type: DelegationEventType
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    data: Dict[str, Any] = field(default_factory=dict)
    agent: Optional[str] = None
    level: str = "info"  # info, debug, warning, error


class DelegationEventEmitter:
    """
    Emits delegation events for observability.

    Supports multiple listeners (CLI, logging, metrics, etc.)
    Non-blocking - events are fire-and-forget.
    """

    def __init__(self):
        """Initialize event emitter"""
        self.listeners: List[Callable[[DelegationEvent], None]] = []
        self.enabled = False  # Disabled by default
        logger.debug("DelegationEventEmitter initialized (disabled)")

    def enable(self):
        """Enable event emission"""
        self.enabled = True
        logger.info("Delegation event emission ENABLED")

    def disable(self):
        """Disable event emission"""
        self.enabled = False
        logger.info("Delegation event emission DISABLED")

    def is_enabled(self) -> bool:
        """Check if event emission is enabled"""
        return self.enabled

    def add_listener(self, listener: Callable[[DelegationEvent], None]):
        """
        Add event listener.

        Args:
            listener: Callback function that receives DelegationEvent
        """
        self.listeners.append(listener)
        logger.debug(f"Added delegation event listener: {listener.__name__}")

    def remove_listener(self, listener: Callable[[DelegationEvent], None]):
        """Remove event listener"""
        if listener in self.listeners:
            self.listeners.remove(listener)
            logger.debug(f"Removed delegation event listener: {listener.__name__}")

    def emit(
        self,
        event_type: DelegationEventType,
        data: Optional[Dict[str, Any]] = None,
        agent: Optional[str] = None,
        level: str = "info"
    ):
        """
        Emit delegation event to all listeners.

        Args:
            event_type: Type of event
            data: Event data payload
            agent: Optional agent identifier
            level: Log level (info, debug, warning, error)
        """
        if not self.enabled:
            return  # Short-circuit if disabled

        event = DelegationEvent(
            event_type=event_type,
            data=data or {},
            agent=agent,
            level=level
        )

        # Fire to all listeners (non-blocking)
        for listener in self.listeners:
            try:
                listener(event)
            except Exception as e:
                logger.error(f"Error in delegation event listener {listener.__name__}: {e}")

    # Convenience methods for common events

    def router_classify(self, message: str, complexity: str, request_type: str):
        """Emit router classification event"""
        self.emit(
            DelegationEventType.ROUTER_CLASSIFY,
            data={
                "message_preview": message[:50],
                "complexity": complexity,
                "request_type": request_type
            }
        )

    def router_select_target(self, target_subsystem: int, reason: str):
        """Emit target agent selection event"""
        self.emit(
            DelegationEventType.ROUTER_SELECT_TARGET,
            data={
                "target_subsystem": target_subsystem,
                "reason": reason
            }
        )

    def prakasa_init_start(self, subsystem: int):
        """Emit Prakāśa initialization start event"""
        self.emit(
            DelegationEventType.PRAKASA_INIT_START,
            data={"subsystem": subsystem},
            agent=f"agent_{subsystem}"
        )

    def prakasa_bimba_query(self, coordinate: str, success: bool):
        """Emit Bimba query event"""
        self.emit(
            DelegationEventType.PRAKASA_BIMBA_QUERY,
            data={"coordinate": coordinate, "success": success}
        )

    def prakasa_cache_hit(self, coordinate: str):
        """Emit cache hit event"""
        self.emit(
            DelegationEventType.PRAKASA_CACHE_HIT,
            data={"coordinate": coordinate},
            level="debug"
        )

    def prakasa_cache_miss(self, coordinate: str):
        """Emit cache miss event"""
        self.emit(
            DelegationEventType.PRAKASA_CACHE_MISS,
            data={"coordinate": coordinate},
            level="debug"
        )

    def prakasa_prompt_composed(self, subsystem: int, prompt_length: int, source: str):
        """Emit prompt composition event"""
        self.emit(
            DelegationEventType.PRAKASA_PROMPT_COMPOSED,
            data={
                "subsystem": subsystem,
                "prompt_length": prompt_length,
                "source": source  # "bimba", "cache", "fallback"
            },
            agent=f"agent_{subsystem}"
        )

    def context_package_build(self, session_id: str, context_id: str):
        """Emit context package build event"""
        self.emit(
            DelegationEventType.CONTEXT_PACKAGE_BUILD,
            data={
                "session_id": session_id,
                "context_id": context_id
            }
        )

    def context_handoff(self, from_agent: str, to_agent: str, reason: str, context_id: str):
        """Emit context handoff event"""
        self.emit(
            DelegationEventType.CONTEXT_HANDOFF,
            data={
                "from_agent": from_agent,
                "to_agent": to_agent,
                "reason": reason,
                "context_id": context_id
            }
        )

    def delegation_start(self, target_subsystem: int, message_preview: str):
        """Emit delegation start event"""
        self.emit(
            DelegationEventType.DELEGATION_START,
            data={
                "target_subsystem": target_subsystem,
                "message_preview": message_preview
            },
            agent=f"agent_{target_subsystem}"
        )

    def delegation_complete(self, target_subsystem: int, success: bool):
        """Emit delegation complete event"""
        self.emit(
            DelegationEventType.DELEGATION_COMPLETE,
            data={
                "target_subsystem": target_subsystem,
                "success": success
            },
            agent=f"agent_{target_subsystem}"
        )

    def agent_processing(self, agent: str, status: str):
        """Emit agent processing status event"""
        self.emit(
            DelegationEventType.AGENT_PROCESSING,
            data={"status": status},
            agent=agent
        )

    def usage_aggregated(self, orchestrator_tokens: int, delegated_tokens: int, total: int):
        """Emit usage aggregation event"""
        self.emit(
            DelegationEventType.USAGE_AGGREGATED,
            data={
                "orchestrator_tokens": orchestrator_tokens,
                "delegated_tokens": delegated_tokens,
                "total_tokens": total
            }
        )


# Global singleton instance
_event_emitter: Optional[DelegationEventEmitter] = None


def get_delegation_emitter() -> DelegationEventEmitter:
    """Get global delegation event emitter singleton"""
    global _event_emitter
    if _event_emitter is None:
        _event_emitter = DelegationEventEmitter()
    return _event_emitter
