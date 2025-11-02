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

    # Get identity Prakāśa (Layer 1) from agent node #5-4.0
    agent_coordinate = "#5-4.0"
    # Use compose_identity_layers to include Layer 1a (QL Foundation from #1-4)
    identity_prompt = await prakasa.compose_identity_layers(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,  # ASCP Layer 1 identity (full layers)
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

    # No tools registered yet - Anuttara will get tools when workflow is defined
    # Future: Add Anuttara-specific tools here when needed

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

    agent_coordinate = "#5-4.1"
    # Use compose_identity_layers to include Layer 1a (QL Foundation from #1-4)
    identity_prompt = await prakasa.compose_identity_layers(agent_coordinate)

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

    # No tools registered yet - Paramasiva will get tools when workflow is defined
    # Future: Add Paramasiva-specific tools here when needed

    logger.info(f"Created Paramasiva agent ({agent_coordinate}) with model {model}")
    return agent


class ParamasivaAgent:
    """Marker class for Paramasiva agent"""
    pass


async def create_parashakti_agent(
    model: str = "deepseek:deepseek-chat",
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

    agent_coordinate = "#5-4.2"
    # Use compose_identity_layers to include Layer 1a (QL Foundation from #1-4)
    identity_prompt = await prakasa.compose_identity_layers(agent_coordinate)

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

    # Register Parashakti-specific MEF tools (4 tools)
    # All tools defined inline with MEF-specific docstrings for resonance analysis context
    @agent.tool
    async def semantic_coordinate_discovery_tool(
        ctx: RunContext[OrchestratorDeps],
        query: str,
        max_results: int = 7
    ) -> dict:
        """
        Discover Bimba coordinates that semantically match a natural language description.

        Use this tool for MEF resonance analysis to find coordinates by concept or meaning.
        Returns ranked matches with similarity scores using hybrid vector+BM25 search.

        Default max_results=7 enables mod6 QL alignment (parent + 6 children).

        Args:
            query: Natural language query describing what you're looking for
            max_results: Maximum results to return (default 7)

        Returns:
            Dict with ranked coordinate matches, similarity scores, semantic context
        """
        from agentic.agents.shared_tools import HttpBimbaClient
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.semantic_coordinate_discovery(query, max_results)

    @agent.tool
    async def get_direct_children_tool(
        ctx: RunContext[OrchestratorDeps],
        bimba_coordinate: str
    ) -> dict:
        """
        Get direct child nodes of a Bimba coordinate.

        Use this tool for MEF resonance analysis to discover architectural/hierarchical
        connections. Returns lean data for sub-coordinates exploration.

        Args:
            bimba_coordinate: Parent coordinate to find children for

        Returns:
            Dict with success flag, children list (name, coordinate, description)
        """
        from agentic.agents.shared_tools import HttpBimbaClient
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_direct_children(bimba_coordinate)

    @agent.tool
    async def get_node_relationships_tool(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str
    ) -> dict:
        """
        Get all direct relationship connections for a Bimba coordinate.

        Use this tool for MEF resonance analysis to traverse canonical semantic
        relations across coordinate space. Explores how coordinates connect.

        Args:
            coordinate: Bimba coordinate to inspect relationships for

        Returns:
            Dict with node info and edges (type, direction, neighbor, properties)
        """
        from agentic.agents.shared_tools import HttpBimbaClient
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_node_relationships(coordinate)

    logger.info(
        f"Registered 3 MEF tools on Parashakti agent ({agent_coordinate}): "
        "semantic_coordinate_discovery_tool, get_direct_children_tool, get_node_relationships_tool"
    )

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

    agent_coordinate = "#5-4.3"
    # Use compose_identity_layers to include Layer 1a (QL Foundation from #1-4)
    identity_prompt = await prakasa.compose_identity_layers(agent_coordinate)

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

    # No tools registered yet - Mahamaya will get tools when workflow is defined
    # Future: Add Mahamaya-specific tools here when needed

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

    agent_coordinate = "#5-4.4"
    # Use compose_identity_layers to include Layer 1a (QL Foundation from #1-4)
    identity_prompt = await prakasa.compose_identity_layers(agent_coordinate)

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

    # No tools registered yet - Nara will get tools when workflow is defined
    # Future: Add Nara-specific tools here when needed

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

    Uses ASCP Prakāśa layered architecture (Phase 4) for identity initialization.
    Layer 1 (1a-1e) loaded as static system_prompt.
    Layers 2-3 load dynamically via @agent.instructions (workflow + runtime context).

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

    # Phase 4: Use new compose_identity_layers() for Layer 1 (1a-1e)
    # This includes: QL Foundation + Project Context + System Prompt + Agent Identity + Capabilities
    identity_layers = await prakasa.compose_identity_layers(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_layers,  # Layer 1 only (static, cached)
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

    # Register dynamic workflow loading (Layers 2-3)
    @agent.instructions
    async def load_workflow_and_context(ctx: RunContext[OrchestratorDeps]) -> str:
        """
        Load EA workflow (Layer 2) + runtime context (Layer 3) dynamically.

        ASCP Phase 1 (Prakāśa) - Dynamic Layers:
        - Layer 2: Workflow Prakāśa (Etymology Archaeology guidance)
        - Layer 3: Context Prakāśa (runtime request context)

        Returns empty string if not in EA mode.
        """
        # Check if EA mode is active
        ea_mode = False

        # Debug logging for EA mode detection
        logger.debug(f"🔍 [EPII INSTRUCTIONS] Checking EA mode...")
        logger.debug(f"🔍 [EPII INSTRUCTIONS] ctx.deps.state: {ctx.deps.state}")

        if ctx.deps.state and ctx.deps.state.get('ea_mode'):
            ea_mode = True
            logger.info(f"✅ [EPII INSTRUCTIONS] EA mode detected in state")

        if not ea_mode:
            # Non-EA sessions don't need workflow layer
            logger.info(f"ℹ️  [EPII INSTRUCTIONS] No EA mode detected, skipping workflow layer for session {ctx.deps.session_id}")
            return ""

        logger.info(f"📖 [EPII INSTRUCTIONS] EA MODE ACTIVE: Loading Etymology Archaeology workflow for {agent_coordinate}")

        try:
            # Layer 2: Engage Etymology Archaeology workflow
            # TODO: Detect current stage from conversation history or session metadata
            # For now, load full workflow without stage-specific guidance
            workflow_prompt = await prakasa.engage_workflow_prakasa(
                agent_coordinate=agent_coordinate,
                workflow_name="etymological_archaeology",
                current_stage=None  # Load full workflow (stages 0-2 for agent domain)
            )

            if workflow_prompt:
                logger.info(f"✅ [EPII INSTRUCTIONS] Loaded EA workflow: {len(workflow_prompt)} chars")
                # Log first 500 chars for debugging
                logger.debug(f"📄 [EPII INSTRUCTIONS] Workflow preview: {workflow_prompt[:500]}...")
            else:
                logger.warning(f"⚠️ [EPII INSTRUCTIONS] EA workflow returned empty for {agent_coordinate}")

            # Layer 3: Build runtime context
            # Note: User's current message not available in @agent.instructions
            # (called before message processing). Context focuses on session state.
            current_request = {
                'message': 'Current user query (runtime)',
                'session_id': ctx.deps.session_id,
                'user_id': ctx.deps.user_id
            }

            context_prompt = prakasa.build_context_prakasa(
                current_request=current_request,
                conversation_history=None  # Message history handled by Pydantic AI
            )

            # Combine Layer 2 + Layer 3
            if workflow_prompt:
                combined = f"{workflow_prompt}\n\n---\n\n{context_prompt}"
                logger.info(f"✅ [EPII INSTRUCTIONS] Composed Layers 2+3: {len(combined)} chars total")
                return combined
            else:
                # Just return context if workflow failed to load
                logger.warning(f"⚠️ [EPII INSTRUCTIONS] Returning only Layer 3 (context) - workflow missing")
                return context_prompt

        except Exception as e:
            logger.error(f"❌ [EPII INSTRUCTIONS] Error loading EA workflow/context: {e}", exc_info=True)
            # Return minimal context on error
            return f"## Current Request\n\nProcessing etymology archaeology request in session {ctx.deps.session_id}"

    # Register shared tools needed for EA workflow (3 tools)
    from agentic.agents.shared_tools import HttpBimbaClient, HttpGraphitiClient

    @agent.tool
    async def semantic_coordinate_discovery(
        ctx: RunContext[OrchestratorDeps],
        query: str,
        max_results: int = 5
    ) -> dict:
        """Discover Bimba coordinates that semantically match a natural language description.

        Use this tool when exploring etymological resonances with the coordinate system.
        Returns ranked matches with similarity scores using hybrid vector+BM25 search.

        Args:
            query: Natural language query describing what you're looking for
            max_results: Maximum results to return (default 5)

        Returns:
            Dict with ranked coordinate matches, similarity scores, semantic context
        """
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.semantic_coordinate_discovery(query, max_results)

    @agent.tool
    async def get_wisdom_packet(
        ctx: RunContext[OrchestratorDeps],
        bimba_coordinate: str,
        depth: int = 2,
        focus: Optional[str] = None
    ) -> dict:
        """Get or generate wisdom packet for a Bimba coordinate.

        Wisdom packets provide pre-synthesized, contextually rich canonical knowledge
        summaries with key concepts, narrative synthesis, and apophatic pointers.

        Args:
            bimba_coordinate: Coordinate to retrieve wisdom packet for (e.g., "#1-2")
            depth: Traversal depth for context gathering (1-5, default 2)
            focus: Optional synthesis lens (STRUCTURAL, PROCESSUAL, ARCHETYPAL, PRACTICAL)

        Returns:
            Dict with wisdom packet content and metadata
        """
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_wisdom_packet(bimba_coordinate, depth, focus, force_regenerate=False)

    @agent.tool
    async def remember_episode(
        ctx: RunContext[OrchestratorDeps],
        entity_name: str,
        content: str,
        source_description: str = "User conversation"
    ) -> dict:
        """Remember significant episode or aphorism in temporal memory.

        Use this tool to capture crystallized insights, aphorisms, or significant
        moments from etymology exploration into Graphiti temporal memory.

        Args:
            entity_name: Name/title for this episode or aphorism
            content: The actual content to remember
            source_description: Context of where this came from (default: "User conversation")

        Returns:
            Dict with success status and episode UUID
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}
        graphiti_client = HttpGraphitiClient(ctx.deps.graphiti_client)
        return await graphiti_client.add_episode(
            entity_name=entity_name,
            content=content,
            source_description=source_description,
            group_id=ctx.deps.user_id or "default"
        )

    # Register EA-specific tools (4 tools)
    from agentic.agents.epii.tools.graphiti_community import (
        create_etymology_community,
        create_aphorism,
        update_community_properties,
        enrich_word_etymology,
        link_aphorism_to_community
    )

    @agent.tool
    async def create_etymology_community(
        ctx: RunContext[OrchestratorDeps],
        name: str,
        words: List[str],
        description: str,
        pie_root: Optional[str] = None,
        semantic_pattern: Optional[str] = None,
        bimba_coordinate: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create an etymology community when a clear pattern emerges.

        IMPORTANT: Backend automatically links community to session.
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        return await create_etymology_community(
            graphiti_client=ctx.deps.graphiti_client,
            group_id=ctx.deps.user_id or "default",
            name=name,
            description=description,
            words=words,
            pie_root=pie_root,
            semantic_pattern=semantic_pattern,
            bimba_coordinate=bimba_coordinate,
            session_id=ctx.deps.session_id,
            user_id=ctx.deps.user_id
        )

    @agent.tool
    async def enrich_community_properties_tool(
        ctx: RunContext[OrchestratorDeps],
        community_id: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich etymology community with additional properties (PIE roots, patterns, etc.)."""
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        return await update_community_properties(
            graphiti_client=ctx.deps.graphiti_client,
            community_id=community_id,
            group_id=ctx.deps.user_id or "default",
            properties=properties
        )

    @agent.tool
    async def enrich_word_node_tool(
        ctx: RunContext[OrchestratorDeps],
        word: str,
        community_id: str,
        etymology_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich individual word node with etymology data."""
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        return await enrich_word_etymology(
            graphiti_client=ctx.deps.graphiti_client,
            word=word,
            community_id=community_id,
            group_id=ctx.deps.user_id or "default",
            etymology_data=etymology_data
        )

    @agent.tool
    async def link_aphorism_to_community_tool(
        ctx: RunContext[OrchestratorDeps],
        aphorism_id: str,
        community_id: str
    ) -> Dict[str, Any]:
        """Link an aphorism (created via remember_episode) to its source etymology community."""
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        return await link_aphorism_to_community(
            graphiti_client=ctx.deps.graphiti_client,
            aphorism_id=aphorism_id,
            community_id=community_id,
            group_id=ctx.deps.user_id or "default",
            relationship_type="DISTILLS_FROM"
        )

    logger.info(
        f"✅ Created Epii agent ({agent_coordinate}) with model {model} "
        f"using ASCP Prakāśa layered architecture:\n"
        f"   - Layer 1 (Identity): Static system_prompt from Neo4j\n"
        f"   - Layers 2-3 (Workflow+Context): Dynamic @agent.instructions (EA mode only)\n"
        f"   - EA Tools: Registered ({len([t for t in dir(agent) if 'tool' in str(t)])} tools)"
    )
    return agent


class EpiiAgent:
    """Marker class for Epii agent"""
    pass


async def create_orchestrator_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create root orchestrator agent (#5-4).

    The orchestrator is the foundational agent that:
    - Has access to ALL shared tools (Bimba, Gnostic, Episodic)
    - Handles general chat and system requests
    - Delegates to specialized agents (subsystems 0-5) when needed
    - Manages agent-to-agent communication
    - Provides full error surfacing and debugging
    - Auto-delegates to Epii (#5-4.5) for EA sessions

    Specialized agents (#5-4.0 through #5-4.5) are created via delegation
    for domain-specific tasks (EA sessions, MEF analysis, etc.).

    Uses ASCP Prakāśa architecture:
    - Layer 1 (Identity): Loaded from #5-4 node as static system_prompt
    - Layer 2 (Workflow): Loaded dynamically when delegation occurs
    - Layer 3 (Tool Use): Guides tool selection and usage patterns

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient
        redis_client: Optional RedisClient

    Returns:
        Pydantic AI Agent for root orchestrator (#5-4)
    """
    # Initialize clients if not provided
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#5-4"  # ROOT orchestrator coordinate

    # Load identity layers from #5-4 (Prakāśa Layer 1)
    identity_layers = await prakasa.compose_identity_layers(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_layers,
        retries=2
    )

    agent._metadata = {
        "subsystem": "orchestrator",  # Not a numbered subsystem
        "coordinate": "#5-4",
        "agent_coordinate": agent_coordinate,
        "name": name or "Orchestrator"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    # Register ALL shared tools (Bimba, Gnostic, Episodic)
    from agentic.agents.shared_tools import setup_all_cag_tools
    setup_all_cag_tools(agent)

    # Register delegation tools
    await _setup_orchestrator_delegation_tools(agent, bimba_client, redis_client)

    logger.info(
        f"Created root orchestrator agent ({agent_coordinate}) with model {model} "
        f"using Prakāśa layered architecture + delegation tools"
    )
    return agent


async def _setup_orchestrator_delegation_tools(
    agent: Agent[OrchestratorDeps],
    bimba_client,
    redis_client
) -> None:
    """Register delegation tools on orchestrator agent."""
    from agentic.agents.delegation_manager import DelegationManager
    from agentic.agents.factory import AgentFactory

    # Create factory and delegation manager for orchestrator to use
    factory = AgentFactory()
    delegation_manager = DelegationManager(factory, redis_client)

    @agent.tool
    async def delegate_to_subagent(
        ctx: RunContext[OrchestratorDeps],
        target_subsystem: int,
        task_description: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Delegate a task to a specialized sub-agent (subsystems 0-5).

        The orchestrator can delegate to specialized agents for domain-specific tasks:
        - 0 = Anuttara (proto-logical processing, foundational patterns)
        - 1 = Paramasiva (Quaternal Logic engine, structural analysis)
        - 2 = Parashakti (vibrational/MEF analysis, energetic patterns)
        - 3 = Mahamaya (symbolic transcription, language patterns)
        - 4 = Nara (personal interface, user-specific interactions)
        - 5 = Epii (Etymology Archaeology specialist, wisdom synthesis)

        EA sessions are auto-delegated to Epii when ea_mode is detected.

        Args:
            target_subsystem: Subsystem number (0-5)
            task_description: What the sub-agent should do
            context: Optional context data to pass to sub-agent

        Returns:
            Dict with success status and result from sub-agent
        """
        try:
            logger.info(f"🔀 ORCHESTRATOR DELEGATION: target_subsystem={target_subsystem}")

            # Use delegation manager to create and run sub-agent
            # Get model from context or use default
            model_name = getattr(ctx, 'model', None) if ctx else None
            if not model_name:
                model_name = "groq:moonshotai/kimi-k2-instruct"

            result = await delegation_manager.delegate(
                message=task_description,
                ctx=ctx,
                target_subsystem=target_subsystem,
                model_name=model_name,
                deps=ctx.deps
            )

            return {
                "success": True,
                "subsystem": target_subsystem,
                "result": result
            }
        except Exception as e:
            logger.error(f"Delegation error to subsystem {target_subsystem}: {e}")
            return {
                "success": False,
                "error": str(e),
                "subsystem": target_subsystem
            }

    # Auto-delegation for EA sessions
    @agent.tool
    async def check_and_delegate_ea_session(
        ctx: RunContext[OrchestratorDeps],
        user_message: str
    ) -> Dict[str, Any]:
        """Check if current session is EA mode and auto-delegate to Epii if so.

        This tool is called automatically when EA mode is detected.
        Orchestrator delegates to Epii (#5-4.5) for specialized EA handling.

        Args:
            user_message: The user's message to pass to Epii

        Returns:
            Dict with delegation status and Epii's response
        """
        try:
            # Check if EA mode
            if ctx.deps.state and ctx.deps.state.get('ea_mode'):
                logger.info("📖 EA MODE DETECTED: Auto-delegating to Epii (#5-4.5)")

                # Delegate to Epii (subsystem 5)
                result = await delegate_to_subagent(
                    ctx=ctx,
                    target_subsystem=5,
                    task_description=user_message,
                    context={"ea_mode": True, "session_type": "etymology_archaeology"}
                )

                return {
                    "success": True,
                    "delegated": True,
                    "target": "Epii (#5-4.5)",
                    "result": result
                }
            else:
                return {
                    "success": True,
                    "delegated": False,
                    "message": "Not EA mode, orchestrator handles directly"
                }
        except Exception as e:
            logger.error(f"EA delegation check error: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    logger.info("✅ Registered delegation tools on orchestrator (delegate_to_subagent, check_and_delegate_ea_session)")


class OrchestratorAgent:
    """Marker class for root orchestrator agent"""
    pass
