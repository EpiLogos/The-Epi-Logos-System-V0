"""
HTTP client for Graphiti service API calls

This client handles all communication with the Graphiti temporal memory service
through the Backend layer's HTTP API, replacing direct Neo4j connections.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from agentic.clients.backend_http_client import BackendHttpClient

logger = logging.getLogger(__name__)


class GraphitiHttpClient(BackendHttpClient):
    """HTTP client for Graphiti temporal memory operations"""
    
    async def create_episode(
        self,
        content: str,
        group_id: str,
        episode_type: str = "agent_rumination",
        session_id: str = None,
        agent_id: str = None,
        bimba_coordinate: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a new episodic memory episode"""
        # Map common episode types to valid Graphiti backend types
        # Backend EpisodeType enum: user_session, agent_rumination, context_frame, learning_event, community_formation
        episode_type_mapping = {
            "experience": "user_session",  # Default type from orchestrator tools
            "insight": "agent_rumination",
            "conversation": "user_session",
            "rumination": "agent_rumination",
            "reflection": "agent_rumination",
            "interaction": "user_session"
        }

        mapped_type = episode_type_mapping.get(episode_type, episode_type)

        request_data = {
            "group_id": group_id,
            "content": content,
            "episode_type": mapped_type,
            "session_id": session_id,
            "agent_id": agent_id,
            "bimba_coordinate": bimba_coordinate,
            "metadata": metadata or {}
        }

        logger.info(f"Creating episode: {mapped_type} (group: {group_id}, session: {session_id})")
        return await self.post("/api/graphiti/episodes", json_data=request_data)
    
    async def search_episodes(
        self,
        query: str,
        session_id: str = None,
        episode_type: str = None,
        limit: int = 10,
        time_range_hours: int = None,
        group_id: str = "default"
    ) -> Dict[str, Any]:
        """Search episodes using semantic similarity"""
        params = {
            "group_id": group_id,
            "query": query,
            "limit": limit
        }
        if session_id:
            params["session_id"] = session_id
        if episode_type:
            params["episode_type"] = episode_type
        if time_range_hours:
            params["time_range_hours"] = time_range_hours

        logger.info(f"Searching episodes: '{query[:50]}...' (session: {session_id})")
        return await self.get("/api/graphiti/episodes/search", params=params)
    
    async def get_session_episodes(self, session_id: str, group_id: str, limit: int = 50) -> Dict[str, Any]:
        """Get all episodes for a specific session"""
        params = {"group_id": group_id, "limit": limit}
        logger.info(f"Getting session episodes: {session_id} (group: {group_id})")
        return await self.get(f"/api/graphiti/sessions/{session_id}/episodes", params=params)
    
    async def get_agent_ruminations(self, agent_id: str, group_id: str, limit: int = 20) -> Dict[str, Any]:
        """Get agent ruminations (reflective thoughts)"""
        params = {"group_id": group_id, "limit": limit}
        logger.info(f"Getting agent ruminations: {agent_id} (group: {group_id})")
        return await self.get(f"/api/graphiti/agents/{agent_id}/ruminations", params=params)
    
    async def create_community(
        self,
        name: str,
        description: str,
        group_id: str,
        words: List[str],
        quaternal_type: str = "FOUR_PART",
        domain: str = "EA",
        session_id: str = None,
        user_id: str = None,
        pie_root: str = None,
        semantic_pattern: str = None,
        bimba_coordinate: str = None
    ) -> Dict[str, Any]:
        """
        Create an etymology community using Graphiti's native community building.

        This calls the /etymology/community endpoint which uses Graphiti's
        EpisodicNode and CommunityNode classes with QL extensions.
        """
        request_data = {
            "group_id": group_id,
            "name": name,
            "description": description,
            "words": words,
            "quaternal_type": quaternal_type,
            "domain": domain,
            "session_id": session_id,
            "user_id": user_id,
            "pie_root": pie_root,
            "semantic_pattern": semantic_pattern,
            "bimba_coordinate": bimba_coordinate
        }

        logger.info(f"Creating etymology community: {name} (group: {group_id}, words: {words})")
        return await self.post("/api/graphiti/etymology/community", json_data=request_data)
    
    async def get_episode_types(self) -> Dict[str, Any]:
        """Get available episode types"""
        return await self.get("/api/graphiti/episodes/types")
    
    async def get_schema(self) -> Dict[str, Any]:
        """Get Graphiti schema information"""
        return await self.get("/api/graphiti/schema")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Graphiti service health"""
        return await self.get("/api/graphiti/health")

    # ==============================================================================
    # Etymology Community Enrichment Methods - Depth Accrual
    # ==============================================================================

    async def update_community_properties(
        self,
        community_id: str,
        group_id: str,
        properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update etymology community properties for depth accrual.

        Args:
            community_id: Community UUID
            group_id: Multi-tenant group identifier
            properties: Dict of properties to update (pie_root, semantic_pattern, etc.)

        Returns:
            Dict with success status and updated properties
        """
        params = {"group_id": group_id}
        logger.info(f"Updating community {community_id} properties: {list(properties.keys())}")
        return await self.patch(
            f"/api/graphiti/etymology/communities/{community_id}",
            json_data=properties,
            params=params
        )

    async def enrich_word_etymology(
        self,
        word: str,
        community_id: str,
        group_id: str,
        etymology_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Enrich a word node with etymology data as discoveries emerge.

        Args:
            word: The word to enrich
            community_id: Parent community UUID
            group_id: Multi-tenant group identifier
            etymology_data: Etymology properties (cognates, PIE lineage, etc.)

        Returns:
            Dict with success status and enriched properties
        """
        params = {
            "community_id": community_id,
            "group_id": group_id
        }
        logger.info(f"Enriching word '{word}' in community {community_id}")
        return await self.patch(
            f"/api/graphiti/etymology/words/{word}",
            json_data=etymology_data,
            params=params
        )

    async def link_aphorism_to_community(
        self,
        aphorism_id: str,
        community_id: str,
        group_id: str,
        relationship_type: str = "DISTILLS_FROM"
    ) -> Dict[str, Any]:
        """
        Link an aphorism to its source etymology community.

        Args:
            aphorism_id: Aphorism episode UUID
            community_id: Community UUID
            group_id: Multi-tenant group identifier
            relationship_type: Relationship type (default: DISTILLS_FROM)

        Returns:
            Dict with success status and relationship details
        """
        # Build query string manually - post() doesn't accept params parameter
        url = f"/api/graphiti/etymology/communities/{community_id}/aphorisms/{aphorism_id}?group_id={group_id}&relationship_type={relationship_type}"
        logger.info(f"Linking aphorism {aphorism_id} to community {community_id}")
        return await self.post(url)

    async def trigger_mef_analysis(
        self,
        community_id: str
    ) -> Dict[str, Any]:
        """
        Trigger MEF (Meta-Epistemic Framework) resonance analysis for a community.

        This initiates an async background task that uses the Parashakti agent to
        analyze the community through 6 cognitive lenses and discover resonant
        Bimba coordinates. The analysis runs in the background and results are
        stored as BimbaResonance nodes in Neo4j.

        Args:
            community_id: Community UUID to analyze

        Returns:
            Dict with success status, is_reanalysis flag, and any errors
        """
        logger.info(f"Triggering MEF analysis for community {community_id}")
        return await self.post(f"/api/graphiti/etymology/communities/{community_id}/analyze-mef")
