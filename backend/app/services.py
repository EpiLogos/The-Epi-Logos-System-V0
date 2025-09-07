from pydantic import BaseModel
from typing import Optional

# Import from shared database package
from shared.database import Neo4jClient

class BimbaNode(BaseModel):
    coordinate: str
    name: str
    subsystem: str | None = None

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
                return BimbaNode(
                    coordinate=coord_value,
                    name=node_data["name"],
                    subsystem=str(node_data.get("subsystem", "unknown"))
                )
            
            # If not found, check if it's a base coordinate we should create
            base_coordinates = {
                "#0": {"name": "Anuttara - Absolute Ground", "subsystem": "0"},
                "#1": {"name": "Paramasiva - Foundational Architect", "subsystem": "1"},
                "#2": {"name": "Parashakti - Cosmic Imagination", "subsystem": "2"},
                "#3": {"name": "Mahamaya - Universal Transcription", "subsystem": "3"},
                "#4": {"name": "Nara - Dialogical Identity", "subsystem": "4"},
                "#5": {"name": "Epii - Synthesis & Orchestration", "subsystem": "5"}
            }
            
            if coordinate in base_coordinates:
                coord_info = base_coordinates[coordinate]
                # Create the node in Neo4j for future queries
                try:
                    self.neo4j_client.create_bimba_node(
                        coordinate=coordinate,
                        name=coord_info["name"],
                        subsystem=int(coord_info["subsystem"]),
                        node_type="base_coordinate"
                    )
                    return BimbaNode(
                        coordinate=coordinate,
                        name=coord_info["name"],
                        subsystem=coord_info["subsystem"]
                    )
                except Exception as create_error:
                    print(f"Error creating base coordinate {coordinate}: {create_error}")
                    # Return the data anyway even if creation fails
                    return BimbaNode(
                        coordinate=coordinate,
                        name=coord_info["name"],
                        subsystem=coord_info["subsystem"]
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

# FastAPI dependency provider
def get_node_service() -> NodeService:
    # Initialize Neo4j client with environment configuration
    neo4j_client = Neo4jClient()
    repo = NodeRepository(neo4j_client=neo4j_client)
    return NodeService(repo=repo)