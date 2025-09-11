# GraphQL Resolvers for Coordinate Resolution
from ariadne import QueryType
from typing import Any, Optional

query = QueryType()

@query.field("getNodeByCoordinate")
def resolve_get_node_by_coordinate(_: Any, info: Any, coordinate: str) -> dict | None:
    # This is the "thin" resolver layer.
    # It just orchestrates the call to the business logic.
    node_service = info.context["service"]
    node = node_service.get_node(coordinate)

    # Transform the Pydantic model into a dictionary for GraphQL.
    return node.model_dump() if node else None

@query.field("searchCoordinates")
def resolve_search_coordinates(_: Any, info: Any, query: str, subsystem: Optional[int] = None, limit: Optional[int] = 10) -> dict:
    # TODO: Implement actual search functionality
    # For now, return empty results with a message
    return {
        "success": False,
        "results": [],
        "error": f"Search functionality not yet implemented (query: '{query[:50]}...', subsystem: {subsystem}, limit: {limit})"
    }

@query.field("getSubsystemCoordinates")
def resolve_get_subsystem_coordinates(_: Any, info: Any, subsystem: int, limit: Optional[int] = 50) -> dict:
    # TODO: Implement subsystem coordinate listing
    # For now, return empty results with a message
    return {
        "success": False,
        "coordinates": [],
        "error": f"Subsystem coordinate listing not yet implemented (subsystem: {subsystem}, limit: {limit})"
    }