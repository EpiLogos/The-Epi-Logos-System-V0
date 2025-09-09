"""
HTTP Graphiti Tools - Backend API integration for temporal memory operations

This module provides HTTP-based tools for working with the Graphiti temporal memory system,
communicating through the Backend layer's REST API instead of direct Neo4j connections.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
from ..clients.graphiti_http_client import GraphitiHttpClient

logger = logging.getLogger(__name__)


class GraphitiError(Exception):
    """Exception raised for Graphiti-related errors"""
    pass


class HttpGraphitiClient:
    """HTTP-based client for Graphiti temporal memory operations"""
    
    def __init__(self, http_client: GraphitiHttpClient):
        self.client = http_client
        
    async def create_episode(
        self,
        content: str,
        episode_type: str = "conversation",
        session_id: str = None,
        agent_id: str = None,
        bimba_coordinate: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create a new episodic memory episode.
        
        Args:
            content: The content of the episode
            episode_type: Type of episode (conversation, reflection, etc.)
            session_id: Associated session ID
            agent_id: Associated agent ID
            bimba_coordinate: Associated Bimba coordinate
            metadata: Additional metadata
            
        Returns:
            Dict containing episode creation results
        """
        try:
            result = await self.client.create_episode(
                content=content,
                episode_type=episode_type,
                session_id=session_id,
                agent_id=agent_id,
                bimba_coordinate=bimba_coordinate,
                metadata=metadata or {}
            )
            
            if result.get("success", True):  # Assume success if not explicitly set
                logger.info(f"Successfully created episode: {episode_type}")
                return {
                    "success": True,
                    "episode": result,
                    "episode_type": episode_type,
                    "session_id": session_id
                }
            else:
                error_msg = result.get("error", "Unknown episode creation error")
                logger.warning(f"Failed to create episode: {error_msg}")
                return {
                    "success": False,
                    "episode_type": episode_type,
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception creating episode: {e}")
            return {
                "success": False,
                "episode_type": episode_type,
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def search_episodes(
        self,
        query: str,
        session_id: str = None,
        episode_type: str = None,
        limit: int = 10,
        time_range_hours: int = None
    ) -> Dict[str, Any]:
        """
        Search episodes using semantic similarity.
        
        Args:
            query: The search query
            session_id: Optional session filter
            episode_type: Optional episode type filter
            limit: Maximum number of results
            time_range_hours: Optional time range in hours
            
        Returns:
            Dict containing search results
        """
        try:
            result = await self.client.search_episodes(
                query=query,
                session_id=session_id,
                episode_type=episode_type,
                limit=limit,
                time_range_hours=time_range_hours
            )
            
            if result.get("success", True):
                episodes = result.get("episodes", result.get("data", []))
                logger.info(f"Episode search found {len(episodes)} results for: '{query[:50]}...'")
                return {
                    "success": True,
                    "query": query,
                    "episodes": episodes,
                    "count": len(episodes),
                    "session_id": session_id
                }
            else:
                error_msg = result.get("error", "Unknown search error")
                logger.warning(f"Episode search failed for '{query}': {error_msg}")
                return {
                    "success": False,
                    "query": query,
                    "episodes": [],
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception searching episodes with query '{query}': {e}")
            return {
                "success": False,
                "query": query,
                "episodes": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def get_session_episodes(self, session_id: str, limit: int = 50) -> Dict[str, Any]:
        """
        Get all episodes for a specific session.
        
        Args:
            session_id: The session ID
            limit: Maximum number of episodes
            
        Returns:
            Dict containing session episodes
        """
        try:
            result = await self.client.get_session_episodes(session_id, limit)
            
            if result.get("success", True):
                episodes = result.get("episodes", result.get("data", []))
                logger.info(f"Retrieved {len(episodes)} episodes for session: {session_id}")
                return {
                    "success": True,
                    "session_id": session_id,
                    "episodes": episodes,
                    "count": len(episodes)
                }
            else:
                error_msg = result.get("error", "Unknown session query error")
                logger.warning(f"Failed to get episodes for session {session_id}: {error_msg}")
                return {
                    "success": False,
                    "session_id": session_id,
                    "episodes": [],
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception getting session episodes for {session_id}: {e}")
            return {
                "success": False,
                "session_id": session_id,
                "episodes": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def get_agent_ruminations(self, agent_id: str, limit: int = 20) -> Dict[str, Any]:
        """
        Get agent ruminations (reflective thoughts).
        
        Args:
            agent_id: The agent ID
            limit: Maximum number of ruminations
            
        Returns:
            Dict containing agent ruminations
        """
        try:
            result = await self.client.get_agent_ruminations(agent_id, limit)
            
            if result.get("success", True):
                ruminations = result.get("ruminations", result.get("data", []))
                logger.info(f"Retrieved {len(ruminations)} ruminations for agent: {agent_id}")
                return {
                    "success": True,
                    "agent_id": agent_id,
                    "ruminations": ruminations,
                    "count": len(ruminations)
                }
            else:
                error_msg = result.get("error", "Unknown rumination query error")
                logger.warning(f"Failed to get ruminations for agent {agent_id}: {error_msg}")
                return {
                    "success": False,
                    "agent_id": agent_id,
                    "ruminations": [],
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception getting agent ruminations for {agent_id}: {e}")
            return {
                "success": False,
                "agent_id": agent_id,
                "ruminations": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def create_community(
        self,
        name: str,
        description: str,
        session_id: str = None,
        bimba_coordinate: str = None,
        metadata: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Create a new community (topic cluster).
        
        Args:
            name: Community name
            description: Community description
            session_id: Associated session ID
            bimba_coordinate: Associated Bimba coordinate
            metadata: Additional metadata
            
        Returns:
            Dict containing community creation results
        """
        try:
            result = await self.client.create_community(
                name=name,
                description=description,
                session_id=session_id,
                bimba_coordinate=bimba_coordinate,
                metadata=metadata or {}
            )
            
            if result.get("success", True):
                logger.info(f"Successfully created community: {name}")
                return {
                    "success": True,
                    "community": result,
                    "name": name
                }
            else:
                error_msg = result.get("error", "Unknown community creation error")
                logger.warning(f"Failed to create community {name}: {error_msg}")
                return {
                    "success": False,
                    "name": name,
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception creating community {name}: {e}")
            return {
                "success": False,
                "name": name,
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def get_episode_types(self) -> Dict[str, Any]:
        """Get available episode types."""
        try:
            result = await self.client.get_episode_types()
            return {"success": True, "episode_types": result}
        except Exception as e:
            logger.error(f"Exception getting episode types: {e}")
            return {"success": False, "error": f"HTTP request failed: {str(e)}"}
    
    async def get_schema(self) -> Dict[str, Any]:
        """Get Graphiti schema information."""
        try:
            result = await self.client.get_schema()
            return {"success": True, "schema": result}
        except Exception as e:
            logger.error(f"Exception getting schema: {e}")
            return {"success": False, "error": f"HTTP request failed: {str(e)}"}
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Graphiti service health."""
        try:
            result = await self.client.health_check()
            return {"success": True, "health": result}
        except Exception as e:
            logger.error(f"Exception checking Graphiti health: {e}")
            return {"success": False, "error": f"HTTP request failed: {str(e)}"}
    
    async def close(self):
        """Close the HTTP client connection"""
        if self.client:
            await self.client.close()


async def create_http_graphiti_client(http_client: GraphitiHttpClient) -> HttpGraphitiClient:
    """
    Factory function to create an HTTP-based Graphiti client.
    
    Args:
        http_client: The HTTP client for Backend API communication
        
    Returns:
        Configured HttpGraphitiClient instance
    """
    client = HttpGraphitiClient(http_client)
    logger.info("HTTP Graphiti client created")
    return client