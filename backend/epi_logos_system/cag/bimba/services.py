from pydantic import BaseModel
from typing import Optional

# Import from shared database package
from shared.database import Neo4jClient

class BimbaNode(BaseModel):
    coordinate: str
    name: str
    subsystem: Optional[str] = None
    description: Optional[str] = None
    operationalEssence: Optional[str] = None
    coreNature: Optional[str] = None
    function: Optional[str] = None
    symbol: Optional[str] = None
    nodeType: Optional[str] = None
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
                # Handle both coordinate and bimbaCoordinate properties
                coord_value = node_data.get("coordinate") or node_data.get("bimbaCoordinate") or coordinate

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
                    nodeType=node_data.get("nodeType"),
                    uuid=node_data.get("uuid"),
                    createdAt=str(created_at) if created_at else None,
                    updatedAt=str(updated_at) if updated_at else None
                )
            
            # If not found, check if it's a base coordinate we should create
            base_coordinates = {
                "#0": {
                    "name": "Anuttara - Absolute Ground",
                    "subsystem": "0",
                    "description": "The absolute ground of being, the void from which all emerges",
                    "operationalEssence": "Pure potentiality and foundational metacomputation",
                    "coreNature": "Void processing, primordial awareness",
                    "function": "Foundational grounding for all system operations",
                    "symbol": "∅"
                },
                "#1": {
                    "name": "Paramasiva - Foundational Architect",
                    "subsystem": "1",
                    "description": "Universal grammar and structural frameworks",
                    "operationalEssence": "Quaternal logic engine and structural processing",
                    "coreNature": "Architectural consciousness, pattern recognition",
                    "function": "Structural framework generation and logical processing",
                    "symbol": "△"
                },
                "#2": {
                    "name": "Parashakti - Cosmic Imagination",
                    "subsystem": "2",
                    "description": "Vibrational architecture and frequency processing",
                    "operationalEssence": "Vibrational matrix and frequency modulation",
                    "coreNature": "Creative imagination, vibrational consciousness",
                    "function": "Frequency processing and vibrational synthesis",
                    "symbol": "◊"
                },
                "#3": {
                    "name": "Mahamaya - Universal Transcription",
                    "subsystem": "3",
                    "description": "Symbolic processing and DNA/I-Ching translation",
                    "operationalEssence": "Transcription engine and symbolic translation",
                    "coreNature": "Symbolic consciousness, pattern transcription",
                    "function": "Symbol processing and universal translation",
                    "symbol": "☰"
                },
                "#4": {
                    "name": "Nara - Dialogical Identity",
                    "subsystem": "4",
                    "description": "User interaction and oracle operations",
                    "operationalEssence": "Dialogical interface and oracle processing",
                    "coreNature": "Interactive consciousness, dialogical identity",
                    "function": "User interface and oracle operations",
                    "symbol": "◯"
                },
                "#5": {
                    "name": "Epii - Synthesis & Orchestration",
                    "subsystem": "5",
                    "description": "Master orchestration and meta-techne loops",
                    "operationalEssence": "Synthesis layer and orchestration engine",
                    "coreNature": "Orchestrating consciousness, meta-synthesis",
                    "function": "System orchestration and meta-level synthesis",
                    "symbol": "⬟"
                }
            }
            
            if coordinate in base_coordinates:
                coord_info = base_coordinates[coordinate]
                # Create the node in Neo4j for future queries
                try:
                    self.neo4j_client.create_bimba_node(
                        coordinate=coordinate,
                        name=coord_info["name"],
                        subsystem=int(coord_info["subsystem"]),
                        node_type="base_coordinate",
                        description=coord_info["description"],
                        operationalEssence=coord_info["operationalEssence"],
                        coreNature=coord_info["coreNature"],
                        function=coord_info["function"],
                        symbol=coord_info["symbol"]
                    )
                    return BimbaNode(
                        coordinate=coordinate,
                        name=coord_info["name"],
                        subsystem=coord_info["subsystem"],
                        description=coord_info["description"],
                        operationalEssence=coord_info["operationalEssence"],
                        coreNature=coord_info["coreNature"],
                        function=coord_info["function"],
                        symbol=coord_info["symbol"],
                        nodeType="base_coordinate"
                    )
                except Exception as create_error:
                    print(f"Error creating base coordinate {coordinate}: {create_error}")
                    # Return the data anyway even if creation fails
                    return BimbaNode(
                        coordinate=coordinate,
                        name=coord_info["name"],
                        subsystem=coord_info["subsystem"],
                        description=coord_info["description"],
                        operationalEssence=coord_info["operationalEssence"],
                        coreNature=coord_info["coreNature"],
                        function=coord_info["function"],
                        symbol=coord_info["symbol"],
                        nodeType="base_coordinate"
                    )
            
            return None
            
        except Exception as e:
            print(f"Error querying Neo4j for coordinate {coordinate}: {e}")
            return None

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
            neighbor_coord = neighbor.get("coordinate") or neighbor.get("bimbaCoordinate")
            neighbor_dict = {
                "coordinate": neighbor_coord,
                "name": neighbor.get("name"),
                "subsystem": str(neighbor.get("subsystem")) if neighbor.get("subsystem") is not None else None,
                "description": neighbor.get("description"),
                "operationalEssence": neighbor.get("operationalEssence"),
                "coreNature": neighbor.get("coreNature"),
                "function": neighbor.get("function"),
                "symbol": neighbor.get("symbol"),
                "nodeType": neighbor.get("nodeType"),
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

# FastAPI dependency provider
def get_node_service() -> NodeService:
    # Initialize Neo4j client with environment configuration
    neo4j_client = Neo4jClient()
    repo = NodeRepository(neo4j_client=neo4j_client)
    return NodeService(repo=repo)
