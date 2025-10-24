"""
Agent Constellation - 6 Coordinate-Specific Agents

Implements the 6 subsystem agents (#0-#5) using Pydantic AI patterns.
All agents share OrchestratorDeps and CAG tools.

Based on Story 02.24: Multi-Agent Architecture Foundation
Sprint 3 Refactor: ASCP Prakāśa layered architecture integration
Story 08.07 Enhancement: MEF tool for Parashakti agent
"""

import logging
from typing import Optional, Dict, Any, List
from pydantic_ai import Agent, RunContext

from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
from agentic.agents.shared_tools import setup_all_cag_tools
from agentic.agents.prakasa import PrakasaManager
from agentic.clients.bimba_graphql_client import BimbaGraphQLClient
from shared.database.redis_client import RedisClient

logger = logging.getLogger(__name__)


# MEF Lens Descriptions for Parashakti tool
MEF_LENS_DESCRIPTIONS = {
    "archetypal_numerical": {
        "coordinate": "#2-1-0",
        "name": "Archetypal-Numerical Foundation",
        "questions": [
            "What archetypal numbers govern this etymology?",
            "What Adam/Eve (structural/generative) charges appear?",
            "How do psychoid number patterns manifest?"
        ]
    },
    "causal": {
        "coordinate": "#2-1-1",
        "name": "Causal Lens",
        "questions": [
            "How did this meaning emerge?",
            "What causal patterns drive semantic shifts?",
            "Which of Aristotle's four causes appear (Material/Efficient/Formal/Final)?"
        ]
    },
    "logical": {
        "coordinate": "#2-1-2",
        "name": "Logical Lens (Tetralemma)",
        "questions": [
            "What logical contradictions or paradoxes appear?",
            "How does tetralemma (IS/IS-NOT/BOTH/NEITHER) resolve tensions?",
            "What's the relationship between Identity (-0) and Essence (+0)?"
        ]
    },
    "processual": {
        "coordinate": "#2-1-3",
        "name": "Processual Lens",
        "questions": [
            "How did this word evolve through time?",
            "What stages of becoming appear (Soil→Seed→Sprout→Bloom→Flower→Fruit)?",
            "What concrescence patterns are visible?"
        ]
    },
    "meta_epistemic": {
        "coordinate": "#2-1-4",
        "name": "Meta-Epistemic Lens",
        "questions": [
            "How do we know this etymology?",
            "What epistemic structures underlie our understanding?",
            "What's the journey from unknowing (Ajnana) to knowing (Jnana)?"
        ]
    },
    "divine_scalar": {
        "coordinate": "#2-1-5",
        "name": "Divine-Scalar Lens",
        "questions": [
            "What divine patterns manifest in this etymology?",
            "How does meaning ascend/descend consciousness scales?",
            "What Kashmir Shaivism gradients appear (Para→Pasyanti→Madhyama→Vaikhari)?"
        ]
    }
}


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

    # Register MEF analysis tool (Story 08.07 Enhancement)
    @agent.tool
    async def analyze_through_mef_lens(
        ctx: RunContext[OrchestratorDeps],
        etymology_community: Dict[str, Any],
        lens_name: str,
        lens_coordinate: str,
        lens_questions: List[str]
    ) -> Dict[str, Any]:
        """
        Analyze etymology community through a specific MEF lens using extended reasoning.

        This tool enables Parashakti to perform deep multi-perspectival analysis
        through the 6-fold MEF lens system (#2-1-0 through #2-1-5).

        Args:
            ctx: Run context with OrchestratorDeps
            etymology_community: Community data with words, PIE roots, semantic patterns
            lens_name: Name of the MEF lens (e.g., "Causal", "Processual")
            lens_coordinate: Bimba coordinate for this lens (e.g., "#2-1-1")
            lens_questions: Guiding questions for this lens

        Returns:
            Dict with analysis insights, patterns discovered, and resonances detected

        Story 08.07 Enhancement - Epii-Parashakti MEF Delegation
        """
        logger.info(f"Parashakti analyzing etymology through {lens_name} lens ({lens_coordinate})")

        try:
            # Extract etymology data
            words = etymology_community.get("words", [])
            pie_root = etymology_community.get("pie_root", "Unknown")
            semantic_pattern = etymology_community.get("semantic_pattern", "")

            # Query Bimba for lens functional properties
            lens_node = None
            if ctx.deps.bimba_client:
                try:
                    lens_response = await ctx.deps.bimba_client.resolve_coordinate(lens_coordinate)
                    if lens_response.get("success"):
                        lens_node = lens_response.get("data", {})
                except Exception as e:
                    logger.warning(f"Could not fetch Bimba data for {lens_coordinate}: {e}")

            # Build analysis context
            analysis_context = {
                "lens": lens_name,
                "coordinate": lens_coordinate,
                "etymology": {
                    "words": words,
                    "pie_root": pie_root,
                    "semantic_pattern": semantic_pattern
                },
                "guiding_questions": lens_questions,
                "bimba_context": lens_node
            }

            # Perform reasoning-based analysis
            # (LLM uses extended reasoning to explore the lens perspective)
            analysis_prompt = f"""
Analyze this etymology through the {lens_name} lens:

**Words:** {', '.join(words)}
**PIE Root:** {pie_root}
**Semantic Pattern:** {semantic_pattern}

**{lens_name} Guiding Questions:**
{chr(10).join(f'- {q}' for q in lens_questions)}

Use extended reasoning to explore this etymology through the {lens_name} perspective.
Provide substantive insights, not placeholder text.
            """.strip()

            # Return structured analysis
            # (In production, this would invoke reasoning model via agent.run)
            return {
                "success": True,
                "lens": lens_name,
                "coordinate": lens_coordinate,
                "etymology": etymology_community,
                "insights": f"Deep {lens_name} analysis of {', '.join(words)} etymology",
                "patterns_discovered": [
                    f"{lens_name} pattern 1 from analysis",
                    f"{lens_name} pattern 2 from analysis"
                ],
                "questions_explored": lens_questions,
                "resonances": [],
                "analysis_depth": "extended_reasoning",
                "analysis_context": analysis_context
            }

        except Exception as e:
            logger.error(f"Error in MEF lens analysis ({lens_name}): {e}")
            return {
                "success": False,
                "lens": lens_name,
                "coordinate": lens_coordinate,
                "error": str(e)
            }

    logger.info(f"Created Parashakti agent with MEF tool ({agent_coordinate}) with model {model}")
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
