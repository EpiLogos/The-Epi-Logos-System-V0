"""
GraphQL client for Bimba coordinate resolution

This client handles all GraphQL communication with the Backend layer's
Bimba coordinate resolution system, replacing direct Neo4j connections.
"""

import logging
from typing import Dict, Any, List, Optional
from agentic.clients.backend_http_client import BackendHttpClient

logger = logging.getLogger(__name__)


class BimbaGraphQLClient(BackendHttpClient):
    """GraphQL client for Bimba coordinate operations"""
    
    async def resolve_coordinate(self, coordinate: str) -> Dict[str, Any]:
        """Resolve a Bimba coordinate to get its content and context"""
        query = """
        query ResolveCoordinate($coordinate: String!) {
            getNodeByCoordinate(coordinate: $coordinate) {
                coordinate
                name
                subsystem
                description
                operationalEssence
                coreNature
                function
                symbol
                nodeType
                uuid
                createdAt
                updatedAt
            }
        }
        """

        variables = {"coordinate": coordinate}
        request_data = {"query": query, "variables": variables}

        logger.info(f"Resolving Bimba coordinate: {coordinate}")
        response = await self.post("/graphql", json_data=request_data)

        # Extract data from GraphQL response format
        if "data" in response and response["data"]:
            node_data = response["data"]["getNodeByCoordinate"]
            if node_data:
                return {
                    "success": True,
                    "coordinate": node_data["coordinate"],
                    "name": node_data["name"],
                    "subsystem": node_data["subsystem"],
                    "content": node_data.get("description"),  # Map description to content
                    "context": {
                        "operationalEssence": node_data.get("operationalEssence"),
                        "coreNature": node_data.get("coreNature"),
                        "function": node_data.get("function"),
                        "symbol": node_data.get("symbol"),
                        "nodeType": node_data.get("nodeType"),
                        "uuid": node_data.get("uuid"),
                        "createdAt": node_data.get("createdAt"),
                        "updatedAt": node_data.get("updatedAt")
                    },
                    "related_coordinates": [],  # TODO: Add relationship queries
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "coordinate": coordinate,
                    "content": None,
                    "context": None,
                    "related_coordinates": [],
                    "error": "Coordinate not found"
                }
        else:
            # Handle GraphQL errors
            errors = response.get("errors", [])
            error_msg = "; ".join([err.get("message", "Unknown error") for err in errors])
            return {
                "success": False,
                "coordinate": coordinate,
                "content": None,
                "context": None,
                "related_coordinates": [],
                "error": error_msg or "GraphQL query failed"
            }
    
    async def search_coordinates(
        self,
        query: str,
        subsystem: Optional[int] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Search for coordinates matching a semantic query"""
        graphql_query = """
        query SearchCoordinates($query: String!, $subsystem: Int, $limit: Int!) {
            searchCoordinates(query: $query, subsystem: $subsystem, limit: $limit) {
                success
                results {
                    coordinate
                    name
                    subsystem
                    description
                    relevance_score
                }
                error
            }
        }
        """

        variables = {
            "query": query,
            "subsystem": subsystem,
            "limit": limit
        }
        request_data = {"query": graphql_query, "variables": variables}

        logger.info(f"Searching coordinates: '{query[:50]}...' (subsystem: {subsystem})")
        response = await self.post("/graphql", json_data=request_data)

        if "data" in response and response["data"]:
            return response["data"]["searchCoordinates"]
        else:
            errors = response.get("errors", [])
            error_msg = "; ".join([err.get("message", "Unknown error") for err in errors])
            return {
                "success": False,
                "results": [],
                "error": error_msg or "GraphQL query failed"
            }
    
    async def get_subsystem_coordinates(self, subsystem: int, limit: int = 50) -> Dict[str, Any]:
        """Get all coordinates for a specific subsystem"""
        query = """
        query GetSubsystemCoordinates($subsystem: Int!, $limit: Int!) {
            getSubsystemCoordinates(subsystem: $subsystem, limit: $limit) {
                success
                coordinates {
                    coordinate
                    name
                    subsystem
                    description
                    operationalEssence
                    coreNature
                    function
                    symbol
                    nodeType
                    uuid
                    createdAt
                    updatedAt
                }
                error
            }
        }
        """

        variables = {"subsystem": subsystem, "limit": limit}
        request_data = {"query": query, "variables": variables}

        logger.info(f"Getting subsystem coordinates: #{subsystem}")
        response = await self.post("/graphql", json_data=request_data)

        if "data" in response and response["data"]:
            return response["data"]["getSubsystemCoordinates"]
        else:
            errors = response.get("errors", [])
            error_msg = "; ".join([err.get("message", "Unknown error") for err in errors])
            return {
                "success": False,
                "coordinates": [],
                "error": error_msg or "GraphQL query failed"
            }

    async def get_node_relationships(self, coordinate: str) -> Dict[str, Any]:
        """Get a node with all direct relationship connections."""
        query = """
        query GetNodeWithRelationships($coordinate: String!) {
            getNodeWithRelationships(coordinate: $coordinate) {
                node {
                    coordinate
                    name
                    subsystem
                    description
                    operationalEssence
                    coreNature
                    function
                    symbol
                    nodeType
                    uuid
                    createdAt
                    updatedAt
                }
                edges {
                    type
                    direction
                    neighbor {
                        coordinate
                        name
                        subsystem
                        description
                        operationalEssence
                        coreNature
                        function
                        symbol
                        nodeType
                        uuid
                        createdAt
                        updatedAt
                    }
                    properties { key value }
                }
            }
        }
        """

        variables = {"coordinate": coordinate}
        request_data = {"query": query, "variables": variables}

        logger.info(f"Fetching relationships for coordinate: {coordinate}")
        response = await self.post("/graphql", json_data=request_data)

        if "data" in response and response["data"]:
            node_with_edges = response["data"].get("getNodeWithRelationships")
            if node_with_edges:
                node = node_with_edges.get("node", {})
                edges = node_with_edges.get("edges", [])
                return {
                    "success": True,
                    "coordinate": node.get("coordinate", coordinate),
                    "node": node,
                    "edges": edges,
                    "error": None,
                }
            else:
                return {
                    "success": False,
                    "coordinate": coordinate,
                    "node": None,
                    "edges": [],
                    "error": "Coordinate not found",
                }
        else:
            errors = response.get("errors", [])
            error_msg = "; ".join([err.get("message", "Unknown error") for err in errors])
            return {
                "success": False,
                "coordinate": coordinate,
                "node": None,
                "edges": [],
                "error": error_msg or "GraphQL query failed",
            }
