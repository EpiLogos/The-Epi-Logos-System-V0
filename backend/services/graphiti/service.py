"""
Core Graphiti service implementation for episodic memory management.

This service wraps the Graphiti library and integrates with the Epi-Logos System's
shared Neo4j infrastructure, providing temporal graph episodic memory capabilities
with proper namespace isolation and multi-tenant support.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from graphiti_core import Graphiti
from graphiti_core.search import SearchConfig, HybridSearchInput, SearchMethod

from ..database.neo4j_client import Neo4jClient
from .models import (
    Episode, Community, EpisodeType,
    EpisodeRequest, EpisodeResponse,
    CommunityRequest, CommunityResponse,
    SearchRequest, SearchResponse
)


logger = logging.getLogger(__name__)


class GraphitiService:
    """
    Graphiti MCP service wrapper for episodic memory management.
    
    Integrates Graphiti library with Epi-Logos System's shared Neo4j infrastructure,
    providing session tracking, agent rumination capture, and temporal community formation.
    """
    
    def __init__(self, neo4j_client: Neo4jClient, workspace_id: str = "episodic"):
        """Initialize Graphiti service with shared Neo4j client."""
        self.neo4j_client = neo4j_client
        self.workspace_id = workspace_id
        
        # Initialize Graphiti with shared Neo4j connection
        self.graphiti = Graphiti(
            neo4j_client.uri,
            neo4j_client.username,
            neo4j_client.password,
            neo4j_client.database
        )
        
        # Set workspace for isolation
        self.graphiti.set_workspace(workspace_id)
        
        logger.info(f"Initialized Graphiti service with workspace: {workspace_id}")
    
    async def create_episode(self, request: EpisodeRequest) -> EpisodeResponse:
        """Create a new episode in the temporal graph."""
        try:
            # Generate unique episode ID
            episode_id = str(uuid.uuid4())
            
            # Use occurred_at if provided, otherwise current time
            occurred_at = request.occurred_at or datetime.now(timezone.utc)
            ingested_at = datetime.now(timezone.utc)
            
            # Create episode using Graphiti's ingestion method
            await self.graphiti.add_episode(
                name=f"{request.episode_type.value}_{episode_id[:8]}",
                episode_body=request.content,
                reference_time=occurred_at
            )
            
            # Create Episode model with our enhanced data
            episode = Episode(
                id=episode_id,
                group_id=request.group_id,
                episode_type=request.episode_type,
                content=request.content,
                context=request.context,
                occurred_at=occurred_at,
                ingested_at=ingested_at,
                user_id=request.user_id,
                session_id=request.session_id,
                agent_id=request.agent_id
            )
            
            # Store additional metadata in Neo4j with proper labeling
            await self._store_episode_metadata(episode)
            
            logger.info(f"Created episode {episode_id} for group {request.group_id}")
            
            return EpisodeResponse(
                success=True,
                episode=episode,
                message=f"Episode created successfully with ID: {episode_id}"
            )
            
        except Exception as e:
            logger.error(f"Error creating episode: {e}")
            return EpisodeResponse(
                success=False,
                message=f"Failed to create episode: {str(e)}"
            )
    
    async def _store_episode_metadata(self, episode: Episode) -> None:
        """Store enhanced episode metadata in Neo4j with proper namespace labeling."""
        query = """
        CREATE (ep:Episode:Graphiti {
            id: $id,
            group_id: $group_id,
            episode_type: $episode_type,
            content: $content,
            context: $context,
            occurred_at: $occurred_at,
            ingested_at: $ingested_at,
            user_id: $user_id,
            session_id: $session_id,
            agent_id: $agent_id,
            workspace_id: $workspace_id
        })
        RETURN ep
        """
        
        await self.neo4j_client.execute_query(query, {
            "id": episode.id,
            "group_id": episode.group_id,
            "episode_type": episode.episode_type.value,
            "content": episode.content,
            "context": episode.context,
            "occurred_at": episode.occurred_at.isoformat(),
            "ingested_at": episode.ingested_at.isoformat(),
            "user_id": episode.user_id,
            "session_id": episode.session_id,
            "agent_id": episode.agent_id,
            "workspace_id": self.workspace_id
        })
    
    async def search_episodes(self, request: SearchRequest) -> SearchResponse:
        """Search episodes using hybrid search (semantic + BM25 + graph traversal)."""
        try:
            episodes = []
            communities = []
            
            if request.query:
                # Use Graphiti's hybrid search capabilities
                search_config = SearchConfig(
                    search_method=SearchMethod.HYBRID,
                    limit=request.limit
                )
                
                search_input = HybridSearchInput(
                    query=request.query,
                    # Configure search based on filters
                    search_config=search_config
                )
                
                # Perform the search
                search_results = await self.graphiti.search(search_input)
                
                # Convert results to our Episode models
                for result in search_results:
                    episode_data = await self._convert_search_result_to_episode(
                        result, request.group_id
                    )
                    if episode_data:
                        episodes.append(episode_data)
            
            # Apply additional filters via Neo4j query
            filtered_episodes = await self._filter_episodes_by_metadata(
                episodes, request
            )
            
            logger.info(f"Search returned {len(filtered_episodes)} episodes for group {request.group_id}")
            
            return SearchResponse(
                success=True,
                episodes=filtered_episodes,
                communities=communities,  # TODO: Implement community search
                total_count=len(filtered_episodes),
                message="Search completed successfully"
            )
            
        except Exception as e:
            logger.error(f"Error searching episodes: {e}")
            return SearchResponse(
                success=False,
                message=f"Search failed: {str(e)}"
            )
    
    async def _convert_search_result_to_episode(
        self, result: Any, group_id: str
    ) -> Optional[Episode]:
        """Convert Graphiti search result to Episode model."""
        try:
            # This would need to be implemented based on actual Graphiti search result structure
            # For now, creating a placeholder implementation
            return Episode(
                id=str(uuid.uuid4()),
                group_id=group_id,
                episode_type=EpisodeType.USER_SESSION,
                content=str(result),
                occurred_at=datetime.now(timezone.utc),
                ingested_at=datetime.now(timezone.utc)
            )
        except Exception as e:
            logger.error(f"Error converting search result: {e}")
            return None
    
    async def _filter_episodes_by_metadata(
        self, episodes: List[Episode], request: SearchRequest
    ) -> List[Episode]:
        """Filter episodes based on metadata criteria using Neo4j."""
        if not episodes:
            return episodes
            
        # Build filter conditions
        conditions = ["ep.group_id = $group_id"]
        params = {"group_id": request.group_id}
        
        if request.episode_types:
            conditions.append("ep.episode_type IN $episode_types")
            params["episode_types"] = [t.value for t in request.episode_types]
        
        if request.user_id:
            conditions.append("ep.user_id = $user_id")
            params["user_id"] = request.user_id
        
        if request.session_id:
            conditions.append("ep.session_id = $session_id")
            params["session_id"] = request.session_id
        
        if request.agent_id:
            conditions.append("ep.agent_id = $agent_id")
            params["agent_id"] = request.agent_id
        
        if request.start_date:
            conditions.append("ep.occurred_at >= $start_date")
            params["start_date"] = request.start_date.isoformat()
        
        if request.end_date:
            conditions.append("ep.occurred_at <= $end_date")
            params["end_date"] = request.end_date.isoformat()
        
        query = f"""
        MATCH (ep:Episode:Graphiti)
        WHERE {' AND '.join(conditions)}
        RETURN ep
        ORDER BY ep.occurred_at DESC
        LIMIT $limit
        """
        params["limit"] = request.limit
        
        try:
            records, _, _ = await self.neo4j_client.execute_query(query, params)
            
            # Convert Neo4j records back to Episode models
            filtered_episodes = []
            for record in records:
                ep_data = dict(record["ep"])
                episode = Episode(
                    id=ep_data["id"],
                    group_id=ep_data["group_id"],
                    episode_type=EpisodeType(ep_data["episode_type"]),
                    content=ep_data["content"],
                    context=ep_data.get("context", {}),
                    occurred_at=datetime.fromisoformat(ep_data["occurred_at"]),
                    ingested_at=datetime.fromisoformat(ep_data["ingested_at"]),
                    user_id=ep_data.get("user_id"),
                    session_id=ep_data.get("session_id"),
                    agent_id=ep_data.get("agent_id")
                )
                filtered_episodes.append(episode)
            
            return filtered_episodes
            
        except Exception as e:
            logger.error(f"Error filtering episodes: {e}")
            return episodes  # Return original episodes if filtering fails
    
    async def create_community(self, request: CommunityRequest) -> CommunityResponse:
        """Create a temporal community of related episodes."""
        try:
            community_id = str(uuid.uuid4())
            
            community = Community(
                id=community_id,
                group_id=request.group_id,
                name=request.name,
                episode_ids=request.episode_ids,
                quaternary_position=request.quaternary_position,
                context_frame_type=request.context_frame_type,
                formed_at=datetime.now(timezone.utc),
                last_activity=datetime.now(timezone.utc)
            )
            
            # Store community in Neo4j
            await self._store_community(community)
            
            # Create relationships between community and episodes
            await self._link_community_episodes(community_id, request.episode_ids)
            
            logger.info(f"Created community {community_id} with {len(request.episode_ids)} episodes")
            
            return CommunityResponse(
                success=True,
                community=community,
                message=f"Community created successfully with ID: {community_id}"
            )
            
        except Exception as e:
            logger.error(f"Error creating community: {e}")
            return CommunityResponse(
                success=False,
                message=f"Failed to create community: {str(e)}"
            )
    
    async def _store_community(self, community: Community) -> None:
        """Store community in Neo4j with proper namespace labeling."""
        query = """
        CREATE (c:Community:Graphiti {
            id: $id,
            group_id: $group_id,
            name: $name,
            quaternary_position: $quaternary_position,
            context_frame_type: $context_frame_type,
            formed_at: $formed_at,
            last_activity: $last_activity,
            metadata: $metadata,
            workspace_id: $workspace_id
        })
        RETURN c
        """
        
        await self.neo4j_client.execute_query(query, {
            "id": community.id,
            "group_id": community.group_id,
            "name": community.name,
            "quaternary_position": community.quaternary_position,
            "context_frame_type": community.context_frame_type,
            "formed_at": community.formed_at.isoformat(),
            "last_activity": community.last_activity.isoformat(),
            "metadata": community.metadata,
            "workspace_id": self.workspace_id
        })
    
    async def _link_community_episodes(self, community_id: str, episode_ids: List[str]) -> None:
        """Create relationships between community and episodes."""
        if not episode_ids:
            return
            
        query = """
        MATCH (c:Community:Graphiti {id: $community_id})
        MATCH (ep:Episode:Graphiti)
        WHERE ep.id IN $episode_ids
        CREATE (c)-[r:CONTAINS_EPISODE]->(ep)
        SET r.created_at = datetime()
        RETURN count(r) as relationships_created
        """
        
        await self.neo4j_client.execute_query(query, {
            "community_id": community_id,
            "episode_ids": episode_ids
        })
    
    async def get_session_continuity(self, group_id: str, session_id: str) -> List[Episode]:
        """Get episodes for session continuity tracking."""
        try:
            query = """
            MATCH (ep:Episode:Graphiti)
            WHERE ep.group_id = $group_id AND ep.session_id = $session_id
            RETURN ep
            ORDER BY ep.occurred_at ASC
            """
            
            records, _, _ = await self.neo4j_client.execute_query(query, {
                "group_id": group_id,
                "session_id": session_id
            })
            
            episodes = []
            for record in records:
                ep_data = dict(record["ep"])
                episode = Episode(
                    id=ep_data["id"],
                    group_id=ep_data["group_id"],
                    episode_type=EpisodeType(ep_data["episode_type"]),
                    content=ep_data["content"],
                    context=ep_data.get("context", {}),
                    occurred_at=datetime.fromisoformat(ep_data["occurred_at"]),
                    ingested_at=datetime.fromisoformat(ep_data["ingested_at"]),
                    user_id=ep_data.get("user_id"),
                    session_id=ep_data.get("session_id"),
                    agent_id=ep_data.get("agent_id")
                )
                episodes.append(episode)
            
            return episodes
            
        except Exception as e:
            logger.error(f"Error getting session continuity: {e}")
            return []
    
    async def get_agent_ruminations(self, group_id: str, agent_id: str, limit: int = 10) -> List[Episode]:
        """Get agent rumination episodes for learning continuity."""
        try:
            query = """
            MATCH (ep:Episode:Graphiti)
            WHERE ep.group_id = $group_id 
              AND ep.agent_id = $agent_id 
              AND ep.episode_type = $episode_type
            RETURN ep
            ORDER BY ep.occurred_at DESC
            LIMIT $limit
            """
            
            records, _, _ = await self.neo4j_client.execute_query(query, {
                "group_id": group_id,
                "agent_id": agent_id,
                "episode_type": EpisodeType.AGENT_RUMINATION.value,
                "limit": limit
            })
            
            episodes = []
            for record in records:
                ep_data = dict(record["ep"])
                episode = Episode(
                    id=ep_data["id"],
                    group_id=ep_data["group_id"],
                    episode_type=EpisodeType(ep_data["episode_type"]),
                    content=ep_data["content"],
                    context=ep_data.get("context", {}),
                    occurred_at=datetime.fromisoformat(ep_data["occurred_at"]),
                    ingested_at=datetime.fromisoformat(ep_data["ingested_at"]),
                    user_id=ep_data.get("user_id"),
                    session_id=ep_data.get("session_id"),
                    agent_id=ep_data.get("agent_id")
                )
                episodes.append(episode)
            
            return episodes
            
        except Exception as e:
            logger.error(f"Error getting agent ruminations: {e}")
            return []
    
    async def close(self):
        """Close Graphiti service and connections."""
        try:
            await self.graphiti.close()
            logger.info("Graphiti service closed successfully")
        except Exception as e:
            logger.error(f"Error closing Graphiti service: {e}")
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()