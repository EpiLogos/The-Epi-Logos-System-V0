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

    async def get_node_details_complete(
        self, coordinate: str, include_functional_properties: bool = False
    ) -> Dict[str, Any]:
        """
        Get ALL node properties from Neo4j with selective filtering.

        Returns complete property set via Generic scalar - no schema restrictions.
        By default filters out f_* prefixed functional properties unless requested.
        Enables agents to access any property without knowing field names beforehand.

        Args:
            coordinate: The Bimba coordinate to retrieve
            include_functional_properties: If True, include f_* functional properties

        Returns:
            Dict containing all properties or error
        """
        try:
            result = await self.client.get_node_details_complete(
                coordinate, include_functional_properties
            )

            if result.get("success"):
                logger.info(f"Retrieved complete node details for: {coordinate}")
                return {
                    "success": True,
                    "coordinate": coordinate,
                    "allProperties": result.get("allProperties")
                }
            else:
                error_msg = result.get("error", "Unknown error")
                logger.warning(f"Failed to get complete details for {coordinate}: {error_msg}")
                return {
                    "success": False,
                    "coordinate": coordinate,
                    "allProperties": None,
                    "error": error_msg
                }
        except Exception as e:
            logger.error(f"Exception getting complete details for {coordinate}: {e}")
            return {
                "success": False,
                "coordinate": coordinate,
                "allProperties": None,
                "error": f"HTTP request failed: {str(e)}"
            }

    async def get_node_by_coordinate_extended(self, coordinate: str) -> Dict[str, Any]:
        """
        Get comprehensive node data with all flexible schema properties.

        Args:
            coordinate: The Bimba coordinate to inspect in detail

        Returns:
            Dict containing complete node data with extended properties or error
        """
        try:
            result = await self.client.get_node_by_coordinate_extended(coordinate)

            if result.get("success"):
                logger.info(f"Retrieved extended node data for: {coordinate}")
                return {
                    "success": True,
                    "coordinate": coordinate,
                    "node": result.get("node"),
                }
            else:
                error_msg = result.get("error", "Unknown error")
                logger.warning(f"Failed to get extended node data for {coordinate}: {error_msg}")
                return {
                    "success": False,
                    "coordinate": coordinate,
                    "node": None,
                    "error": error_msg,
                }
        except Exception as e:
            logger.error(f"Exception getting extended node data for {coordinate}: {e}")
            return {
                "success": False,
                "coordinate": coordinate,
                "node": None,
                "error": f"HTTP request failed: {str(e)}",
            }

    async def get_node_relationships(self, coordinate: str) -> Dict[str, Any]:
        """
        Get all direct relationship connections for a Bimba coordinate.

        Args:
            coordinate: The Bimba coordinate to inspect

        Returns:
            Dict containing the node and its relationship edges
        """
        try:
            result = await self.client.get_node_relationships(coordinate)

            if result.get("success"):
                logger.info(f"Retrieved relationships for coordinate: {coordinate} ({len(result.get('edges', []))} edges)")
                return {
                    "success": True,
                    "coordinate": result.get("coordinate", coordinate),
                    "node": result.get("node"),
                    "edges": result.get("edges", []),
                }
            else:
                error_msg = result.get("error", "Unknown relationships error")
                logger.warning(f"Failed to fetch relationships for {coordinate}: {error_msg}")
                return {
                    "success": False,
                    "coordinate": coordinate,
                    "node": None,
                    "edges": [],
                    "error": error_msg,
                }
        except Exception as e:
            logger.error(f"Exception fetching relationships for {coordinate}: {e}")
            return {
                "success": False,
                "coordinate": coordinate,
                "node": None,
                "edges": [],
                "error": f"HTTP request failed: {str(e)}",
            }

    async def semantic_coordinate_discovery(self, query_text: str, max_results: int = 7) -> Dict[str, Any]:
        """Discover Bimba coordinates matching a natural language query via GraphQL.

        Default 7 results enables parent + complete mod6 children (e.g., #1 + #1-0 through #1-5).
        """
        try:
            result = await self.client.semantic_coordinate_discovery(query_text, max_results)
            if result.get("success"):
                return result
            else:
                return {"success": False, "results": [], "error": result.get("error", "Unknown error")}
        except Exception as e:
            logger.error(f"Exception in semantic_coordinate_discovery: {e}")
            return {"success": False, "results": [], "error": f"HTTP request failed: {str(e)}"}

    async def lexical_coordinate_search(self, search_string: str, limit: Optional[int] = None) -> Dict[str, Any]:
        """Lexical substring search across all Bimba properties via GraphQL.

        Direct property iteration for exact substring matching when semantic/fulltext search fails.
        Finds substrings like 'Iti' in 'My-Self/Iti'.

        Args:
            search_string: String to search for in any property
            limit: Max results (default 20, capped at 50)

        Returns:
            Dict with success flag, results list, and error (if any)
        """
        try:
            result = await self.client.lexical_coordinate_search(search_string, limit)
            if result.get("success"):
                return result
            else:
                return {"success": False, "results": [], "error": result.get("error", "Unknown error")}
        except Exception as e:
            logger.error(f"Exception in lexical_coordinate_search: {e}")
            return {"success": False, "results": [], "error": f"HTTP request failed: {str(e)}"}

    async def get_direct_children(self, bimba_coordinate: str) -> Dict[str, Any]:
        """Get direct child nodes of a Bimba coordinate via GraphQL.

        Returns lean data (name, coordinate, primaryDesignation, description) for hierarchical children.

        Args:
            bimba_coordinate: Parent coordinate to find children for

        Returns:
            Dict with success flag, children list, and error (if any)
        """
        try:
            result = await self.client.get_direct_children(bimba_coordinate)
            if result.get("success"):
                return result
            else:
                return {"success": False, "children": [], "error": result.get("error", "Unknown error")}
        except Exception as e:
            logger.error(f"Exception in get_direct_children: {e}")
            return {"success": False, "children": [], "error": f"HTTP request failed: {str(e)}"}

    async def regenerate_node_embedding(self, coordinate: str) -> Dict[str, Any]:
        """Regenerate embeddings for a node via GraphQL mutation."""
        try:
            return await self.client.regenerate_node_embedding(coordinate)
        except Exception as e:
            logger.error(f"Embedding regeneration failed for {coordinate}: {e}")
            return {"success": False, "coordinate": coordinate, "error": str(e)}

    async def regenerate_all_embeddings(self, batch_size: int = 500) -> Dict[str, Any]:
        """Regenerate embeddings for all nodes via GraphQL mutation (admin)."""
        try:
            return await self.client.regenerate_all_embeddings(batch_size)
        except Exception as e:
            logger.error(f"Bulk embedding regeneration failed: {e}")
            return {"success": False, "total": 0, "updated": 0, "skipped": 0, "error": str(e)}

    async def get_path_between_coordinates(
        self,
        start_coordinate: str,
        end_coordinate: str,
        max_hops: int = 5,
    ) -> Dict[str, Any]:
        """
        Find an ordered relationship path between two Bimba coordinates via GraphQL.

        Args:
            start_coordinate: Starting Bimba coordinate
            end_coordinate: Ending Bimba coordinate
            max_hops: Optional hop limit (default 5)

        Returns:
            Dict containing pathLength, start/end nodes, and ordered components
        """
        # Construct GraphQL request inline using the underlying client's POST
        query = """
        query GetPath($start: String!, $end: String!, $hops: Int) {
          getPathBetweenCoordinates(startCoordinate: $start, endCoordinate: $end, maxHops: $hops) {
            startNode { coordinate name subsystem }
            endNode { coordinate name subsystem }
            pathLength
            pathComponents {
              ... on PathNode { position coordinate name subsystem }
              ... on PathRelationship { position type direction properties { key value } }
            }
          }
        }
        """

        variables = {
            "start": start_coordinate,
            "end": end_coordinate,
            "hops": max_hops,
        }

        try:
            logger.info(
                "Requesting path between %s and %s (maxHops=%s)",
                start_coordinate,
                end_coordinate,
                max_hops,
            )
            response = await self.client.post("/graphql", json_data={"query": query, "variables": variables})

            if "data" in response and response["data"]:
                path = response["data"].get("getPathBetweenCoordinates")
                if path is None:
                    return {
                        "success": False,
                        "error": "No path found within constraints",
                        "path": None,
                    }
                return {"success": True, "path": path}

            # GraphQL errors path
            errors = response.get("errors", [])
            error_msg = "; ".join([err.get("message", "Unknown error") for err in errors])
            logger.warning("Path traversal GraphQL error: %s", error_msg)
            return {"success": False, "error": error_msg or "GraphQL query failed", "path": None}

        except Exception as e:
            logger.error("HTTP error during path traversal: %s", e)
            return {"success": False, "error": f"HTTP request failed: {str(e)}", "path": None}
    
    async def close(self):
        """Close the HTTP client connection"""
        if self.client:
            await self.client.close()

    async def create_bimba_node(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Bimba node via Backend GraphQL mutation.

        Expects keys: coordinate, name, subsystem, and optional description,
        operationalEssence, coreNature, architecturalFunction, symbol.
        """
        mutation = """
        mutation CreateNode($input: CreateBimbaNodeInput!) {
          createBimbaNode(input: $input) {
            success
            node { coordinate name subsystem description operationalEssence coreNature architecturalFunction symbol uuid createdAt updatedAt }
            errors { field message code }
          }
        }
        """
        try:
            resp = await self.client.post(
                "/graphql",
                json_data={"query": mutation, "variables": {"input": input_data}},
            )
            data = resp.get("data", {}).get("createBimbaNode") if isinstance(resp, dict) else None
            if data:
                return data
            errors = resp.get("errors", []) if isinstance(resp, dict) else []
            err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
            return {"success": False, "errors": [{"field": None, "message": err_msg or "GraphQL error", "code": "GRAPHQL_ERROR"}]}
        except Exception as e:
            logger.error(f"Create node failed: {e}")
            return {"success": False, "errors": [{"field": None, "message": str(e), "code": "HTTP_ERROR"}]}

    async def create_bimba_relationship(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a Bimba relationship via Backend GraphQL mutation (admin-only).

        Expects: fromCoordinate, toCoordinate, relationshipType (required)
        Optional: properties (list of {key, value}), bidirectional (bool)
        """
        try:
            result = await self.client.create_bimba_relationship(input_data)
            if result.get("success"):
                rel = result.get("relationship", {})
                was_update = result.get("wasUpdate", False)
                action = "Updated" if was_update else "Created"
                logger.info(
                    f"{action} relationship: {rel.get('fromCoordinate')} "
                    f"-[{rel.get('type')}]-> {rel.get('toCoordinate')}"
                )
            else:
                errors = result.get("errors", [])
                err_msg = "; ".join([e.get("message", "Unknown") for e in errors])
                logger.warning(f"Relationship creation failed: {err_msg}")
            return result
        except Exception as e:
            logger.error(f"Create relationship failed: {e}")
            return {"success": False, "errors": [{"field": None, "message": str(e), "code": "HTTP_ERROR"}]}

    async def update_bimba_node(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a Bimba node via Backend GraphQL mutation (admin-only).

        Expects coordinate (required) and any flexible schema properties to update.
        FLEXIBLE PROPERTIES: Accepts arbitrary camelCase property names.
        Common fields: Core Identity, Structure, Principles, Operational, Relational properties.
        Custom fields: Any coordinate-specific properties (e.g., f_cycle_orchestration, spandaMode).
        Backend validates: camelCase naming, no nested objects (Neo4j compatibility).
        """
        try:
            result = await self.client.update_bimba_node(input_data)
            if result.get("success"):
                logger.info(f"Successfully updated node: {input_data.get('coordinate')}")
            else:
                errors = result.get("errors", [])
                err_msg = "; ".join([e.get("message", "Unknown") for e in errors])
                logger.warning(f"Update failed for {input_data.get('coordinate')}: {err_msg}")
            return result
        except Exception as e:
            logger.error(f"Update node failed for {input_data.get('coordinate')}: {e}")
            return {"success": False, "errors": [{"field": None, "message": str(e), "code": "HTTP_ERROR"}]}


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
