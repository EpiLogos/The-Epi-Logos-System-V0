# GraphQL Resolvers for Coordinate Resolution
from ariadne import QueryType, UnionType, MutationType
from typing import Any, Optional

query = QueryType()
path_component = UnionType("PathComponent")
mutation = MutationType()

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


@mutation.field("createBimbaNode")
def resolve_create_bimba_node(_: Any, info: Any, input: dict) -> dict:
    """Create a Bimba node with admin enforcement.

    Returns a payload with success flag, node (when successful), and errors array.
    """
    user = info.context.get("current_user") if info and info.context else None
    if not user or not getattr(user, "isAdmin", False):
        return {
            "success": False,
            "node": None,
            "errors": [{
                "field": None,
                "message": "Admin privileges required",
                "code": "UNAUTHORIZED_ADMIN",
            }],
        }

    service = info.context["service"]
    try:
        node = service.create_bimba_node(input)
        if node is None:
            return {
                "success": False,
                "node": None,
                "errors": [{
                    "field": "coordinate",
                    "message": "A node with this coordinate already exists",
                    "code": "DUPLICATE_COORDINATE",
                }],
            }
        return {"success": True, "node": node.model_dump(), "errors": []}
    except ValueError as ve:
        return {
            "success": False,
            "node": None,
            "errors": [{
                "field": None,
                "message": str(ve),
                "code": "INVALID_INPUT",
            }],
        }
    except Exception:
        # Do not leak internals; classify as INVALID_INPUT for now
        return {
            "success": False,
            "node": None,
            "errors": [{
                "field": None,
                "message": "Creation failed",
                "code": "INVALID_INPUT",
            }],
        }


@query.field("semanticCoordinateDiscovery")
def resolve_semantic_coordinate_discovery(_: Any, info: Any, queryText: str, maxResults: Optional[int] = 5) -> list[dict]:
    """Semantic-to-coordinate discovery using vector similarity search.

    - Accepts natural language text and optional maxResults (default 5, capped at 20)
    - Returns ranked BimbaCoordinateMatch objects
    """
    service = info.context["service"]
    try:
        return service.semantic_coordinate_discovery(queryText, maxResults)
    except Exception:
        # On error, return empty list to avoid leaking internals via GraphQL errors
        return []


@mutation.field("regenerateNodeEmbedding")
def resolve_regenerate_node_embedding(_: Any, info: Any, coordinate: str) -> dict:
    """Regenerate embeddings for a single node (admin required)."""
    user = info.context.get("current_user") if info and info.context else None
    if not user or not getattr(user, "isAdmin", False):
        return {
            "success": False,
            "coordinate": coordinate,
            "error": "Admin privileges required",
        }
    service = info.context["service"]
    return service.regenerate_node_embedding(coordinate)


@mutation.field("regenerateAllEmbeddings")
def resolve_regenerate_all_embeddings(_: Any, info: Any, batchSize: Optional[int] = 500, force: Optional[bool] = False) -> dict:
    """Regenerate embeddings for all Bimba nodes in batches (admin required)."""
    user = info.context.get("current_user") if info and info.context else None
    if not user or not getattr(user, "isAdmin", False):
        return {
            "success": False,
            "total": 0,
            "updated": 0,
            "skipped": 0,
            "error": "Admin privileges required",
        }
    service = info.context["service"]
    return service.regenerate_all_embeddings(batch_size=batchSize or 500, force=bool(force))
