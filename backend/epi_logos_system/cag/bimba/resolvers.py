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

@query.field("getNodeDetailsComplete")
def resolve_get_node_details_complete(
    _: Any, info: Any, coordinate: str, includeFunctionalProperties: bool = False
) -> dict | None:
    """Resolve complete node with selective property filtering via Generic scalar.

    Returns BimbaNodeComplete with allProperties containing properties
    from Neo4j. By default filters out f_* prefixed functional properties,
    embeddings metadata, and internal timestamps. Enables agents to access
    any property without knowing field names beforehand.

    Args:
        coordinate: Bimba coordinate to retrieve
        includeFunctionalProperties: If True, include f_* functional properties
    """
    node_service = info.context["service"]
    return node_service.get_node_complete(coordinate, includeFunctionalProperties)

@query.field("getNodeByCoordinateExtended")
def resolve_get_node_by_coordinate_extended(_: Any, info: Any, coordinate: str) -> dict | None:
    """Resolve extended node with complete property set for comprehensive inspection.

    Returns BimbaNodeExtended with all flexible schema properties including
    principle arrays, internal structure, operational details, and relationships.
    """
    node_service = info.context["service"]
    node_data = node_service.get_node_extended(coordinate)

    if not node_data:
        return None

    # Map Neo4j properties to GraphQL BimbaNodeExtended schema
    return {
        "coordinate": node_data.get("bimbaCoordinate"),
        "name": node_data.get("name"),
        "subsystem": str(node_data.get("subsystem")) if node_data.get("subsystem") is not None else None,
        "primaryDesignation": node_data.get("primaryDesignation"),
        "coreNature": node_data.get("coreNature"),
        "architecturalFunction": node_data.get("architecturalFunction"),
        "internalStructure": node_data.get("internalStructure"),
        "keyPrinciples": node_data.get("keyPrinciples"),
        "resonances": node_data.get("resonances"),
        "practicalApplications": node_data.get("practicalApplications"),
        "operationalEssence": node_data.get("operationalEssence"),
        "accessLevel": node_data.get("accessLevel"),
        "consciousnessStructure": node_data.get("consciousnessStructure"),
        "operationalSymbolics": node_data.get("operationalSymbolics"),
        "relatedCoordinates": node_data.get("relatedCoordinates"),
        "lastUpdated": str(node_data.get("lastUpdated")) if node_data.get("lastUpdated") else None,
        "description": node_data.get("description"),
        "function": node_data.get("function"),
        "symbol": node_data.get("symbol"),
        "uuid": node_data.get("uuid"),
        "createdAt": str(node_data.get("created_at")) if node_data.get("created_at") else None,
        "updatedAt": str(node_data.get("updated_at")) if node_data.get("updated_at") else None,
    }

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
def resolve_semantic_coordinate_discovery(_: Any, info: Any, queryText: str, maxResults: Optional[int] = 7, alpha: Optional[float] = None) -> list[dict]:
    """Semantic-to-coordinate discovery using vector similarity search.

    - Accepts natural language text and optional maxResults (default 7 for mod6 QL alignment, capped at 20)
    - Default 7 enables parent + complete mod6 children (e.g., #1 + #1-0 through #1-5)
    - Returns ranked BimbaCoordinateMatch objects
    """
    service = info.context["service"]
    try:
        return service.semantic_coordinate_discovery(queryText, maxResults, alpha)
    except Exception:
        # On error, return empty list to avoid leaking internals via GraphQL errors
        return []

@query.field("lexicalCoordinateSearch")
def resolve_lexical_coordinate_search(_: Any, info: Any, searchString: str, limit: Optional[int] = None) -> dict:
    """Lexical substring search across all BimbaNode properties.

    Direct property iteration for exact substring matching when semantic/fulltext search fails.
    Finds substrings like 'Iti' in 'My-Self/Iti'. Heavier query but more precise.

    Args:
        searchString: String to search for in any property
        limit: Max results (default 20, capped at 50)

    Returns:
        LexicalSearchResponse with success flag and results list
    """
    service = info.context["service"]
    try:
        results = service.lexical_coordinate_search(searchString, limit)
        return {
            "success": True,
            "results": results,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "results": [],
            "error": str(e)
        }


@query.field("directChildren")
def resolve_direct_children(_: Any, info: Any, bimbaCoordinate: str) -> dict:
    """Get direct child nodes of a Bimba coordinate.

    Returns lean data (name, coordinate, primaryDesignation, description) for hierarchical children.

    Args:
        bimbaCoordinate: Parent coordinate to find children for

    Returns:
        DirectChildrenResponse with success flag and children list
    """
    service = info.context["service"]
    try:
        children = service.get_direct_children(bimbaCoordinate)
        return {
            "success": True,
            "children": children,
            "error": None
        }
    except Exception as e:
        return {
            "success": False,
            "children": [],
            "error": str(e)
        }


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


@mutation.field("createBimbaRelationship")
def resolve_create_bimba_relationship(_: Any, info: Any, input: dict) -> dict:
    """Create or update a relationship between Bimba nodes (admin required).

    Returns payload with success flag, relationship data (when successful), wasUpdate flag, and errors array.
    """
    user = info.context.get("current_user") if info and info.context else None
    if not user or not getattr(user, "isAdmin", False):
        return {
            "success": False,
            "relationship": None,
            "reverseRelationship": None,
            "wasUpdate": False,
            "errors": [{
                "field": None,
                "message": "Admin privileges required",
                "code": "UNAUTHORIZED_ADMIN",
            }],
        }

    from_coord = input.get("fromCoordinate")
    to_coord = input.get("toCoordinate")
    rel_type = input.get("relationshipType")

    if not from_coord or not to_coord or not rel_type:
        return {
            "success": False,
            "relationship": None,
            "reverseRelationship": None,
            "wasUpdate": False,
            "errors": [{
                "field": None,
                "message": "fromCoordinate, toCoordinate, and relationshipType are required",
                "code": "MISSING_REQUIRED_FIELDS",
            }],
        }

    service = info.context["service"]
    try:
        properties = input.get("properties", [])
        bidirectional = input.get("bidirectional", False)

        result = service.create_bimba_relationship(
            from_coordinate=from_coord,
            to_coordinate=to_coord,
            relationship_type=rel_type,
            properties=properties,
            bidirectional=bidirectional
        )

        # Invalidate embeddings for both nodes (relationships now part of embedding context)
        service.invalidate_node_embedding(from_coord)
        service.invalidate_node_embedding(to_coord)

        # Map forward relationship to GraphQL schema
        forward_rel = result.get("forward", {})
        relationship_response = {
            "type": rel_type,
            "fromCoordinate": forward_rel.get("fromCoordinate"),
            "toCoordinate": forward_rel.get("toCoordinate"),
            "properties": [
                {"key": k, "value": str(v)}
                for k, v in forward_rel.items()
                if k not in ["fromCoordinate", "toCoordinate", "createdAt", "updatedAt", "bidirectionalPair"]
            ],
            "createdAt": str(forward_rel.get("createdAt")) if forward_rel.get("createdAt") else None,
            "updatedAt": str(forward_rel.get("updatedAt")) if forward_rel.get("updatedAt") else None,
        }

        # Map reverse relationship if exists
        reverse_response = None
        if result.get("reverse"):
            rev_rel = result["reverse"]
            reverse_response = {
                "type": rel_type,
                "fromCoordinate": rev_rel.get("fromCoordinate"),
                "toCoordinate": rev_rel.get("toCoordinate"),
                "properties": [
                    {"key": k, "value": str(v)}
                    for k, v in rev_rel.items()
                    if k not in ["fromCoordinate", "toCoordinate", "createdAt", "updatedAt", "bidirectionalPair"]
                ],
                "createdAt": str(rev_rel.get("createdAt")) if rev_rel.get("createdAt") else None,
                "updatedAt": str(rev_rel.get("updatedAt")) if rev_rel.get("updatedAt") else None,
            }

        return {
            "success": True,
            "relationship": relationship_response,
            "reverseRelationship": reverse_response,
            "wasUpdate": result.get("wasUpdate", False),
            "errors": []
        }

    except ValueError as ve:
        # Handle coordinate not found or validation errors
        error_code = "COORDINATE_NOT_FOUND" if "not found" in str(ve) else "VALIDATION_ERROR"
        return {
            "success": False,
            "relationship": None,
            "reverseRelationship": None,
            "wasUpdate": False,
            "errors": [{
                "field": None,
                "message": str(ve),
                "code": error_code,
            }],
        }
    except Exception:
        # Do not leak internals
        return {
            "success": False,
            "relationship": None,
            "reverseRelationship": None,
            "wasUpdate": False,
            "errors": [{
                "field": None,
                "message": "Relationship creation failed",
                "code": "RELATIONSHIP_ERROR",
            }],
        }


@mutation.field("updateBimbaNode")
def resolve_update_bimba_node(_: Any, info: Any, input: dict) -> dict:
    """Update an existing Bimba node with flexible schema-based properties (admin required).

    Returns a payload with success flag, updated node (when successful), and errors array.
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

    coordinate = input.get("coordinate")
    if not coordinate:
        return {
            "success": False,
            "node": None,
            "errors": [{
                "field": "coordinate",
                "message": "Coordinate is required",
                "code": "MISSING_COORDINATE",
            }],
        }

    service = info.context["service"]
    try:
        # Remove coordinate from update_data to prevent immutability issues
        update_data = {k: v for k, v in input.items() if k not in ["coordinate", "properties"]}

        # Convert key-value array to dict and merge into update_data
        properties_array = input.get("properties")
        if properties_array and isinstance(properties_array, list):
            # Transform [{key: "foo", value: "bar"}] → {foo: "bar"}
            for prop in properties_array:
                if isinstance(prop, dict) and "key" in prop and "value" in prop:
                    update_data[prop["key"]] = prop["value"]

        updated_node = service.update_bimba_node(coordinate, update_data)

        if updated_node is None:
            return {
                "success": False,
                "node": None,
                "errors": [{
                    "field": "coordinate",
                    "message": "Coordinate not found",
                    "code": "COORDINATE_NOT_FOUND",
                }],
            }

        # Map Neo4j node properties to GraphQL extended schema
        node_response = {
            "coordinate": updated_node.get("bimbaCoordinate"),
            "name": updated_node.get("name"),
            "subsystem": str(updated_node.get("subsystem")) if updated_node.get("subsystem") is not None else None,
            "primaryDesignation": updated_node.get("primaryDesignation"),
            "coreNature": updated_node.get("coreNature"),
            "architecturalFunction": updated_node.get("architecturalFunction"),
            "internalStructure": updated_node.get("internalStructure"),
            "keyPrinciples": updated_node.get("keyPrinciples"),
            "resonances": updated_node.get("resonances"),
            "practicalApplications": updated_node.get("practicalApplications"),
            "operationalEssence": updated_node.get("operationalEssence"),
            "accessLevel": updated_node.get("accessLevel"),
            "consciousnessStructure": updated_node.get("consciousnessStructure"),
            "operationalSymbolics": updated_node.get("operationalSymbolics"),
            "relatedCoordinates": updated_node.get("relatedCoordinates"),
            "lastUpdated": str(updated_node.get("lastUpdated")) if updated_node.get("lastUpdated") else None,
            "description": updated_node.get("description"),
            "function": updated_node.get("function"),
            "symbol": updated_node.get("symbol"),
            "uuid": updated_node.get("uuid"),
            "createdAt": str(updated_node.get("created_at")) if updated_node.get("created_at") else None,
            "updatedAt": str(updated_node.get("updated_at")) if updated_node.get("updated_at") else None,
        }

        return {"success": True, "node": node_response, "errors": []}

    except ValueError as ve:
        return {
            "success": False,
            "node": None,
            "errors": [{
                "field": None,
                "message": str(ve),
                "code": "VALIDATION_ERROR",
            }],
        }
    except Exception:
        # Do not leak internals
        return {
            "success": False,
            "node": None,
            "errors": [{
                "field": None,
                "message": "Update failed",
                "code": "UPDATE_ERROR",
            }],
        }
