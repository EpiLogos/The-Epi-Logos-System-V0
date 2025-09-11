"""
FastAPI endpoints for Graphiti GraphQL integration.

This module provides HTTP API endpoints for frontend and backend integration
with the Graphiti episodic memory service, exposing GraphQL-compatible operations
for temporal memory management.
"""

import logging
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field

from shared.database import Neo4jClient
from .service import GraphitiService
from .models import (
    Episode, Community, EpisodeType,
    EpisodeRequest, EpisodeResponse,
    CommunityRequest, CommunityResponse,
    SearchRequest, SearchResponse
)


logger = logging.getLogger(__name__)


# Dependency for getting Graphiti service instance
def get_graphiti_service() -> GraphitiService:
    """Get Graphiti service instance with shared Neo4j client."""
    # This should be configured with proper dependency injection in the main FastAPI app
    # For now, creating a new instance (this would be optimized in production)
    neo4j_client = Neo4jClient()
    return GraphitiService(neo4j_client)


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
async def health_check(service: GraphitiService = Depends(get_graphiti_service)):
    """Health check endpoint for service monitoring."""
    try:
        # Test Neo4j connection
        connection_ok = service.neo4j_client.test_connection()
        
        return {
            "status": "healthy" if connection_ok else "unhealthy",
            "neo4j_connection": connection_ok,
            "workspace_id": service.workspace_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
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


# Export router for integration with main FastAPI app
__all__ = ["router"]