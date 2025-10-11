"""
Hybrid Router - Pydantic AI Pattern 2 (Programmatic Hand-off)

Routes requests to either:
- Lightweight: Orchestrator with persona mask (internal handling)
- Heavyweight: Specialist agent delegation (Pattern 1)

Architecture Compliance:
- Implements Pydantic AI Pattern 2 (Programmatic Hand-off) for routing logic
- Integrates with Pattern 1 (Agent Delegation) for heavyweight requests
- Supports FastA2A library for A2A protocol compliance

Story 02.24 - AC: 3 (Hybrid Router Implementation)

Usage Example:
    ```python
    router = HybridRouter()
    decision = router.get_routing_decision("Synthesize insights")

    if decision['should_delegate']:
        # Use Pattern 1: Agent Delegation
        target_agent = factory.create_agent(decision['target_agent'])
        result = await target_agent.run(message, deps=ctx.deps, usage=ctx.usage)
    else:
        # Use Pattern 2: Persona Mask
        mask_manager.activate_mask(decision['request_type'])
        result = await orchestrator.run(message, deps=ctx.deps)
    ```
"""

import logging
import re
from typing import Dict, Any, Optional, Literal
from enum import Enum

from agentic.agents.delegation_events import get_delegation_emitter, DelegationEventType

logger = logging.getLogger(__name__)


class RequestComplexity(Enum):
    """Request complexity classification"""
    LIGHTWEIGHT = "lightweight"
    HEAVYWEIGHT = "heavyweight"


class RequestType(Enum):
    """Request type categories"""
    GREETING = "greeting"
    SIMPLE_QUERY = "simple_query"
    COORDINATE_LOOKUP = "coordinate_lookup"
    ANALYSIS = "analysis"
    SYNTHESIS = "synthesis"
    DOCUMENT_PROCESSING = "document_processing"
    MULTI_STEP_WORKFLOW = "multi_step_workflow"


class HybridRouter:
    """
    Implements Pydantic AI Pattern 2 (Programmatic Hand-off).

    Classifies requests and routes to appropriate handling:
    - Lightweight → Orchestrator (persona mask)
    - Heavyweight → Agent delegation (Pattern 1)
    """

    # Keywords indicating heavyweight processing
    HEAVYWEIGHT_KEYWORDS = [
        "analyze", "synthesis", "synthesize", "compare", "correlate",
        "patterns", "insights", "deep", "comprehensive", "detailed analysis",
        "across all", "all coordinates", "entire", "complete",
        "document", "process", "transform", "integrate"
    ]

    # Keywords indicating lightweight processing
    LIGHTWEIGHT_KEYWORDS = [
        "hello", "hi", "hey", "what is", "tell me", "explain",
        "show me", "describe", "what does", "how do i"
    ]

    # Coordinate query pattern
    COORDINATE_PATTERN = re.compile(r'#\d+(?:[-\.]\d+)*')

    def __init__(self):
        """Initialize hybrid router"""
        logger.info("HybridRouter initialized with Pattern 2 (Programmatic Hand-off)")

    def classify_request(self, message: str) -> RequestComplexity:
        """
        Classify request complexity for routing decision.

        Args:
            message: User request message

        Returns:
            RequestComplexity (LIGHTWEIGHT or HEAVYWEIGHT)
        """
        message_lower = message.lower().strip()

        # Check for heavyweight indicators
        heavyweight_score = sum(
            1 for keyword in self.HEAVYWEIGHT_KEYWORDS
            if keyword in message_lower
        )

        # Check for lightweight indicators
        lightweight_score = sum(
            1 for keyword in self.LIGHTWEIGHT_KEYWORDS
            if keyword in message_lower
        )

        # Check message length (longer messages tend to be more complex)
        word_count = len(message.split())

        # Check for multiple coordinate references (heavyweight)
        coordinate_count = len(self.COORDINATE_PATTERN.findall(message))

        # Classification logic
        if heavyweight_score > 0:
            complexity = RequestComplexity.HEAVYWEIGHT
        elif lightweight_score > 0 and word_count < 20:
            complexity = RequestComplexity.LIGHTWEIGHT
        elif word_count > 30 or coordinate_count > 2:
            complexity = RequestComplexity.HEAVYWEIGHT
        else:
            # Default to lightweight for simple queries
            complexity = RequestComplexity.LIGHTWEIGHT

        logger.debug(
            f"Request classification: {complexity.value} "
            f"(heavy={heavyweight_score}, light={lightweight_score}, "
            f"words={word_count}, coords={coordinate_count})"
        )

        # Emit router classification event
        request_type = self.identify_request_type(message)
        get_delegation_emitter().emit(
            DelegationEventType.ROUTER_CLASSIFY,
            {
                "complexity": complexity.value,
                "request_type": request_type.value,
                "heavyweight_score": heavyweight_score,
                "lightweight_score": lightweight_score,
                "word_count": word_count,
                "coordinate_count": coordinate_count
            }
        )

        return complexity

    def identify_request_type(self, message: str) -> RequestType:
        """
        Identify specific request type for specialized handling.

        Args:
            message: User request message

        Returns:
            RequestType enum value
        """
        message_lower = message.lower().strip()

        # Check in priority order (most specific first)

        # Analysis requests (check before greetings)
        if any(kw in message_lower for kw in ["analyze", "analysis", "examine"]):
            return RequestType.ANALYSIS

        # Synthesis requests (check before greetings)
        if any(kw in message_lower for kw in ["synthesize", "synthesis", "integrate"]):
            return RequestType.SYNTHESIS

        # Multi-step workflows
        if any(kw in message_lower for kw in ["workflow", "pipeline", "multi-step"]):
            return RequestType.MULTI_STEP_WORKFLOW

        # Document processing (check for specific patterns)
        if any(kw in message_lower for kw in ["process this document", "process document", "ingest document"]):
            return RequestType.DOCUMENT_PROCESSING

        # Greetings (standalone only)
        words = message_lower.split()
        if words and words[0] in ["hello", "hi", "hey"]:
            return RequestType.GREETING

        # Simple coordinate lookup
        if self.COORDINATE_PATTERN.search(message) and len(message.split()) < 10:
            return RequestType.COORDINATE_LOOKUP

        # Default to simple query
        return RequestType.SIMPLE_QUERY

    def select_target_agent(
        self,
        message: str,
        request_type: Optional[RequestType] = None
    ) -> Optional[int]:
        """
        Select target subagent subsystem for heavyweight delegation.

        Args:
            message: User request message
            request_type: Optional pre-identified request type

        Returns:
            Subsystem number (0-5) or None for orchestrator handling
        """
        if request_type is None:
            request_type = self.identify_request_type(message)

        # Routing logic based on request type
        routing_map = {
            RequestType.SYNTHESIS: 5,  # Epii - synthesis & orchestration
            RequestType.DOCUMENT_PROCESSING: 5,  # Epii - document intelligence
            RequestType.ANALYSIS: 5,  # Epii - pattern analysis
            # Future: Add specialized routing for other agents
            # RequestType.DIALOGICAL: 4,  # Nara - dialogical processing
            # RequestType.SYMBOLIC: 3,    # Mahamaya - symbolic transcription
        }

        target = routing_map.get(request_type)

        if target is not None:
            logger.info(f"Selected target agent: #{target} for {request_type.value}")

            # Emit target selection event
            get_delegation_emitter().emit(
                DelegationEventType.ROUTER_SELECT_TARGET,
                {
                    "target_subsystem": target,
                    "reason": request_type.value
                }
            )
        else:
            logger.debug(f"No specific agent selected for {request_type.value}")

        return target

    def should_delegate(self, message: str) -> bool:
        """
        Determine if request should be delegated to subagent.

        Args:
            message: User request message

        Returns:
            True if should delegate, False for orchestrator handling
        """
        complexity = self.classify_request(message)
        request_type = self.identify_request_type(message)

        # Delegate heavyweight requests
        if complexity == RequestComplexity.HEAVYWEIGHT:
            return True

        # Delegate specific types even if lightweight
        heavyweight_types = {
            RequestType.SYNTHESIS,
            RequestType.DOCUMENT_PROCESSING,
            RequestType.MULTI_STEP_WORKFLOW
        }

        if request_type in heavyweight_types:
            return True

        return False

    def get_routing_decision(self, message: str) -> Dict[str, Any]:
        """
        Get complete routing decision with metadata.

        Args:
            message: User request message

        Returns:
            Routing decision dict with complexity, type, and target
        """
        complexity = self.classify_request(message)
        request_type = self.identify_request_type(message)
        should_delegate = self.should_delegate(message)
        target_agent = self.select_target_agent(message, request_type) if should_delegate else None

        decision = {
            "complexity": complexity.value,
            "request_type": request_type.value,
            "should_delegate": should_delegate,
            "target_agent": target_agent,
            "routing_pattern": "delegation" if should_delegate else "persona_mask",
            "message_length": len(message.split())
        }

        logger.info(
            f"Routing decision: {decision['routing_pattern']} "
            f"(complexity={complexity.value}, type={request_type.value})"
        )

        return decision
