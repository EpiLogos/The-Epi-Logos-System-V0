# GraphQL Resolvers for Coordinate Resolution
from ariadne import QueryType
from typing import Any

query = QueryType()

@query.field("getNodeByCoordinate")
def resolve_get_node_by_coordinate(_: Any, info: Any, coordinate: str) -> dict | None:
    # This is the "thin" resolver layer.
    # It just orchestrates the call to the business logic.
    node_service = info.context["service"]
    node = node_service.get_node(coordinate)
    
    # Transform the Pydantic model into a dictionary for GraphQL.
    return node.model_dump() if node else None