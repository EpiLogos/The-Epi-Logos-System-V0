"""
HTTP client for Graphiti service API calls

This client handles all communication with the Graphiti temporal memory service
through the Backend layer's HTTP API, replacing direct Neo4j connections.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .backend_http_client import BackendHttpClient

logger = logging.getLogger(__name__)


class GraphitiHttpClient(BackendHttpClient):
    """HTTP client for Graphiti temporal memory operations"""
    
    async def create_episode(
        self,
        content: str,
        episode_type: str = "conversation",
        session_id: str = None,
        agent_id: str = None,
        bimba_coordinate: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a new episodic memory episode"""
        request_data = {
            "content": content,
            "episode_type": episode_type,
            "session_id": session_id,
            "agent_id": agent_id,
            "bimba_coordinate": bimba_coordinate,
            "metadata": metadata or {}
        }
        
        logger.info(f"Creating episode: {episode_type} (session: {session_id})")
        return await self.post("/api/graphiti/episodes", json_data=request_data)
    
    async def search_episodes(
        self,
        query: str,
        session_id: str = None,
        episode_type: str = None,
        limit: int = 10,
        time_range_hours: int = None
    ) -> Dict[str, Any]:
        """Search episodes using semantic similarity"""
        params = {
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
    
    async def get_session_episodes(self, session_id: str, limit: int = 50) -> Dict[str, Any]:
        """Get all episodes for a specific session"""
        params = {"limit": limit}
        logger.info(f"Getting session episodes: {session_id}")
        return await self.get(f"/api/graphiti/sessions/{session_id}/episodes", params=params)
    
    async def get_agent_ruminations(self, agent_id: str, limit: int = 20) -> Dict[str, Any]:
        """Get agent ruminations (reflective thoughts)"""
        params = {"limit": limit}
        logger.info(f"Getting agent ruminations: {agent_id}")
        return await self.get(f"/api/graphiti/agents/{agent_id}/ruminations", params=params)
    
    async def create_community(
        self,
        name: str,
        description: str,
        session_id: str = None,
        bimba_coordinate: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Create a new community (topic cluster)"""
        request_data = {
            "name": name,
            "description": description,
            "session_id": session_id,
            "bimba_coordinate": bimba_coordinate,
            "metadata": metadata or {}
        }
        
        logger.info(f"Creating community: {name}")
        return await self.post("/api/graphiti/communities", json_data=request_data)
    
    async def get_episode_types(self) -> Dict[str, Any]:
        """Get available episode types"""
        return await self.get("/api/graphiti/episodes/types")
    
    async def get_schema(self) -> Dict[str, Any]:
        """Get Graphiti schema information"""
        return await self.get("/api/graphiti/schema")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Graphiti service health"""
        return await self.get("/api/graphiti/health")