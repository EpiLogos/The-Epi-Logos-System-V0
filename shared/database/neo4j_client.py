"""
Neo4j Aura client for unified graph database operations.

This client handles connections to Neo4j Aura cloud and provides
operations for Bimba Map, LightRAG, and Graphiti data with proper
label-based namespacing for service isolation.
"""

import os
import logging
from typing import Dict, List, Any, Optional
from neo4j import GraphDatabase, Driver, Session, Result
from neo4j.exceptions import ServiceUnavailable, AuthError


logger = logging.getLogger(__name__)


class Neo4jClient:
    """Neo4j Aura cloud database client with unified graph support."""
    
    def __init__(self, uri: Optional[str] = None, username: Optional[str] = None, 
                 password: Optional[str] = None, database: Optional[str] = None):
        """Initialize Neo4j client with provided or environment configuration."""
        # Use provided parameters or fall back to environment variables
        self.uri = uri or os.getenv("NEO4J_URI")
        self.username = username or os.getenv("NEO4J_USERNAME", "neo4j")
        self.password = password or os.getenv("NEO4J_PASSWORD")
        self.database = database or os.getenv("NEO4J_DATABASE", "neo4j")
        
        self._driver: Optional[Driver] = None
        
        if not self.uri or not self.password:
            logger.warning("Neo4j configuration incomplete. Some operations may fail.")
    
    @property
    def driver(self) -> Driver:
        """Get or create Neo4j driver instance."""
        if self._driver is None:
            if not self.uri or not self.password:
                raise ValueError("Neo4j URI and password must be configured")
            
            self._driver = GraphDatabase.driver(
                self.uri,
                auth=(self.username, self.password),
                database=self.database
            )
        return self._driver
    
    def test_connection(self) -> bool:
        """Test connection to Neo4j Aura using recommended verify_connectivity method."""
        try:
            # Use the recommended verify_connectivity method for Neo4j Aura
            self.driver.verify_connectivity()
            logger.info("Neo4j connection verified successfully")
            return True
        except (ServiceUnavailable, AuthError) as e:
            logger.error(f"Neo4j connection test failed: {e}")
            logger.error(f"URI: {self.uri}, Username: {self.username}, Database: {self.database}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during Neo4j connection test: {e}")
            logger.error(f"URI: {self.uri}, Username: {self.username}, Database: {self.database}")
            return False
    
    def _is_local_connection(self) -> bool:
        """Check if this is a local Neo4j connection."""
        return self.uri and ('localhost' in self.uri or '127.0.0.1' in self.uri)

    def execute_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> tuple:
        """Execute a Cypher query with compatibility for both local and cloud instances."""
        try:
            # For local connections, use session-based approach to avoid routing issues
            if self._is_local_connection():
                with self.driver.session(database=self.database) as session:
                    result = session.run(query, parameters or {})
                    records = list(result)
                    summary = result.consume()
                    keys = result.keys()
                    return records, summary, keys
            else:
                # For cloud connections, use the recommended driver.execute_query method
                records, summary, keys = self.driver.execute_query(
                    query,
                    parameters or {},
                    database_=self.database
                )
                return records, summary, keys
        except Exception as e:
            logger.error(f"Error executing Neo4j query: {e}")
            raise
    
    # Note: Creation of Bimba nodes is handled by explicit admin/seed services, not generic clients.
    
    def get_bimba_node(self, coordinate: str) -> Optional[Dict[str, Any]]:
        """Get a Bimba Map node by coordinate."""
        # Use defensive querying to handle both property names for backward compatibility
        query = """
        MATCH (n:BimbaNode { bimbaCoordinate: $coordinate })
        RETURN n
        """
        records, _, _ = self.execute_query(query, {"coordinate": coordinate})

        return dict(records[0]["n"]) if records else None

    def get_bimba_node_relationships(self, coordinate: str) -> List[Dict[str, Any]]:
        """Get all direct relationships for a Bimba node identified by coordinate.

        Returns a list of dictionaries with keys: type, direction, neighbor, properties.
        """
        edges: List[Dict[str, Any]] = []

        # Outgoing relationships from the node to neighbors
        outgoing_query = """
        MATCH (n:BimbaNode {bimbaCoordinate: $coordinate})-[r]->(neighbor)
        RETURN type(r) AS rel_type, neighbor AS neighbor, properties(r) AS rel_props
        """

        # Incoming relationships from neighbors to the node
        incoming_query = """
        MATCH (n:BimbaNode {bimbaCoordinate: $coordinate})<- [r] - (neighbor)
        RETURN type(r) AS rel_type, neighbor AS neighbor, properties(r) AS rel_props
        """

        try:
            out_records, _, _ = self.execute_query(outgoing_query, {"coordinate": coordinate})
            for rec in out_records:
                neighbor = dict(rec["neighbor"]) if rec.get("neighbor") is not None else {}
                props = dict(rec["rel_props"]) if rec.get("rel_props") is not None else {}
                edges.append(
                    {
                        "type": rec.get("rel_type"),
                        "direction": "OUTGOING",
                        "neighbor": neighbor,
                        "properties": props,
                    }
                )

            in_records, _, _ = self.execute_query(incoming_query, {"coordinate": coordinate})
            for rec in in_records:
                neighbor = dict(rec["neighbor"]) if rec.get("neighbor") is not None else {}
                props = dict(rec["rel_props"]) if rec.get("rel_props") is not None else {}
                edges.append(
                    {
                        "type": rec.get("rel_type"),
                        "direction": "INCOMING",
                        "neighbor": neighbor,
                        "properties": props,
                    }
                )
        except Exception as e:
            logger.error(f"Error fetching Bimba node relationships for {coordinate}: {e}")
            raise

        return edges
    
    def create_lightrag_entity(self, name: str, entity_type: str, 
                              source_document: str, confidence: float,
                              **properties) -> Dict[str, Any]:
        """Create a LightRAG entity with proper labeling."""
        query = """
        CREATE (e:Entity:LightRAG {
            name: $name,
            type: $entity_type,
            source_document: $source_document,
            confidence: $confidence,
            created_at: datetime()
        })
        SET e += $properties
        RETURN e
        """
        
        records, _, _ = self.execute_query(query, {
            "name": name,
            "entity_type": entity_type,
            "source_document": source_document,
            "confidence": confidence,
            "properties": properties
        })

        return dict(records[0]["e"]) if records else {}
    
    def create_graphiti_episode(self, date: str, content: str, user_id: str,
                               context: str, **properties) -> Dict[str, Any]:
        """Create a Graphiti episodic memory with proper labeling."""
        query = """
        CREATE (ep:Episode:Graphiti {
            date: $date,
            content: $content,
            user_id: $user_id,
            context: $context,
            created_at: datetime()
        })
        SET ep += $properties
        RETURN ep
        """
        
        records, _, _ = self.execute_query(query, {
            "date": date,
            "content": content,
            "user_id": user_id,
            "context": context,
            "properties": properties
        })

        return dict(records[0]["ep"]) if records else {}
    
    def create_cross_service_relationship(self, from_node_query: str, to_node_query: str,
                                        relationship_type: str, **properties) -> bool:
        """Create relationships between different service data."""
        query = f"""
        MATCH (from) WHERE {from_node_query}
        MATCH (to) WHERE {to_node_query}
        CREATE (from)-[r:{relationship_type}]->(to)
        SET r += $properties
        SET r.created_at = datetime()
        RETURN r
        """
        
        try:
            records, _, _ = self.execute_query(query, {"properties": properties})
            return len(records) > 0
        except Exception as e:
            logger.error(f"Error creating cross-service relationship: {e}")
            return False
    
    def search_unified_graph(self, query_params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Search across the unified graph with flexible parameters."""
        # This is a simplified example - real implementation would be more sophisticated
        query = """
        MATCH (n)
        WHERE ($labels IS NULL OR any(label IN $labels WHERE label IN labels(n)))
        AND ($properties IS NULL OR all(key IN keys($properties) WHERE n[key] = $properties[key]))
        RETURN n, labels(n) as node_labels
        LIMIT $limit
        """
        
        result = self.execute_query(query, {
            "labels": query_params.get("labels"),
            "properties": query_params.get("properties"),
            "limit": query_params.get("limit", 100)
        })
        
        return [{"node": dict(record["n"]), "labels": record["node_labels"]} 
                for record in result]
    
    def close(self):
        """Close the Neo4j driver connection."""
        if self._driver:
            self._driver.close()
            self._driver = None
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Context manager exit."""
        _ = exc_type, exc_val, exc_tb  # Suppress unused parameter warnings
        self.close()
