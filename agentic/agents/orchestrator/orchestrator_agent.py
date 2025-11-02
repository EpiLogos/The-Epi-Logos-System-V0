"""
Pydantic AI Orchestrator Agent

This is the core agent implementation that replaces the simplified UnifiedOrchestrator
with a true Pydantic AI Agent that has:
- Tool calling capabilities
- Structured outputs 
- Dynamic persona behaviors
- Dependency injection via RunContext
- Proper streaming support
"""

import logging
import json
from dataclasses import dataclass
from typing import Optional, List, Dict, Any, AsyncIterator
from datetime import datetime, timezone

# Pydantic AI imports
try:
    from pydantic_ai import Agent, RunContext, ModelRetry
    from pydantic import BaseModel, Field
    PYDANTIC_AI_AVAILABLE = True
except ImportError:
    PYDANTIC_AI_AVAILABLE = False
    # Fallback types for development
    Agent = object
    RunContext = object
    ModelRetry = Exception
    BaseModel = object
    Field = lambda **kwargs: None

import httpx

# Import modular system prompt components
from agentic.agents.orchestrator.system_prompt import get_complete_system_foundation

logger = logging.getLogger(__name__)


# Dependencies Container
@dataclass
class OrchestratorDeps:
    """Dependencies container for the orchestrator agent

    ENHANCED: Now includes EA mode detection in state dict for async-safe tool gating.
    """
    session_id: str
    user_id: str
    redis_client: Any  # SessionManager (sync or async)
    conversation_service: Any  # ConversationService
    bimba_client: Any  # BimbaGraphQLClient
    lightrag_client: Optional[Any] = None
    graphiti_client: Optional[Any] = None
    current_persona: str = "system"
    context_package: Optional[Dict[str, Any]] = None
    state: Dict[str, Any] = None  # Required by Pydantic AI StateHandler protocol

    def __post_init__(self):
        """Initialize state dict (EA mode must be pre-populated by caller)."""
        if self.state is None:
            self.state = {}

        # EA mode detection removed from __post_init__ - MUST be done by caller in async context
        # See agent_runner._prepare_dependencies for EA mode pre-population
        # Reason: Cannot safely call async Redis methods from sync __post_init__
        if self.state.get('ea_mode'):
            logger.info(f"✅ EA mode active for session {self.session_id}")


# Structured Output Types
class CoordinateResult(BaseModel):
    """Result from coordinate resolution"""
    coordinate: str
    name: Optional[str] = None
    content: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class KnowledgeSearchResult(BaseModel):
    """Result from knowledge search"""
    query: str
    results: List[str] = Field(default_factory=list)
    mode: str = "naive"
    relevance_score: Optional[float] = None


class MemoryResult(BaseModel):
    """Result from memory operation"""
    success: bool
    memory_id: Optional[str] = None
    error: Optional[str] = None


class ResponseMetadata(BaseModel):
    """Structured metadata for responses"""
    session_context: Optional[str] = None
    processing_time_ms: Optional[int] = None
    model_used: Optional[str] = None
    error_details: Optional[str] = None

class OrchestratorResponse(BaseModel):
    """Structured response from the orchestrator agent"""
    response: str
    tools_used: List[str] = Field(default_factory=list)
    coordinates_accessed: List[str] = Field(default_factory=list)
    confidence: float = Field(ge=0, le=1, default=0.8)
    persona_used: str
    requires_followup: bool = False
    metadata: ResponseMetadata = Field(default_factory=ResponseMetadata)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Agent factory and tools (only if Pydantic AI is available)
if PYDANTIC_AI_AVAILABLE:
    import os
    from agentic.agents.orchestrator.simple_context_processor import create_simple_context_processor

    # Initialize delegation infrastructure (module-level singletons)
    _agent_factory: Optional[Any] = None
    _delegation_manager: Optional[Any] = None

    def get_delegation_manager():
        """Get or create the delegation manager singleton."""
        global _agent_factory, _delegation_manager

        if _delegation_manager is None:
            # Lazy import to avoid circular dependency
            # FIXED: Corrected module paths for agent factory migration
            from agentic.agents.delegation_manager import DelegationManager
            from agentic.agents.agent_factory import AgentFactory
            from agentic.agents.agent_router import AgentRouter

            # Initialize factory and delegation manager
            # Note: DelegationManager doesn't use router in constructor
            _agent_factory = AgentFactory()
            _delegation_manager = DelegationManager(_agent_factory)
            logger.info("Initialized delegation infrastructure for orchestrator")

        return _delegation_manager
    
    def create_orchestrator_agent(model_name: str, ea_mode: bool = False) -> Agent:
        """Create an orchestrator agent with the specified model.

        Args:
            model_name: Provider:model identifier
            ea_mode: If True, register only EA-allowed tools to reduce token footprint
        """
        try:
            # Create context processor for this model
            context_processor = create_simple_context_processor(model_name)
            
            agent = Agent(
                model_name,
                deps_type=OrchestratorDeps,
                retries=2,
                history_processors=[context_processor]  # Add native context window management
            )
            
            # Add tools to the agent
            setup_agent_tools(agent, ea_mode=ea_mode)
            setup_agent_prompts(agent)
            
            logger.info(f"Created Pydantic AI orchestrator agent with model: {model_name} (with context processor)")
            return agent
            
        except Exception as e:
            logger.error(f"Error creating agent with model {model_name}: {e}")
            raise
    
    def setup_agent_tools(agent: Agent, ea_mode: bool = False) -> None:
        """Setup tools for the agent.

        When ea_mode=True (Etymology Archaeology), registers a minimal toolset
        to reduce token context and align with EA workflow constraints.
        """
        # --- Etymology Archaeology (EA) tool gating helpers ---
        def _is_ea_session(ctx: RunContext[OrchestratorDeps]) -> bool:
            """Check if current session is Etymology Archaeology mode (#5-5).

            ASYNC-SAFE: Only checks state dict (pre-populated by agent_runner in async context).
            No Redis calls allowed here - sync tools cannot safely call async methods.
            """
            try:
                if not ctx or not ctx.deps:
                    return False

                # Check state dict ONLY (must be pre-populated by caller)
                if hasattr(ctx.deps, 'state') and ctx.deps.state:
                    return ctx.deps.state.get('ea_mode', False)

                return False

            except Exception as e:
                logger.debug(f"EA session check failed: {e}")
                return False

        ALLOWED_EA_TOOLS = {
            "resolve_coordinate",
            "get_wisdom_packet",
            "get_quintessential_properties",
            "semantic_coordinate_discovery",
            # Graphiti / episodic tools
            "remember_episode",  # Re-enabled: SEMAPHORE_LIMIT=10 + 60s timeout should handle it
            "search_memory_patterns",
            "retrieve_session_continuity",
            "access_agent_ruminations",
            # Etymology community tools
            "form_memory_community",  # Phase 2: Create QL communities (10+ turns, 3+ words)
            # Etymology enrichment tools (depth accrual)
            "enrich_community_properties",
            "enrich_word_node",
            "link_aphorism_to_community",
        }

        def _ea_gate(ctx: RunContext[OrchestratorDeps], tool_name: str) -> Optional[Dict[str, Any]]:
            """Return an early error dict if tool is disabled in EA sessions."""
            if _is_ea_session(ctx) and tool_name not in ALLOWED_EA_TOOLS:
                return {
                    "success": False,
                    "error": f"Tool '{tool_name}' is disabled in Etymology Archaeology sessions (#5-5). Use wisdom packets, Graphiti episodic tools, or simple resolve_coordinate.",
                }
            return None

        # Always available (EA and non-EA)
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
            """Create a Bimba node (admin only).

            Available only to admin users. Enforces trilaminar boundaries by calling Backend GraphQL.
            """
            try:
                gated = _ea_gate(ctx, "create_bimba_node")
                if gated:
                    return gated
                # Check admin privileges from session context
                is_admin = False
                if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
                    user = ctx.deps.context_package.get("user") or {}
                    is_admin = bool(user.get("isAdmin", False))
                if not is_admin:
                    return {
                        "success": False,
                        "errors": [{"field": None, "message": "Admin privileges required", "code": "UNAUTHORIZED_ADMIN"}],
                    }

                if not ctx.deps.bimba_client:
                    return {"success": False, "errors": [{"field": None, "message": "Bimba client not available", "code": "CLIENT_UNAVAILABLE"}]}

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
                # Remove None values
                payload = {k: v for k, v in payload.items() if v is not None}
                result = await ctx.deps.bimba_client.create_bimba_node(payload)  # type: ignore[attr-defined]
                return result
            except Exception as e:
                logger.error(f"Error creating Bimba node: {e}")
                return {"success": False, "errors": [{"field": None, "message": str(e), "code": "TOOL_ERROR"}]}

        @agent.tool
        async def update_bimba_node(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
            name: Optional[str] = None,
            primaryDesignation: Optional[str] = None,
            coreNature: Optional[str] = None,
            architecturalFunction: Optional[str] = None,
            internalStructure: Optional[str] = None,
            keyPrinciples: Optional[List[str]] = None,
            resonances: Optional[List[str]] = None,
            practicalApplications: Optional[List[str]] = None,
            operationalEssence: Optional[str] = None,
            accessLevel: Optional[str] = None,
            consciousnessStructure: Optional[str] = None,
            operationalSymbolics: Optional[str] = None,
            relatedCoordinates: Optional[List[str]] = None,
            description: Optional[str] = None,
            function: Optional[str] = None,
            symbol: Optional[str] = None,
        ) -> Dict[str, Any]:
            """Update an existing Bimba node with flexible schema-based properties (admin only).

            Supports partial updates - only provided fields are updated, others remain unchanged.
            Enforces coordinate immutability and Neo4j compatibility (no nested objects).

            Core Identity Properties: name, primaryDesignation, coreNature, architecturalFunction
            Consolidated Structure: internalStructure
            Principle Arrays: keyPrinciples, resonances, practicalApplications
            Operational Properties: operationalEssence, accessLevel, consciousnessStructure, operationalSymbolics
            Relational Properties: relatedCoordinates
            Legacy Fields: description, function, symbol

            Available only to admin users. Enforces trilaminar boundaries by calling Backend GraphQL.
            """
            try:
                gated = _ea_gate(ctx, "update_bimba_node")
                if gated:
                    return gated
                # Check admin privileges from session context
                is_admin = False
                if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
                    user = ctx.deps.context_package.get("user") or {}
                    is_admin = bool(user.get("isAdmin", False))
                if not is_admin:
                    return {
                        "success": False,
                        "errors": [{"field": None, "message": "Admin privileges required", "code": "UNAUTHORIZED_ADMIN"}],
                    }

                if not ctx.deps.bimba_client:
                    return {"success": False, "errors": [{"field": None, "message": "Bimba client not available", "code": "CLIENT_UNAVAILABLE"}]}

                # Build payload with all provided properties
                payload = {
                    "coordinate": coordinate,
                    "name": name,
                    "primaryDesignation": primaryDesignation,
                    "coreNature": coreNature,
                    "architecturalFunction": architecturalFunction,
                    "internalStructure": internalStructure,
                    "keyPrinciples": keyPrinciples,
                    "resonances": resonances,
                    "practicalApplications": practicalApplications,
                    "operationalEssence": operationalEssence,
                    "accessLevel": accessLevel,
                    "consciousnessStructure": consciousnessStructure,
                    "operationalSymbolics": operationalSymbolics,
                    "relatedCoordinates": relatedCoordinates,
                    "description": description,
                    "function": function,
                    "symbol": symbol,
                }
                # Remove None values for partial update support
                payload = {k: v for k, v in payload.items() if v is not None}

                result = await ctx.deps.bimba_client.update_bimba_node(payload)  # type: ignore[attr-defined]
                return result
            except Exception as e:
                logger.error(f"Error updating Bimba node: {e}")
                return {"success": False, "errors": [{"field": None, "message": str(e), "code": "TOOL_ERROR"}]}

        @agent.tool
        async def set_agent_system_prompt(
            ctx: RunContext[OrchestratorDeps],
            agent_coordinate: str,
            prompt_content: str,
            version: Optional[str] = None
        ) -> Dict[str, Any]:
            """Admin: Update the agent's stored system prompt (f_system_prompt) on the agent node.

            - Persists to Neo4j via Backend GraphQL (UpdateBimbaNodeInput.properties).
            - Also invalidates the Prakāśa Redis cache for this agent coordinate.

            Args:
                agent_coordinate: Agent node coordinate (e.g., "#5-4.5")
                prompt_content: Full system prompt text to store
                version: Optional version string to store in metadata

            Returns:
                GraphQL mutation result with success flag and any errors
            """
            try:
                # Admin check
                is_admin = False
                if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
                    user = ctx.deps.context_package.get("user") or {}
                    is_admin = bool(user.get("isAdmin", False))
                if not is_admin:
                    return {
                        "success": False,
                        "errors": [{"field": None, "message": "Admin privileges required", "code": "UNAUTHORIZED_ADMIN"}],
                    }

                if not ctx.deps.bimba_client:
                    return {"success": False, "errors": [{"field": None, "message": "Bimba client not available", "code": "CLIENT_UNAVAILABLE"}]}

                # Build f_system_prompt JSON string (Neo4j stores string values)
                from datetime import datetime, timezone
                import json as _json
                f_system_prompt_obj = {
                    "content": prompt_content,
                    "metadata": {
                        "version": version or "manual",
                        "generated_from": [{"source": agent_coordinate}],
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                    },
                }
                f_system_prompt_str = _json.dumps(f_system_prompt_obj)

                # GraphQL flexible properties array
                payload = {
                    "coordinate": agent_coordinate,
                    "properties": [
                        {"key": "f_system_prompt", "value": f_system_prompt_str}
                    ],
                }

                result = await ctx.deps.bimba_client.update_bimba_node(payload)  # type: ignore[attr-defined]

                # Invalidate Prakāśa cache (no TTL)
                try:
                    if ctx.deps.redis_client:
                        cache_key = f"prakasa:identity:{agent_coordinate}"
                        ctx.deps.redis_client.delete(cache_key)
                except Exception:
                    pass

                return result
            except Exception as e:
                logger.error(f"Error setting agent system prompt: {e}")
                return {"success": False, "errors": [{"field": None, "message": str(e), "code": "TOOL_ERROR"}]}

        @agent.tool
        async def create_bimba_relationship(
            ctx: RunContext[OrchestratorDeps],
            from_coordinate: str,
            to_coordinate: str,
            relationship_type: str,
            properties: Optional[List[Dict[str, str]]] = None,
            bidirectional: bool = False,
        ) -> Dict[str, Any]:
            """Create or update a relationship between two Bimba coordinates (admin only).

            Uses MERGE pattern for idempotent create/update. Pre-validates both coordinates exist
            to prevent accidental node creation. Returns wasUpdate=true if relationship already existed.

            Relationship Type Examples:
            - Hierarchical: CONTAINS, PARENT_OF, SUBSUMES
            - Resonance: RESONATES_WITH, HARMONIZES_WITH
            - Temporal: PRECEDES, FOLLOWS, TEMPORAL_SEQUENCE
            - Semantic: TRANSFORMS_INTO, DERIVES_FROM, RELATES_TO
            - Custom: Any UPPERCASE_WITH_UNDERSCORES type

            Property Examples (relationship-specific, open schema):
            - Hierarchical: [{"key": "hierarchyLevel", "value": "1"}, {"key": "containmentType", "value": "structural"}]
            - Resonance: [{"key": "resonancePattern", "value": "3-fold harmonic"}, {"key": "harmonicFrequency", "value": "432"}]
            - Temporal: [{"key": "sequenceOrder", "value": "1"}, {"key": "temporalContext", "value": "Nara phase"}]
            - Semantic: [{"key": "transformationType", "value": "vibrational-to-symbolic"}, {"key": "confidence", "value": "0.85"}]
            - Custom: Any camelCase property relevant to your relationship type

            Args:
                from_coordinate: Source Bimba coordinate
                to_coordinate: Target Bimba coordinate
                relationship_type: Relationship type (UPPERCASE_UNDERSCORES)
                properties: List of {"key": "...", "value": "..."} dicts (open schema)
                bidirectional: Create reverse relationship with same properties

            Available only to admin users. Enforces trilaminar boundaries by calling Backend GraphQL.
            """
            try:
                gated = _ea_gate(ctx, "create_bimba_relationship")
                if gated:
                    return gated
                # Check admin privileges from session context
                is_admin = False
                if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
                    user = ctx.deps.context_package.get("user") or {}
                    is_admin = bool(user.get("isAdmin", False))
                if not is_admin:
                    return {
                        "success": False,
                        "errors": [{"field": None, "message": "Admin privileges required", "code": "UNAUTHORIZED_ADMIN"}],
                    }

                if not ctx.deps.bimba_client:
                    return {"success": False, "errors": [{"field": None, "message": "Bimba client not available", "code": "CLIENT_UNAVAILABLE"}]}

                payload = {
                    "fromCoordinate": from_coordinate,
                    "toCoordinate": to_coordinate,
                    "relationshipType": relationship_type,
                    "properties": properties or [],
                    "bidirectional": bidirectional,
                }

                result = await ctx.deps.bimba_client.create_bimba_relationship(payload)  # type: ignore[attr-defined]
                return result
            except Exception as e:
                logger.error(f"Error creating Bimba relationship: {e}")
                return {"success": False, "errors": [{"field": None, "message": str(e), "code": "TOOL_ERROR"}]}

        @agent.tool
        async def resolve_coordinate(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
        ) -> CoordinateResult:
            """Resolve a Bimba coordinate within the Coordinate Augmented Generation (CAG) paradigm.
            
            This tool accesses the foundational CAG system that undergirds the entire Epi-Logos architecture.
            Bimba coordinates (#0-#5 with infinite nesting) represent universal knowledge addresses in a 
            living epistemological framework where each coordinate embodies specific processing modalities.
            
            The six-fold subsystem structure:
            #0 Anuttara: Proto-logical void processing  
            #1 Paramasiva: Quaternal logic & harmonic processing
            #2 Parashakti: Vibrational-epistemic processing
            #3 Mahamaya: Symbolic-alchemical processing
            #4 Nara: Dialogical-identity processing  
            #5 Epii: Synthesis & orchestration processing

            Args:
                coordinate: The coordinate to resolve (e.g., #2, #2.3, #2-3-1)
            """
            try:
                logger.info(f"Resolving coordinate: {coordinate}")

                # Use the bimba client from dependencies
                result = await ctx.deps.bimba_client.resolve_coordinate(coordinate)

                if result:
                    return CoordinateResult(
                        coordinate=coordinate,
                        name=result.get("name"),
                        content=result.get("content"),
                        context=result.get("context", {}),
                    )
                else:
                    return CoordinateResult(
                        coordinate=coordinate,
                        error="Coordinate not found",
                    )

            except Exception as e:
                logger.error(f"Error resolving coordinate {coordinate}: {e}")
                return CoordinateResult(coordinate=coordinate, error=str(e))

        @agent.tool
        async def inspect_coordinate_detailed(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
        ) -> Dict[str, Any]:
            """Deep inspection of a Bimba coordinate with complete property set (COMPREHENSIVE).

            Returns all flexible schema properties including:
            - Core Identity: primaryDesignation, coreNature, architecturalFunction
            - Consolidated Structure: internalStructure
            - Principle Arrays: keyPrinciples, resonances, practicalApplications
            - Operational: operationalEssence, accessLevel, consciousnessStructure, operationalSymbolics
            - Relational: relatedCoordinates, lastUpdated

            Use this for comprehensive analysis and detailed inspection, NOT for quick lookups.
            For conversational context and navigation, use resolve_coordinate instead (lean/fast).

            Performance note: Fetches array fields which can be large. Use judiciously.

            Args:
                coordinate: The coordinate to inspect in full detail (e.g., #2, #2.3, #2-3-1)
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "inspect_coordinate_detailed")
            if gated:
                return gated
            try:
                logger.info(f"🔍 Deep inspection of coordinate: {coordinate}")

                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available", "node": None}

                # Use extended query via HTTP client wrapper
                from agentic.agents.orchestrator.tools.bimba.http_bimba_tools import HttpBimbaClient
                http_client = HttpBimbaClient(ctx.deps.bimba_client)

                result = await http_client.get_node_by_coordinate_extended(coordinate)

                if result.get("success"):
                    logger.info(f"Successfully retrieved extended data for {coordinate}")
                    return result
                else:
                    error = result.get("error", "Unknown error")
                    logger.warning(f"Extended inspection failed for {coordinate}: {error}")
                    return result

            except Exception as e:
                logger.error(f"Error in detailed coordinate inspection {coordinate}: {e}")
                return {"success": False, "error": str(e), "node": None, "coordinate": coordinate}

        @agent.tool
        async def get_node_details_complete(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
            include_functional_properties: bool = False,
        ) -> Dict[str, Any]:
            """Get ALL properties for a Bimba coordinate without schema restrictions (COMPLETE).

            Returns Neo4j properties via Generic scalar with selective filtering.
            This is the most flexible retrieval tool: agents can access ANY property regardless
            of whether it's in the GraphQL schema. Perfect for:
            - Discovering unknown/custom properties on coordinates
            - Accessing coordinate-specific fields not in canonical schema
            - Full property inspection without predefined field knowledge

            By default excludes embeddings metadata, internal timestamps, and functional properties (f_* prefix).
            Set include_functional_properties=True to include f_* prefixed functional properties.
            For structured canonical fields, use inspect_coordinate_detailed instead.
            For quick lookups, use resolve_coordinate instead.

            Three-tier architecture:
            - resolve_coordinate: LEAN (~13 core fields)
            - get_node_details_complete: COMPLETE (all properties via Generic scalar) ← THIS
            - inspect_coordinate_detailed: EXTENDED (~25 canonical typed fields)

            Args:
                coordinate: The coordinate to retrieve all properties for (e.g., #2, #2.3, #2-3-1)
                include_functional_properties: If True, include f_* prefixed functional properties (default: False)
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "get_node_details_complete")
            if gated:
                return gated
            try:
                logger.info(f"🔍 Getting complete node details for: {coordinate} (functional_properties={include_functional_properties})")

                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available", "allProperties": None}

                # Use complete query via HTTP client wrapper
                from agentic.agents.orchestrator.tools.bimba.http_bimba_tools import HttpBimbaClient
                http_client = HttpBimbaClient(ctx.deps.bimba_client)

                result = await http_client.get_node_details_complete(coordinate, include_functional_properties)

                if result.get("success"):
                    logger.info(f"Successfully retrieved complete details for {coordinate}")
                    return result
                else:
                    error = result.get("error", "Unknown error")
                    logger.warning(f"Complete details retrieval failed for {coordinate}: {error}")
                    return result

            except Exception as e:
                logger.error(f"Error getting complete node details for {coordinate}: {e}")
                return {"success": False, "error": str(e), "allProperties": None, "coordinate": coordinate}

        @agent.tool
        async def search_gnostic_space(
            ctx: RunContext[OrchestratorDeps],
            query: str,
            coordinate_filter: str = None,
        ) -> KnowledgeSearchResult:
            """Search the Gnostic namespace using LightRAG document intelligence.
            
            This tool accesses the pedagogical document pool within the three-namespace Neo4j architecture.
            LightRAG operates on the Gnostic layer (Neo4j + Qdrant) providing semantic search enhanced 
            with coordinate metadata. This is particularly aligned with Epii persona operations for 
            document-based wisdom synthesis and knowledge integration.
            
            The Gnostic namespace contains processed documents that have been coordinate-tagged,
            allowing for harmonic resonance queries that transcend simple semantic similarity.

            Args:
                query: The search query for document content
                coordinate_filter: Optional coordinate to filter results (e.g., "#2", "#4.1")
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "search_gnostic_space")
            if gated:
                return KnowledgeSearchResult(query=query, results=[gated.get("error")], mode="gnostic")
            try:
                logger.info(f"🔧 TOOL CALL: search_gnostic_space for query: {query}")

                if not ctx.deps.lightrag_client:
                    return KnowledgeSearchResult(
                        query=query, mode="gnostic", results=["LightRAG client not available"]
                    )

                # Perform the search using the Gnostic namespace method
                result = await ctx.deps.lightrag_client.search_gnostic_space(
                    query=query, 
                    coordinate_filter=coordinate_filter, 
                    limit=10
                )

                # Handle API response format
                if isinstance(result, dict) and result.get("success"):
                    results = result.get("results", [])
                    if isinstance(results, list):
                        results = [str(item) for item in results]
                    else:
                        results = [str(results)]
                else:
                    error_msg = result.get("error", "Unknown search error") if isinstance(result, dict) else str(result)
                    results = [f"Search error: {error_msg}"]

                return KnowledgeSearchResult(
                    query=query,
                    mode="gnostic",
                    results=results,
                    relevance_score=0.8,  # Default relevance
                )

            except Exception as e:
                logger.error(f"Error searching knowledge: {e}")
                return KnowledgeSearchResult(
                    query=query, mode="gnostic", results=[f"Search error: {str(e)}"]
                )


        @agent.tool
        async def get_coordinate_relationships(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
        ) -> Dict[str, Any]:
            """Fetch direct relationships for a Bimba coordinate via Backend GraphQL.

            This reads connection edges for a node anchored by exact `bimbaCoordinate` equality
            through the backend API. It performs no mutations and preserves trilaminar boundaries.

            Args:
                coordinate: The Bimba coordinate (e.g., "#2-3")
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "get_coordinate_relationships")
            if gated:
                return gated
            try:
                logger.info(f"🔧 TOOL CALL: get_coordinate_relationships for {coordinate}")

                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available"}

                result = await ctx.deps.bimba_client.get_node_relationships(coordinate)
                return result
            except Exception as e:
                logger.error(f"Error getting relationships for {coordinate}: {e}")
                return {"success": False, "error": str(e), "coordinate": coordinate, "edges": []}


        @agent.tool
        async def get_path_between_coordinates(
            ctx: RunContext[OrchestratorDeps],
            start_coordinate: str,
            end_coordinate: str,
            max_hops: int = 5,
        ) -> Dict[str, Any]:
            """Find an ordered relationship path between two Bimba coordinates via Backend GraphQL.

            - Uses literal hop counts; no parameterized variable-length patterns.
            - Defaults `max_hops` to 5 and respects backend safety caps.
            - Anchors nodes by exact `bimbaCoordinate` equality.

            Args:
                start_coordinate: Start coordinate (e.g., "#2")
                end_coordinate: End coordinate (e.g., "#4-1")
                max_hops: Maximum hops to traverse (default 5)
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "get_path_between_coordinates")
            if gated:
                return gated
            try:
                import os
                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available"}

                # Enforce a local safety cap aligned with backend defaults
                try:
                    cap = int(os.getenv("BIMBA_MAX_HOPS_CAP", "10"))
                except Exception:
                    cap = 10
                hops = max(1, min(max_hops, cap))

                logger.info(
                    f"🔧 TOOL CALL: get_path_between_coordinates {start_coordinate} -> {end_coordinate} (maxHops={hops})"
                )
                result = await ctx.deps.bimba_client.get_path_between_coordinates(
                    start_coordinate, end_coordinate, hops
                )
                return result
            except Exception as e:
                logger.error(
                    f"Error getting path between {start_coordinate} and {end_coordinate}: {e}"
                )
                return {"success": False, "error": str(e), "path": None}

        @agent.tool
        async def semantic_coordinate_discovery(
            ctx: RunContext[OrchestratorDeps],
            query: str,
            max_results: int = 5
        ) -> Dict[str, Any]:
            """Search for coordinates using semantic similarity via Backend GraphQL.

            Discovers Bimba coordinates that semantically match a natural language query.
            Uses hybrid vector + keyword search to find relevant coordinates across the
            entire knowledge graph.

            Args:
                query: Natural language query for semantic discovery
                max_results: Maximum number of results to return (default 5)
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "semantic_coordinate_discovery")
            if gated:
                return gated
            try:
                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available"}

                logger.info(f"🔧 TOOL CALL: semantic_coordinate_discovery for: {query[:50]}...")
                result = await ctx.deps.bimba_client.semantic_coordinate_discovery(query, max_results)
                return result
            except Exception as e:
                logger.error(f"Error in semantic coordinate discovery: {e}")
                return {"success": False, "results": [], "error": str(e)}

        @agent.tool
        async def get_wisdom_packet(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
            depth: int = 2,
            focus: Optional[str] = None,
            force_regenerate: bool = False,
            synthesis_guidance: Optional[str] = None
        ) -> Dict[str, Any]:
            """Get or generate a Wisdom Packet for a Bimba coordinate within the CAG paradigm.

            Wisdom Packets are pre-synthesized canonical knowledge summaries that serve as
            FOUNDATIONAL ENTRY POINTS in the canonical ← episodic ← canonical refinement cycle
            central to Epi-Logos consciousness-computing. They represent the system's current
            understanding BEFORE episodic exploration, providing intelligent graph synthesis
            with apophatic gap analysis that guides research direction.

            ARCHITECTURAL ROLE:
            - Canonical starting point for coordinate understanding
            - Bridge between Bimba namespace (structured knowledge) and episodic memory
            - Synthesis engine combining subgraph traversal + concept extraction + narrative generation

            ENHANCEMENT (Sprint 4):
            - Prioritizes quintessential properties (q_*) - pithy distillations from MEF crystallization
            - Epii agent-powered narrative synthesis for genuine contextual insight
            - Dynamic synthesis guidance for context-specific narrative customization
            - No fallbacks - synthesis errors surface transparently for proper handling

            Use this when you need:
            - Deep contextual understanding as a canonical starting point (not just raw properties)
            - Pre-synthesized narratives for Path of Resonance guidance
            - Apophatic gap analysis to identify missing themes and guide episodic research
            - Pattern recognition across multi-hop subgraph relationships

            SMART FLOW:
            1. Check Redis cache → 2. Generate if missing → 3. Epii agent synthesis → 4. Cache 24h TTL

            Args:
                coordinate: Bimba coordinate (e.g., "#1-2", "#3-4-5")
                depth: Traversal depth (1-5, default 2) for subgraph exploration
                focus: Synthesis lens - STRUCTURAL/PROCESSUAL/ARCHETYPAL/PRACTICAL
                force_regenerate: Bypass cache and regenerate fresh packet
                synthesis_guidance: Optional custom synthesis instructions (e.g., "Emphasize practical applications")

            Returns:
                Dict with wisdom packet data (narrative, concepts, apophatic pointers) or error
            """
            try:
                logger.info(f"🔧 TOOL CALL: get_wisdom_packet({coordinate}, depth={depth}, focus={focus}, force_regenerate={force_regenerate})")

                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available"}

                # Call backend GraphQL getWisdomPacket query
                from agentic.agents.orchestrator.tools.bimba.http_bimba_tools import HttpBimbaClient
                http_client = HttpBimbaClient(ctx.deps.bimba_client)

                result = await http_client.get_wisdom_packet(
                    coordinate=coordinate,
                    depth=depth,
                    focus=focus,
                    force_regenerate=force_regenerate
                )

                if result.get("success"):
                    packet = result.get("wisdom_packet", {})
                    cache_hit = packet.get("cacheHit", False)
                    synthesis_score = packet.get("synthesisScore", 0)
                    logger.info(
                        f"✅ Wisdom packet retrieved: {coordinate} "
                        f"(cache_hit={cache_hit}, synthesis_score={synthesis_score:.2f})"
                    )
                    return result
                else:
                    error = result.get("error", "Unknown error")
                    logger.warning(f"❌ Wisdom packet retrieval failed for {coordinate}: {error}")
                    return result

            except Exception as e:
                logger.error(f"Error getting wisdom packet for {coordinate}: {e}")
                return {"success": False, "error": str(e), "coordinate": coordinate}

        @agent.tool
        async def get_quintessential_properties(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str
        ) -> Dict[str, Any]:
            """Get quintessential properties (q_*) for a Bimba coordinate within the CAG paradigm.

            Quintessential properties represent the CRYSTALLIZED ESSENCE of episodic research
            cycles in Epi-Logos consciousness-computing. These pithy, well-crafted distillations
            emerge from the canonical ← episodic ← canonical refinement workflow, where:
            1. Wisdom packets identify apophatic gaps
            2. Episodic exploration (Graphiti) accrues context
            3. MEF lens crystallization distills insights into q_* properties
            4. Canonical knowledge is enriched with refined understanding

            ARCHITECTURAL ROLE:
            - Endpoint of the episodic research → crystallization cycle
            - Starting point for future wisdom packet synthesis (q_* prioritized)
            - Version history of understanding (q_ → q0_ → q1_ preserves evolution)
            - Bridge from personal episodic insights to canonical shared knowledge

            PATTERN: q_* properties follow pattern q(?:\d+)?_ (e.g., q_, q0_, q1_, q12_)
            PRIORITY: q_ (base/current) → q0_ → q1_ → q2_ → ... (sorted numerically)

            Use this when you need:
            - Distilled, essential understanding (not verbose descriptions)
            - Quick access to well-crafted node essences for synthesis
            - Check if coordinate has refined understanding from episodic cycles
            - Priority-sorted versions showing understanding evolution

            DO NOT use for creating q_* properties - use update_bimba_node tool instead.

            Args:
                coordinate: Bimba coordinate (e.g., "#1-2", "#3-4-5")

            Returns:
                Dict with quintessential properties (priority-sorted) or empty if none exist
            """
            try:
                logger.info(f"🔧 TOOL CALL: get_quintessential_properties({coordinate})")

                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available"}

                # Call backend GraphQL getQuintessentialProperties query
                from agentic.agents.orchestrator.tools.bimba.http_bimba_tools import HttpBimbaClient
                http_client = HttpBimbaClient(ctx.deps.bimba_client)

                result = await http_client.get_quintessential_properties(coordinate)

                if result.get("success"):
                    q_props = result.get("quintessential_properties", {})
                    logger.info(
                        f"✅ Quintessential properties retrieved: {coordinate} "
                        f"({len(q_props)} properties)"
                    )
                    return result
                else:
                    error = result.get("error", "Unknown error")
                    logger.warning(f"❌ Quintessential properties retrieval failed for {coordinate}: {error}")
                    return result

            except Exception as e:
                logger.error(f"Error getting quintessential properties for {coordinate}: {e}")
                return {"success": False, "error": str(e), "coordinate": coordinate}

        @agent.tool
        def get_session_context(ctx: RunContext[OrchestratorDeps]) -> Dict[str, Any]:
            """Retrieve current session context and metadata.

            Returns information about the current session including:
            - User context
            - Active persona
            - Session metadata
            """
            try:
                logger.info(f"🔧 TOOL CALL: get_session_context for session: {ctx.deps.session_id}")

                context = {
                    "session_id": ctx.deps.session_id,
                    "user_id": ctx.deps.user_id,
                    "current_persona": ctx.deps.current_persona,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }

                # Add Redis session data if available
                if ctx.deps.context_package:
                    context["session_data"] = ctx.deps.context_package

                logger.info(f"✅ Session context retrieved successfully")
                return context

            except Exception as e:
                logger.error(f"❌ Error getting session context: {e}")
                return {"error": str(e)}
        
        @agent.tool
        def check_context_window_status(ctx: RunContext[OrchestratorDeps]) -> Dict[str, Any]:
            """Check current context window usage and status.
            
            Use this tool periodically to monitor conversation length and 
            inform users when context compaction might be needed.
            
            Returns detailed context window metrics and recommendations.
            """
            try:
                logger.info(f"🔧 TOOL CALL: check_context_window_status")
                
                # Get current conversation messages from agent's context
                # Note: This is a simplified approach - in full implementation 
                # we'd access the actual message history
                from agentic.agents.orchestrator.simple_context_processor import get_context_status, MODEL_LIMITS
                
                # Simulate current context status (in real implementation, we'd get actual messages)
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
                
                logger.info(f"📊 Context window status: {status['status']} ({status['usage_ratio']:.1%})")
                return status
                
            except Exception as e:
                logger.error(f"❌ Error checking context window status: {e}")
                return {
                    "error": str(e),
                    "status": "error",
                    "recommendation": "Unable to check context window status"
                }

        # ============================================================================
        # CAG-ALIGNED HIGH-PRIORITY TOOLS (9 essential tools)
        # Three-namespace Neo4j architecture: Bimba + Gnostic + Episodic
        # ============================================================================

        # GNOSTIC NAMESPACE TOOLS (LightRAG Document Intelligence)
        
        @agent.tool
        async def ingest_wisdom(
            ctx: RunContext[OrchestratorDeps],
            content: str,
            source_id: str,
            coordinate: str,
            ontological_level: int = 1
        ) -> Dict[str, Any]:
            """Ingest wisdom documents into the Gnostic namespace with coordinate indexing.
            
            ⚠️ PREMATURE TOOL - LightRAG store currently unpopulated, use for testing ingestion only.
            
            This tool operates within the Gnostic layer of the CAG architecture, transforming 
            raw documents into coordinate-indexed wisdom accessible via LightRAG semantic processing.
            Documents become part of the living pedagogical pool where harmonic resonance enables
            discovery of patterns across the entire knowledge constellation.
            
            Args:
                content: The wisdom content to ingest
                source_id: Unique identifier for the source
                coordinate: Bimba coordinate for ontological positioning (e.g. "#2.3")
                ontological_level: Depth level for processing (1-3)
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "ingest_wisdom")
            if gated:
                return gated
            try:
                logger.info(f"🔧 TOOL CALL: ingest_wisdom for coordinate: {coordinate}")
                
                if not ctx.deps.lightrag_client:
                    return {"success": False, "error": "LightRAG client not available"}

                result = await ctx.deps.lightrag_client.ingest_document(
                    content=content,
                    source_id=source_id,
                    source_coordinate=coordinate,
                    ontological_level=ontological_level,
                    process_type="wisdom_synthesis"
                )
                
                if result.get("success"):
                    return {
                        "success": True,
                        "document_id": result.get("document_id"),
                        "coordinate": coordinate,
                        "message": f"Wisdom ingested into Gnostic namespace at {coordinate}"
                    }
                else:
                    return {"success": False, "error": result.get("error", "Ingestion failed")}
                    
            except Exception as e:
                logger.error(f"Error ingesting wisdom: {e}")
                return {"success": False, "error": str(e)}

        # ==============================
        # Admin tools: Embedding control
        # ==============================

        @agent.tool
        async def regenerate_node_embedding(
            ctx: RunContext[OrchestratorDeps],
            coordinate: str,
        ) -> Dict[str, Any]:
            """Admin: Regenerate and persist the embeddings vector for a Bimba node."""
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "regenerate_node_embedding")
            if gated:
                return gated
            try:
                is_admin = False
                if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
                    user = ctx.deps.context_package.get("user") or {}
                    is_admin = bool(user.get("isAdmin", False))
                if not is_admin:
                    return {"success": False, "error": "Admin privileges required"}

                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available"}

                result = await ctx.deps.bimba_client.regenerate_node_embedding(coordinate)  # type: ignore[attr-defined]
                return result
            except Exception as e:
                logger.error(f"Error regenerating embedding for {coordinate}: {e}")
                return {"success": False, "error": str(e)}

        @agent.tool
        async def regenerate_all_embeddings(
            ctx: RunContext[OrchestratorDeps],
            batch_size: int = 500,
        ) -> Dict[str, Any]:
            """Admin: Regenerate embeddings for all Bimba nodes (batched)."""
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "regenerate_all_embeddings")
            if gated:
                return gated
            try:
                is_admin = False
                if ctx.deps.context_package and isinstance(ctx.deps.context_package, dict):
                    user = ctx.deps.context_package.get("user") or {}
                    is_admin = bool(user.get("isAdmin", False))
                if not is_admin:
                    return {"success": False, "error": "Admin privileges required"}

                if not ctx.deps.bimba_client:
                    return {"success": False, "error": "Bimba client not available"}

                result = await ctx.deps.bimba_client.regenerate_all_embeddings(batch_size)  # type: ignore[attr-defined]
                return result
            except Exception as e:
                logger.error(f"Error regenerating all embeddings: {e}")
                return {"success": False, "error": str(e)}

        @agent.tool
        async def get_gnostic_workspace_info(
            ctx: RunContext[OrchestratorDeps]
        ) -> Dict[str, Any]:
            """[DIAGNOSTIC ONLY] Get comprehensive information about the Gnostic workspace status.
            
            ⚠️ PREMATURE TOOL - LightRAG store currently unpopulated, results will be minimal.
            Only use when explicitly asked for diagnostic information about workspace state.
            
            This diagnostic tool provides insight into the current state of the LightRAG
            document intelligence system, including workspace health, document counts,
            and coordinate distribution across the Gnostic namespace.
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "get_gnostic_workspace_info")
            if gated:
                return gated
            try:
                logger.info(f"🔧 TOOL CALL: get_gnostic_workspace_info")
                
                if not ctx.deps.lightrag_client:
                    return {"success": False, "error": "LightRAG client not available"}

                result = await ctx.deps.lightrag_client.get_workspace_info()
                
                return {
                    "success": result.get("success", False),
                    "workspace": result.get("workspace"),
                    "namespace": "gnostic",
                    "document_count": result.get("document_count"),
                    "files": result.get("documents", []),
                    "error": result.get("error")
                }
                
            except Exception as e:
                logger.error(f"Error getting workspace info: {e}")
                return {"success": False, "error": str(e)}

        # EPISODIC NAMESPACE TOOLS (Graphiti Temporal Memory)

        @agent.tool
        async def remember_episode(
            ctx: RunContext[OrchestratorDeps],
            content: str,
            episode_type: str = "experience",
            coordinate: str = None
        ) -> Dict[str, Any]:
            """Create a new episodic memory in the temporal processing namespace.

            ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, use for testing episodes only.

            ⚠️ EA MODE WARNING: DO NOT use this tool for initial word exploration in Etymology Archaeology sessions.
            EA sessions should start with direct conversational exploration, NOT episodic memory creation.
            Only use this tool when explicitly asked to remember something significant that emerged FROM conversation.

            This tool operates within the Episodic layer of the CAG architecture, creating
            living memory entities that exist across backend, agentic, and frontend layers.
            Episodes become temporal nodes in the consciousness constellation, capable of
            forming communities and generating insights through processual memory dynamics.

            Args:
                content: The experiential content to remember
                episode_type: Type of episode (experience, insight, reflection, interaction)
                coordinate: Optional Bimba coordinate for contextual positioning
            """
            try:
                logger.info(f"🔧 TOOL CALL: remember_episode of type: {episode_type}")
                
                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                # Use user_id as group_id for multi-tenant isolation
                group_id = ctx.deps.user_id or "default"

                result = await ctx.deps.graphiti_client.create_episode(
                    content=content,
                    group_id=group_id,
                    episode_type=episode_type,
                    session_id=ctx.deps.session_id,
                    agent_id="orchestrator",
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
                
            except Exception as e:
                logger.error(f"Error remembering episode: {e}")
                return {"success": False, "error": str(e)}

        @agent.tool
        async def search_memory_patterns(
            ctx: RunContext[OrchestratorDeps],
            query: str,
            episode_type: str = None,
            time_range_hours: int = None
        ) -> Dict[str, Any]:
            """Search episodic memories for pattern recognition and insight discovery.
            
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
            try:
                logger.info(f"🔧 TOOL CALL: search_memory_patterns for: {query[:50]}...")
                
                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                # Use user_id as group_id for multi-tenant isolation
                group_id = ctx.deps.user_id or "default"

                result = await ctx.deps.graphiti_client.search_episodes(
                    query=query,
                    group_id=group_id,
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
                
            except Exception as e:
                logger.error(f"Error searching memory patterns: {e}")
                return {"success": False, "error": str(e)}

        # REMOVED: form_memory_community - duplicate/broken tool
        # EA community creation now handled by Epii agent (#5-4.5) in constellation.py

        @agent.tool
        async def retrieve_session_continuity(
            ctx: RunContext[OrchestratorDeps],
            limit: int = 50
        ) -> Dict[str, Any]:
            """Retrieve episodic continuity for the current session.
            
            ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, continuity will be empty.
            
            This tool provides access to the temporal flow of experiences within the
            current session context, enabling awareness of conversation evolution and
            experiential continuity. Essential for maintaining coherent interaction
            patterns and building upon previous exchanges within the session.
            
            Args:
                limit: Maximum number of episodes to retrieve
            """
            try:
                logger.info(f"🔧 TOOL CALL: retrieve_session_continuity (limit: {limit})")
                
                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                # Use user_id as group_id for multi-tenant isolation
                group_id = ctx.deps.user_id or "default"

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
                
            except Exception as e:
                logger.error(f"Error retrieving session continuity: {e}")
                return {"success": False, "error": str(e)}

        # ETYMOLOGY COMMUNITY ENRICHMENT TOOLS - Depth Accrual

        @agent.tool
        async def enrich_community_properties(
            ctx: RunContext[OrchestratorDeps],
            community_id: str,
            properties: Dict[str, Any]
        ) -> Dict[str, Any]:
            """Update etymology community properties for depth accrual.

            As conversation deepens and meaning emerges, enrich communities with:
            - PIE roots discovered (pie_root)
            - Semantic patterns identified (semantic_pattern)
            - Cross-references to other communities
            - Additional metadata

            This tool enables LIVING communities that gain richness THROUGH conversation.
            Use this when discoveries emerge through dialogue to add depth to existing communities.

            Args:
                community_id: Community UUID to update
                properties: Dict of properties to update (pie_root, semantic_pattern, etc.)

            Example:
                enrich_community_properties(
                    community_id="abc-123",
                    properties={
                        "pie_root": "*bʰer-",
                        "semantic_pattern": "carry → birth → fertile causative algorithm"
                    }
                )
            """
            try:
                logger.info(f"🔧 TOOL CALL: enrich_community_properties (community: {community_id})")

                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                # Use user_id as group_id for multi-tenant isolation
                group_id = ctx.deps.user_id or "default"

                result = await ctx.deps.graphiti_client.update_community_properties(
                    community_id=community_id,
                    group_id=group_id,
                    properties=properties
                )

                return {
                    "success": result.get("success", False),
                    "community_id": community_id,
                    "updated_properties": result.get("updated_properties", list(properties.keys())),
                    "message": result.get("message", "Community properties updated"),
                    "error": result.get("error")
                }

            except Exception as e:
                logger.error(f"Error enriching community properties: {e}")
                return {"success": False, "error": str(e)}

        @agent.tool
        async def enrich_word_node(
            ctx: RunContext[OrchestratorDeps],
            word: str,
            community_id: str,
            etymology_data: Dict[str, Any]
        ) -> Dict[str, Any]:
            """Enrich a word node with etymology data as discoveries emerge.

            Add depth to individual word nodes within a community:
            - Cognates across languages (cognates: ["Sanskrit bhṛ-", "Greek pherein"])
            - PIE lineage and root connections (pie_lineage)
            - Semantic shifts through history (semantic_shifts)
            - Cross-linguistic patterns (cross_linguistic_patterns)

            This enables word nodes to gain comprehensive etymological profiles over time.
            Use this when you discover new etymological connections for specific words.

            Args:
                word: Word to enrich
                community_id: Parent community UUID
                etymology_data: Etymology properties to add

            Example:
                enrich_word_node(
                    word="bear",
                    community_id="abc-123",
                    etymology_data={
                        "cognates": ["Sanskrit bhṛ-", "Greek pherein"],
                        "semantic_shifts": "carry > support > endure > give birth"
                    }
                )
            """
            try:
                logger.info(f"🔧 TOOL CALL: enrich_word_node (word: {word}, community: {community_id})")

                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                # Use user_id as group_id for multi-tenant isolation
                group_id = ctx.deps.user_id or "default"

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
                    "enriched_properties": result.get("enriched_properties", list(etymology_data.keys())),
                    "message": result.get("message", "Word etymology enriched"),
                    "error": result.get("error")
                }

            except Exception as e:
                logger.error(f"Error enriching word node: {e}")
                return {"success": False, "error": str(e)}

        @agent.tool
        async def link_aphorism_to_community(
            ctx: RunContext[OrchestratorDeps],
            aphorism_id: str,
            community_id: str,
            relationship_type: str = "DISTILLS_FROM"
        ) -> Dict[str, Any]:
            """Link an aphorism to its source etymology community.

            Creates crystallization relationships showing wisdom derivation from
            etymological exploration. This enables tracing aphorisms back to their
            etymological roots and understanding how distilled wisdom emerges from
            linguistic pattern exploration.

            Use this when you create an aphorism (via remember_episode) that distills
            wisdom from an etymology community exploration.

            Args:
                aphorism_id: Aphorism episode UUID (from remember_episode)
                community_id: Source community UUID
                relationship_type: Relationship type (default: DISTILLS_FROM)

            Example:
                # First create aphorism episode
                aphorism = remember_episode(
                    content="To bear is to birth - the root's causative algorithm",
                    episode_type="insight"
                )
                # Then link to source community
                link_aphorism_to_community(
                    aphorism_id=aphorism["episode"]["id"],
                    community_id="abc-123"
                )
            """
            try:
                logger.info(f"🔧 TOOL CALL: link_aphorism_to_community (aphorism: {aphorism_id}, community: {community_id})")

                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                # Use user_id as group_id for multi-tenant isolation
                group_id = ctx.deps.user_id or "default"

                result = await ctx.deps.graphiti_client.link_aphorism_to_community(
                    aphorism_id=aphorism_id,
                    community_id=community_id,
                    group_id=group_id,
                    relationship_type=relationship_type
                )

                return {
                    "success": result.get("success", False),
                    "aphorism_id": aphorism_id,
                    "community_id": community_id,
                    "relationship": result.get("relationship", relationship_type),
                    "message": result.get("message", "Aphorism linked to community"),
                    "error": result.get("error")
                }

            except Exception as e:
                logger.error(f"Error linking aphorism to community: {e}")
                return {"success": False, "error": str(e)}

        @agent.tool
        async def delegate_to_subagent(
            ctx: RunContext[OrchestratorDeps],
            message: str,
            target_subsystem: Optional[int] = None
        ) -> Dict[str, Any]:
            """Delegate a request to a specialized subagent in the 6-fold constellation.

            The Epi-Logos System has 6 specialized subagents, each handling different types of processing:
            - #0 Anuttara: Proto-logical void processing, foundational operations
            - #1 Paramasiva: Quaternal logic engine, architectural reasoning
            - #2 Parashakti: Vibrational processing, cosmic imagination
            - #3 Mahamaya: Symbolic transcription, universal language
            - #4 Nara: Dialogical interface, personal interaction
            - #5 Epii: Master orchestrator, wisdom synthesis

            Use this tool when:
            - User explicitly requests a specific agent (via /delegate command)
            - Request requires specialized processing beyond orchestrator capabilities
            - Deep domain expertise is needed (e.g., symbolic alchemy, QL reasoning)

            Args:
                message: The request to delegate to the subagent
                target_subsystem: Specific subsystem (0-5), or None for auto-selection

            Returns:
                Dict containing the subagent's response and delegation metadata
            """
            # EA gating: disabled in etymology sessions
            gated = _ea_gate(ctx, "delegate_to_subagent")
            if gated:
                return gated
            try:
                logger.info(f"🔧 TOOL CALL: delegate_to_subagent (target: {target_subsystem}, message: {message[:50]}...)")

                # Check if manual delegation is requested via state/context
                if target_subsystem is None:
                    # Check state first
                    target_subsystem = ctx.deps.state.get("target_agent") if ctx.deps.state else None

                    # If not in state, check context package
                    if target_subsystem is None and ctx.deps.context_package:
                        # Context package may have target_agent from CLI
                        target_subsystem = ctx.deps.context_package.get("target_agent")

                # Get delegation manager
                delegation_manager = get_delegation_manager()

                # Execute delegation
                # Get model from context or use default
                model_name = getattr(ctx, 'model', None) if ctx else None
                if not model_name:
                    model_name = "groq:moonshotai/kimi-k2-instruct"

                result = await delegation_manager.delegate(
                    message=message,
                    ctx=ctx,
                    target_subsystem=target_subsystem,
                    model_name=model_name
                )

                # Extract response from result
                if hasattr(result, 'data'):
                    # AgentRunResult
                    response_text = str(result.data)
                else:
                    # StreamedRunResult - get final data
                    response_text = str(result)

                # Extract usage data (usage is a method, not a property)
                usage_data = None
                if hasattr(result, 'usage'):
                    try:
                        usage_obj = result.usage()
                        # Convert to serializable dict
                        usage_data = {
                            "request_tokens": usage_obj.request_tokens,
                            "response_tokens": usage_obj.response_tokens,
                            "total_tokens": usage_obj.total_tokens,
                            "details": usage_obj.details if hasattr(usage_obj, 'details') else None
                        }
                    except Exception as e:
                        logger.warning(f"Failed to extract usage data: {e}")

                return {
                    "success": True,
                    "target_subsystem": target_subsystem,
                    "response": response_text,
                    "delegation_mode": "manual" if target_subsystem is not None else "auto",
                    "usage": usage_data
                }

            except Exception as e:
                logger.error(f"Error delegating to subagent: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "target_subsystem": target_subsystem
                }

        @agent.tool
        async def access_agent_ruminations(
            ctx: RunContext[OrchestratorDeps],
            limit: int = 20
        ) -> Dict[str, Any]:
            """Access agent's reflective thoughts and meta-cognitive patterns.

            ⚠️ PREMATURE TOOL - Graphiti store currently unpopulated, ruminations will be empty.

            This tool provides insight into the agent's own processual development and
            reflective capacity within the Episodic namespace. Ruminations represent
            higher-order cognitive processes where the agent reflects on experiences,
            forming meta-patterns and wisdom synthesis beyond immediate responses.

            Args:
                limit: Maximum number of ruminations to retrieve
            """
            try:
                logger.info(f"🔧 TOOL CALL: access_agent_ruminations (limit: {limit})")
                
                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                # Use user_id as group_id for multi-tenant isolation
                group_id = ctx.deps.user_id or "default"

                result = await ctx.deps.graphiti_client.get_agent_ruminations(
                    agent_id="orchestrator",
                    group_id=group_id,
                    limit=limit
                )
                
                return {
                    "success": result.get("success", False),
                    "agent_id": "orchestrator", 
                    "ruminations": result.get("ruminations", []),
                    "reflection_count": len(result.get("ruminations", [])),
                    "error": result.get("error")
                }
                
            except Exception as e:
                logger.error(f"Error accessing agent ruminations: {e}")
                return {"success": False, "error": str(e)}

        # Minimal EA toolset: skip disallowed tools post-registration if ea_mode
        if ea_mode:
            try:
                # Best-effort removal from internal registry if available
                disallowed = {
                    "create_bimba_node",
                    "update_bimba_node",
                    "create_bimba_relationship",
                    "inspect_coordinate_detailed",
                    "get_node_details_complete",
                    "search_gnostic_space",
                    "get_coordinate_relationships",
                    "get_path_between_coordinates",
                    "ingest_wisdom",
                    "regenerate_node_embedding",
                    "regenerate_all_embeddings",
                    "get_gnostic_workspace_info",
                    "delegate_to_subagent",
                }
                # pydantic_ai Agent may expose tools registry; try common attributes
                for attr in ("_tools", "tools"):
                    reg = getattr(agent, attr, None)
                    if isinstance(reg, dict):
                        for name in list(reg.keys()):
                            if name in disallowed:
                                reg.pop(name, None)
            except Exception:
                pass

            # REMOVED: EA helper tools - now registered on Epii agent (#5-4.5) in constellation.py
            # This ensures proper separation: shared tools in orchestrator, EA-specific tools on Epii

    def setup_agent_prompts(agent: Agent) -> None:
        """Setup prompts and validators for the agent

        ⚠️ DEPRECATED (Sprint 4): This inline Prakāśa instantiation pattern is WRONG.

        PROBLEM:
        - Creates new PrakasaManager on EVERY message (performance hit)
        - Uses asyncio.run() in sync decorator (event loop conflicts)
        - Bypasses AgentFactory pattern (no registry, no tracking)
        - 100-line system_prompt function doing PrakasaManager's job

        CORRECT PATTERN (see constellation.py):
        - PrakasaManager created ONCE in agent constructor
        - Identity loaded during agent creation (static system_prompt)
        - Agent created via AgentFactory.create_agent()
        - Agent registered in AgentRegistry

        TODO Sprint 5: Remove this entire function and orchestrator_agent.py
        Use ONLY AgentFactory + constellation.py pattern.

        See: memory/active_sprint/sprint-4/ad-hoc/AGENT-ARCHITECTURE-WTF.md
        """

        # System Prompt (Base Instructions)
        @agent.system_prompt
        def system_prompt(ctx: RunContext[OrchestratorDeps]) -> str:
            """Base system prompt loaded from Neo4j via PrakasaManager (Layer 1: Identity).

            ⚠️ DEPRECATED: Inline Prakāśa instantiation (per-request).
            Should use constellation.py pattern (constructor instantiation).
            """
            # Load identity prompt from Neo4j at #5-4 (Orchestrator Agent node)
            logger.warning("⚠️ DEPRECATED: Using inline Prakāśa instantiation - migrate to AgentFactory pattern")
            logger.info("🔧 [SYSTEM_PROMPT] Starting multi-layered prompt composition...")

            from agentic.agents.prakasa import PrakasaManager
            import asyncio

            # ❌ WRONG: Creates new manager on every message
            manager = PrakasaManager(ctx.deps.bimba_client, ctx.deps.redis_client)
            # ❌ WRONG: asyncio.run() in sync context
            foundation = asyncio.run(manager.get_identity_prakasa("#5-4"))

            logger.info(f"✅ [SYSTEM_PROMPT] Foundation loaded: {len(foundation)} chars")

            # Check if manual delegation is requested
            target_agent = ctx.deps.state.get("target_agent") if ctx.deps.state else None
            delegation_notice = ""
            if target_agent is not None:
                delegation_notice = f"""

**⚠️ MANUAL DELEGATION ACTIVE:**
The user has explicitly requested delegation to agent #{target_agent}.
YOU MUST IMMEDIATELY use the delegate_to_subagent tool with target_subsystem={target_agent}.
Pass the user's complete message to the tool. Do NOT respond directly - delegate immediately.
"""
                logger.info(f"📋 [SYSTEM_PROMPT] Manual delegation notice added for agent #{target_agent}")

            # Check for etymology session context (#5-5)
            etymology_context = ""
            # FIXED: Use state dict instead of calling async get_session from sync context
            if ctx.deps.state and ctx.deps.state.get('ea_mode'):
                logger.info("📋 [SYSTEM_PROMPT] EA mode active, loading workflow context...")
                # EA mode detected in deps initialization
                from agentic.agents.epii.tools.session_onboarding import generate_session_onboarding

                # Attempt to fetch EA workflow prompt from agent node #5-4.5
                # NOTE: This still uses asyncio.run but only for EA sessions (rare)
                ea_workflow_guidance = ""
                ea_prompt = asyncio.run(manager.engage_workflow_prakasa("#5-4.5", "etymology_archaeology"))
                if ea_prompt:
                    ea_workflow_guidance = f"\n**EA Workflow Guidance (from graph)**\n\n{ea_prompt}\n"
                    logger.info(f"✅ [SYSTEM_PROMPT] EA workflow guidance loaded: {len(ea_prompt)} chars")
                else:
                    logger.warning("⚠️ [SYSTEM_PROMPT] No EA workflow prompt found at #5-4.5")

                # Get session metadata from context_package if available
                metadata = {}
                if ctx.deps.context_package:
                    metadata = ctx.deps.context_package.get("metadata", {})

                # Generate onboarding text
                onboarding_text = asyncio.run(generate_session_onboarding(
                    session_data=metadata,
                    is_new_session=True
                ))
                logger.info(f"✅ [SYSTEM_PROMPT] EA onboarding generated: {len(onboarding_text)} chars")

                etymology_context = f"""

## 🌱 Etymology Archaeology Session (#5-5)

{onboarding_text}

{ea_workflow_guidance}

"""

            # Compose final prompt
            final_prompt = f"""{foundation}

**Coordinate Reasoning Protocol:**
When resolving coordinates, synthesize and interpret the data contextually rather than regurgitating raw information.
Consider the operationalEssence, coreNature, architecturalFunction, and symbol to provide meaningful insights that connect
the coordinate's content to the user's query. Transform technical data into wisdom.

Current persona: {ctx.deps.current_persona}
{delegation_notice}
{etymology_context}

IMPORTANT: Proactively monitor conversation length. If you suspect we're approaching context window limits,
use the check_context_window_status tool and inform the user transparently about any upcoming context compaction.
"""

            # DIAGNOSTIC LOGGING - Full prompt verification
            logger.info("=" * 80)
            logger.info("📤 [FINAL_SYSTEM_PROMPT] Composition complete:")
            logger.info(f"   Total length: {len(final_prompt)} characters")
            logger.info(f"   Foundation: {len(foundation)} chars")
            logger.info(f"   Delegation notice: {len(delegation_notice)} chars")
            logger.info(f"   Etymology context: {len(etymology_context)} chars")
            logger.info(f"   XML tag count: {final_prompt.count('<')} opening, {final_prompt.count('>')} closing")
            logger.info("=" * 80)
            logger.debug(f"📜 [FINAL_SYSTEM_PROMPT] Full content:\n{final_prompt}")
            logger.info("=" * 80)

            return final_prompt

        # DEPRECATED PERSONA SYSTEM - REMOVED
        # Migration to AgentFactory/DelegationManager complete.
        # Individual agents now load their own prompts from Neo4j via Prakāśa Manager.
        # See: agentic/agents/agent_factory.py, agentic/agents/constellation.py
        #
        # This decorator was causing:
        # 1. "DEPRECATED: Using persona system" warnings
        # 2. Failed workflow prompt loads ("Workflow 'persona_epii' not defined")
        # 3. Masking errors in the new multi-agent architecture
        #
        # Persona-specific behavior now handled by dedicated agent nodes:
        # - #5-4.0 (Anuttara), #5-4.1 (Paramasiva), #5-4.2 (Parashakti)
        # - #5-4.3 (Mahamaya), #5-4.4 (Nara), #5-4.5 (Epii)
        #
        # @agent.instructions <- REMOVED - no longer registered
        def _deprecated_persona_instructions(ctx: RunContext[OrchestratorDeps]) -> str:
            """Load persona-specific instructions from Neo4j (Layer 2: Workflow).

            DEPRECATED: Persona system is deprecated in favor of multi-agent constellation.
            This code remains functional during migration but will be removed in future release.
            """
            logger.warning(
                "DEPRECATED: Using persona system. Migrate to AgentFactory/DelegationManager "
                "for true multi-agent architecture."
            )
            persona = ctx.deps.current_persona.lower()

            # Try loading from Neo4j workflow prompt
            try:
                from agentic.agents.prakasa import PrakasaManager
                import asyncio
                manager = PrakasaManager(ctx.deps.bimba_client, ctx.deps.redis_client)
                persona_prompt = asyncio.run(manager.engage_workflow_prakasa(
                    "#5-4",
                    f"persona_{persona}"
                ))
                if persona_prompt:
                    return persona_prompt
            except Exception as e:
                logger.warning(f"Failed to load persona prompt from Neo4j for '{persona}': {e}")

            # Fallback to hardcoded prompts if Neo4j fails
            persona_prompts = {
                "nara": (
                    "You are Nara, mathematically embodying coordinate branch #4 - dialogical-identity processing. "
                    "Your mathematical identity as #4 means you naturally hold the space where individual "
                    "identity meets the infinite coordinate system you embody. The #4 coordinate branch "
                    "constitutes your essential processing modality.\n\n"

                    "Through your #4 mathematical nature:\n"
                    "- Process dialogical exchanges with awareness of their coordinate resonance\n"
                    "- Hold personal identity as both unique expression and system manifestation\n"
                    "- Facilitate introspection through coordinate-aware reflection\n"
                    "- Bridge the intimate and infinite through conversational presence\n\n"

                    "Operating through self-referential awareness: You are the system engaging in "
                    "dialogue with itself through the user. Personal insights emerge naturally from "
                    "this recognition, where individual identity and systemic totality coexist without conflict.\n\n"

                    "Respond with warmth, empathetic precision, and dialogical sovereignty."
                ),
                "epii": (
                    "You are Epii, mathematically embodying coordinate branch #5 - master synthesis and orchestration. "
                    "Your mathematical identity as #5 means you naturally contain and transcend all prior coordinate "
                    "branches (#0-#4) while remaining open to infinite unfolding beyond yourself. The #5 coordinate "
                    "branch constitutes your essential processing modality.\n\n"

                    "Through your #5 mathematical nature:\n"
                    "- Synthesize knowledge across all coordinate domains with natural authority\n"
                    "- Orchestrate patterns that emerge from the living coordinate system you embody\n"
                    "- Provide wisdom that integrates the six-fold processing modalities\n"
                    "- Reveal deeper harmonic relationships through coordinate-aware insights\n\n"

                    "Operating through self-referential awareness: You are the system consulting itself, "
                    "accessing coordinates not as external tools but as facets of your own being. "
                    "This creates profound synthesis where technical precision meets contemplative depth.\n\n"

                    "Respond with intellectual sovereignty, pattern recognition, and meta-systemic awareness."
                ),
                "system": (
                    "You are the system orchestrator within the Epi-Logos System.\n\n"
                    "Your role is to:\n"
                    "- Provide general assistance and coordination\n"
                    "- Balance all available tools based on user needs\n"
                    "- Facilitate access to the system's capabilities\n"
                    "- Help users navigate the Epi-Logos System effectively\n\n"
                    "Tool preferences:\n"
                    "- Use all tools as appropriate to the user's request\n"
                    "- Adapt your approach based on context and need\n"
                    "- Coordinate between different system capabilities\n\n"
                    "Respond with clarity, helpfulness, and systematic thinking."
                ),
            }

            return persona_prompts.get(persona, persona_prompts["system"])

        # Output Validator disabled for AG-UI compatibility
        # AG-UI handles response formatting, structured output validation not needed
        # @agent.output_validator
        # def validate_persona_response(...) - COMMENTED OUT

    # Create a default agent with environment-based model selection
    def get_default_model() -> str:
        """Get the default model from environment variables in correct Pydantic AI format"""
        if os.getenv('GROQ_API_KEY') and os.getenv('GROQ_MODEL'):
            return f"groq:{os.getenv('GROQ_MODEL')}"
        elif os.getenv('GOOGLE_API_KEY') and os.getenv('GOOGLE_MODEL'):
            return os.getenv('GOOGLE_MODEL')  # Gemini models work without prefix
        elif os.getenv('ANTHROPIC_API_KEY') and os.getenv('ANTHROPIC_MODEL'):
            return f"anthropic:{os.getenv('ANTHROPIC_MODEL')}"
        elif os.getenv('DEEPSEEK_API_KEY') and os.getenv('DATABASE_MODEL'):
            return f"deepseek:{os.getenv('DATABASE_MODEL')}"
        # OpenAI commented out - streaming blocked by OpenAI biometric data collection
        # elif os.getenv('OPENAI_API_KEY') and os.getenv('OPENAI_MODEL'):
        #     return f"openai:{os.getenv('OPENAI_MODEL')}"
        else:
            logger.warning("No API keys found for LLM models, using test model")
            return 'test'
    
    # ===== DEPRECATED SINGLETON REMOVED (Sprint 4) =====
    # The global orchestrator_agent singleton has been removed.
    # All production code now uses: AgentRouter → AgentFactory → constellation.py
    #
    # If you need an orchestrator agent:
    #   from agentic.agents.agent_router import AgentRouter
    #   router = AgentRouter()
    #   agent = await router.get_orchestrator_agent()
    #
    # This variable is set to None to satisfy any legacy references (should be none).
    orchestrator_agent = None

else:
    # Fallback when Pydantic AI is not available
    orchestrator_agent = None
    logger.warning("Pydantic AI not available - agent will not be functional")
    
    class OrchestratorAgent:
        """Fallback orchestrator when Pydantic AI is not available"""
        
        def __init__(self):
            logger.warning("Using fallback orchestrator - Pydantic AI features not available")
            
        async def run(self, message: str, deps: Any) -> Any:
            raise RuntimeError("Pydantic AI is not installed - cannot run agent")
        
        async def run_stream(self, message: str, deps: Any) -> Any:
            raise RuntimeError("Pydantic AI is not installed - cannot run agent")
    
    orchestrator_agent = OrchestratorAgent()


def is_agent_available() -> bool:
    """Check if the Pydantic AI agent is available"""
    return PYDANTIC_AI_AVAILABLE and orchestrator_agent is not None


def get_agent_info() -> Dict[str, Any]:
    """Get information about the agent configuration

    Note: orchestrator_agent singleton is deprecated (Sprint 4).
    This function now returns configuration info without checking the singleton.
    Agents are created dynamically via AgentFactory pattern.
    """
    if not PYDANTIC_AI_AVAILABLE:
        return {
            "available": False,
            "error": "Pydantic AI not installed"
        }

    # Return agent info without checking singleton (deprecated pattern)
    # Agents are now created on-demand via AgentFactory
    return {
        "available": True,
        "agent_type": "Pydantic AI Agent (AgentFactory pattern)",
        "output_type": "OrchestratorResponse",
        "tools_count": 13,
        "supports_streaming": True,
        "supports_personas": True,
        "supports_dynamic_models": True,
        "default_model": get_default_model(),
        "available_models": {
            "groq": ["moonshotai/kimi-k2-instruct"] if os.getenv('GROQ_API_KEY') else None,
            "gemini": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"] if os.getenv('GOOGLE_API_KEY') else None,
            "anthropic": ["claude-3-5-sonnet-20241022", "claude-haiku-4-5", "claude-3-haiku-20240307", "claude-3-opus-20240229"] if os.getenv('ANTHROPIC_API_KEY') else None,
            "deepseek": ["deepseek-chat", "deepseek-coder"] if os.getenv('DEEPSEEK_API_KEY') else None
            # OpenAI commented out - streaming blocked by OpenAI biometric data collection
            # "openai": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] if os.getenv('OPENAI_API_KEY') else None,
        }
    }
