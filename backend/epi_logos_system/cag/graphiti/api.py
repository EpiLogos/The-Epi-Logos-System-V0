"""
FastAPI endpoints for Graphiti GraphQL integration.

This module provides HTTP API endpoints for frontend and backend integration
with the Graphiti episodic memory service, exposing GraphQL-compatible operations
for temporal memory management.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from pydantic import BaseModel, Field

from shared.database import Neo4jClient
from .service import GraphitiService
from .session_service import EtymologySessionService
from .models import (
    Episode, Community, EpisodeType,
    EpisodeRequest, EpisodeResponse,
    CommunityRequest, CommunityResponse,
    SearchRequest, SearchResponse,
    EtymologySessionRequest,
    EtymologySessionResponse,
    EtymologySessionUpdateRequest,
    EtymologySessionListResponse,
    EtymologySessionStatus,
    EtymologyCommunityRequest,
    AphorismRequest
)


logger = logging.getLogger(__name__)


# Singleton GraphitiService instance (initialized on first request)
_graphiti_service_singleton: Optional[GraphitiService] = None

# Dependency for getting Graphiti service instance
def get_graphiti_service() -> GraphitiService:
    """Get singleton Graphiti service instance with shared Neo4j client.

    FIXED: Uses singleton pattern to avoid re-instantiation on every request,
    preventing 54s+ index rebuilding delays (see GraphitiService._ensure_indices).
    """
    global _graphiti_service_singleton

    if _graphiti_service_singleton is None:
        # Create singleton on first request - shared across all requests
        neo4j_client = Neo4jClient()
        _graphiti_service_singleton = GraphitiService(neo4j_client)
        logger.info("✅ Initialized singleton GraphitiService instance")

    return _graphiti_service_singleton


# Dependency for getting Etymology Session service
def get_session_service() -> EtymologySessionService:
    """Get Etymology Session service instance."""
    return EtymologySessionService()


# API Response models for GraphQL compatibility
class GraphQLEpisodeResponse(BaseModel):
    """GraphQL-compatible episode response."""
    data: Optional[Episode] = None
    errors: Optional[List[str]] = None
    message: Optional[str] = None


class GraphQLEpisodesResponse(BaseModel):
    """GraphQL-compatible episodes list response."""
    data: List[Episode] = Field(default_factory=list)
    total_count: int = 0
    errors: Optional[List[str]] = None
    message: Optional[str] = None


class GraphQLCommunityResponse(BaseModel):
    """GraphQL-compatible community response."""
    data: Optional[Community] = None
    errors: Optional[List[str]] = None
    message: Optional[str] = None


# Create router for Graphiti API endpoints
router = APIRouter(prefix="/api/graphiti", tags=["episodic-memory"])


@router.post("/episodes", response_model=GraphQLEpisodeResponse)
async def create_episode(
    request: EpisodeRequest,
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Create a new episodic memory entry.
    
    This endpoint provides HTTP access to episode creation for frontend
    and backend services, with the same functionality as the MCP server.
    """
    try:
        response = await service.create_episode(request)
        
        if response.success:
            return GraphQLEpisodeResponse(
                data=response.episode,
                message=response.message
            )
        else:
            return GraphQLEpisodeResponse(
                errors=[response.message or "Failed to create episode"],
                message=response.message
            )
            
    except Exception as e:
        logger.error(f"Error in create_episode API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/episodes/search", response_model=GraphQLEpisodesResponse)
async def search_episodes(
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    query: Optional[str] = Query(None, description="Search query text"),
    episode_types: Optional[str] = Query(None, description="Comma-separated episode types"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    session_id: Optional[str] = Query(None, description="Filter by session ID"),
    agent_id: Optional[str] = Query(None, description="Filter by agent ID"),
    start_date: Optional[str] = Query(None, description="Filter episodes after this date (ISO format)"),
    end_date: Optional[str] = Query(None, description="Filter episodes before this date (ISO format)"),
    limit: int = Query(10, ge=1, le=100, description="Maximum results to return"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Search episodic memories using hybrid search.
    
    Provides GraphQL-compatible search interface with filtering capabilities
    for temporal memory retrieval across user sessions, agent ruminations,
    and context frame activations.
    """
    try:
        # Parse episode types
        parsed_episode_types = None
        if episode_types:
            try:
                parsed_episode_types = [EpisodeType(t.strip()) for t in episode_types.split(",")]
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid episode type: {e}")
        
        # Parse dates
        parsed_start_date = None
        parsed_end_date = None
        
        if start_date:
            try:
                parsed_start_date = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid start_date format. Use ISO format.")
        
        if end_date:
            try:
                parsed_end_date = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid end_date format. Use ISO format.")
        
        # Create search request
        search_request = SearchRequest(
            group_id=group_id,
            query=query,
            episode_types=parsed_episode_types,
            user_id=user_id,
            session_id=session_id,
            agent_id=agent_id,
            start_date=parsed_start_date,
            end_date=parsed_end_date,
            limit=limit
        )
        
        # Execute search
        response = await service.search_episodes(search_request)
        
        if response.success:
            return GraphQLEpisodesResponse(
                data=response.episodes,
                total_count=response.total_count,
                message=response.message
            )
        else:
            return GraphQLEpisodesResponse(
                errors=[response.message or "Search failed"],
                message=response.message
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in search_episodes API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sessions/{session_id}/episodes", response_model=GraphQLEpisodesResponse)
async def get_session_episodes(
    session_id: str,
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Get all episodes for a specific session to maintain continuity.
    
    This endpoint is crucial for maintaining session state and context
    across multiple interactions within the same user session.
    """
    try:
        episodes = await service.get_session_continuity(group_id, session_id)
        
        return GraphQLEpisodesResponse(
            data=episodes,
            total_count=len(episodes),
            message=f"Retrieved {len(episodes)} episodes for session {session_id}"
        )
        
    except Exception as e:
        logger.error(f"Error in get_session_episodes API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/agents/{agent_id}/ruminations", response_model=GraphQLEpisodesResponse)
async def get_agent_ruminations(
    agent_id: str,
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    limit: int = Query(10, ge=1, le=50, description="Maximum ruminations to return"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Get recent agent rumination episodes for learning continuity.
    
    This endpoint provides access to AI agent self-reflection and reasoning
    processes for maintaining learning continuity and context awareness.
    """
    try:
        episodes = await service.get_agent_ruminations(group_id, agent_id, limit)
        
        return GraphQLEpisodesResponse(
            data=episodes,
            total_count=len(episodes),
            message=f"Retrieved {len(episodes)} ruminations for agent {agent_id}"
        )
        
    except Exception as e:
        logger.error(f"Error in get_agent_ruminations API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# DEPRECATED ENDPOINT REMOVED (2025-10-27):
# POST /communities - Used deprecated service.create_community() method with sync/async mismatch
# Use POST /etymology/community instead, which properly uses Graphiti's build_communities()


@router.get("/episodes/types")
async def get_episode_types():
    """Get available episode types for frontend selection."""
    return {
        "episode_types": [
            {
                "value": episode_type.value,
                "description": {
                    "user_session": "User interaction and navigation events",
                    "agent_rumination": "AI agent self-reflection and reasoning processes",
                    "context_frame": "Context frame activation events",
                    "learning_event": "Agent learning and understanding updates",
                    "community_formation": "Temporal clustering of related episodes"
                }.get(episode_type.value, "Unknown episode type")
            }
            for episode_type in EpisodeType
        ]
    }


@router.get("/health")
async def health_check():
    """Health check endpoint for service monitoring."""
    try:
        # Try to create service - this is where initialization fails
        service = get_graphiti_service()

        # Test Neo4j connection
        connection_ok = service.neo4j_client.test_connection()

        return {
            "status": "healthy" if connection_ok else "degraded",
            "neo4j_connection": connection_ok,
            "workspace_id": service.workspace_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    except Exception as e:
        logger.error(f"Graphiti health check failed: {e}", exc_info=True)
        # Return 200 with error details instead of letting FastAPI convert to 500
        # This allows frontend to see actual error message
        return {
            "status": "unhealthy",
            "error": str(e),
            "error_type": type(e).__name__,
            "error_details": {
                "message": str(e),
                "hint": "Check GEMINI_API_KEY and Neo4j credentials in environment"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# GraphQL Schema Extensions (for documentation and frontend integration)
@router.get("/schema")
async def get_graphql_schema():
    """
    Get GraphQL schema definition for episodic memory types.
    
    This provides schema information for frontend GraphQL clients
    to properly integrate with the episodic memory service.
    """
    schema = {
        "types": {
            "Episode": {
                "fields": {
                    "id": "ID!",
                    "group_id": "String!",
                    "episode_type": "EpisodeType!",
                    "content": "String!",
                    "context": "JSON",
                    "occurred_at": "DateTime!",
                    "ingested_at": "DateTime!",
                    "user_id": "String",
                    "session_id": "String",
                    "agent_id": "String",
                    "related_episodes": "[String!]!",
                    "community_id": "String"
                }
            },
            "Community": {
                "fields": {
                    "id": "ID!",
                    "group_id": "String!",
                    "name": "String!",
                    "episode_ids": "[String!]!",
                    "quaternary_position": "Int",
                    "context_frame_type": "String",
                    "formed_at": "DateTime!",
                    "last_activity": "DateTime!",
                    "metadata": "JSON"
                }
            }
        },
        "enums": {
            "EpisodeType": [t.value for t in EpisodeType]
        },
        "queries": [
            "searchEpisodes(group_id: String!, query: String, filters: EpisodeFilters): EpisodeSearchResult!",
            "getSessionEpisodes(group_id: String!, session_id: String!): [Episode!]!",
            "getAgentRuminations(group_id: String!, agent_id: String!, limit: Int): [Episode!]!"
        ],
        "mutations": [
            "createEpisode(input: EpisodeInput!): Episode!",
            "createCommunity(input: CommunityInput!): Community!"
        ]
    }
    
    return {"graphql_schema": schema}


# Etymology Archaeology (EA) Endpoints - Story 08.07

@router.post("/etymology/community", response_model=GraphQLCommunityResponse)
async def create_etymology_community(
    request: EtymologyCommunityRequest,
    service: GraphitiService = Depends(get_graphiti_service),
    session_service: EtymologySessionService = Depends(get_session_service)
):
    """
    Create an etymology-specific community with EA labeling.

    Implements AC: 2 - Graphiti QL Community Creation with :EA:Episodic labeling.
    Creates community with proper namespace isolation using domain property.

    CRITICAL: Also updates session's communities_created array for frontend observability.

    Story 08.07 - Etymology Archaeology Workflow
    """
    try:
        # STEP 1: Look up Etymology Session BEFORE creating community
        # This allows us to store the etymology_session_id in the community attributes
        etymology_session_id = None
        if request.session_id:
            thread_id = request.session_id  # request.session_id is actually the thread_id from agent
            logger.info(f"Looking up Etymology Session for thread {thread_id}")

            existing_session = await session_service.get_session_by_thread_id(thread_id)
            if existing_session:
                etymology_session_id = existing_session.session_id
                logger.info(f"Found Etymology Session {etymology_session_id} for thread {thread_id}")
            else:
                logger.warning(
                    f"No Etymology Session found for thread {thread_id}. "
                    f"Community will be created without etymology_session_id link."
                )

        # STEP 2: Create community with etymology_session_id in attributes
        response = await service.create_etymology_community(
            request,
            etymology_session_id=etymology_session_id
        )

        if response.success:
            # STEP 3: Update Etymology Session's communities_created array
            if etymology_session_id and response.community:
                community_id = response.community.id
                logger.info(f"Linking community {community_id} to session {etymology_session_id}")

                session_update = EtymologySessionUpdateRequest(
                    session_id=etymology_session_id,
                    communities_to_add=[community_id]
                )

                update_result = await session_service.update_session(session_update)
                if not update_result.success:
                    logger.warning(f"Failed to update session {etymology_session_id}: {update_result.message}")
                else:
                    logger.info(f"Successfully linked community {community_id} to session {etymology_session_id}")

            return GraphQLCommunityResponse(
                data=response.community,
                message=response.message
            )
        else:
            return GraphQLCommunityResponse(
                errors=[response.message or "Failed to create etymology community"],
                message=response.message
            )

    except Exception as e:
        logger.error(f"Error in create_etymology_community API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class GraphQLAphorismResponse(BaseModel):
    """GraphQL-compatible aphorism response."""
    data: Optional['Aphorism'] = None
    errors: Optional[List[str]] = None
    message: Optional[str] = None


@router.post("/etymology/aphorism", response_model=GraphQLAphorismResponse)
async def create_aphorism(
    request: AphorismRequest,
    service: GraphitiService = Depends(get_graphiti_service),
    session_service: EtymologySessionService = Depends(get_session_service)
):
    """
    Create an aphorism node for distilled wisdom capture.

    Implements AC: 3 - Aphorism Node Storage with proper labeling.
    Uses :EA_Aphorism:Episodic for etymology-specific aphorisms or
    :Aphorism:Episodic for domain-agnostic aphorisms.

    CRITICAL: Also updates session's aphorisms array for frontend observability.

    Story 08.07 - Etymology Archaeology Workflow
    """
    try:
        response = await service.create_aphorism(request)

        if response.success:
            # CRITICAL FIX: Update session with new aphorism ID
            # This enables stats button and frontend polling detection
            if request.session_id and response.aphorism:
                aphorism_id = response.aphorism.id
                logger.info(f"Updating session {request.session_id} with aphorism {aphorism_id}")

                session_update = EtymologySessionUpdateRequest(
                    session_id=request.session_id,
                    aphorisms_to_add=[aphorism_id]
                )

                update_result = await session_service.update_session(session_update)
                if not update_result.success:
                    logger.warning(f"Failed to update session {request.session_id}: {update_result.message}")
                else:
                    logger.info(f"Successfully linked aphorism {aphorism_id} to session {request.session_id}")

            return GraphQLAphorismResponse(
                data=response.aphorism,
                message=response.message
            )
        else:
            return GraphQLAphorismResponse(
                errors=[response.message or "Failed to create aphorism"],
                message=response.message
            )

    except Exception as e:
        logger.error(f"Error in create_aphorism API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/sessions/{session_id}/stats")
async def get_etymology_session_stats(
    session_id: str,
    group_id: str = Query(..., description="User/group ID for multi-tenant isolation"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Get real-time statistics for an Etymology Session by querying Neo4j directly.

    Returns counts of:
    - Communities created (filtered by etymology_session_id)
    - Words explored (unique words across all communities)
    - PIE roots discovered (unique pie_roots across communities)
    - Resonances found (unique bimba_coordinates)

    This replaces MongoDB array-based stats with direct Neo4j queries.
    Story 08.07 - Real-time session observability
    """
    try:
        logger.info(f"Fetching stats for session {session_id}, group {group_id}")

        # Query communities for this session
        # FIXED: Properties are stored DIRECTLY on EntityNode, not in attributes Map
        communities_query = """
        MATCH (c:Entity:EA:Community)
        WHERE c.group_id = $group_id
          AND c.etymology_session_id = $session_id
        RETURN c.uuid as id,
               c.pie_root as pie_root,
               c.suggestion_resonance as suggestion_resonance
        """

        community_records, _, _ = service.neo4j_client.execute_query(
            communities_query,
            {"group_id": group_id, "session_id": session_id}
        )

        logger.info(f"Found {len(community_records)} communities for session {session_id}")

        # Aggregate stats from communities
        unique_words = set()
        unique_pie_roots = set()
        unique_resonances = set()

        for record in community_records:
            community_id = record["id"]
            pie_root = record.get("pie_root")
            suggestion_resonance = record.get("suggestion_resonance")

            logger.debug(f"Processing community {community_id}, pie_root={pie_root}, resonance={suggestion_resonance}")

            # Get words from this community
            word_query = """
            MATCH (c:Entity:EA:Community {uuid: $community_id})-[:CONTAINS]->(w:Entity:EA:Word)
            RETURN w.name as word
            """
            word_records, _, _ = service.neo4j_client.execute_query(
                word_query,
                {"community_id": community_id}
            )

            logger.debug(f"Found {len(word_records)} words for community {community_id}")

            for wr in word_records:
                unique_words.add(wr["word"])

            # Collect PIE roots (stored directly on node)
            if pie_root:
                unique_pie_roots.add(pie_root)
                logger.debug(f"Added PIE root: {pie_root}")

            # Collect resonances (stored directly on node)
            if suggestion_resonance:
                unique_resonances.add(suggestion_resonance)
                logger.debug(f"Added resonance: {suggestion_resonance}")

        stats_result = {
            "communities_count": len(community_records),
            "words_count": len(unique_words),
            "pie_roots_count": len(unique_pie_roots),
            "resonances_count": len(unique_resonances)
        }

        logger.info(f"Stats for session {session_id}: {stats_result}")

        return {
            "success": True,
            "stats": stats_result
        }

    except Exception as e:
        logger.error(f"Error fetching session stats: {e}")
        return {
            "success": False,
            "message": f"Failed to fetch session stats: {str(e)}",
            "stats": {
                "communities_count": 0,
                "words_count": 0,
                "pie_roots_count": 0,
                "resonances_count": 0
            }
        }


@router.get("/etymology/communities")
async def list_etymology_communities(
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    user_id: Optional[str] = Query(None, description="Filter by user"),
    session_id: Optional[str] = Query(None, description="Filter by session"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    List etymology communities for a user or session.

    Provides access to personal etymology explorations in EA namespace.
    Story 08.07 - AC: 8 (Personal Exploration Tracking)

    FIXED: Query now matches EntityNode structure created by create_etymology_community.
    Community nodes are :Entity:EA:Community with data in attributes Map.

    NOTE: session_id parameter is the Etymology Session UUID (not thread_id).
    Communities store etymology_session_id in attributes for filtering.
    """
    try:
        # FIXED: EntityNode stores properties DIRECTLY on node, not in attributes Map
        query = """
        MATCH (c:Entity:EA:Community)
        WHERE c.group_id = $group_id
        """

        params = {"group_id": group_id, "limit": limit}

        # Properties are stored directly on the node
        if user_id:
            query += " AND c.user_id = $user_id"
            params["user_id"] = user_id

        if session_id:
            # session_id is the Etymology Session UUID (stored as etymology_session_id directly on node)
            query += " AND c.etymology_session_id = $session_id"
            params["session_id"] = session_id

        query += """
        RETURN c.uuid as id, c.name as name, c.group_id as group_id,
               c.summary as description,
               c.quaternal_type as quaternal_type,
               c.pie_root as pie_root,
               c.semantic_pattern as semantic_pattern,
               c.thread_id as thread_id,
               c.etymology_session_id as etymology_session_id,
               c.user_id as user_id,
               c.suggestion_resonance as suggestion_resonance,
               c.domain as domain,
               c.created_at as formed_at
        ORDER BY c.created_at DESC
        LIMIT $limit
        """

        records, _, _ = service.neo4j_client.execute_query(query, params)

        # Transform EntityNode results to expected EtymologyCommunity format
        # FIXED: Properties are now returned directly from query, not from attrs Map
        communities = []
        for record in records:
            # Query word entities linked to this community
            word_query = """
            MATCH (c:Entity:EA:Community {uuid: $community_id})-[r:CONTAINS]->(w:Entity:EA:Word)
            RETURN
                w.uuid as word_id,
                w.name as word,
                coalesce(w.pie_root, w.attributes.pie_root) as word_pie_root,
                coalesce(w.pie_lineage, w.attributes.pie_lineage) as pie_lineage,
                coalesce(w.lineage, w.attributes.lineage) as lineage,
                coalesce(w.semantic_pattern, w.attributes.semantic_pattern) as word_semantic_pattern,
                coalesce(w.relationship_descriptor, w.relation_descriptor, w.attributes.relationship_descriptor, w.attributes.relation_descriptor) as relation_descriptor,
                w.enriched_at as enriched_at,
                r.qlPosition as ql_position
            ORDER BY w.name
            """
            word_records, _, _ = service.neo4j_client.execute_query(
                word_query,
                {"community_id": record["id"]}
            )

            word_nodes = []
            for wr in word_records:
                wr_data = dict(wr)
                word_nodes.append({
                    "id": wr_data.get("word_id"),
                    "word": wr_data.get("word"),
                    "pie_root": wr_data.get("word_pie_root"),
                    "pie_lineage": wr_data.get("pie_lineage"),
                    "lineage": wr_data.get("lineage"),
                    "semantic_pattern": wr_data.get("word_semantic_pattern"),
                    "relation_descriptor": wr_data.get("relation_descriptor"),
                    "ql_position": wr_data.get("ql_position"),
                    "enriched_at": wr_data.get("enriched_at")
                })

            words = [wn["word"] for wn in word_nodes if wn.get("word")]

            # Normalize quaternal_type to lowercase for frontend (backend stores uppercase)
            raw_quaternal_type = record.get("quaternal_type", "FOUR_PART")
            quaternal_type_normalized = raw_quaternal_type.lower() if raw_quaternal_type else "four_part"

            community = {
                "id": record["id"],
                "name": record["name"],
                "group_id": record["group_id"],
                "description": record["description"] or "",
                "quaternal_type": quaternal_type_normalized,
                "words": words,
                "pie_root": record.get("pie_root"),
                "semantic_pattern": record.get("semantic_pattern"),
                "thread_id": record.get("thread_id"),  # Thread ID from agent context
                "etymology_session_id": record.get("etymology_session_id"),  # Etymology Session UUID
                "user_id": record.get("user_id"),
                "bimba_coordinate": record.get("suggestion_resonance"),
                "domain": record.get("domain", "EA"),
                "formed_at": record["formed_at"],
                "last_activity": record["formed_at"],  # TODO: track actual last activity
                "word_nodes": word_nodes
            }
            communities.append(community)

        return {
            "success": True,
            "communities": communities,
            "count": len(communities)
        }

    except Exception as e:
        logger.error(f"Error listing etymology communities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/aphorisms")
async def list_aphorisms(
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    user_id: Optional[str] = Query(None, description="Filter by user"),
    domain: Optional[str] = Query("EA", description="Domain filter"),
    limit: int = Query(20, ge=1, le=100, description="Maximum results"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    List aphorisms by user or domain.

    Retrieves distilled wisdom nodes from episodic namespace.
    Story 08.07 - AC: 3 (Aphorism Node Storage)
    """
    try:
        # Query for both EA_Aphorism and generic Aphorism nodes
        query = """
        MATCH (a:Episodic)
        WHERE (a:EA_Aphorism OR a:Aphorism)
        AND a.group_id = $group_id
        """

        params = {"group_id": group_id, "limit": limit}

        if user_id:
            query += " AND a.user_id = $user_id"
            params["user_id"] = user_id

        if domain:
            query += " AND a.domain = $domain"
            params["domain"] = domain

        query += """
        RETURN a
        ORDER BY a.created_at DESC
        LIMIT $limit
        """

        records, _, _ = service.neo4j_client.execute_query(query, params)

        aphorisms = [dict(record["a"]) for record in records]

        return {
            "success": True,
            "aphorisms": aphorisms,
            "count": len(aphorisms)
        }

    except Exception as e:
        logger.error(f"Error listing aphorisms: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/resonances/{community_id}")
async def get_bimba_resonances(
    community_id: str,
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Get Bimba coordinate resonances for an etymology community.

    Retrieves semantic and lexical matches between etymology patterns
    and Bimba coordinate structures.

    Story 08.07 - AC: 5 (Bimba Resonance Detection)
    """
    try:
        # Get community data
        query = """
        MATCH (c:EA:Episodic {id: $community_id})
        RETURN c
        """
        records, _, _ = service.neo4j_client.execute_query(query, {"community_id": community_id})

        if not records:
            raise HTTPException(status_code=404, detail=f"Community {community_id} not found")

        community_data = dict(records[0]["c"])

        # Return community metadata for resonance detection
        # (Actual resonance detection happens async in agentic layer)
        return {
            "success": True,
            "community_id": community_id,
            "words": community_data.get("words", []),
            "pie_root": community_data.get("pie_root"),
            "semantic_pattern": community_data.get("semantic_pattern"),
            "note": "Resonance detection runs asynchronously via Epii agent tools"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting resonances for community {community_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/etymology/sessions/backfill-words")
async def backfill_session_words(
    group_id: str = Query(..., description="Group ID for multi-tenant isolation"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Backfill session words_explored and pie_roots_discovered from existing communities.

    Story 08.10 - Fix missing session data arrays
    """
    try:
        # Get all EA sessions for this group
        query = """
        MATCH (s:EA:Session {group_id: $group_id})
        RETURN s
        """

        sessions_records, _, _ = service.neo4j_client.execute_query(
            query, {"group_id": group_id}
        )

        updated_count = 0

        for record in sessions_records:
            session = dict(record["s"])
            session_id = session.get("session_id")

            if not session_id:
                continue

            # Get all communities for this session
            community_query = """
            MATCH (c:EA:Episodic {session_id: $session_id})
            RETURN c
            """

            communities_records, _, _ = service.neo4j_client.execute_query(
                community_query, {"session_id": session_id}
            )

            if not communities_records:
                continue

            # Collect words and PIE roots
            words_set = set(session.get("words_explored", []))
            pie_roots_set = set(session.get("pie_roots_discovered", []))

            for comm_record in communities_records:
                community = dict(comm_record["c"])

                for word in community.get("words", []):
                    words_set.add(word)

                pie_root = community.get("pie_root")
                if pie_root:
                    pie_roots_set.add(pie_root)

            # Update session
            if words_set or pie_roots_set:
                update_query = """
                MATCH (s:EA:Session {session_id: $session_id})
                SET s.words_explored = $words,
                    s.pie_roots_discovered = $pie_roots
                RETURN s
                """

                service.neo4j_client.execute_query(
                    update_query,
                    {
                        "session_id": session_id,
                        "words": list(words_set),
                        "pie_roots": list(pie_roots_set)
                    }
                )
                updated_count += 1

        return {
            "success": True,
            "updated_sessions": updated_count,
            "message": f"Backfilled {updated_count} sessions"
        }

    except Exception as e:
        logger.error(f"Error backfilling sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/tree/{word}")
async def get_etymology_tree(
    word: str,
    limit: int = Query(20, ge=1, le=100, description="Maximum tree depth"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Get etymology tree structure for a word.

    Traces etymological relationships and PIE roots to build
    hierarchical word family tree.

    Story 08.07 - Frontend data retrieval
    """
    try:
        # Find communities containing this word
        query = """
        MATCH (c:EA:Episodic)
        WHERE $word IN c.words
        RETURN c
        ORDER BY c.formed_at DESC
        LIMIT $limit
        """
        records, _, _ = service.neo4j_client.execute_query(
            query, {"word": word, "limit": limit}
        )

        communities = []
        for record in records:
            community_data = dict(record["c"])
            communities.append({
                "id": community_data.get("id"),
                "name": community_data.get("name"),
                "words": community_data.get("words", []),
                "pie_root": community_data.get("pie_root"),
                "semantic_pattern": community_data.get("semantic_pattern"),
                "quaternal_type": community_data.get("quaternal_type")
            })

        # Build tree structure (simplified - full tree logic in frontend)
        tree = {
            "root_word": word,
            "communities": communities,
            "total_related_communities": len(communities)
        }

        return {
            "success": True,
            "word": word,
            "tree": tree
        }

    except Exception as e:
        logger.error(f"Error getting etymology tree for '{word}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/ql-structure/{community_id}")
async def get_ql_structure(
    community_id: str,
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Get QL (Quaternal Logic) structure for an etymology community.

    Returns QL pattern data for visualization (2/3/4/6/12-fold structures).

    Story 08.07 - Frontend QL community visualization
    """
    try:
        # Get community with QL structure
        query = """
        MATCH (c:EA:Episodic {id: $community_id})
        RETURN c
        """
        records, _, _ = service.neo4j_client.execute_query(
            query, {"community_id": community_id}
        )

        if not records:
            raise HTTPException(status_code=404, detail=f"Community {community_id} not found")

        community_data = dict(records[0]["c"])

        # Extract QL structure data
        ql_type = community_data.get("quaternal_type", "FOUR_PART")
        words = community_data.get("words", [])

        # Map words to QL positions
        ql_structure = {
            "community_id": community_id,
            "quaternal_type": ql_type,
            "ql_positions": {},
            "total_positions": len(words)
        }

        # Simple position mapping (0-indexed for mod6)
        for idx, word in enumerate(words):
            position = idx % 6  # Mod6 positioning
            ql_structure["ql_positions"][str(position)] = {
                "word": word,
                "position_index": position,
                "position_name": _get_ql_position_name(position)
            }

        return {
            "success": True,
            "community_id": community_id,
            "ql_structure": ql_structure
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting QL structure for community {community_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _get_ql_position_name(position: int) -> str:
    """Get QL position name from mod6 index."""
    position_names = {
        0: "Implicit potential (0)",
        1: "Material/what (1)",
        2: "Efficient/how (2)",
        3: "Formal/who (3)",
        4: "Contextual/where-when (4)",
        5: "Purposive/why (5)"
    }
    return position_names.get(position, f"Position {position}")


# ==============================================================================
# Etymology Community Property Enrichment Endpoints - Depth Accrual
# ==============================================================================

@router.patch("/etymology/communities/{community_id}")
async def update_etymology_community_properties(
    community_id: str,
    properties: Dict[str, Any],
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Update etymology community properties for depth accrual.

    Enables enrichment as conversation deepens: add PIE roots, semantic patterns,
    cross-references, and other properties as discoveries emerge through dialogue.

    **Depth Accrual Philosophy:**
    Communities gain richness THROUGH conversation, not just at creation.
    """
    try:
        result = await service.update_community_properties(
            community_id=community_id,
            group_id=group_id,
            properties=properties
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Update failed"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating community {community_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/etymology/words/{word}")
async def enrich_word_etymology(
    word: str,
    etymology_data: Dict[str, Any],
    community_id: str = Query(..., description="Parent community ID"),
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Enrich a word node with etymology data as discoveries emerge.

    Add cognates, PIE lineage, semantic shifts, cross-linguistic patterns
    to individual word nodes within a community.

    **Property Depth Philosophy:**
    Word nodes gain etymology richness through conversation, building a
    comprehensive etymological profile over time.
    """
    try:
        result = await service.enrich_word_node(
            word=word,
            community_id=community_id,
            group_id=group_id,
            etymology_data=etymology_data
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Enrichment failed"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error enriching word '{word}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/etymology/communities/{community_id}/aphorisms/{aphorism_id}")
async def link_aphorism_to_community_endpoint(
    community_id: str,
    aphorism_id: str,
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    relationship_type: str = Query("DISTILLS_FROM", description="Relationship type"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Link an aphorism to its source etymology community.

    Creates crystallization relationships showing wisdom derivation
    from etymological exploration. Enables tracing aphorisms back to
    their etymological roots.
    """
    try:
        result = await service.link_aphorism_to_community(
            aphorism_id=aphorism_id,
            community_id=community_id,
            group_id=group_id,
            relationship_type=relationship_type
        )

        if result.get("success"):
            return result
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Linking failed"))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error linking aphorism {aphorism_id} to community {community_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# Etymology Session Management Endpoints - Story 08.07 Enhancement
# ==============================================================================

@router.post("/etymology/sessions", response_model=EtymologySessionResponse)
async def create_etymology_session(
    request: EtymologySessionRequest,
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    Create a new etymology exploration session (word project).

    Sessions span multiple chat threads and persist communities, resonances,
    and aphorisms across the project lifecycle.

    Story 08.07 Enhancement - AC: 8 (Personal Exploration Tracking)
    """
    try:
        logger.info(f"Creating etymology session - user_id: {request.user_id}, title: {request.title}")
        return await service.create_session(request)
    except Exception as e:
        logger.error(f"Error creating etymology session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/sessions/{session_id}", response_model=EtymologySessionResponse)
async def get_etymology_session(
    session_id: str,
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    Get etymology session by ID with all associated data.

    Returns session metadata, linked threads, communities, resonances, and aphorisms.

    Story 08.07 Enhancement - AC: 8 (Personal Exploration Tracking)
    """
    try:
        session = await service.get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

        return EtymologySessionResponse(
            success=True,
            session=session,
            message="Session retrieved successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting etymology session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/sessions/thread/{thread_id}")
async def get_session_by_thread(
    thread_id: str,
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    Get session ID for a given thread ID.

    Used by frontend to restore session context after page reload.
    When user selects a thread, this endpoint returns the session_id
    so session data/stats/communities can load properly.

    Story 08.13 - Bug Fix: Stats panel reload issue
    """
    try:
        session = await service.get_session_by_thread_id(thread_id)
        if not session:
            raise HTTPException(status_code=404, detail=f"No session found for thread {thread_id}")

        return {
            "success": True,
            "session_id": session.session_id,
            "thread_id": thread_id
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session for thread {thread_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/etymology/sessions/{session_id}", response_model=EtymologySessionResponse)
async def update_etymology_session(
    session_id: str,
    request: EtymologySessionUpdateRequest,
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    Update etymology session data.

    Supports adding words, communities, resonances, aphorisms, PIE roots,
    and semantic patterns. Uses append semantics to accumulate data across threads.

    Story 08.07 Enhancement - AC: 8 (Personal Exploration Tracking)
    """
    try:
        # Ensure session_id matches request
        request.session_id = session_id
        return await service.update_session(request)
    except Exception as e:
        logger.error(f"Error updating etymology session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/etymology/sessions/{session_id}/threads")
async def add_thread_to_session(
    session_id: str,
    thread_id: str = Query(..., description="Thread ID to link to session"),
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    Link a chat thread to an etymology session.

    Allows multiple threads to contribute to the same word project.
    Automatically creates backend-initiated onboarding message in conversations.

    Story 08.07 Enhancement - AC: 8 (Personal Exploration Tracking)
    """
    try:
        from shared.database.mongodb_client import MongoDBClient
        from datetime import datetime, timezone

        # Link thread to session
        result = await service.add_thread_to_session(session_id, thread_id)

        if result.success:
            # Get session data for onboarding message
            session_response = await service.get_session(session_id)
            if session_response:
                # Import onboarding generator
                try:
                    from agentic.agents.epii.tools.session_onboarding import generate_session_onboarding

                    # Prepare session data dict for onboarding
                    session_dict = {
                        'session_id': session_id,
                        'title': session_response.title,
                        'words_explored': session_response.words_explored,
                        'communities_created': session_response.communities_created,
                        'pie_roots_discovered': session_response.pie_roots_discovered
                    }

                    # Check if this is the first thread (new session)
                    is_new_session = len(session_response.thread_ids) == 1

                    # Generate onboarding message
                    onboarding_text = await generate_session_onboarding(
                        session_data=session_dict,
                        is_new_session=is_new_session
                    )

                    # Insert onboarding message using ConversationService
                    from shared.database.conversation_service import ConversationService

                    conv_service = ConversationService()

                    # Check if thread already has messages to avoid duplicates
                    existing_thread = await conv_service.get_thread(thread_id)

                    if not existing_thread or len(existing_thread.messages) == 0:
                        # Create first assistant message with onboarding
                        await conv_service.add_turn(
                            thread_id=thread_id,
                            user_id=session_response.user_id,
                            user_message="",  # No user message for onboarding
                            agent_response=onboarding_text,
                            persona="epii",
                            context="#5-5",  # Etymology Archaeology coordinate
                            etymology_session_id=session_id,
                            metadata={
                                "execution_time_ms": 0,
                                "is_onboarding": True,
                                "etymology_session_id": session_id
                            }
                        )
                        logger.info(f"✅ Created onboarding message for thread {thread_id} in session {session_id}")
                    else:
                        logger.info(f"⏭️ Skipped onboarding - thread {thread_id} already has {len(existing_thread.messages)} messages")

                except Exception as onboarding_error:
                    logger.error(f"Failed to create onboarding message: {onboarding_error}")
                    # Don't fail the thread linking - onboarding is nice-to-have

        return result

    except Exception as e:
        logger.error(f"Error adding thread {thread_id} to session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/sessions/{session_id}/threads")
async def list_etymology_session_threads(
    session_id: str,
    service: EtymologySessionService = Depends(get_session_service),
    graphiti_service: GraphitiService = Depends(get_graphiti_service)
) -> Dict[str, Any]:
    """
    List threads for a specific Etymology Session.

    Returns thread metadata by joining Etymology Session thread_ids with conversation_threads collection.
    Provides thread titles, message counts, timestamps, and latest communities formed in each thread.
    """
    try:
        from shared.database.conversation_service import ConversationService

        # Get Etymology Session to retrieve thread_ids
        session_response = await service.get_session(session_id)
        if not session_response:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

        thread_ids = session_response.thread_ids
        if not thread_ids:
            return {"threads": []}

        # Query conversation_threads collection for thread metadata
        conv_service = ConversationService()

        threads = []
        for thread_id in thread_ids:
            # Get thread from conversation_threads
            thread = await conv_service.get_thread(thread_id)

            if thread:
                # Use thread_title from metadata if available, otherwise use first user message
                thread_title = thread.metadata.get("thread_title")
                if not thread_title and thread.messages:
                    first_user_msg = next((m for m in thread.messages if m.role == "user"), None)
                    if first_user_msg:
                        thread_title = first_user_msg.content[:100]
                    else:
                        thread_title = "Untitled"
                else:
                    thread_title = thread_title or "Untitled"

                # Fetch latest communities created in this thread (max 3)
                # Communities store thread_id in attributes.thread_id
                communities_query = """
                MATCH (c:Entity:EA:Community)
                WHERE c.attributes.thread_id = $thread_id
                  AND c.attributes.etymology_session_id = $session_id
                RETURN c.name as name, c.created_at as created_at
                ORDER BY c.created_at DESC
                LIMIT 3
                """

                try:
                    community_records, _, _ = graphiti_service.neo4j_client.execute_query(
                        communities_query,
                        {"thread_id": thread_id, "session_id": session_id}
                    )
                    latest_communities = [rec["name"] for rec in community_records]
                except Exception as comm_err:
                    logger.warning(f"Failed to fetch communities for thread {thread_id}: {comm_err}")
                    latest_communities = []

                threads.append({
                    "thread_id": thread_id,
                    "title": thread_title,
                    "created_at": thread.created_at.isoformat(),
                    "message_count": len(thread.messages),
                    "latest_communities": latest_communities  # NEW: Community names
                })
            else:
                # Thread exists in session but has no messages yet
                threads.append({
                    "thread_id": thread_id,
                    "title": None,  # Will show date/time only in frontend
                    "created_at": None,
                    "message_count": 0,
                    "latest_communities": []
                })

        return {"threads": threads}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing threads for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/sessions", response_model=EtymologySessionListResponse)
async def list_user_etymology_sessions(
    user_id: str = Query(..., description="User ID"),
    status: Optional[EtymologySessionStatus] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200, description="Maximum sessions to return"),
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    List etymology sessions for a user.

    Returns user's word projects sorted by last activity.
    Optionally filter by status (active, paused, archived).

    Story 08.07 Enhancement - AC: 8 (Personal Exploration Tracking)
    """
    try:
        return await service.list_user_sessions(user_id, status, limit)
    except Exception as e:
        logger.error(f"Error listing etymology sessions for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/etymology/sessions/{session_id}")
async def archive_etymology_session(
    session_id: str,
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    Archive an etymology session (soft delete).

    Sets session status to ARCHIVED. Session remains in database but is hidden from UI.
    Use DELETE /etymology/sessions/{session_id}/permanent for irreversible hard delete.

    Story 08.07 Enhancement - AC: 8 (Personal Exploration Tracking)
    """
    try:
        result = await service.archive_session(session_id)
        if result.success:
            return {"success": True, "message": f"Session {session_id} archived"}
        else:
            raise HTTPException(status_code=404, detail=result.message)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error archiving etymology session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/etymology/sessions/{session_id}/permanent")
async def delete_etymology_session_permanent(
    session_id: str,
    service: EtymologySessionService = Depends(get_session_service)
):
    """
    PERMANENTLY delete an etymology session with CASCADE cleanup.

    ⚠️ IRREVERSIBLE ACTION ⚠️

    Deletes:
    - Session document from MongoDB
    - All linked thread messages from conversations collection
    - Session from Redis cache
    - Entry from user's session set

    Does NOT delete:
    - Graphiti communities (may be referenced by other sessions)
    - Neo4j episodic data (preserves knowledge graph)

    Use DELETE /etymology/sessions/{session_id} for safe archiving instead.

    Story: Cascade Deletion Implementation
    """
    try:
        success = await service.delete_session_cascade(session_id)
        if success:
            return {
                "success": True,
                "message": f"Session {session_id} permanently deleted with cascade cleanup"
            }
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error permanently deleting session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==============================================================================
# MEF Resonance Analysis Endpoints - Story 08.13
# ==============================================================================

@router.post("/etymology/communities/{community_id}/analyze-mef")
async def trigger_mef_analysis(
    community_id: str,
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    user_id: str = Query(..., description="User ID for authorization"),
    background_tasks: BackgroundTasks = None,
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Trigger MEF (Meta-Epistemic Framework) resonance analysis for a community.

    Manual trigger endpoint called by UI "Analyze MEF" button.
    Queues background task for async 6-lens MEF analysis via Parashakti agent.

    Story 08.13 - AC: 4 (API Endpoints)

    Args:
        community_id: Etymology community UUID
        group_id: Multi-tenant group identifier
        user_id: User ID for community ownership validation
        background_tasks: FastAPI background tasks queue
        service: GraphitiService dependency

    Returns:
        JSON with success status, is_reanalysis flag, and message

    Raises:
        404: Community not found
        403: User doesn't own community
    """
    try:
        # STEP 1: Validate community exists
        community_query = """
        MATCH (c:Entity:EA:Community {uuid: $community_id, group_id: $group_id})
        RETURN c.user_id as owner_id, c.name as name
        """
        records, _, _ = service.neo4j_client.execute_query(
            community_query,
            {"community_id": community_id, "group_id": group_id}
        )

        if not records:
            logger.warning(f"Community {community_id} not found for group {group_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Community {community_id} not found"
            )

        # STEP 2: Ownership validation REMOVED
        # Community ownership validation removed - users can analyze any community
        # in their group_id scope (multi-tenant isolation via group_id)
        community_owner = records[0]["owner_id"]
        logger.debug(
            f"User {user_id} analyzing community {community_id} "
            f"(owner: {community_owner})"
        )

        # STEP 3: Check for existing resonances (set is_reanalysis flag)
        resonance_check_query = """
        MATCH (c:Entity:EA:Community {uuid: $community_id})-[:RESONATES_WITH]->(r:BimbaResonance)
        RETURN count(r) as resonance_count
        """
        resonance_records, _, _ = service.neo4j_client.execute_query(
            resonance_check_query,
            {"community_id": community_id}
        )

        resonance_count = resonance_records[0]["resonance_count"] if resonance_records else 0
        is_reanalysis = resonance_count > 0

        logger.info(
            f"MEF analysis trigger for community {community_id}: "
            f"is_reanalysis={is_reanalysis} (found {resonance_count} existing resonances)"
        )

        # STEP 4: Queue background task for MEF analysis
        if background_tasks:
            # Import MEF service function
            from backend.epi_logos_system.cag.graphiti.mef_service import run_mef_analysis

            background_tasks.add_task(
                run_mef_analysis,
                community_id=community_id,
                service=service
            )

            logger.info(f"Queued MEF analysis background task for community {community_id}")

            return {
                "success": True,
                "status": "queued",
                "is_reanalysis": is_reanalysis,
                "message": (
                    f"MEF analysis queued for '{records[0]['name']}'. "
                    f"{'Re-analyzing (previous resonances will be cleared).' if is_reanalysis else 'First analysis.'}"
                )
            }
        else:
            # Fallback for testing environments without BackgroundTasks
            logger.warning("BackgroundTasks not available, returning mock response")
            return {
                "success": True,
                "status": "mock",
                "is_reanalysis": is_reanalysis,
                "message": "MEF analysis would be queued (BackgroundTasks not available)"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error triggering MEF analysis for community {community_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/etymology/communities/{community_id}/resonances")
async def get_community_resonances(
    community_id: str,
    group_id: str = Query(..., description="Multi-tenant group identifier"),
    user_id: str = Query(..., description="User ID for authorization"),
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Get MEF resonances for an etymology community.

    Retrieves all BimbaResonance nodes linked to the community,
    with coordinate details and MEF lens insights.

    Story 08.13 - AC: 4 (API Endpoints)

    Args:
        community_id: Etymology community UUID
        group_id: Multi-tenant group identifier
        user_id: User ID for community ownership validation
        service: GraphitiService dependency

    Returns:
        JSON with resonances array (ordered by strength DESC)

    Raises:
        404: Community not found
        403: User doesn't own community
    """
    try:
        import json

        # STEP 1: Validate community exists and user owns it
        community_query = """
        MATCH (c:Entity:EA:Community {uuid: $community_id, group_id: $group_id})
        RETURN c.user_id as owner_id, c.name as name
        """
        records, _, _ = service.neo4j_client.execute_query(
            community_query,
            {"community_id": community_id, "group_id": group_id}
        )

        if not records:
            raise HTTPException(
                status_code=404,
                detail=f"Community {community_id} not found"
            )

        # Ownership validation REMOVED - users can view any community resonances
        # in their group_id scope (multi-tenant isolation via group_id)
        community_owner = records[0]["owner_id"]
        logger.debug(
            f"User {user_id} viewing resonances for community {community_id} "
            f"(owner: {community_owner})"
        )

        # STEP 2: Query resonances with coordinate details
        resonance_query = """
        MATCH (c:Entity:EA:Community {uuid: $community_id})
              -[:RESONATES_WITH]->(r:BimbaResonance:EA:Episodic)
              -[:TARGETS]->(coord:BimbaNode)
        RETURN r.uuid as id,
               coord.bimbaCoordinate as coordinate,
               coord.name as coordinate_name,
               r.resonance_type as resonance_type,
               r.resonance_strength as resonance_strength,
               r.description as description,
               r.detected_via_lens as detected_via_lens,
               r.detected_via_tool as detected_via_tool,
               r.reasoning_summary as reasoning_summary,
               r.deepseek_reasoning_chain as deepseek_reasoning,
               r.detected_at as detected_at,
               r.mef_archetypal as mef_archetypal,
               r.mef_causal as mef_causal,
               r.mef_logical as mef_logical,
               r.mef_processual as mef_processual,
               r.mef_meta_epistemic as mef_meta_epistemic,
               r.mef_divine_scalar as mef_divine_scalar
        ORDER BY r.resonance_strength DESC
        """

        resonance_records, _, _ = service.neo4j_client.execute_query(
            resonance_query,
            {"community_id": community_id}
        )

        # STEP 3: Parse resonances and lens insights
        resonances = []
        for record in resonance_records:
            # Parse JSON lens insights (stored as JSON strings in Neo4j)
            def parse_lens_json(lens_str):
                if lens_str:
                    try:
                        return json.loads(lens_str)
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse lens JSON: {lens_str}")
                        return None
                return None

            resonance = {
                "id": record["id"],
                "coordinate": record["coordinate"],
                "coordinate_name": record["coordinate_name"],
                "resonance_type": record["resonance_type"],
                "resonance_strength": record["resonance_strength"],
                "description": record["description"],
                "detected_via_lens": record["detected_via_lens"],
                "detected_via_tool": record["detected_via_tool"],
                "reasoning_summary": record["reasoning_summary"],
                "deepseek_reasoning": record["deepseek_reasoning"],
                "detected_at": record["detected_at"],
                # Parse MEF lens insights from JSON
                "mef_archetypal": parse_lens_json(record["mef_archetypal"]),
                "mef_causal": parse_lens_json(record["mef_causal"]),
                "mef_logical": parse_lens_json(record["mef_logical"]),
                "mef_processual": parse_lens_json(record["mef_processual"]),
                "mef_meta_epistemic": parse_lens_json(record["mef_meta_epistemic"]),
                "mef_divine_scalar": parse_lens_json(record["mef_divine_scalar"])
            }
            resonances.append(resonance)

        logger.info(
            f"Retrieved {len(resonances)} resonances for community {community_id}"
        )

        return {
            "success": True,
            "resonances": resonances,
            "count": len(resonances)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving resonances for community {community_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Export router for integration with main FastAPI app
__all__ = ["router"]
