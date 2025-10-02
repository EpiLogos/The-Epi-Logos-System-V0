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
        """Resolve a Bimba coordinate to get its content and context (LEAN query)"""
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
                architecturalFunction
                symbol
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
                        "architecturalFunction": node_data.get("architecturalFunction") or node_data.get("function"),
                        "symbol": node_data.get("symbol"),
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

    async def get_node_by_coordinate_extended(self, coordinate: str) -> Dict[str, Any]:
        """Get comprehensive node data with all flexible schema properties (COMPREHENSIVE query)"""
        query = """
        query GetNodeExtended($coordinate: String!) {
            getNodeByCoordinateExtended(coordinate: $coordinate) {
                coordinate
                name
                subsystem
                primaryDesignation
                coreNature
                architecturalFunction
                internalStructure
                keyPrinciples
                resonances
                practicalApplications
                operationalEssence
                accessLevel
                consciousnessStructure
                operationalSymbolics
                relatedCoordinates
                lastUpdated
                description
                function
                symbol
                uuid
                createdAt
                updatedAt
            }
        }
        """

        variables = {"coordinate": coordinate}
        request_data = {"query": query, "variables": variables}

        logger.info(f"Getting extended node data for: {coordinate}")
        response = await self.post("/graphql", json_data=request_data)

        if "data" in response and response["data"]:
            node_data = response["data"]["getNodeByCoordinateExtended"]
            if node_data:
                return {
                    "success": True,
                    "node": node_data,
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "node": None,
                    "error": "Coordinate not found"
                }
        else:
            errors = response.get("errors", [])
            error_msg = "; ".join([err.get("message", "Unknown error") for err in errors])
            return {
                "success": False,
                "node": None,
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
                    architecturalFunction
                    symbol
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
                    architecturalFunction
                    symbol
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
                        architecturalFunction
                        symbol
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

    async def semantic_coordinate_discovery(self, query_text: str, max_results: int = 5) -> Dict[str, Any]:
        """Discover coordinates matching natural language descriptions via GraphQL."""
        query = """
        query SemanticCoordinateDiscovery($queryText: String!, $maxResults: Int) {
          semanticCoordinateDiscovery(queryText: $queryText, maxResults: $maxResults) {
            coordinate
            name
            similarity
            semanticContext
            namespace
            clusterId
            clusterTheme
          }
        }
        """
        variables = {"queryText": query_text, "maxResults": max_results}
        resp = await self.post("/graphql", json_data={"query": query, "variables": variables})
        if "data" in resp and resp["data"] is not None:
            return {"success": True, "results": resp["data"].get("semanticCoordinateDiscovery", [])}
        errors = resp.get("errors", []) if isinstance(resp, dict) else []
        err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
        return {"success": False, "results": [], "error": err_msg or "GraphQL query failed"}

    async def regenerate_node_embedding(self, coordinate: str) -> Dict[str, Any]:
        mutation = """
        mutation Regen($coordinate: String!) {
          regenerateNodeEmbedding(coordinate: $coordinate) {
            success
            coordinate
            dimension
            updatedAt
            model
            hash
            error
          }
        }
        """
        resp = await self.post("/graphql", json_data={"query": mutation, "variables": {"coordinate": coordinate}})
        if "data" in resp and resp["data"]:
            return resp["data"]["regenerateNodeEmbedding"]
        errors = resp.get("errors", []) if isinstance(resp, dict) else []
        err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
        return {"success": False, "coordinate": coordinate, "error": err_msg or "GraphQL error"}

    async def regenerate_all_embeddings(self, batch_size: int = 500, force: bool = False) -> Dict[str, Any]:
        mutation = """
        mutation RegenAll($batchSize: Int, $force: Boolean) {
          regenerateAllEmbeddings(batchSize: $batchSize, force: $force) {
            success
            total
            updated
            skipped
            error
          }
        }
        """
        resp = await self.post("/graphql", json_data={"query": mutation, "variables": {"batchSize": batch_size, "force": force}})
        if "data" in resp and resp["data"]:
            return resp["data"]["regenerateAllEmbeddings"]
        errors = resp.get("errors", []) if isinstance(resp, dict) else []
        err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
        return {"success": False, "total": 0, "updated": 0, "skipped": 0, "error": err_msg or "GraphQL error"}

    async def create_bimba_node(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Bimba node via GraphQL mutation (admin-only)."""
        mutation = """
        mutation CreateNode($input: CreateBimbaNodeInput!) {
          createBimbaNode(input: $input) {
            success
            node {
              coordinate name subsystem description operationalEssence coreNature function architecturalFunction symbol uuid createdAt updatedAt
            }
            errors { field message code }
          }
        }
        """
        resp = await self.post("/graphql", json_data={"query": mutation, "variables": {"input": input_data}})
        if "data" in resp and resp["data"]:
            return resp["data"].get("createBimbaNode", {"success": False, "errors": [{"message": "No payload"}]})
        errors = resp.get("errors", []) if isinstance(resp, dict) else []
        err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
        return {"success": False, "errors": [{"field": None, "message": err_msg or "GraphQL error", "code": "GRAPHQL_ERROR"}]}

    async def create_bimba_relationship(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a Bimba relationship via GraphQL mutation (admin-only)."""
        mutation = """
        mutation CreateRel($input: CreateBimbaRelationshipInput!) {
          createBimbaRelationship(input: $input) {
            success
            relationship {
              type
              fromCoordinate
              toCoordinate
              properties { key value }
              createdAt
              updatedAt
            }
            reverseRelationship {
              type
              fromCoordinate
              toCoordinate
              properties { key value }
              createdAt
              updatedAt
            }
            wasUpdate
            errors { field message code }
          }
        }
        """
        resp = await self.post("/graphql", json_data={"query": mutation, "variables": {"input": input_data}})
        if "data" in resp and resp["data"]:
            return resp["data"].get("createBimbaRelationship", {"success": False, "errors": [{"message": "No payload"}]})
        errors = resp.get("errors", []) if isinstance(resp, dict) else []
        err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
        return {"success": False, "errors": [{"field": None, "message": err_msg or "GraphQL error", "code": "GRAPHQL_ERROR"}]}

    async def update_bimba_node(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a Bimba node via GraphQL mutation (admin-only)."""
        mutation = """
        mutation UpdateNode($input: UpdateBimbaNodeInput!) {
          updateBimbaNode(input: $input) {
            success
            node {
              coordinate name subsystem
              primaryDesignation coreNature architecturalFunction
              internalStructure
              keyPrinciples resonances practicalApplications
              operationalEssence accessLevel consciousnessStructure operationalSymbolics
              relatedCoordinates lastUpdated
              description function symbol uuid
              createdAt updatedAt
            }
            errors { field message code }
          }
        }
        """
        resp = await self.post("/graphql", json_data={"query": mutation, "variables": {"input": input_data}})
        if "data" in resp and resp["data"]:
            return resp["data"].get("updateBimbaNode", {"success": False, "errors": [{"message": "No payload"}]})
        errors = resp.get("errors", []) if isinstance(resp, dict) else []
        err_msg = "; ".join([e.get("message", "Unknown error") for e in errors])
        return {"success": False, "errors": [{"field": None, "message": err_msg or "GraphQL error", "code": "GRAPHQL_ERROR"}]}
