"""
Agent Constellation - 6 Coordinate-Specific Agents

Implements the 6 subsystem agents (#0-#5) using Pydantic AI patterns.
All agents share OrchestratorDeps and CAG tools.

Based on Story 02.24: Multi-Agent Architecture Foundation
Sprint 3 Refactor: ASCP Prakāśa layered architecture integration
"""

import logging
from typing import Optional
from pydantic_ai import Agent

from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
from agentic.agents.shared_tools import setup_all_cag_tools
from agentic.agents.prakasa import PrakasaManager
from agentic.clients.bimba_graphql_client import BimbaGraphQLClient
from shared.database.redis_client import RedisClient

logger = logging.getLogger(__name__)


# Agent Creator Functions

async def create_anuttara_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create Anuttara agent (#0 - Proto-logical void processor).

    Uses ASCP Prakāśa layered architecture for identity initialization.

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient (creates new if None)
        redis_client: Optional RedisClient (creates new if None)

    Returns:
        Pydantic AI Agent for subsystem #0
    """
    # Initialize clients if not provided
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    # Get identity Prakāśa (Layer 1) from agent node #0-4.0
    agent_coordinate = "#0-4.0"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,  # ASCP Layer 1 identity
        retries=2
    )

    # Add metadata for coordinate awareness
    agent._metadata = {
        "subsystem": 0,
        "coordinate": "#0",
        "agent_coordinate": agent_coordinate,
        "name": name or "Anuttara"
    }

    # Store PrakasaManager reference for potential workflow engagement
    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    # Register shared CAG tools
    setup_all_cag_tools(agent)

    logger.info(f"Created Anuttara agent ({agent_coordinate}) with model {model}")
    return agent


# Define the agent class for isinstance checks
class AnuttaraAgent:
    """Marker class for Anuttara agent"""
    pass


async def create_paramasiva_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create Paramasiva agent (#1 - Quaternal Logic engine).

    Uses ASCP Prakāśa layered architecture for identity initialization.

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient (creates new if None)
        redis_client: Optional RedisClient (creates new if None)

    Returns:
        Pydantic AI Agent for subsystem #1
    """
    # Initialize clients if not provided
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#1-4.1"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,
        retries=2
    )

    agent._metadata = {
        "subsystem": 1,
        "coordinate": "#1",
        "agent_coordinate": agent_coordinate,
        "name": name or "Paramasiva"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    setup_all_cag_tools(agent)

    logger.info(f"Created Paramasiva agent ({agent_coordinate}) with model {model}")
    return agent


class ParamasivaAgent:
    """Marker class for Paramasiva agent"""
    pass


async def create_parashakti_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create Parashakti agent (#2 - Vibrational processor).

    Uses ASCP Prakāśa layered architecture for identity initialization.

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient (creates new if None)
        redis_client: Optional RedisClient (creates new if None)

    Returns:
        Pydantic AI Agent for subsystem #2
    """
    # Initialize clients if not provided
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#2-4.2"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,
        retries=2
    )

    agent._metadata = {
        "subsystem": 2,
        "coordinate": "#2",
        "agent_coordinate": agent_coordinate,
        "name": name or "Parashakti"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    setup_all_cag_tools(agent)

    logger.info(f"Created Parashakti agent ({agent_coordinate}) with model {model}")
    return agent


class ParashaktiAgent:
    """Marker class for Parashakti agent"""
    pass


async def create_mahamaya_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create Mahamaya agent (#3 - Symbolic transcription engine).

    Uses ASCP Prakāśa layered architecture for identity initialization.

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient (creates new if None)
        redis_client: Optional RedisClient (creates new if None)

    Returns:
        Pydantic AI Agent for subsystem #3
    """
    # Initialize clients if not provided
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#3-4.3"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,
        retries=2
    )

    agent._metadata = {
        "subsystem": 3,
        "coordinate": "#3",
        "agent_coordinate": agent_coordinate,
        "name": name or "Mahamaya"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    setup_all_cag_tools(agent)

    logger.info(f"Created Mahamaya agent ({agent_coordinate}) with model {model}")
    return agent


class MahamayaAgent:
    """Marker class for Mahamaya agent"""
    pass


async def create_nara_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create Nara agent (#4 - Dialogical interface).

    Uses ASCP Prakāśa layered architecture for identity initialization.

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient (creates new if None)
        redis_client: Optional RedisClient (creates new if None)

    Returns:
        Pydantic AI Agent for subsystem #4
    """
    # Initialize clients if not provided
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#4-4.4"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,
        retries=2
    )

    agent._metadata = {
        "subsystem": 4,
        "coordinate": "#4",
        "agent_coordinate": agent_coordinate,
        "name": name or "Nara"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    setup_all_cag_tools(agent)

    logger.info(f"Created Nara agent ({agent_coordinate}) with model {model}")
    return agent


class NaraAgent:
    """Marker class for Nara agent"""
    pass


async def create_epii_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create Epii agent (#5 - Master orchestrator and wisdom synthesis).

    Uses ASCP Prakāśa layered architecture for identity initialization.

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient (creates new if None)
        redis_client: Optional RedisClient (creates new if None)

    Returns:
        Pydantic AI Agent for subsystem #5
    """
    # Initialize clients if not provided
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#5-4.5"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,
        retries=2
    )

    agent._metadata = {
        "subsystem": 5,
        "coordinate": "#5",
        "agent_coordinate": agent_coordinate,
        "name": name or "Epii"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    setup_all_cag_tools(agent)

    logger.info(f"Created Epii agent ({agent_coordinate}) with model {model}")
    return agent


class EpiiAgent:
    """Marker class for Epii agent"""
    pass
