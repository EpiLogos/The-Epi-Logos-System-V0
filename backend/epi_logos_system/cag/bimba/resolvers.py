# GraphQL Resolvers for Coordinate Resolution
from ariadne import QueryType, UnionType
from typing import Any, Optional

query = QueryType()
path_component = UnionType("PathComponent")

@query.field("getNodeByCoordinate")
def resolve_get_node_by_coordinate(_: Any, info: Any, coordinate: str) -> dict | None:
    # This is the "thin" resolver layer.
    # It just orchestrates the call to the business logic.
    node_service = info.context["service"]
    node = node_service.get_node(coordinate)

    # Transform the Pydantic model into a dictionary for GraphQL.
    return node.model_dump() if node else None

@query.field("getNodeWithRelationships")
def resolve_get_node_with_relationships(_: Any, info: Any, coordinate: str) -> dict | None:
    """Resolve a node and its direct relationships.

    Follows the same thin-resolver pattern as getNodeByCoordinate, delegating
    all business logic to the service layer and shaping the response for GraphQL.
    """
    node_service = info.context["service"]
    result = node_service.get_node_relationships(coordinate)
    return result if result else None

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


@query.field("getPathBetweenCoordinates")
def resolve_get_path_between_coordinates(
    _: Any,
    info: Any,
    startCoordinate: str,
    endCoordinate: str,
    maxHops: Optional[int] = None,
) -> dict | None:
    """Resolve an ordered path between two coordinates using service layer."""
    service = info.context["service"]
    return service.get_path_between_coordinates(startCoordinate, endCoordinate, maxHops)


@path_component.type_resolver
def resolve_path_component_type(obj, *_):
    if isinstance(obj, dict) and "type" in obj:
        return "PathRelationship"
    return "PathNode"
