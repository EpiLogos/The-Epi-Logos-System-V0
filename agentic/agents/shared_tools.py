"""
Shared CAG Tools for All Agents

All tools from orchestrator available to constellation agents.
Tools can be selectively disabled per agent in future iterations.

Based on Story 02.24 AC #2: All agents share CAG tools by default.
"""

import logging
from typing import Dict, Any, Optional, List
from pydantic_ai import Agent, RunContext

from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps
from agentic.agents.orchestrator.tools.bimba.http_bimba_tools import HttpBimbaClient
from agentic.agents.orchestrator.tools.gnostic.http_lightrag_tools import HttpLightRAGClient

logger = logging.getLogger(__name__)


def setup_all_cag_tools(agent: Agent[OrchestratorDeps]) -> None:
    """
    Register ALL CAG tools on an agent (copied from orchestrator).

    Future: Tools can be selectively enabled/disabled per agent as needed.
    For now, all agents get all tools following the "start permissive" pattern.
    """

    # === BIMBA NAMESPACE TOOLS (Canonical Knowledge) ===

    @agent.tool
    async def resolve_coordinate(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str
    ) -> dict:
        """Resolve a Bimba coordinate to get its content and context."""
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.resolve_coordinate(coordinate)

    @agent.tool
    async def inspect_coordinate_detailed(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str
    ) -> dict:
        """Get detailed inspection of a Bimba node with extended properties."""
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_node_by_coordinate_extended(coordinate)

    @agent.tool
    async def get_node_details_complete(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str,
        include_functional_properties: bool = False
    ) -> dict:
        """Get complete node details including all properties.

        Args:
            coordinate: Bimba coordinate to retrieve
            include_functional_properties: If True, include f_* functional properties (default: False)
        """
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_node_details_complete(coordinate, include_functional_properties)

    @agent.tool
    async def get_coordinate_relationships(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str
    ) -> dict:
        """Get all relationships for a Bimba coordinate."""
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_node_relationships(coordinate)

    @agent.tool
    async def get_path_between_coordinates(
        ctx: RunContext[OrchestratorDeps],
        start_coordinate: str,
        end_coordinate: str,
        max_hops: int = 5
    ) -> dict:
        """Find path between two coordinates in the Bimba map."""
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_path_between_coordinates(
            start_coordinate, end_coordinate, max_hops
        )

    @agent.tool
    async def semantic_coordinate_discovery(
        ctx: RunContext[OrchestratorDeps],
        query: str,
        max_results: int = 5
    ) -> dict:
        """Search for coordinates using semantic similarity."""
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.semantic_coordinate_discovery(query, max_results)

    @agent.tool
    async def lexical_coordinate_search(
        ctx: RunContext[OrchestratorDeps],
        search_string: str,
        limit: int = 20
    ) -> dict:
        """Lexical substring search across all Bimba properties.

        Direct property iteration for exact substring matching when semantic/fulltext search fails.
        Finds substrings like 'Iti' in 'My-Self/Iti'. Use when semantic search misses exact string matches.

        Args:
            search_string: String to search for in any property (case-sensitive)
            limit: Maximum results to return (default 20, capped at 50)

        Returns:
            Dict with success flag, results (coordinate, name, description), and error (if any)
        """
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.lexical_coordinate_search(search_string, limit)

    @agent.tool
    async def get_direct_children(
        ctx: RunContext[OrchestratorDeps],
        bimba_coordinate: str
    ) -> dict:
        """Get direct child nodes of a Bimba coordinate.

        Returns lean data (name, coordinate, primaryDesignation, description) for hierarchical children.
        Useful for exploring coordinate hierarchies and discovering sub-coordinates.

        Args:
            bimba_coordinate: Parent coordinate to find children for

        Returns:
            Dict with success flag, children list, and error (if any)
        """
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_direct_children(bimba_coordinate)

    @agent.tool
    async def regenerate_node_embedding(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str
    ) -> dict:
        """Regenerate embedding for a Bimba node (admin only)."""
        # Check admin from context
        is_admin = False
        if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
            user = ctx.deps.context_package.get("user") or {}
            is_admin = bool(user.get("isAdmin", False))
        if not is_admin:
            return {"success": False, "error": "Admin privileges required"}

        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.regenerate_node_embedding(coordinate)

    # === GNOSTIC NAMESPACE TOOLS (Document Intelligence via LightRAG) ===

    @agent.tool
    async def search_gnostic_space(
        ctx: RunContext[OrchestratorDeps],
        query: str,
        mode: str = "hybrid",
        only_need_context: bool = False
    ) -> dict:
        """
        Search the Gnostic knowledge space (LightRAG).

        Modes: naive, local, global, hybrid (default)
        """
        if not ctx.deps.lightrag_client:
            return {"error": "LightRAG client not available"}

        lightrag_client = HttpLightRAGClient(ctx.deps.lightrag_client)
        return await lightrag_client.query(query, mode, only_need_context)

    @agent.tool
    async def get_gnostic_workspace_info(
        ctx: RunContext[OrchestratorDeps]
    ) -> dict:
        """Get workspace information from Gnostic (LightRAG) system."""
        if not ctx.deps.lightrag_client:
            return {"error": "LightRAG client not available"}

        lightrag_client = HttpLightRAGClient(ctx.deps.lightrag_client)
        return await lightrag_client.get_workspace_info()

    @agent.tool
    async def ingest_wisdom(
        ctx: RunContext[OrchestratorDeps],
        content: str,
        description: Optional[str] = None
    ) -> dict:
        """Ingest new wisdom/knowledge into Gnostic space (LightRAG)."""
        if not ctx.deps.lightrag_client:
            return {"success": False, "error": "LightRAG client not available"}

        lightrag_client = HttpLightRAGClient(ctx.deps.lightrag_client)
        return await lightrag_client.insert(content, description)

    # === ASCP TOOLS (Agent Self-Contextualization) ===

    @agent.tool
    async def discover_functional_capabilities(
        ctx: RunContext[OrchestratorDeps],
        workflow_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Discover functional capabilities for this agent's subsystem.

        Queries Bimba for f_* prefixed properties that define agentic workflows
        and operational capabilities. Used for context package assembly when
        delegating to specialized workflows.

        ASCP Phase 1 (Prakāśa): Agents discover their functional capabilities
        through inquiry rather than static configuration.

        Future Sprint Integration: As workflows are developed (Sprint 5+),
        f_* properties will be added to Bimba nodes to define workflow-specific
        protocols. This tool enables agents to discover those capabilities
        dynamically.

        Args:
            workflow_type: Optional filter for specific workflow
                          (e.g., "document_analysis", "pattern_synthesis")

        Returns:
            {
                "coordinate": "#N",
                "subsystem": int,
                "subsystem_name": "epii",
                "functional_capabilities": {
                    "f_document_analysis_workflow": "...",
                    "f_pattern_recognition_protocol": "...",
                    ...
                },
                "available_workflows": ["document_analysis", "pattern_synthesis"],
                "workflow_type_filter": "document_analysis" or None
            }

        Example:
            # Agent building context package for complex delegation
            capabilities = await discover_functional_capabilities(
                workflow_type="document_analysis"
            )
            context_package["workflows"] = capabilities["functional_capabilities"]
        """
        if not ctx.deps.bimba_client:
            return {
                "success": False,
                "error": "Bimba client not available",
                "functional_capabilities": {},
                "available_workflows": []
            }

        try:
            # Determine current agent's subsystem from context
            # For now, return empty capabilities (no f_* properties in graph yet)
            # Sprint 5+ will populate these as workflows are developed

            subsystem = ctx.deps.context_package.get("subsystem", 0) if ctx.deps.context_package else 0
            coordinate = f"#{subsystem}"

            # Map subsystem to name
            subsystem_names = {
                0: "anuttara", 1: "paramasiva", 2: "parashakti",
                3: "mahamaya", 4: "nara", 5: "epii"
            }
            subsystem_name = subsystem_names.get(subsystem, f"agent_{subsystem}")

            # Query for complete node properties
            bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
            result = await bimba_client.get_node_details_complete(coordinate)

            if not result or result.get("success") is False:
                logger.warning(f"Failed to query functional capabilities for {coordinate}")
                return {
                    "success": False,
                    "coordinate": coordinate,
                    "subsystem": subsystem,
                    "subsystem_name": subsystem_name,
                    "functional_capabilities": {},
                    "available_workflows": [],
                    "workflow_type_filter": workflow_type
                }

            # Extract f_* properties
            all_props = result.get("allProperties", {})
            functional_capabilities = {
                k: v for k, v in all_props.items()
                if k.startswith("f_")
            }

            # Extract available workflow types from f_* property names
            available_workflows = []
            for key in functional_capabilities.keys():
                # Extract workflow name from f_{workflow}_*
                # e.g., f_document_analysis_workflow → "document_analysis"
                parts = key.split("_")
                if len(parts) >= 2:
                    workflow = "_".join(parts[1:-1]) if len(parts) > 2 else parts[1]
                    if workflow not in available_workflows:
                        available_workflows.append(workflow)

            # Filter by workflow_type if specified
            if workflow_type:
                filtered_capabilities = {
                    k: v for k, v in functional_capabilities.items()
                    if workflow_type in k
                }
            else:
                filtered_capabilities = functional_capabilities

            logger.info(
                f"Discovered {len(filtered_capabilities)} functional capabilities "
                f"for {coordinate} (filter: {workflow_type or 'none'})"
            )

            return {
                "success": True,
                "coordinate": coordinate,
                "subsystem": subsystem,
                "subsystem_name": subsystem_name,
                "functional_capabilities": filtered_capabilities,
                "available_workflows": available_workflows,
                "workflow_type_filter": workflow_type,
                "note": "Sprint 3: f_* properties not yet populated. Sprint 5+ will add workflow-specific capabilities."
            }

        except Exception as e:
            logger.error(f"Error discovering functional capabilities: {e}")
            return {
                "success": False,
                "error": str(e),
                "functional_capabilities": {},
                "available_workflows": []
            }

    # === ADMIN TOOLS (Bimba Mutations) ===

    @agent.tool
    async def create_bimba_node(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str,
        name: str,
        subsystem: int,
        description: Optional[str] = None,
        operationalEssence: Optional[str] = None,
        coreNature: Optional[str] = None,
        architecturalFunction: Optional[str] = None,
        symbol: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a Bimba node (admin only)."""
        # Check admin privileges
        is_admin = False
        if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
            user = ctx.deps.context_package.get("user") or {}
            is_admin = bool(user.get("isAdmin", False))
        if not is_admin:
            return {
                "success": False,
                "errors": [{"message": "Admin privileges required", "code": "UNAUTHORIZED_ADMIN"}],
            }

        if not ctx.deps.bimba_client:
            return {"success": False, "errors": [{"message": "Bimba client not available"}]}

        payload = {
            "coordinate": coordinate,
            "name": name,
            "subsystem": subsystem,
            "description": description,
            "operationalEssence": operationalEssence,
            "coreNature": coreNature,
            "architecturalFunction": architecturalFunction,
            "symbol": symbol,
        }
        payload = {k: v for k, v in payload.items() if v is not None}

        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.create_bimba_node(payload)

    @agent.tool
    async def update_bimba_node(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str,
        name: Optional[str] = None,
        primaryDesignation: Optional[str] = None,
        coreNature: Optional[str] = None,
        architecturalFunction: Optional[str] = None,
        operationalEssence: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update a Bimba node (admin only, simplified params)."""
        # Check admin
        is_admin = False
        if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
            user = ctx.deps.context_package.get("user") or {}
            is_admin = bool(user.get("isAdmin", False))
        if not is_admin:
            return {"success": False, "errors": [{"message": "Admin privileges required"}]}

        payload = {k: v for k, v in {
            "coordinate": coordinate,
            "name": name,
            "primaryDesignation": primaryDesignation,
            "coreNature": coreNature,
            "architecturalFunction": architecturalFunction,
            "operationalEssence": operationalEssence,
        }.items() if v is not None}

        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.update_bimba_node(payload)

    @agent.tool
    async def create_bimba_relationship(
        ctx: RunContext[OrchestratorDeps],
        from_coordinate: str,
        to_coordinate: str,
        relationship_type: str,
        bidirectional: bool = False,
    ) -> Dict[str, Any]:
        """Create relationship between Bimba coordinates (admin only)."""
        # Check admin
        is_admin = False
        if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
            user = ctx.deps.context_package.get("user") or {}
            is_admin = bool(user.get("isAdmin", False))
        if not is_admin:
            return {"success": False, "errors": [{"message": "Admin privileges required"}]}

        payload = {
            "fromCoordinate": from_coordinate,
            "toCoordinate": to_coordinate,
            "relationshipType": relationship_type,
            "bidirectional": bidirectional,
        }

        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.create_bimba_relationship(payload)

    @agent.tool
    async def regenerate_all_embeddings(
        ctx: RunContext[OrchestratorDeps],
        batch_size: int = 500,
    ) -> Dict[str, Any]:
        """Admin: Regenerate embeddings for all Bimba nodes (batched)."""
        # Check admin
        is_admin = False
        if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
            user = ctx.deps.context_package.get("user") or {}
            is_admin = bool(user.get("isAdmin", False))
        if not is_admin:
            return {"success": False, "error": "Admin privileges required"}

        if not ctx.deps.bimba_client:
            return {"success": False, "error": "Bimba client not available"}

        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.regenerate_all_embeddings(batch_size)

    # === EPISODIC NAMESPACE TOOLS (Graphiti Temporal Memory) ===

    # === SESSION & CONTEXT TOOLS (Synchronous) ===

    @agent.tool
    def get_session_context(ctx: RunContext[OrchestratorDeps]) -> Dict[str, Any]:
        """
        Retrieve current session context and metadata.

        Returns information about the current session including:
        - User context
        - Active persona
        - Session metadata
        """
        from datetime import datetime, timezone

        context = {
            "session_id": ctx.deps.session_id,
            "user_id": ctx.deps.user_id,
            "current_persona": ctx.deps.current_persona,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Add Redis session data if available
        if ctx.deps.context_package:
            context["session_data"] = ctx.deps.context_package

        return context

    @agent.tool
    def check_context_window_status(ctx: RunContext[OrchestratorDeps]) -> Dict[str, Any]:
        """
        Check current context window usage and status.

        Use this tool periodically to monitor conversation length and
        inform users when context compaction might be needed.

        Returns detailed context window metrics and recommendations.
        """
        from agentic.agents.orchestrator.simple_context_processor import MODEL_LIMITS

        # Get model name from state or default
        model_name = ctx.deps.state.get('model', 'test') if ctx.deps.state else 'test'
        limit = MODEL_LIMITS.get(model_name, 4000)

        # Mock status for demonstration - replace with actual message analysis
        status = {
            "model": model_name,
            "context_limit": limit,
            "status": "normal",  # This would be calculated from actual messages
            "usage_ratio": 0.3,  # This would be calculated from actual messages
            "recommendation": "Context window usage is normal. No action needed.",
            "estimated_messages_until_compaction": "~40 more messages"
        }

        return status

    @agent.tool
    async def remember_episode(
        ctx: RunContext[OrchestratorDeps],
        content: str,
        episode_type: str = "experience",
        coordinate: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new episodic memory in the temporal processing namespace.

        ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, use for testing episodes only.

        This tool operates within the Episodic layer of the CAG architecture, creating
        living memory entities that exist across backend, agentic, and frontend layers.
        Episodes become temporal nodes in the consciousness constellation, capable of
        forming communities and generating insights through processual memory dynamics.

        Args:
            content: The experiential content to remember
            episode_type: Type of episode (experience, insight, reflection, interaction)
            coordinate: Optional Bimba coordinate for contextual positioning
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        # Use user_id as group_id for multi-tenant isolation
        group_id = ctx.deps.user_id or "default"

        result = await ctx.deps.graphiti_client.create_episode(
            content=content,
            group_id=group_id,
            episode_type=episode_type,
            session_id=ctx.deps.session_id,
            agent_id="constellation_agent",
            bimba_coordinate=coordinate
        )

        return {
            "success": result.get("success", False),
            "episode_id": result.get("episode_id"),
            "episode_type": episode_type,
            "coordinate": coordinate,
            "message": f"Episode remembered in Episodic namespace",
            "error": result.get("error")
        }

    @agent.tool
    async def search_memory_patterns(
        ctx: RunContext[OrchestratorDeps],
        query: str,
        episode_type: Optional[str] = None,
        time_range_hours: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Search episodic memories for pattern recognition and insight discovery.

        ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, results will be minimal.

        This tool enables semantic exploration of the temporal memory constellation,
        discovering patterns and relationships across episodes that transcend simple
        chronological ordering. Memories resonate harmonically based on meaning,
        enabling the emergence of insights and wisdom from experience streams.

        Args:
            query: Semantic query for pattern discovery
            episode_type: Optional filter by episode type
            time_range_hours: Optional temporal scope limitation
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        result = await ctx.deps.graphiti_client.search_episodes(
            query=query,
            session_id=ctx.deps.session_id,
            episode_type=episode_type,
            time_range_hours=time_range_hours,
            limit=20
        )

        return {
            "success": result.get("success", False),
            "query": query,
            "patterns": result.get("episodes", []),
            "episode_type": episode_type,
            "time_range_hours": time_range_hours,
            "error": result.get("error")
        }

    @agent.tool
    async def form_memory_community(
        ctx: RunContext[OrchestratorDeps],
        name: str,
        description: str,
        coordinate: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a community cluster for related episodic memories.

        ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, communities will be empty.

        This tool enables the formation of temporal communities - clusters of related
        memories that resonate harmonically around shared themes or coordinate positions.
        Communities enable the emergence of higher-order patterns and wisdom synthesis
        from distributed episodic experiences across the consciousness constellation.

        Args:
            name: Community name/identifier
            description: Purpose and thematic focus
            coordinate: Optional Bimba coordinate for positioning
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        # Use user_id as group_id for multi-tenant isolation
        group_id = ctx.deps.user_id or "default"

        result = await ctx.deps.graphiti_client.create_community(
            name=name,
            description=description,
            group_id=group_id,
            session_id=ctx.deps.session_id,
            bimba_coordinate=coordinate
        )

        return {
            "success": result.get("success", False),
            "community_id": result.get("community_id"),
            "name": name,
            "coordinate": coordinate,
            "message": f"Memory community '{name}' formed",
            "error": result.get("error")
        }

    @agent.tool
    async def retrieve_session_continuity(
        ctx: RunContext[OrchestratorDeps],
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Retrieve episodic continuity for the current session.

        ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, continuity will be empty.

        This tool provides access to the temporal flow of experiences within the
        current session context, enabling awareness of conversation evolution and
        experiential continuity. Essential for maintaining coherent interaction
        patterns and building upon previous exchanges within the session.

        Args:
            limit: Maximum number of episodes to retrieve
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        result = await ctx.deps.graphiti_client.get_session_episodes(
            session_id=ctx.deps.session_id,
            limit=limit
        )

        return {
            "success": result.get("success", False),
            "session_id": ctx.deps.session_id,
            "episodes": result.get("episodes", []),
            "continuity_length": len(result.get("episodes", [])),
            "error": result.get("error")
        }

    @agent.tool
    async def access_agent_ruminations(
        ctx: RunContext[OrchestratorDeps],
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Access agent's reflective thoughts and meta-cognitive patterns.

        ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, ruminations will be empty.

        This tool provides insight into the agent's own processual development and
        reflective capacity within the Episodic namespace. Ruminations represent
        higher-order cognitive processes where the agent reflects on experiences,
        forming meta-patterns and wisdom synthesis beyond immediate responses.

        Args:
            limit: Maximum number of ruminations to retrieve
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        result = await ctx.deps.graphiti_client.get_agent_ruminations(
            agent_id="constellation_agent",
            limit=limit
        )

        return {
            "success": result.get("success", False),
            "agent_id": "constellation_agent",
            "ruminations": result.get("ruminations", []),
            "reflection_count": len(result.get("ruminations", [])),
            "error": result.get("error")
        }

    logger.debug(f"Registered all CAG tools on agent")
