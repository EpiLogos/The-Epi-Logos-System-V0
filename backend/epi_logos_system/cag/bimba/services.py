from pydantic import BaseModel
from typing import Optional

# Import from shared database package
from shared.database import Neo4jClient
import os

class BimbaNode(BaseModel):
    coordinate: str
    name: str
    subsystem: Optional[str] = None
    description: Optional[str] = None
    operationalEssence: Optional[str] = None
    coreNature: Optional[str] = None
    function: Optional[str] = None
    symbol: Optional[str] = None
    uuid: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None

# Real Neo4j repository
class NodeRepository:
    def __init__(self, neo4j_client: Neo4jClient):
        self.neo4j_client = neo4j_client
    
    def find_by_coordinate(self, coordinate: str) -> BimbaNode | None:
        print(f"Neo4j: Querying for coordinate {coordinate}")
        
        try:
            # Query Neo4j for Bimba coordinate
            node_data = self.neo4j_client.get_bimba_node(coordinate)
            
            if node_data:
                # Always map from bimbaCoordinate
                coord_value = node_data.get("bimbaCoordinate")

                # Convert datetime objects to strings if present
                created_at = node_data.get("created_at")
                updated_at = node_data.get("updated_at")
                if created_at and hasattr(created_at, 'isoformat'):
                    created_at = created_at.isoformat()
                if updated_at and hasattr(updated_at, 'isoformat'):
                    updated_at = updated_at.isoformat()

                return BimbaNode(
                    coordinate=coord_value,
                    name=node_data["name"],
                    subsystem=str(node_data.get("subsystem", "unknown")),
                    description=node_data.get("description"),
                    operationalEssence=node_data.get("operationalEssence"),
                    coreNature=node_data.get("coreNature"),
                    function=node_data.get("function"),
                    symbol=node_data.get("symbol"),
                    uuid=node_data.get("uuid"),
                    createdAt=str(created_at) if created_at else None,
                    updatedAt=str(updated_at) if updated_at else None
                )
            
            # Not found; do not create nodes implicitly (read paths are pure)
            return None
            
        except Exception as e:
            print(f"Error querying Neo4j for coordinate {coordinate}: {e}")
            return None

    def find_shortest_path(self, start: str, end: str, hops: int) -> tuple[list[dict], list[dict]]:
        """Find shortest path nodes and relationships between two coordinates.

        Returns (nodes, relationships), or ([], []) if not found.
        """
        # Build Cypher with literal hop bound (never parameterized)
        # Anchored strictly by bimbaCoordinate
        query = f"""
        MATCH (start:BimbaNode {{ bimbaCoordinate: $start }})
        MATCH (end:BimbaNode {{ bimbaCoordinate: $end }})
        CALL {{
          WITH start, end
          MATCH p = shortestPath((start)-[*1..{hops}]-(end))
          RETURN p LIMIT 1
        }}
        RETURN 
          nodes(p) AS nodes,
          [i IN range(0, size(relationships(p))-1) |
            {{
              type: type(relationships(p)[i]),
              direction: CASE WHEN startNode(relationships(p)[i]) = nodes(p)[i] THEN 'OUTGOING' ELSE 'INCOMING' END,
              properties: properties(relationships(p)[i])
            }}
          ] AS rels
        """

        records, _summary, _keys = self.neo4j_client.execute_query(
            query, {"start": start, "end": end}
        )

        if not records:
            return [], []
        rec = records[0]
        nodes = [dict(n) for n in rec.get("nodes", [])]
        rels = [dict(r) for r in rec.get("rels", [])]
        return nodes, rels

# The service that uses the repository
class NodeService:
    def __init__(self, repo: NodeRepository):
        self._repo = repo

    def get_node(self, coordinate: str) -> BimbaNode | None:
        return self._repo.find_by_coordinate(coordinate=coordinate)

    def get_node_relationships(self, coordinate: str) -> dict | None:
        """Return a node bundled with its immediate relationship edges.

        Uses the shared Neo4j client to fetch both the node and all direct
        incoming/outgoing relationships, formatting the result to match the
        GraphQL schema NodeWithEdges shape.
        """
        # First, resolve the node itself
        node = self.get_node(coordinate)
        if not node:
            return None

        # Fetch relationships via Neo4j client helper
        edges_raw = self._repo.neo4j_client.get_bimba_node_relationships(coordinate)

        # Transform raw edges into GraphQL-friendly structures
        edges: list[dict] = []
        for edge in edges_raw:
            neighbor = edge.get("neighbor", {})

            # Normalize coordinate field to always be present
            neighbor_coord = neighbor.get("bimbaCoordinate")
            neighbor_dict = {
                "coordinate": neighbor_coord,
                "name": neighbor.get("name"),
                "subsystem": str(neighbor.get("subsystem")) if neighbor.get("subsystem") is not None else None,
                "description": neighbor.get("description"),
                "operationalEssence": neighbor.get("operationalEssence"),
                "coreNature": neighbor.get("coreNature"),
                "function": neighbor.get("function"),
                "symbol": neighbor.get("symbol"),
                "uuid": neighbor.get("uuid"),
                "createdAt": str(neighbor.get("created_at")) if neighbor.get("created_at") else None,
                "updatedAt": str(neighbor.get("updated_at")) if neighbor.get("updated_at") else None,
            }

            # Flatten relationship properties into key-value array
            rel_props = edge.get("properties", {}) or {}
            properties_list = [
                {"key": k, "value": rel_props[k] if rel_props[k] is not None else None}
                for k in rel_props
            ]

            edges.append(
                {
                    "type": edge.get("type"),
                    "direction": edge.get("direction"),
                    "neighbor": neighbor_dict,
                    "properties": properties_list,
                }
            )

        return {
            "node": node.model_dump(),
            "edges": edges,
        }

    def get_path_between_coordinates(self, start_coordinate: str, end_coordinate: str, max_hops: Optional[int] = None) -> dict | None:
        """Return ordered path structure between two coordinates.

        Validates maxHops (>=1 and <= safety cap) and formats components.
        """
        # Determine default and safety cap from environment
        default_hops = int(os.getenv("BIMBA_MAX_HOPS_DEFAULT", "5"))
        cap_hops = int(os.getenv("BIMBA_MAX_HOPS_CAP", "10"))
        hops = default_hops if max_hops is None else int(max_hops)
        if hops < 1:
            raise ValueError("maxHops must be >= 1")
        if hops > cap_hops:
            raise ValueError(f"maxHops exceeds safety cap {cap_hops}")

        nodes, rels = self._repo.find_shortest_path(start_coordinate, end_coordinate, hops)
        if not nodes:
            return None

        components: list[dict] = []
        for idx, n in enumerate(nodes):
            components.append(
                {
                    "coordinate": n.get("bimbaCoordinate"),
                    "name": n.get("name"),
                    "subsystem": str(n.get("subsystem")) if n.get("subsystem") is not None else None,
                    "position": idx * 2,
                }
            )
            if idx < len(rels):
                r = rels[idx]
                props = r.get("properties") or {}
                props_list = [{"key": k, "value": props[k] if props[k] is not None else None} for k in props]
                components.append(
                    {
                        "type": r.get("type") or r.get("_type") or r.get("label") or "RELATED_TO",
                        "direction": r.get("direction") or "OUTGOING",
                        "properties": props_list,
                        "position": idx * 2 + 1,
                    }
                )

        start_node = nodes[0]
        end_node = nodes[-1]
        return {
            "startNode": {
                "coordinate": start_node.get("bimbaCoordinate"),
                "name": start_node.get("name"),
                "subsystem": str(start_node.get("subsystem")) if start_node.get("subsystem") is not None else None,
            },
            "endNode": {
                "coordinate": end_node.get("bimbaCoordinate"),
                "name": end_node.get("name"),
                "subsystem": str(end_node.get("subsystem")) if end_node.get("subsystem") is not None else None,
            },
            "pathLength": len(nodes) - 1,
            "pathComponents": components,
        }

# FastAPI dependency provider
def get_node_service() -> NodeService:
    # Initialize Neo4j client with environment configuration
    neo4j_client = Neo4jClient()
    repo = NodeRepository(neo4j_client=neo4j_client)
    return NodeService(repo=repo)
