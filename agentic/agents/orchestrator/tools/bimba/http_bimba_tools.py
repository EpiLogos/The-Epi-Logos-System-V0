"""
HTTP Bimba Tools - Backend API integration for coordinate resolution

This module provides HTTP-based tools for working with the Bimba coordinate system,
communicating through the Backend layer's GraphQL API instead of direct Neo4j connections.
"""

import logging
from typing import Dict, Any, Optional, List
from agentic.clients.bimba_graphql_client import BimbaGraphQLClient

logger = logging.getLogger(__name__)


class BimbaCoordinateError(Exception):
    """Exception raised for Bimba coordinate-related errors"""
    pass


class HttpBimbaClient:
    """HTTP-based client for Bimba coordinate operations"""
    
    def __init__(self, graphql_client: BimbaGraphQLClient):
        self.client = graphql_client
        
    async def resolve_coordinate(self, coordinate: str) -> Dict[str, Any]:
        """
        Resolve a Bimba coordinate to get its content and context.
        
        Args:
            coordinate: The Bimba coordinate to resolve (e.g., "#0", "#1-2", "#3-4-5")
            
        Returns:
            Dict containing coordinate resolution data
        """
        try:
            result = await self.client.resolve_coordinate(coordinate)
            
            if result.get("success"):
                logger.info(f"Successfully resolved coordinate: {coordinate}")
                return {
                    "success": True,
                    "coordinate": coordinate,
                    "content": result.get("content"),
                    "context": result.get("context", {}),
                    "related_coordinates": result.get("related_coordinates", [])
                }
            else:
                error_msg = result.get("error", "Unknown resolution error")
                logger.warning(f"Failed to resolve coordinate {coordinate}: {error_msg}")
                return {
                    "success": False,
                    "coordinate": coordinate,
                    "content": None,
                    "context": None,
                    "related_coordinates": [],
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception resolving coordinate {coordinate}: {e}")
            return {
                "success": False,
                "coordinate": coordinate,
                "content": None,
                "context": None,
                "related_coordinates": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def search_coordinates(self, query: str, subsystem: Optional[int] = None, limit: int = 10) -> Dict[str, Any]:
        """
        Search for coordinates matching a semantic query.
        
        Args:
            query: Semantic query string
            subsystem: Optional subsystem filter (#0-#5)
            limit: Maximum number of results
            
        Returns:
            Dict containing search results
        """
        try:
            result = await self.client.search_coordinates(query, subsystem, limit)
            
            if result.get("success"):
                logger.info(f"Search found {len(result.get('results', []))} coordinates for: '{query[:50]}...'")
                return {
                    "success": True,
                    "query": query,
                    "results": result.get("results", []),
                    "subsystem_filter": subsystem
                }
            else:
                error_msg = result.get("error", "Unknown search error")
                logger.warning(f"Search failed for '{query}': {error_msg}")
                return {
                    "success": False,
                    "query": query,
                    "results": [],
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception searching coordinates with query '{query}': {e}")
            return {
                "success": False,
                "query": query,
                "results": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def get_subsystem_coordinates(self, subsystem: int, limit: int = 50) -> Dict[str, Any]:
        """
        Get all coordinates for a specific subsystem.
        
        Args:
            subsystem: The subsystem number (0-5)
            limit: Maximum number of coordinates to return
            
        Returns:
            Dict containing subsystem coordinates
        """
        try:
            result = await self.client.get_subsystem_coordinates(subsystem, limit)
            
            if result.get("success"):
                coordinates = result.get("coordinates", [])
                logger.info(f"Retrieved {len(coordinates)} coordinates for subsystem #{subsystem}")
                return {
                    "success": True,
                    "subsystem": subsystem,
                    "coordinates": coordinates,
                    "count": len(coordinates)
                }
            else:
                error_msg = result.get("error", "Unknown subsystem query error")
                logger.warning(f"Failed to get subsystem #{subsystem} coordinates: {error_msg}")
                return {
                    "success": False,
                    "subsystem": subsystem,
                    "coordinates": [],
                    "error": error_msg
                }
                
        except Exception as e:
            logger.error(f"Exception getting subsystem #{subsystem} coordinates: {e}")
            return {
                "success": False,
                "subsystem": subsystem,
                "coordinates": [],
                "error": f"HTTP request failed: {str(e)}"
            }
    
    async def close(self):
        """Close the HTTP client connection"""
        if self.client:
            await self.client.close()


async def create_http_bimba_client(graphql_client: BimbaGraphQLClient) -> HttpBimbaClient:
    """
    Factory function to create an HTTP-based Bimba client.
    
    Args:
        graphql_client: The GraphQL client for Backend API communication
        
    Returns:
        Configured HttpBimbaClient instance
    """
    client = HttpBimbaClient(graphql_client)
    logger.info("HTTP Bimba client created")
    return client
