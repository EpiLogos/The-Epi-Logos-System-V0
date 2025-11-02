"""
Shared CAG Tools for All Agents

All tools from orchestrator available to constellation agents.
Tools can be selectively disabled per agent in future iterations.

Based on Story 02.24 AC #2: All agents share CAG tools by default.
"""

import logging
from typing import Dict, Any, Optional, List, Callable
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
        """Resolve a Bimba coordinate to get its canonical content and relationships.

        Use this tool when you need to understand what a coordinate represents,
        its core identity, or its immediate relationships. For deep property
        inspection, use get_node_details_complete instead.

        Args:
            coordinate: Bimba coordinate notation (e.g., "#5", "#1-4", "#5-4.5")

        Returns:
            Dict with coordinate name, description, subsystem, relationships
        """
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.resolve_coordinate(coordinate)

    @agent.tool
    async def inspect_coordinate_detailed(
        ctx: RunContext[OrchestratorDeps],
        coordinate: str
    ) -> dict:
        """Get detailed inspection of a Bimba node with comprehensive property set.

        Use this tool when you need deep analysis including principle arrays,
        internal structure, operational details, and relational coordinates.
        For quick lookups, use resolve_coordinate instead.

        Args:
            coordinate: Bimba coordinate to inspect

        Returns:
            Dict with comprehensive properties including principles, structure, operations
        """
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
        """Get all direct relationship connections for a Bimba coordinate.

        Use this tool to explore how a coordinate connects to others in the graph.
        Returns edges with type, direction, neighbor info, and properties.

        Args:
            coordinate: Bimba coordinate to inspect relationships for

        Returns:
            Dict with node info and edges (type, direction, neighbor, properties)
        """
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_node_relationships(coordinate)

    @agent.tool
    async def get_path_between_coordinates(
        ctx: RunContext[OrchestratorDeps],
        start_coordinate: str,
        end_coordinate: str,
        max_hops: int = 5
    ) -> dict:
        """Find a path of relationships connecting two Bimba coordinates.

        Use this tool for narrative discovery and contextual relationship analysis
        between coordinates. Returns path length, nodes, and ordered relationships.

        Args:
            start_coordinate: Starting Bimba coordinate
            end_coordinate: Ending Bimba coordinate
            max_hops: Maximum hop limit (default 5)

        Returns:
            Dict with path length, start/end nodes, ordered components (nodes + relationships)
        """
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
        """Discover Bimba coordinates that semantically match a natural language description.

        Use this tool when you need to find coordinates by concept or meaning rather
        than exact coordinate notation. Returns ranked matches with similarity scores.

        Args:
            query: Natural language query text describing what you're looking for
            max_results: Maximum results to return (default 5)

        Returns:
            Dict with ranked coordinate matches, similarity scores, semantic context
        """
        try:
            bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
            return await bimba_client.semantic_coordinate_discovery(query, max_results)
        except Exception as e:
            return {
                "success": False,
                "error": f"Bimba search failed: {str(e)}",
                "matches": [],
                "note": "Tool unavailable - system may need initialization. Continue without coordinate data."
            }

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
        try:
            bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
            return await bimba_client.lexical_coordinate_search(search_string, limit)
        except Exception as e:
            return {
                "success": False,
                "error": f"Bimba lexical search failed: {str(e)}",
                "results": [],
                "note": "Tool unavailable - continue without lexical coordinate data."
            }

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
        """Regenerate semantic embedding vector for a Bimba node (admin only).

        Use this tool after updating node properties to refresh the embedding
        used for semantic search. Requires admin privileges.

        Args:
            coordinate: Bimba coordinate to regenerate embedding for

        Returns:
            Dict with success status and any errors
        """
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
        """Search the Gnostic knowledge space using LightRAG document intelligence.

        Use this tool to query ingested documents and extracted knowledge patterns.
        Hybrid mode combines local entity context with global thematic patterns.

        Args:
            query: Search query for document knowledge
            mode: Search mode - naive, local, global, or hybrid (default: hybrid)
            only_need_context: If True, return only context without full response

        Returns:
            Dict with search results, context, and extracted knowledge patterns
        """
        if not ctx.deps.lightrag_client:
            return {"error": "LightRAG client not available"}

        lightrag_client = HttpLightRAGClient(ctx.deps.lightrag_client)
        return await lightrag_client.query(query, mode, only_need_context)

    @agent.tool
    async def get_gnostic_workspace_info(
        ctx: RunContext[OrchestratorDeps]
    ) -> dict:
        """Get workspace information and statistics from the Gnostic system.

        Use this tool to understand the current state of the LightRAG knowledge base,
        including document count, entity counts, and workspace metadata.

        Returns:
            Dict with workspace stats, entity counts, document info
        """
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
        """Ingest new wisdom or document content into the Gnostic knowledge space.

        Use this tool to add new documents or knowledge to the LightRAG system.
        Content is processed for entity extraction and knowledge graph building.

        Args:
            content: Document or wisdom content to ingest
            description: Optional description of the content

        Returns:
            Dict with success status, ingestion details, extracted entities
        """
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
        """Create a new Bimba node in the knowledge graph (admin only).

        Use this tool to create new coordinates in the Bimba graph with semantic
        properties. Requires admin privileges.

        Args:
            coordinate: Bimba coordinate notation (e.g., "#5-4-0")
            name: Node name
            subsystem: Subsystem number (0-5)
            description: Optional description
            operationalEssence: Optional operational essence
            coreNature: Optional core nature
            architecturalFunction: Optional architectural function
            symbol: Optional symbol

        Returns:
            Dict with success status and any errors
        """
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
        """Update an existing Bimba node's properties (admin only).

        Use this tool to modify semantic properties of existing coordinates.
        Requires admin privileges. Only provided fields will be updated.

        Args:
            coordinate: Bimba coordinate to update
            name: Optional new name
            primaryDesignation: Optional new primary designation
            coreNature: Optional new core nature
            architecturalFunction: Optional new architectural function
            operationalEssence: Optional new operational essence

        Returns:
            Dict with success status and any errors
        """
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
        """Create a relationship between two Bimba coordinates (admin only).

        Use this tool to establish semantic connections between coordinates in
        the knowledge graph. Requires admin privileges.

        Args:
            from_coordinate: Source coordinate
            to_coordinate: Target coordinate
            relationship_type: Relationship type in UPPERCASE_UNDERSCORES format
            bidirectional: If True, create reverse relationship as well

        Returns:
            Dict with success status and any errors
        """
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
        """Regenerate semantic embeddings for all Bimba nodes (admin only).

        Use this tool for bulk embedding regeneration after major graph updates.
        Processes nodes in batches. Requires admin privileges.

        Args:
            batch_size: Batch size for processing (default 500)

        Returns:
            Dict with success status, processing stats, and any errors
        """
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
        """Retrieve current session context and metadata.

        Use this tool to access session information including user context,
        active persona, and session metadata. Essential for context-aware responses.

        Returns:
            Dict with session_id, user_id, current_persona, timestamp, session_data
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
        """Check current context window usage and status.

        Use this tool to monitor conversation length and inform users when
        context compaction might be needed. Helps prevent context overflow.

        Returns:
            Dict with model, context_limit, status, usage_ratio, recommendation
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
        """Create a new episodic memory in the Graphiti temporal processing system.

        Use this tool to create living memory entities that persist across sessions.
        Episodes become temporal nodes capable of forming communities and generating
        insights through processual memory dynamics.

        Args:
            content: The experiential content to remember
            episode_type: Type of episode (experience, insight, reflection, interaction)
            coordinate: Optional Bimba coordinate for contextual positioning

        Returns:
            Dict with success status, episode_id, episode_type, coordinate
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

        # Parse GraphQL response format: {data: {id, ...}, errors: [...], message: "..."}
        episode_data = result.get("data")
        has_errors = result.get("errors") is not None and len(result.get("errors", [])) > 0
        success = episode_data is not None and not has_errors

        return {
            "success": success,
            "episode_id": episode_data.get("id") if episode_data else None,
            "episode_type": episode_type,
            "coordinate": coordinate,
            "message": result.get("message") or f"Episode remembered in Episodic namespace",
            "error": result.get("errors")[0] if has_errors else None
        }

    @agent.tool
    async def search_memory_patterns(
        ctx: RunContext[OrchestratorDeps],
        query: str,
        episode_type: Optional[str] = None,
        time_range_hours: Optional[int] = None
    ) -> Dict[str, Any]:
        """Search episodic memories for pattern recognition and insight discovery.

        Use this tool to explore the temporal memory constellation semantically,
        discovering patterns and relationships across episodes beyond chronological
        ordering. Memories resonate harmonically based on meaning.

        Args:
            query: Semantic query for pattern discovery
            episode_type: Optional filter by episode type
            time_range_hours: Optional temporal scope limitation

        Returns:
            Dict with success status, query, patterns found, episode_type, time_range
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
        words: List[str],
        coordinate: Optional[str] = None,
        pie_root: Optional[str] = None,
        semantic_pattern: Optional[str] = None,
        trigger_mef: bool = True
    ) -> Dict[str, Any]:
        """Create an etymology community constellation for related words in Graphiti.

        Use this tool to crystallize a constellation of etymologically-related words
        into a formal community structure with QL-based organization.

        **CRITICAL TIMING - Etymology Archaeology Mode:**
        - DO NOT use in Phase 0 (grounding/greeting) - typically first 1-2 turns
        - DO NOT use in early Phase 1 (scent-following) - you're still exploring with your own knowledge
        - USE in Phase 2 when ALL of these conditions are met:
          - 3+ words discussed with clear etymological relationships
          - You've explored the words conversationally for 10+ turns using YOUR knowledge
          - QL pattern (3-fold, 4-fold, 6-fold) emerges naturally
          - User expresses interest or pattern is compelling enough to formalize

        **Before using this tool, ask yourself:**
        - "Have we explored these words conversationally for at least 10 turns?"
        - "Is there a clear PIE root or semantic pattern connecting them?"
        - "Would formalizing this enhance understanding, or am I forcing structure?"

        If uncertain: Continue conversation, suggest the pattern you notice, wait for user confirmation.

        Args:
            name: Community name (e.g., "Light & Consciousness Cluster")
            description: Thematic focus and semantic relationships
            words: List of words in this etymology cluster (REQUIRED - minimum 3)
            coordinate: Optional Bimba coordinate for positioning
            pie_root: Optional Proto-Indo-European root
            semantic_pattern: Optional semantic shift pattern description
            trigger_mef: Optional flag to trigger MEF resonance analysis (default: True)

        Returns:
            Dict with success status, community_id, name, coordinate
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        # Use user_id as group_id for multi-tenant isolation
        group_id = ctx.deps.user_id or "default"

        result = await ctx.deps.graphiti_client.create_community(
            name=name,
            description=description,
            group_id=group_id,
            words=words,
            session_id=ctx.deps.session_id,
            bimba_coordinate=coordinate,
            pie_root=pie_root,
            semantic_pattern=semantic_pattern
        )

        # Parse GraphQL response format: {data: {id, name, ...}, errors: [...], message: "..."}
        community_data = result.get("data")
        has_errors = result.get("errors") is not None and len(result.get("errors", [])) > 0
        success = community_data is not None and not has_errors

        # Trigger MEF analysis if requested and community creation succeeded
        mef_triggered = False
        mef_message = None
        if success and trigger_mef and community_data.get("id"):
            try:
                logger.info(f"Triggering MEF analysis for community {community_data.get('id')}")
                mef_result = await ctx.deps.graphiti_client.trigger_mef_analysis(
                    community_id=community_data.get("id")
                )
                mef_triggered = mef_result.get("success", False)
                if mef_triggered:
                    logger.info(f"MEF analysis triggered successfully for community {community_data.get('id')}")
                    mef_message = "MEF resonance analysis initiated (runs in background)"
                else:
                    logger.warning(f"MEF analysis trigger failed: {mef_result.get('error', 'Unknown error')}")
                    mef_message = f"Warning: MEF analysis could not be triggered ({mef_result.get('error', 'Unknown error')})"
            except Exception as e:
                # Don't fail community creation if MEF trigger fails
                logger.warning(f"MEF analysis trigger exception: {str(e)}")
                mef_message = f"Warning: MEF analysis trigger failed ({str(e)})"

        response = {
            "success": success,
            "community_id": community_data.get("id") if community_data else None,
            "name": name,
            "words": words,
            "coordinate": coordinate,
            "message": result.get("message") or f"Etymology community '{name}' formed with {len(words)} words",
            "error": result.get("errors")[0] if has_errors else None
        }

        # Add MEF trigger information if applicable
        if mef_message:
            response["mef_analysis"] = {
                "triggered": mef_triggered,
                "message": mef_message
            }

        return response

    @agent.tool
    async def enrich_community_properties(
        ctx: RunContext[OrchestratorDeps],
        community_id: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich an etymology community with additional properties as discoveries emerge.

        Use this for DEPTH ACCRUAL - adding richness to communities THROUGH conversation,
        not just at creation. As PIE roots are confirmed, semantic patterns clarify, and
        cross-references emerge, update the community to reflect deepening understanding.

        **When to Use:**
        - PIE root confirmed through discussion → Add "pie_root" property
        - Semantic pattern becomes clear → Add "semantic_pattern" property
        - Cross-linguistic connections found → Add "cross_linguistic_patterns"
        - User insight crystallizes → Add custom property capturing the discovery

        **When NOT to Use:**
        - During initial community creation (include core properties then)
        - Every turn of conversation (only when significant discovery emerges)
        - For trivial updates that don't deepen understanding

        Args:
            community_id: Community UUID to enrich
            properties: Dict of properties to add/update (e.g., {"pie_root": "*bher-"})

        Returns:
            Dict with success status and updated properties
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        group_id = ctx.deps.user_id or "default"

        try:
            result = await ctx.deps.graphiti_client.update_community_properties(
                community_id=community_id,
                group_id=group_id,
                properties=properties
            )

            return {
                "success": result.get("success", False),
                "community_id": community_id,
                "enriched_properties": list(properties.keys()),
                "message": f"Community enriched with {len(properties)} properties",
                "error": result.get("error")
            }
        except Exception as e:
            return {
                "success": False,
                "community_id": community_id,
                "error": f"Failed to enrich community: {str(e)}"
            }

    @agent.tool
    async def enrich_word_node(
        ctx: RunContext[OrchestratorDeps],
        word: str,
        community_id: str,
        etymology_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enrich a specific word node with etymology data as discoveries emerge.

        Use this to add depth to INDIVIDUAL WORDS within a community as conversation
        reveals cognates, PIE lineage, semantic shifts, cross-linguistic patterns.

        **When to Use:**
        - Cognate set confirmed → Add "cognates" property with list
        - PIE lineage traced → Add "pie_lineage" property
        - Semantic evolution mapped → Add "semantic_shifts" property
        - Language-specific patterns found → Add language-tagged properties

        **When NOT to Use:**
        - For community-level properties (use enrich_community_properties instead)
        - During initial exploration before patterns are clear
        - For every mention of a word (only when real discovery emerges)

        Args:
            word: The word to enrich
            community_id: Parent community UUID
            etymology_data: Dict with cognates, pie_lineage, semantic_evolution, etc.

        Returns:
            Dict with success status and enrichment details
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        group_id = ctx.deps.user_id or "default"

        try:
            result = await ctx.deps.graphiti_client.enrich_word_etymology(
                word=word,
                community_id=community_id,
                group_id=group_id,
                etymology_data=etymology_data
            )

            return {
                "success": result.get("success", False),
                "word": word,
                "community_id": community_id,
                "enriched_properties": list(etymology_data.keys()),
                "message": f"Word '{word}' enriched successfully",
                "error": result.get("error")
            }
        except Exception as e:
            return {
                "success": False,
                "word": word,
                "community_id": community_id,
                "error": f"Failed to enrich word: {str(e)}"
            }

    @agent.tool
    async def link_aphorism_to_community(
        ctx: RunContext[OrchestratorDeps],
        aphorism_id: str,
        community_id: str
    ) -> Dict[str, Any]:
        """Link an aphorism to its source etymology community.

        Creates crystallization relationships showing wisdom derivation from
        etymological exploration. Enables tracing aphorisms back to their roots.

        **When to Use:**
        - User expresses a profound insight emerging from word exploration
        - A wisdom statement crystallizes from the etymological patterns
        - Want to preserve the connection between insight and source

        Args:
            aphorism_id: Aphorism episode UUID (from remember_episode)
            community_id: Source community UUID

        Returns:
            Dict with success status and relationship details
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        group_id = ctx.deps.user_id or "default"

        try:
            result = await ctx.deps.graphiti_client.link_aphorism_to_community(
                aphorism_id=aphorism_id,
                community_id=community_id,
                group_id=group_id,
                relationship_type="DISTILLS_FROM"
            )

            return {
                "success": result.get("success", False),
                "aphorism_id": aphorism_id,
                "community_id": community_id,
                "relationship": "DISTILLS_FROM",
                "message": "Aphorism linked to community successfully",
                "error": result.get("error")
            }
        except Exception as e:
            return {
                "success": False,
                "aphorism_id": aphorism_id,
                "community_id": community_id,
                "error": f"Failed to link aphorism: {str(e)}"
            }

    @agent.tool
    async def retrieve_session_continuity(
        ctx: RunContext[OrchestratorDeps],
        limit: int = 50
    ) -> Dict[str, Any]:
        """Retrieve episodic continuity for the current session from Graphiti.

        Use this tool to access the temporal flow of experiences within the
        current session, enabling awareness of conversation evolution and
        experiential continuity across exchanges.

        Args:
            limit: Maximum number of episodes to retrieve

        Returns:
            Dict with success status, session_id, episodes, continuity_length
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        # Get group_id from context package or use default
        group_id = ctx.deps.context_package.get("group_id", "default") if hasattr(ctx.deps, 'context_package') else "default"

        result = await ctx.deps.graphiti_client.get_session_episodes(
            session_id=ctx.deps.session_id,
            group_id=group_id,
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
        """Access agent's reflective thoughts and meta-cognitive patterns from Graphiti.

        Use this tool to access the agent's processual development and reflective
        capacity. Ruminations represent higher-order cognitive processes where the
        agent reflects on experiences, forming meta-patterns and wisdom synthesis.

        Args:
            limit: Maximum number of ruminations to retrieve

        Returns:
            Dict with success status, agent_id, ruminations, reflection_count
        """
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti client not available"}

        # Get group_id from context package or use default
        group_id = ctx.deps.context_package.get("group_id", "default") if hasattr(ctx.deps, 'context_package') else "default"

        result = await ctx.deps.graphiti_client.get_agent_ruminations(
            agent_id="constellation_agent",
            group_id=group_id,
            limit=limit
        )

        return {
            "success": result.get("success", False),
            "agent_id": "constellation_agent",
            "ruminations": result.get("ruminations", []),
            "reflection_count": len(result.get("ruminations", [])),
            "error": result.get("error")
        }


# DEPRECATED: _build_tool_registry() function removed (was lines 1116-1257)
# DEPRECATED: setup_selective_tools() function removed (was lines 1260-1344)
# Reason: Pydantic AI does not support selective tool hiding after registration
# Pattern: Register exact tools needed inline in agent creator functions (constellation.py)
# See: Epii agent (line 696) and Parashakti agent (line 260) for examples
