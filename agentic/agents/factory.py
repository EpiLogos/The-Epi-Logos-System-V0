"""
Agent Factory Pattern

Creates coordinate-specific agents (#0-#5) with shared dependencies and CAG tools.
Follows Pydantic AI best practices with OrchestratorDeps dependency injection.

Based on Story 02.24: Multi-Agent Architecture Foundation
"""

import logging
from typing import Dict, Any, Optional
from pydantic_ai import Agent

from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
from agentic.agents.constellation import (
    create_anuttara_agent,
    create_paramasiva_agent,
    create_parashakti_agent,
    create_mahamaya_agent,
    create_nara_agent,
    create_epii_agent
)

logger = logging.getLogger(__name__)


class AgentRegistry:
    """
    Registry for tracking created agents and enabling runtime discovery.

    Provides coordinate-based lookups and constellation management.
    """

    def __init__(self):
        self._agents: Dict[int, Agent[OrchestratorDeps]] = {}
        self._metadata: Dict[int, Dict[str, Any]] = {}

    def register(self, subsystem: int, agent: Agent[OrchestratorDeps]) -> None:
        """Register an agent in the registry"""
        self._agents[subsystem] = agent
        self._metadata[subsystem] = agent._metadata
        logger.debug(f"Registered agent for subsystem #{subsystem}")

    def get(self, subsystem: int) -> Optional[Agent[OrchestratorDeps]]:
        """Get agent by subsystem number"""
        return self._agents.get(subsystem)

    def get_by_coordinate(self, coordinate: str) -> Optional[Agent[OrchestratorDeps]]:
        """Get agent by coordinate string (e.g., '#0', '#1')"""
        # Extract subsystem number from coordinate
        try:
            subsystem = int(coordinate.replace('#', '').split('-')[0])
            return self.get(subsystem)
        except (ValueError, IndexError):
            return None

    def list_all(self) -> Dict[int, Agent[OrchestratorDeps]]:
        """Get all registered agents"""
        return self._agents.copy()

    def get_metadata(self, subsystem: int) -> Optional[Dict[str, Any]]:
        """Get agent metadata"""
        return self._metadata.get(subsystem)


class AgentFactory:
    """
    Factory for creating coordinate-specific Pydantic AI agents.

    All agents:
    - Use OrchestratorDeps as their deps_type (Pydantic AI Pattern 1 requirement)
    - Share common CAG tools (resolve_coordinate, search, etc.)
    - Have coordinate-specific metadata for identification
    - Support Prakāśa phase Bimba initialization (Sprint 3)
    """

    def __init__(self):
        """
        Initialize agent factory.

        Note: Model is specified dynamically when creating agents, following the
        orchestrator pattern where model_name is passed at runtime.
        """
        self.registry = AgentRegistry()
        self._agent_constructors = {
            0: create_anuttara_agent,
            1: create_paramasiva_agent,
            2: create_parashakti_agent,
            3: create_mahamaya_agent,
            4: create_nara_agent,
            5: create_epii_agent
        }
        logger.info("AgentFactory initialized")

    async def create_agent(
        self,
        subsystem: int,
        model_name: str,
        name: Optional[str] = None,
        bimba_client = None,
        redis_client = None
    ) -> Agent[OrchestratorDeps]:
        """
        Create a coordinate-specific agent with specified model.

        Uses ASCP Prakāśa layered architecture for identity initialization.

        Args:
            subsystem: Subsystem number (0-5) corresponding to coordinates #0-#5
            model_name: Model to use (e.g., 'google-gla:gemini-2.0-flash-exp')
            name: Optional agent name override
            bimba_client: Optional BimbaGraphQLClient (creates new if None)
            redis_client: Optional RedisClient (creates new if None)

        Returns:
            Pydantic AI Agent instance with OrchestratorDeps

        Raises:
            ValueError: If subsystem is not in range 0-5
        """
        if subsystem not in range(6):
            raise ValueError(
                f"Invalid subsystem: {subsystem}. Must be between 0 and 5."
            )

        # Get the appropriate constructor
        constructor = self._agent_constructors[subsystem]

        # Create the agent using the async constructor with optional clients
        agent = await constructor(
            model=model_name,
            name=name,
            bimba_client=bimba_client,
            redis_client=redis_client
        )

        # Register agent in registry
        self.registry.register(subsystem, agent)

        coordinate = f"#{subsystem}"
        agent_coordinate = f"#{subsystem}-4.{subsystem}"
        logger.info(
            f"Created agent for coordinate {coordinate} (agent node {agent_coordinate}): "
            f"{agent.__class__.__name__} with model {model_name}"
        )

        return agent

    async def create_constellation(self, model_name: str) -> Dict[int, Agent[OrchestratorDeps]]:
        """
        Create the full 6-agent constellation with specified model.

        Uses ASCP Prakāśa layered architecture for all agent identities.

        Args:
            model_name: Model to use for all agents

        Returns:
            Dict mapping subsystem number (0-5) to Agent instance
        """
        constellation = {}

        for subsystem in range(6):
            constellation[subsystem] = await self.create_agent(subsystem, model_name=model_name)

        logger.info(f"Created full constellation of {len(constellation)} agents with model {model_name}")
        return constellation


# Convenience function for creating single agents
async def create_coordinate_agent(
    subsystem: int,
    model_name: str,
    name: Optional[str] = None
) -> Agent[OrchestratorDeps]:
    """
    Convenience function to create a single coordinate agent.

    Uses ASCP Prakāśa layered architecture for identity initialization.

    Args:
        subsystem: Subsystem number (0-5)
        model_name: Model to use (e.g., 'google-gla:gemini-2.0-flash-exp')
        name: Optional agent name

    Returns:
        Pydantic AI Agent instance
    """
    factory = AgentFactory()
    return await factory.create_agent(subsystem, model_name=model_name, name=name)
