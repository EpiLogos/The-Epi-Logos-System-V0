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
    """Dependencies container for the orchestrator agent"""
    session_id: str
    user_id: str
    redis_client: Any  # SessionManager
    mongodb_client: Any  # ConversationManager
    bimba_client: Any  # BimbaGraphQLClient
    lightrag_client: Optional[Any] = None
    graphiti_client: Optional[Any] = None
    current_persona: str = "system"
    context_package: Optional[Dict[str, Any]] = None
    state: Dict[str, Any] = None  # Required by Pydantic AI StateHandler protocol


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
    
    def create_orchestrator_agent(model_name: str) -> Agent:
        """Create an orchestrator agent with the specified model"""
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
            setup_agent_tools(agent)
            setup_agent_prompts(agent)
            
            logger.info(f"Created Pydantic AI orchestrator agent with model: {model_name} (with context processor)")
            return agent
            
        except Exception as e:
            logger.error(f"Error creating agent with model {model_name}: {e}")
            raise
    
    def setup_agent_tools(agent: Agent) -> None:
        """Setup tools for the agent"""

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

                result = await ctx.deps.graphiti_client.create_episode(
                    content=content,
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
                
            except Exception as e:
                logger.error(f"Error searching memory patterns: {e}")
                return {"success": False, "error": str(e)}

        @agent.tool
        async def form_memory_community(
            ctx: RunContext[OrchestratorDeps],
            name: str,
            description: str,
            coordinate: str = None
        ) -> Dict[str, Any]:
            """Create a community cluster for related episodic memories.
            
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
            try:
                logger.info(f"🔧 TOOL CALL: form_memory_community: {name}")
                
                if not ctx.deps.graphiti_client:
                    return {"success": False, "error": "Graphiti client not available"}

                result = await ctx.deps.graphiti_client.create_community(
                    name=name,
                    description=description,
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
                
            except Exception as e:
                logger.error(f"Error forming memory community: {e}")
                return {"success": False, "error": str(e)}

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
                
            except Exception as e:
                logger.error(f"Error retrieving session continuity: {e}")
                return {"success": False, "error": str(e)}

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

                result = await ctx.deps.graphiti_client.get_agent_ruminations(
                    agent_id="orchestrator",
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

    def setup_agent_prompts(agent: Agent) -> None:
        """Setup prompts and validators for the agent"""

        # System Prompt (Base Instructions)
        @agent.system_prompt
        def system_prompt(ctx: RunContext[OrchestratorDeps]) -> str:
            """Base system prompt using modular foundation components."""
            # Get complete system foundation from modular imports
            foundation = get_complete_system_foundation()
            
            return f"""{foundation}

**Coordinate Reasoning Protocol:**
When resolving coordinates, synthesize and interpret the data contextually rather than regurgitating raw information. 
Consider the operationalEssence, coreNature, architecturalFunction, and symbol to provide meaningful insights that connect 
the coordinate's content to the user's query. Transform technical data into wisdom.

Current persona: {ctx.deps.current_persona}

IMPORTANT: Proactively monitor conversation length. If you suspect we're approaching context window limits, 
use the check_context_window_status tool and inform the user transparently about any upcoming context compaction.
"""

        # Dynamic Persona Instructions
        @agent.instructions
        def persona_instructions(ctx: RunContext[OrchestratorDeps]) -> str:
            """Generate persona-specific instructions dynamically."""
            persona = ctx.deps.current_persona.lower()

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
    
    # Create default orchestrator agent for backward compatibility
    try:
        default_model = get_default_model()
        orchestrator_agent = create_orchestrator_agent(default_model)
        logger.info(f"Default orchestrator agent created with model: {default_model}")
    except Exception as e:
        logger.error(f"Error creating default orchestrator agent: {e}")
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
    """Get information about the agent configuration"""
    if not PYDANTIC_AI_AVAILABLE:
        return {
            "available": False,
            "error": "Pydantic AI not installed"
        }
    
    if orchestrator_agent is None:
        return {
            "available": False,
            "error": "Agent not initialized"
        }
    
    return {
        "available": True,
        "agent_type": "Pydantic AI Agent",
        "output_type": "OrchestratorResponse",
        "tools_count": 13,
        "supports_streaming": True,
        "supports_personas": True,
        "supports_dynamic_models": True,
        "default_model": get_default_model(),
        "available_models": {
            "groq": ["moonshotai/kimi-k2-instruct"] if os.getenv('GROQ_API_KEY') else None,
            "gemini": ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-pro"] if os.getenv('GOOGLE_API_KEY') else None,
            "anthropic": ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"] if os.getenv('ANTHROPIC_API_KEY') else None,
            "deepseek": ["deepseek-chat", "deepseek-coder"] if os.getenv('DEEPSEEK_API_KEY') else None
            # OpenAI commented out - streaming blocked by OpenAI biometric data collection
            # "openai": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] if os.getenv('OPENAI_API_KEY') else None,
        }
    }
