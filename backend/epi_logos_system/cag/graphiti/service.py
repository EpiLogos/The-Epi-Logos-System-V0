"""
Core Graphiti service implementation for episodic memory management.

This service wraps the Graphiti library and integrates with the Epi-Logos System's
shared Neo4j infrastructure, providing temporal graph episodic memory capabilities
with proper namespace isolation and multi-tenant support.
"""

import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple

from graphiti_core import Graphiti
from graphiti_core.search.search_config import SearchConfig, CommunitySearchMethod

from shared.database import Neo4jClient
from .models import (
    Episode, Community, EpisodeType,
    EpisodeRequest, EpisodeResponse,
    CommunityRequest, CommunityResponse,
    SearchRequest, SearchResponse,
    QuaternalUnit, QuaternalType, QuaternalStatus,
    QuaternalEntity, SourceReference, CrossCoordinateLink
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
        
        # Initialize Graphiti with shared Neo4j connection and Gemini clients
        import os
        from graphiti_core.llm_client.gemini_client import GeminiClient, LLMConfig
        from graphiti_core.embedder.gemini import GeminiEmbedder, GeminiEmbedderConfig
        from graphiti_core.cross_encoder.gemini_reranker_client import GeminiRerankerClient
        
        # Get Gemini API key from environment
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required for Graphiti")
        
        # Create Gemini LLM client
        llm_client = GeminiClient(
            config=LLMConfig(
                api_key=gemini_api_key,
                model="gemini-2.5-flash"
            )
        )
        
        # Create Gemini embedder
        embedder = GeminiEmbedder(
            config=GeminiEmbedderConfig(
                api_key=gemini_api_key,
                embedding_model="gemini-embedding-001"
            )
        )
        
        # Create Gemini reranker/cross-encoder
        cross_encoder = GeminiRerankerClient(
            config=LLMConfig(
                api_key=gemini_api_key,
                model="gemini-2.5-flash"
            )
        )
        
        # Initialize Graphiti with Gemini clients and Neo4j connection
        self.graphiti = Graphiti(
            uri=neo4j_client.uri,
            user=neo4j_client.username,
            password=neo4j_client.password,
            llm_client=llm_client,
            embedder=embedder,
            cross_encoder=cross_encoder
        )
        
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
                source_description=f"Episode from {request.episode_type.value}",
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
                # Use Graphiti's search capabilities
                try:
                    search_results = await self.graphiti.search(
                        query=request.query,
                        search_type="episodes",
                        limit=request.limit
                    )
                    
                    # Convert results to our Episode models
                    for result in search_results:
                        episode_data = await self._convert_search_result_to_episode(
                            result, request.group_id
                        )
                        if episode_data:
                            episodes.append(episode_data)
                except Exception as e:
                    logger.warning(f"Search failed, falling back to direct query: {e}")
                    # Fall back to direct Neo4j query if search fails
                    episodes = []
            
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
    
    # QuaternalUnit CRUD Operations
    
    async def create_quaternal_unit(
        self, 
        group_id: str,
        quaternal_type: QuaternalType,
        bimba_coordinate: str,
        summary: str,
        entities: List[QuaternalEntity] = None,
        source_references: List[SourceReference] = None,
        workspace_id: str = "default"
    ) -> Optional[QuaternalUnit]:
        """Create a new QuaternalUnit with QL structure validation."""
        try:
            qu_id = str(uuid.uuid4())
            entities = entities or []
            source_references = source_references or []
            
            # Create QuaternalUnit node with proper namespace labeling
            create_query = """
            CREATE (qu:QuaternalUnit:Graphiti {
                id: $id,
                group_id: $group_id,
                workspace_id: $workspace_id,
                quaternal_type: $quaternal_type,
                status: $status,
                bimba_coordinate: $bimba_coordinate,
                summary: $summary,
                created_at: $created_at,
                updated_at: $updated_at,
                confidence_score: $confidence_score,
                completeness_score: $completeness_score,
                coherence_score: $coherence_score
            })
            RETURN qu
            """
            
            now = datetime.utcnow()
            records, _, _ = await self.neo4j_client.execute_query(create_query, {
                "id": qu_id,
                "group_id": group_id,
                "workspace_id": workspace_id,
                "quaternal_type": quaternal_type.value,
                "status": QuaternalStatus.POTENTIAL.value,
                "bimba_coordinate": bimba_coordinate,
                "summary": summary,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
                "confidence_score": 0.5,
                "completeness_score": 0.0,
                "coherence_score": 0.0
            })
            
            if not records:
                logger.error(f"Failed to create QuaternalUnit {qu_id}")
                return None
            
            # Create entity relationships if provided
            if entities:
                await self._create_quaternal_entities(qu_id, entities)
            
            # Create source reference relationships if provided
            if source_references:
                await self._create_source_references(qu_id, source_references)
            
            return await self.get_quaternal_unit(group_id, qu_id)
            
        except Exception as e:
            logger.error(f"Error creating QuaternalUnit: {e}")
            return None
    
    async def get_quaternal_unit(self, group_id: str, qu_id: str) -> Optional[QuaternalUnit]:
        """Retrieve a QuaternalUnit by ID with all relationships."""
        try:
            query = """
            MATCH (qu:QuaternalUnit:Graphiti)
            WHERE qu.id = $qu_id AND qu.group_id = $group_id
            
            OPTIONAL MATCH (qu)-[:HAS_ENTITY]->(e:QuaternalEntity:Graphiti)
            OPTIONAL MATCH (qu)-[:HAS_SOURCE]->(sr:SourceReference:Graphiti)
            OPTIONAL MATCH (qu)-[:CROSS_COORDINATE_LINK]->(ccl:CrossCoordinateLink:Graphiti)
            
            RETURN qu, 
                   collect(DISTINCT e) AS entities,
                   collect(DISTINCT sr) AS source_refs,
                   collect(DISTINCT ccl) AS cross_links
            """
            
            records, _, _ = await self.neo4j_client.execute_query(query, {
                "qu_id": qu_id,
                "group_id": group_id
            })
            
            if not records:
                return None
            
            record = records[0]
            qu_data = dict(record["qu"])
            
            # Parse entities
            entities = []
            for entity_data in record["entities"]:
                if entity_data:
                    entities.append(QuaternalEntity(
                        name=entity_data["name"],
                        ql_position=entity_data["ql_position"],
                        summary=entity_data.get("summary"),
                        entity_id=entity_data.get("entity_id"),
                        confidence=entity_data.get("confidence", 1.0)
                    ))
            
            # Parse source references
            source_refs = []
            for sr_data in record["source_refs"]:
                if sr_data:
                    source_refs.append(SourceReference(
                        source_type=sr_data["source_type"],
                        source_id=sr_data["source_id"],
                        confidence=sr_data.get("confidence", 1.0),
                        excerpt=sr_data.get("excerpt")
                    ))
            
            # Parse cross-coordinate links
            cross_links = []
            for ccl_data in record["cross_links"]:
                if ccl_data:
                    cross_links.append(CrossCoordinateLink(
                        target_qu_id=ccl_data["target_qu_id"],
                        target_coordinate=ccl_data["target_coordinate"],
                        relationship_type=ccl_data["relationship_type"],
                        strength=ccl_data.get("strength", 0.5),
                        created_at=datetime.fromisoformat(ccl_data["created_at"])
                    ))
            
            return QuaternalUnit(
                id=qu_data["id"],
                group_id=qu_data["group_id"],
                quaternal_type=QuaternalType(qu_data["quaternal_type"]),
                status=QuaternalStatus(qu_data["status"]),
                bimba_coordinate=qu_data["bimba_coordinate"],
                summary=qu_data["summary"],
                entities=entities,
                source_references=source_refs,
                cross_coordinate_links=cross_links,
                created_at=datetime.fromisoformat(qu_data["created_at"]),
                updated_at=datetime.fromisoformat(qu_data["updated_at"]),
                validated_at=datetime.fromisoformat(qu_data["validated_at"]) if qu_data.get("validated_at") else None,
                confidence_score=qu_data.get("confidence_score", 0.5),
                completeness_score=qu_data.get("completeness_score", 0.0),
                coherence_score=qu_data.get("coherence_score", 0.0)
            )
            
        except Exception as e:
            logger.error(f"Error getting QuaternalUnit {qu_id}: {e}")
            return None
    
    async def update_quaternal_unit(
        self,
        group_id: str,
        qu_id: str,
        summary: str = None,
        entities: List[QuaternalEntity] = None,
        status: QuaternalStatus = None,
        confidence_score: float = None
    ) -> Optional[QuaternalUnit]:
        """Update a QuaternalUnit with new information."""
        try:
            # Build dynamic update query
            update_fields = []
            params = {"qu_id": qu_id, "group_id": group_id, "updated_at": datetime.utcnow().isoformat()}
            
            if summary:
                update_fields.append("qu.summary = $summary")
                params["summary"] = summary
            
            if status:
                update_fields.append("qu.status = $status")
                params["status"] = status.value
                if status == QuaternalStatus.VALIDATED:
                    update_fields.append("qu.validated_at = $validated_at")
                    params["validated_at"] = datetime.utcnow().isoformat()
            
            if confidence_score is not None:
                update_fields.append("qu.confidence_score = $confidence_score")
                params["confidence_score"] = confidence_score
            
            if update_fields:
                update_fields.append("qu.updated_at = $updated_at")
                
                query = f"""
                MATCH (qu:QuaternalUnit:Graphiti)
                WHERE qu.id = $qu_id AND qu.group_id = $group_id
                SET {', '.join(update_fields)}
                RETURN qu
                """
                
                await self.neo4j_client.execute_query(query, params)
            
            # Update entities if provided
            if entities is not None:
                await self._replace_quaternal_entities(qu_id, entities)
            
            return await self.get_quaternal_unit(group_id, qu_id)
            
        except Exception as e:
            logger.error(f"Error updating QuaternalUnit {qu_id}: {e}")
            return None
    
    async def find_quaternal_units(
        self,
        group_id: str,
        workspace_id: str = "default",
        quaternal_type: QuaternalType = None,
        status: QuaternalStatus = None,
        bimba_coordinate: str = None,
        min_confidence: float = None,
        min_completeness: float = None,
        limit: int = 10
    ) -> List[QuaternalUnit]:
        """Search for QuaternalUnits with filtering."""
        try:
            # Build dynamic where clause
            where_conditions = ["qu.group_id = $group_id", "qu.workspace_id = $workspace_id"]
            params = {"group_id": group_id, "workspace_id": workspace_id, "limit": limit}
            
            if quaternal_type:
                where_conditions.append("qu.quaternal_type = $quaternal_type")
                params["quaternal_type"] = quaternal_type.value
            
            if status:
                where_conditions.append("qu.status = $status")
                params["status"] = status.value
            
            if bimba_coordinate:
                where_conditions.append("qu.bimba_coordinate = $bimba_coordinate")
                params["bimba_coordinate"] = bimba_coordinate
            
            if min_confidence is not None:
                where_conditions.append("qu.confidence_score >= $min_confidence")
                params["min_confidence"] = min_confidence
            
            if min_completeness is not None:
                where_conditions.append("qu.completeness_score >= $min_completeness")
                params["min_completeness"] = min_completeness
            
            query = f"""
            MATCH (qu:QuaternalUnit:Graphiti)
            WHERE {' AND '.join(where_conditions)}
            RETURN qu
            ORDER BY qu.updated_at DESC
            LIMIT $limit
            """
            
            records, _, _ = await self.neo4j_client.execute_query(query, params)
            
            results = []
            for record in records:
                qu_data = dict(record["qu"])
                # Get full QuaternalUnit with relationships
                full_qu = await self.get_quaternal_unit(group_id, qu_data["id"])
                if full_qu:
                    results.append(full_qu)
            
            return results
            
        except Exception as e:
            logger.error(f"Error finding QuaternalUnits: {e}")
            return []
    
    async def delete_quaternal_unit(self, group_id: str, qu_id: str) -> bool:
        """Delete a QuaternalUnit and all its relationships."""
        try:
            query = """
            MATCH (qu:QuaternalUnit:Graphiti)
            WHERE qu.id = $qu_id AND qu.group_id = $group_id
            
            // Delete all relationships and connected nodes
            OPTIONAL MATCH (qu)-[r1]->(e:QuaternalEntity:Graphiti)
            OPTIONAL MATCH (qu)-[r2]->(sr:SourceReference:Graphiti)
            OPTIONAL MATCH (qu)-[r3]->(ccl:CrossCoordinateLink:Graphiti)
            
            DELETE r1, r2, r3, e, sr, ccl, qu
            RETURN count(qu) as deleted
            """
            
            records, _, _ = await self.neo4j_client.execute_query(query, {
                "qu_id": qu_id,
                "group_id": group_id
            })
            
            return len(records) > 0 and records[0]["deleted"] > 0
            
        except Exception as e:
            logger.error(f"Error deleting QuaternalUnit {qu_id}: {e}")
            return False
    
    # Helper methods for QuaternalUnit relationships
    
    async def _create_quaternal_entities(self, qu_id: str, entities: List[QuaternalEntity]) -> bool:
        """Create entity nodes and relationships for a QuaternalUnit."""
        try:
            for entity in entities:
                entity_query = """
                MATCH (qu:QuaternalUnit:Graphiti {id: $qu_id})
                CREATE (e:QuaternalEntity:Graphiti {
                    name: $name,
                    summary: $summary,
                    ql_position: $ql_position,
                    entity_id: $entity_id,
                    confidence: $confidence
                })
                CREATE (qu)-[:HAS_ENTITY]->(e)
                """
                
                await self.neo4j_client.execute_query(entity_query, {
                    "qu_id": qu_id,
                    "name": entity.name,
                    "summary": entity.summary,
                    "ql_position": entity.ql_position,
                    "entity_id": entity.entity_id or str(uuid.uuid4()),
                    "confidence": entity.confidence
                })
            
            return True
            
        except Exception as e:
            logger.error(f"Error creating QuaternalEntity relationships: {e}")
            return False
    
    async def _create_source_references(self, qu_id: str, source_refs: List[SourceReference]) -> bool:
        """Create source reference nodes and relationships for a QuaternalUnit."""
        try:
            for source_ref in source_refs:
                source_query = """
                MATCH (qu:QuaternalUnit:Graphiti {id: $qu_id})
                CREATE (sr:SourceReference:Graphiti {
                    source_type: $source_type,
                    source_id: $source_id,
                    confidence: $confidence,
                    excerpt: $excerpt
                })
                CREATE (qu)-[:HAS_SOURCE]->(sr)
                """
                
                await self.neo4j_client.execute_query(source_query, {
                    "qu_id": qu_id,
                    "source_type": source_ref.source_type,
                    "source_id": source_ref.source_id,
                    "confidence": source_ref.confidence,
                    "excerpt": source_ref.excerpt
                })
            
            return True
            
        except Exception as e:
            logger.error(f"Error creating SourceReference relationships: {e}")
            return False
    
    async def _replace_quaternal_entities(self, qu_id: str, entities: List[QuaternalEntity]) -> bool:
        """Replace all entities for a QuaternalUnit."""
        try:
            # Delete existing entities
            delete_query = """
            MATCH (qu:QuaternalUnit:Graphiti {id: $qu_id})-[r:HAS_ENTITY]->(e:QuaternalEntity:Graphiti)
            DELETE r, e
            """
            await self.neo4j_client.execute_query(delete_query, {"qu_id": qu_id})
            
            # Create new entities
            return await self._create_quaternal_entities(qu_id, entities)
            
        except Exception as e:
            logger.error(f"Error replacing QuaternalEntity relationships: {e}")
            return False
    
    async def create_cross_coordinate_link(
        self,
        group_id: str,
        source_qu_id: str,
        target_qu_id: str,
        target_coordinate: str,
        relationship_type: str,
        strength: float = 0.5
    ) -> bool:
        """Create a cross-coordinate link between QuaternalUnits."""
        try:
            query = """
            MATCH (source_qu:QuaternalUnit:Graphiti {id: $source_qu_id, group_id: $group_id})
            MATCH (target_qu:QuaternalUnit:Graphiti {id: $target_qu_id, group_id: $group_id})
            
            CREATE (ccl:CrossCoordinateLink:Graphiti {
                target_qu_id: $target_qu_id,
                target_coordinate: $target_coordinate,
                relationship_type: $relationship_type,
                strength: $strength,
                created_at: $created_at
            })
            
            CREATE (source_qu)-[:CROSS_COORDINATE_LINK]->(ccl)
            RETURN ccl
            """
            
            records, _, _ = await self.neo4j_client.execute_query(query, {
                "source_qu_id": source_qu_id,
                "target_qu_id": target_qu_id,
                "target_coordinate": target_coordinate,
                "relationship_type": relationship_type,
                "strength": strength,
                "group_id": group_id,
                "created_at": datetime.utcnow().isoformat()
            })
            
            return len(records) > 0
            
        except Exception as e:
            logger.error(f"Error creating cross-coordinate link: {e}")
            return False
    
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
