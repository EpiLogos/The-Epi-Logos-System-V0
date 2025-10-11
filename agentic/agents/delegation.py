"""
Delegation Manager - Pydantic AI Pattern 1 (Agent Delegation)

Handles agent-to-agent delegation with usage tracking and context propagation.

Critical Pattern 1 Requirements:
- Pass deps=ctx.deps (shared dependencies)
- Pass usage=ctx.usage (usage aggregation)
- Subagent must share same deps_type (OrchestratorDeps)

Story 02.24 - AC: 7 (PoC Delegation)
"""

import logging
from typing import Dict, Any, Optional, Union
from pydantic_ai import Agent, RunContext
from pydantic_ai.result import AgentRunResult, StreamedRunResult

# Type alias for run results
RunResult = Union[AgentRunResult, StreamedRunResult]

from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
from agentic.agents.router import HybridRouter
from agentic.agents.context import A2AContextManager
from agentic.agents.factory import AgentFactory
from agentic.agents.delegation_events import get_delegation_emitter, DelegationEventType

logger = logging.getLogger(__name__)


class DelegationManager:
    """
    Manages agent delegation using Pydantic AI Pattern 1.

    Responsibilities:
    - Create A2A context packages
    - Select target agents via router
    - Execute delegation with deps + usage
    - Aggregate usage tracking
    """

    def __init__(self, agent_factory: AgentFactory, router: HybridRouter):
        """
        Initialize delegation manager.

        Args:
            agent_factory: Factory for creating target agents
            router: Router for target selection
        """
        self.factory = agent_factory
        self.router = router
        logger.info("DelegationManager initialized")

    def create_delegation_context(
        self,
        ctx: RunContext[OrchestratorDeps],
        target_agent: str,
        reason: str
    ) -> Dict[str, Any]:
        """
        Create context package for delegation.

        Args:
            ctx: Current run context
            target_agent: Target agent identifier
            reason: Reason for delegation

        Returns:
            Context package dict with A2A context_id
        """
        # Build context package using A2AContextManager
        context_package = A2AContextManager.build_context_package(
            session_id=ctx.deps.session_id,
            user_id=ctx.deps.user_id,
            thread_id=None,  # Will be set from AG-UI if available
            user_context=ctx.deps.context_package or {},
            metadata={"delegated_from": "orchestrator"}
        )

        # Propagate context for delegation lineage
        updated_package = A2AContextManager.propagate_context(
            existing_package=context_package,
            from_agent="orchestrator",
            to_agent=target_agent,
            reason=reason
        )

        logger.info(
            f"Created delegation context: orchestrator → {target_agent} "
            f"(context_id: {updated_package['context_id']})"
        )

        # Emit context package build event
        get_delegation_emitter().emit(
            DelegationEventType.CONTEXT_PACKAGE_BUILD,
            {"context_id": updated_package['context_id']}
        )

        # Emit handoff event
        get_delegation_emitter().emit(
            DelegationEventType.CONTEXT_HANDOFF,
            {
                "from_agent": "orchestrator",
                "to_agent": target_agent,
                "reason": reason
            }
        )

        return updated_package

    def select_target_agent(self, message: str) -> Optional[int]:
        """
        Select target agent subsystem for delegation.

        Args:
            message: User request message

        Returns:
            Subsystem number (0-5) or None
        """
        decision = self.router.get_routing_decision(message)

        if decision["should_delegate"]:
            target = decision["target_agent"]
            logger.info(f"Selected target agent: #{target} ({decision['request_type']})")
            return target
        else:
            logger.debug("No delegation needed (lightweight request)")
            return None

    async def delegate(
        self,
        message: str,
        ctx: RunContext[OrchestratorDeps],
        target_subsystem: Optional[int] = None,
        model_name: Optional[str] = None
    ) -> RunResult:
        """
        Execute delegation to target agent using Pattern 1.

        Critical Pattern 1 requirements:
        - Pass deps=ctx.deps for shared dependencies
        - Pass usage=ctx.usage for cost aggregation
        - Target agent must use same deps_type (OrchestratorDeps)

        Args:
            message: Request message to delegate
            ctx: Current run context
            target_subsystem: Optional target (auto-select if None)
            model_name: Optional model for target agent

        Returns:
            RunResult from target agent with aggregated usage

        Raises:
            ValueError: If delegation fails
        """
        # Select target if not provided
        if target_subsystem is None:
            target_subsystem = self.select_target_agent(message)

            if target_subsystem is None:
                raise ValueError("No target agent selected for delegation")

        # Get target agent from factory
        if model_name is None:
            # Use same model as orchestrator (from deps state if available)
            model_name = ctx.deps.state.get("model") if ctx.deps.state else "test"

        # Check if agent already exists in registry
        target_agent = self.factory.registry.get(target_subsystem)

        if target_agent is None:
            # Create new agent instance
            logger.info(f"Creating target agent for subsystem #{target_subsystem}")
            target_agent = await self.factory.create_agent(
                subsystem=target_subsystem,
                model_name=model_name
            )

        # Create delegation context
        request_type = self.router.identify_request_type(message)
        context_package = self.create_delegation_context(
            ctx,
            target_agent=f"agent_{target_subsystem}",
            reason=request_type.value
        )

        # Update deps with delegation context
        delegation_deps = OrchestratorDeps(
            session_id=ctx.deps.session_id,
            user_id=ctx.deps.user_id,
            redis_client=ctx.deps.redis_client,
            mongodb_client=ctx.deps.mongodb_client,
            bimba_client=ctx.deps.bimba_client,
            lightrag_client=ctx.deps.lightrag_client,
            graphiti_client=ctx.deps.graphiti_client,
            current_persona=ctx.deps.current_persona,
            context_package=context_package,
            state=ctx.deps.state or {}
        )

        logger.info(
            f"Delegating to agent #{target_subsystem}: {message[:50]}... "
            f"(context_id: {context_package['context_id']})"
        )

        # Emit delegation start event
        message_preview = message[:50] + "..." if len(message) > 50 else message
        get_delegation_emitter().emit(
            DelegationEventType.DELEGATION_START,
            {
                "target_subsystem": target_subsystem,
                "message_preview": message_preview
            }
        )

        # Execute delegation with Pattern 1 requirements
        try:
            result = await target_agent.run(
                message,
                deps=delegation_deps,  # CRITICAL: Pass deps for shared state
                usage=ctx.usage        # CRITICAL: Pass usage for aggregation
            )

            logger.info(
                f"Delegation complete: agent #{target_subsystem} → orchestrator "
                f"(usage aggregated: {ctx.usage})"
            )

            # Emit delegation complete event
            get_delegation_emitter().emit(
                DelegationEventType.DELEGATION_COMPLETE,
                {
                    "target_subsystem": target_subsystem,
                    "success": True
                }
            )

            # Emit usage aggregation event
            if ctx.usage:
                get_delegation_emitter().emit(
                    DelegationEventType.USAGE_AGGREGATED,
                    {
                        "orchestrator_tokens": ctx.usage.request_tokens + ctx.usage.response_tokens,
                        "delegated_tokens": result.usage().total_tokens if hasattr(result, 'usage') else 0,
                        "total_tokens": ctx.usage.total_tokens
                    }
                )

            return result

        except Exception as e:
            # Emit delegation failure event
            get_delegation_emitter().emit(
                DelegationEventType.DELEGATION_COMPLETE,
                {
                    "target_subsystem": target_subsystem,
                    "success": False,
                    "error": str(e)
                }
            )
            raise


async def delegate_to_agent(
    message: str,
    ctx: RunContext[OrchestratorDeps],
    factory: AgentFactory,
    router: HybridRouter,
    target_subsystem: Optional[int] = None
) -> RunResult:
    """
    Convenience function for agent delegation.

    Args:
        message: Request message
        ctx: Run context
        factory: Agent factory
        router: Hybrid router
        target_subsystem: Optional target subsystem

    Returns:
        RunResult from delegated agent
    """
    manager = DelegationManager(factory, router)
    return await manager.delegate(message, ctx, target_subsystem)
