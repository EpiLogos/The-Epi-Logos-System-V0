"""
FastAPI endpoints for Graphiti GraphQL integration.

This module provides HTTP API endpoints for frontend and backend integration
with the Graphiti episodic memory service, exposing GraphQL-compatible operations
for temporal memory management.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Query
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
    EtymologySessionStatus
)


logger = logging.getLogger(__name__)


# Dependency for getting Graphiti service instance
def get_graphiti_service() -> GraphitiService:
    """Get Graphiti service instance with shared Neo4j client."""
    # This should be configured with proper dependency injection in the main FastAPI app
    # For now, creating a new instance (this would be optimized in production)
    neo4j_client = Neo4jClient()
    return GraphitiService(neo4j_client)


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


@router.post("/communities", response_model=GraphQLCommunityResponse)
async def create_community(
    request: CommunityRequest,
    service: GraphitiService = Depends(get_graphiti_service)
):
    """
    Create a temporal community of related episodes.
    
    Communities enable QL-aligned temporal clustering of related thoughts,
    sessions, and reasoning processes for enhanced context formation.
    """
    try:
        response = await service.create_community(request)
        
        if response.success:
            return GraphQLCommunityResponse(
                data=response.community,
                message=response.message
            )
        else:
            return GraphQLCommunityResponse(
                errors=[response.message or "Failed to create community"],
                message=response.message
            )
            
    except Exception as e:
        logger.error(f"Error in create_community API: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
    request: 'EtymologyCommunityRequest',
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
        # Import here to avoid circular dependency
        from .models import EtymologyCommunityRequest

        response = await service.create_etymology_community(request)

        if response.success:
            # CRITICAL FIX: Update session with new community ID
            # This enables stats button and frontend polling detection
            if request.session_id and response.community:
                community_id = response.community.id
                logger.info(f"Updating session {request.session_id} with community {community_id}")

                session_update = EtymologySessionUpdateRequest(
                    session_id=request.session_id,
                    communities_to_add=[community_id]
                )

                update_result = await session_service.update_session(session_update)
                if not update_result.success:
                    logger.warning(f"Failed to update session {request.session_id}: {update_result.message}")
                else:
                    logger.info(f"Successfully linked community {community_id} to session {request.session_id}")

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
    request: 'AphorismRequest',
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
        # Import here to avoid circular dependency
        from .models import AphorismRequest, Aphorism

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
    """
    try:
        query = """
        MATCH (c:EA:Episodic)
        WHERE c.group_id = $group_id
        """

        params = {"group_id": group_id, "limit": limit}

        if user_id:
            query += " AND c.user_id = $user_id"
            params["user_id"] = user_id

        if session_id:
            query += " AND c.session_id = $session_id"
            params["session_id"] = session_id

        query += """
        RETURN c
        ORDER BY c.formed_at DESC
        LIMIT $limit
        """

        records, _, _ = await service.neo4j_client.execute_query(query, params)

        communities = [dict(record["c"]) for record in records]

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

        records, _, _ = await service.neo4j_client.execute_query(query, params)

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
        records, _, _ = await service.neo4j_client.execute_query(query, {"community_id": community_id})

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
        records, _, _ = await service.neo4j_client.execute_query(
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
        records, _, _ = await service.neo4j_client.execute_query(
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
        import traceback
        logger.warning(f"🚨 ETYMOLOGY SESSION CREATION REQUESTED - user_id: {request.user_id}, title: {request.title}")
        logger.warning(f"🚨 CALL STACK:\n{''.join(traceback.format_stack())}")
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

                    # Insert onboarding message into conversations collection
                    db = MongoDBClient().get_database()
                    conversations_coll = db.get_collection("conversations")

                    # Check if thread already has messages to avoid duplicates
                    existing_messages = conversations_coll.count_documents({"session_id": thread_id})

                    if existing_messages == 0:
                        # Create first assistant message with onboarding
                        onboarding_doc = {
                            "session_id": thread_id,
                            "user_id": session_response.user_id,
                            "persona": "epii",
                            "user_message": "",  # No user message for onboarding
                            "agent_response": onboarding_text,
                            "metadata": {
                                "execution_time_ms": 0,
                                "is_onboarding": True,
                                "etymology_session_id": session_id
                            },
                            "context": "#5-5",  # Etymology Archaeology coordinate
                            "created_at": datetime.now(timezone.utc)
                        }

                        conversations_coll.insert_one(onboarding_doc)
                        logger.info(f"✅ Created onboarding message for thread {thread_id} in session {session_id}")
                    else:
                        logger.info(f"⏭️ Skipped onboarding - thread {thread_id} already has {existing_messages} messages")

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
    service: EtymologySessionService = Depends(get_session_service)
) -> Dict[str, Any]:
    """
    List threads for a specific Etymology Session.

    Returns thread metadata by joining Etymology Session thread_ids with conversations collection.
    Provides thread titles, message counts, and timestamps for UI display.
    """
    try:
        from shared.database.mongodb_client import MongoDBClient

        # Get Etymology Session to retrieve thread_ids
        session_response = await service.get_session(session_id)
        if not session_response:
            raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

        thread_ids = session_response.thread_ids
        if not thread_ids:
            return {"threads": []}

        # Query conversations collection for thread metadata
        db = MongoDBClient().get_database()
        conversations_coll = db.get_collection("conversations")

        threads = []
        for thread_id in thread_ids:
            # Get first message for title
            first_doc = conversations_coll.find_one(
                {"session_id": thread_id},
                sort=[("created_at", 1)]
            )

            if first_doc:
                # Count messages in thread
                message_count = conversations_coll.count_documents({"session_id": thread_id})

                threads.append({
                    "thread_id": thread_id,
                    "title": first_doc.get("user_message", "Untitled")[:100],  # First message as title
                    "created_at": first_doc.get("created_at").isoformat() if first_doc.get("created_at") else None,
                    "message_count": message_count
                })
            else:
                # Thread exists in session but has no messages yet
                threads.append({
                    "thread_id": thread_id,
                    "title": "Empty thread",
                    "created_at": None,
                    "message_count": 0
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
    Archive an etymology session.

    Sets session status to ARCHIVED (soft delete).

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


# Export router for integration with main FastAPI app
__all__ = ["router"]