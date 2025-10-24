"""
Delegation Manager for Agent-to-Agent (A2A) Task Delegation

Manages async delegation between agents with proper A2A context propagation.
Implements background task execution with Redis-backed status tracking.

Story 08.07 Enhancement - Epii-Parashakti MEF Delegation
Story 02.24 - A2A Communication Infrastructure
"""

import asyncio
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from agentic.agents.factory import AgentFactory
from agentic.agents.context import A2AContext, A2AContextManager
from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
from shared.database.redis_client import RedisClient
from agentic.agents.constellation import MEF_LENS_DESCRIPTIONS

logger = logging.getLogger(__name__)


class DelegationManager:
    """
    Manages A2A agent delegation with context propagation and async task execution.

    Architecture:
    - Uses AgentFactory to create target agents on-demand
    - Propagates A2AContext through delegation chain
    - Tracks task status and results in Redis
    - Supports async background execution (non-blocking)
    """

    REDIS_TASK_PREFIX = "mef:task:"
    REDIS_RESULT_PREFIX = "mef:result:"
    TASK_TTL = 3600  # 1 hour

    def __init__(
        self,
        factory: AgentFactory,
        redis_client: Optional[RedisClient] = None
    ):
        """
        Initialize delegation manager.

        Args:
            factory: AgentFactory for creating target agents
            redis_client: Redis client for task tracking (creates new if None)
        """
        self.factory = factory
        self.redis = redis_client or RedisClient()
        self.context_manager = A2AContextManager()
        logger.info("DelegationManager initialized with A2A context propagation")

    def _redis_task_key(self, task_id: str) -> str:
        """Get Redis key for task status."""
        return f"{self.REDIS_TASK_PREFIX}{task_id}"

    def _redis_result_key(self, task_id: str) -> str:
        """Get Redis key for task result."""
        return f"{self.REDIS_RESULT_PREFIX}{task_id}"

    async def delegate_mef_analysis_async(
        self,
        from_agent_subsystem: int,
        etymology_community: Dict[str, Any],
        lenses: List[str],
        a2a_context: A2AContext,
        deps: OrchestratorDeps,
        model_name: str = "deepseek/deepseek-r1-distill-llama-70b"
    ) -> str:
        """
        Delegate MEF analysis to Parashakti agent asynchronously.

        Returns task_id immediately. Parashakti processes in background.
        Calling agent (e.g., Epii) can continue dialogue while waiting.

        Args:
            from_agent_subsystem: Source agent subsystem (e.g., 5 for Epii)
            etymology_community: Etymology community data to analyze
            lenses: List of MEF lens names to apply
            a2a_context: A2A context for lineage tracking
            deps: OrchestratorDeps to pass to Parashakti
            model_name: Model for Parashakti (default: DeepSeek reasoning)

        Returns:
            task_id: Task identifier for status/result queries

        Story 08.07 Enhancement - Epii-Parashakti MEF Delegation
        """
        task_id = f"mef_{uuid.uuid4().hex[:12]}"

        # Record handoff in A2A context
        a2a_context.add_handoff(
            from_agent=f"#{from_agent_subsystem}",
            to_agent="#2",  # Parashakti
            reason=f"MEF analysis through {len(lenses)} lenses"
        )

        # Store task metadata in Redis
        task_metadata = {
            "task_id": task_id,
            "status": "processing",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "lenses": lenses,
            "context_id": a2a_context.context_id,
            "session_id": a2a_context.session_id,
            "user_id": a2a_context.user_id,
            "from_agent": f"#{from_agent_subsystem}",
            "to_agent": "#2",
            "model_name": model_name
        }

        self.redis.setex(
            self._redis_task_key(task_id),
            self.TASK_TTL,
            json.dumps(task_metadata)
        )

        # Launch async background task
        asyncio.create_task(
            self._execute_mef_analysis(
                task_id=task_id,
                etymology_community=etymology_community,
                lenses=lenses,
                a2a_context=a2a_context,
                deps=deps,
                model_name=model_name
            )
        )

        logger.info(
            f"Delegated MEF analysis task {task_id} to Parashakti (#2) "
            f"with {len(lenses)} lenses using {model_name}"
        )

        return task_id

    async def _execute_mef_analysis(
        self,
        task_id: str,
        etymology_community: Dict[str, Any],
        lenses: List[str],
        a2a_context: A2AContext,
        deps: OrchestratorDeps,
        model_name: str
    ):
        """
        Background execution of MEF analysis.

        Creates Parashakti agent, runs analysis through each lens,
        stores results in Redis, and updates task status.

        Args:
            task_id: Task identifier
            etymology_community: Etymology data to analyze
            lenses: MEF lenses to apply
            a2a_context: A2A context for tracking
            deps: OrchestratorDeps for agent execution
            model_name: Model to use for Parashakti
        """
        try:
            logger.info(f"Starting MEF analysis task {task_id} in background")

            # Create Parashakti agent with reasoning model
            parashakti = await self.factory.create_agent(
                subsystem=2,  # Parashakti
                model_name=model_name
            )

            results = {}

            # Process each lens sequentially
            for lens in lenses:
                lens_desc = MEF_LENS_DESCRIPTIONS.get(lens)

                if not lens_desc:
                    logger.warning(f"Unknown lens '{lens}' - skipping")
                    results[lens] = {
                        "success": False,
                        "error": f"Unknown lens: {lens}"
                    }
                    continue

                logger.info(f"Task {task_id}: Analyzing through {lens_desc['name']} lens")

                try:
                    # Call Parashakti's analyze_through_mef_lens tool
                    # Build tool invocation message
                    tool_message = (
                        f"Use the analyze_through_mef_lens tool to analyze this etymology:\n"
                        f"Etymology community: {json.dumps(etymology_community, indent=2)}\n"
                        f"Lens: {lens_desc['name']}\n"
                        f"Coordinate: {lens_desc['coordinate']}\n"
                        f"Questions: {json.dumps(lens_desc['questions'])}"
                    )

                    # Run Parashakti agent
                    result = await parashakti.run(
                        tool_message,
                        deps=deps,
                        message_history=a2a_context.conversation_memory
                    )

                    # Extract analysis from result
                    results[lens] = {
                        "success": True,
                        "lens_name": lens_desc["name"],
                        "coordinate": lens_desc["coordinate"],
                        "analysis": result.data if hasattr(result, 'data') else str(result),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }

                    logger.info(f"Task {task_id}: Completed {lens_desc['name']} analysis")

                except Exception as lens_error:
                    logger.error(f"Task {task_id}: Error in {lens} analysis: {lens_error}")
                    results[lens] = {
                        "success": False,
                        "lens_name": lens_desc["name"],
                        "coordinate": lens_desc["coordinate"],
                        "error": str(lens_error)
                    }

            # Store results in Redis
            result_data = {
                "task_id": task_id,
                "etymology_community": etymology_community,
                "lenses_analyzed": lenses,
                "results": results,
                "total_lenses": len(lenses),
                "successful_lenses": sum(1 for r in results.values() if r.get("success")),
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "context_id": a2a_context.context_id
            }

            self.redis.setex(
                self._redis_result_key(task_id),
                self.TASK_TTL,
                json.dumps(result_data, default=str)
            )

            # Update task status to completed
            task_update = {
                "task_id": task_id,
                "status": "completed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "lenses_analyzed": len(results),
                "successful_analyses": sum(1 for r in results.values() if r.get("success"))
            }

            self.redis.setex(
                self._redis_task_key(task_id),
                self.TASK_TTL,
                json.dumps(task_update)
            )

            logger.info(
                f"MEF analysis task {task_id} completed: "
                f"{task_update['successful_analyses']}/{len(results)} lenses successful"
            )

        except Exception as e:
            logger.error(f"MEF analysis task {task_id} failed: {e}")

            # Update task status to failed
            task_failure = {
                "task_id": task_id,
                "status": "failed",
                "error": str(e),
                "failed_at": datetime.now(timezone.utc).isoformat()
            }

            self.redis.setex(
                self._redis_task_key(task_id),
                self.TASK_TTL,
                json.dumps(task_failure)
            )

    async def get_mef_status(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Check MEF task status.

        Args:
            task_id: Task identifier

        Returns:
            Dict with task status or None if not found
        """
        try:
            status_json = self.redis.get(self._redis_task_key(task_id))

            if not status_json:
                return None

            return json.loads(status_json)

        except Exception as e:
            logger.error(f"Error getting MEF task status for {task_id}: {e}")
            return None

    async def get_mef_result(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve completed MEF analysis results.

        Args:
            task_id: Task identifier

        Returns:
            Dict with analysis results or None if not found/not complete
        """
        try:
            result_json = self.redis.get(self._redis_result_key(task_id))

            if not result_json:
                return None

            return json.loads(result_json)

        except Exception as e:
            logger.error(f"Error getting MEF task result for {task_id}: {e}")
            return None

    async def cancel_mef_task(self, task_id: str) -> bool:
        """
        Cancel a running MEF task.

        Note: Actual task cancellation is limited - this marks status as cancelled
        but background asyncio task may still complete.

        Args:
            task_id: Task identifier

        Returns:
            True if task was marked as cancelled
        """
        try:
            # Check if task exists
            status = await self.get_mef_status(task_id)
            if not status:
                return False

            # Can only cancel if still processing
            if status.get("status") != "processing":
                logger.warning(f"Cannot cancel task {task_id} - status: {status.get('status')}")
                return False

            # Update status to cancelled
            cancelled_status = {
                "task_id": task_id,
                "status": "cancelled",
                "cancelled_at": datetime.now(timezone.utc).isoformat()
            }

            self.redis.setex(
                self._redis_task_key(task_id),
                self.TASK_TTL,
                json.dumps(cancelled_status)
            )

            logger.info(f"Cancelled MEF task {task_id}")
            return True

        except Exception as e:
            logger.error(f"Error cancelling MEF task {task_id}: {e}")
            return False
