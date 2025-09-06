"""
Bimba GraphQL Client Implementation

GraphQL client for basic Bimba Map access as a foundational CAG tool.
Provides coordinate resolution and basic context lookup capabilities.

Implements AC4: GraphQL API integration for basic Bimba Map access as foundational CAG tool
"""

import logging
import aiohttp
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class BimbaNode(BaseModel):
    """Basic Bimba Node model for GraphQL responses"""
    coordinate: str
    name: str
    subsystem: int
    
    # Optional extended fields that might be available
    description: Optional[str] = None
    properties: Dict[str, Any] = Field(default_factory=dict)


class GraphQLError(BaseModel):
    """GraphQL error model"""
    message: str
    locations: Optional[List[Dict[str, int]]] = None
    path: Optional[List[str]] = None
    extensions: Optional[Dict[str, Any]] = None


class GraphQLResponse(BaseModel):
    """GraphQL response model"""
    data: Optional[Dict[str, Any]] = None
    errors: Optional[List[GraphQLError]] = None


class BimbaGraphQLClient:
    """
    GraphQL client for basic Bimba Map access.
    
    Provides foundational coordinate resolution and context lookup capabilities
    for the UnifiedOrchestrator system. This serves as the basic CAG tool for
    accessing the Bimba coordinate space.
    """
    
    def __init__(self, graphql_endpoint: str, timeout: int = 30):
        """Initialize the Bimba GraphQL client"""
        self.endpoint = graphql_endpoint
        self.timeout = timeout
        self.session: Optional[aiohttp.ClientSession] = None
        
        # Basic GraphQL queries
        self.queries = {
            'get_node_by_coordinate': """
                query GetNodeByCoordinate($coordinate: String!) {
                    getNodeByCoordinate(coordinate: $coordinate) {
                        coordinate
                        name
                        subsystem
                    }
                }
            """,
            
            'get_nodes_by_coordinates': """
                query GetNodesByCoordinates($coordinates: [String!]!) {
                    getNodesByCoordinates(coordinates: $coordinates) {
                        coordinate
                        name
                        subsystem
                    }
                }
            """,
            
            'search_nodes': """
                query SearchNodes($query: String!, $limit: Int = 10) {
                    searchNodes(query: $query, limit: $limit) {
                        coordinate
                        name
                        subsystem
                    }
                }
            """
        }
        
        logger.info(f"BimbaGraphQLClient initialized with endpoint: {graphql_endpoint}")
    
    async def _get_session(self) -> aiohttp.ClientSession:
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            timeout = aiohttp.ClientTimeout(total=self.timeout)
            self.session = aiohttp.ClientSession(
                timeout=timeout,
                headers={'Content-Type': 'application/json'}
            )
        return self.session
    
    async def _execute_query(
        self, 
        query: str, 
        variables: Optional[Dict[str, Any]] = None
    ) -> GraphQLResponse:
        """Execute a GraphQL query against the Bimba Map"""
        
        try:
            session = await self._get_session()
            
            payload = {
                'query': query,
                'variables': variables or {}
            }
            
            async with session.post(self.endpoint, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return GraphQLResponse(**result)
                else:
                    error_text = await response.text()
                    logger.error(f"GraphQL request failed with status {response.status}: {error_text}")
                    return GraphQLResponse(
                        errors=[GraphQLError(
                            message=f"HTTP {response.status}: {error_text}"
                        )]
                    )
                    
        except aiohttp.ClientError as e:
            logger.error(f"Network error executing GraphQL query: {e}")
            return GraphQLResponse(
                errors=[GraphQLError(message=f"Network error: {str(e)}")]
            )
        except Exception as e:
            logger.error(f"Unexpected error executing GraphQL query: {e}")
            return GraphQLResponse(
                errors=[GraphQLError(message=f"Unexpected error: {str(e)}")]
            )
    
    async def get_node_by_coordinate(self, coordinate: str) -> Optional[BimbaNode]:
        """
        Get a single Bimba node by its coordinate.
        
        This is the foundational CAG operation for coordinate resolution.
        """
        try:
            query = self.queries['get_node_by_coordinate']
            variables = {'coordinate': coordinate}
            
            response = await self._execute_query(query, variables)
            
            if response.errors:
                logger.warning(f"GraphQL errors for coordinate {coordinate}: {response.errors}")
                return None
            
            if response.data and 'getNodeByCoordinate' in response.data:
                node_data = response.data['getNodeByCoordinate']
                if node_data:
                    return BimbaNode(**node_data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting node by coordinate {coordinate}: {e}")
            return None
    
    async def get_nodes_by_coordinates(self, coordinates: List[str]) -> List[BimbaNode]:
        """
        Get multiple Bimba nodes by their coordinates.
        
        Efficient batch operation for multiple coordinate lookups.
        """
        try:
            if not coordinates:
                return []
            
            query = self.queries['get_nodes_by_coordinates'] 
            variables = {'coordinates': coordinates}
            
            response = await self._execute_query(query, variables)
            
            if response.errors:
                logger.warning(f"GraphQL errors for coordinates {coordinates}: {response.errors}")
                return []
            
            if response.data and 'getNodesByCoordinates' in response.data:
                nodes_data = response.data['getNodesByCoordinates']
                if nodes_data:
                    return [BimbaNode(**node_data) for node_data in nodes_data]
            
            return []
            
        except Exception as e:
            logger.error(f"Error getting nodes by coordinates {coordinates}: {e}")
            return []
    
    async def search_nodes(self, query: str, limit: int = 10) -> List[BimbaNode]:
        """
        Search for Bimba nodes by text query.
        
        Basic text search capability for finding relevant nodes.
        """
        try:
            graphql_query = self.queries['search_nodes']
            variables = {'query': query, 'limit': limit}
            
            response = await self._execute_query(graphql_query, variables)
            
            if response.errors:
                logger.warning(f"GraphQL errors for search '{query}': {response.errors}")
                return []
            
            if response.data and 'searchNodes' in response.data:
                nodes_data = response.data['searchNodes']
                if nodes_data:
                    return [BimbaNode(**node_data) for node_data in nodes_data]
            
            return []
            
        except Exception as e:
            logger.error(f"Error searching nodes with query '{query}': {e}")
            return []
    
    async def resolve_coordinate_context(
        self, 
        coordinates: List[str]
    ) -> Dict[str, Any]:
        """
        Resolve coordinate context for persona workflow integration.
        
        This provides the foundational context resolution capability that
        integrates with the ACT Protocol Context Package system.
        """
        try:
            # Get all nodes for the coordinates
            nodes = await self.get_nodes_by_coordinates(coordinates)
            
            # Build context summary
            context = {
                'coordinates_requested': coordinates,
                'nodes_found': len(nodes),
                'coordinates_resolved': [node.coordinate for node in nodes],
                'subsystem_distribution': {},
                'nodes': [node.model_dump() for node in nodes],
                'resolved_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Calculate subsystem distribution
            for node in nodes:
                subsystem = node.subsystem
                context['subsystem_distribution'][subsystem] = \
                    context['subsystem_distribution'].get(subsystem, 0) + 1
            
            logger.info(
                f"Resolved coordinate context: {len(nodes)} nodes from "
                f"{len(coordinates)} coordinates"
            )
            
            return context
            
        except Exception as e:
            logger.error(f"Error resolving coordinate context: {e}")
            return {
                'coordinates_requested': coordinates,
                'nodes_found': 0,
                'error': str(e),
                'resolved_at': datetime.now(timezone.utc).isoformat()
            }
    
    async def validate_coordinates(self, coordinates: List[str]) -> Dict[str, bool]:
        """
        Validate a list of coordinates exist in the Bimba Map.
        
        Returns dictionary mapping coordinate -> exists (boolean)
        """
        try:
            nodes = await self.get_nodes_by_coordinates(coordinates)
            found_coordinates = {node.coordinate for node in nodes}
            
            return {
                coord: coord in found_coordinates 
                for coord in coordinates
            }
            
        except Exception as e:
            logger.error(f"Error validating coordinates: {e}")
            return {coord: False for coord in coordinates}
    
    async def get_subsystem_nodes(self, subsystem: int, limit: int = 50) -> List[BimbaNode]:
        """
        Get nodes from a specific subsystem.
        
        Note: This would require a subsystem-specific query in the GraphQL schema.
        For now, this is a placeholder for future implementation.
        """
        # This would require extending the GraphQL schema with subsystem queries
        logger.warning("get_subsystem_nodes not yet implemented - requires schema extension")
        return []
    
    async def health_check(self) -> bool:
        """
        Check if the GraphQL endpoint is healthy and responsive.
        
        Returns True if the endpoint is accessible and responding.
        """
        try:
            # Simple introspection query to test connectivity
            introspection_query = """
                query {
                    __schema {
                        types {
                            name
                        }
                    }
                }
            """
            
            response = await self._execute_query(introspection_query)
            
            if response.errors:
                logger.warning(f"GraphQL health check failed: {response.errors}")
                return False
            
            return response.data is not None
            
        except Exception as e:
            logger.error(f"GraphQL health check error: {e}")
            return False
    
    async def close(self):
        """Close the HTTP session"""
        if self.session and not self.session.closed:
            await self.session.close()
            logger.info("BimbaGraphQLClient session closed")
    
    def get_client_info(self) -> Dict[str, Any]:
        """Get information about the client configuration"""
        return {
            'endpoint': self.endpoint,
            'timeout': self.timeout,
            'session_active': self.session is not None and not self.session.closed,
            'available_queries': list(self.queries.keys())
        }