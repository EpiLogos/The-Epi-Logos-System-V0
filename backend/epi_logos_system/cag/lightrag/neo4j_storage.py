"""
Neo4j Workspace Storage for LightRAG
"""

from lightrag.base import BaseGraphStorage
from neo4j import GraphDatabase
import os
from typing import Optional, Dict, Any


class WorkspaceNeo4JStorage(BaseGraphStorage):
    """Neo4j storage with workspace isolation"""
    
    def __init__(self, workspace: str, **kwargs):
        # Get connection config from environment
        config = self._get_config()
        super().__init__(**config, **kwargs)
        self.workspace = workspace
        self.workspace_label = f"LightRAG_{workspace}"
    
    def _get_config(self) -> Dict[str, Any]:
        """Get Neo4j connection from environment"""
        return {
            "uri": os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            "username": os.getenv("NEO4J_USERNAME", "neo4j"), 
            "password": os.getenv("NEO4J_PASSWORD"),
            "database": os.getenv("NEO4J_DATABASE", "neo4j")
        }
    
    def create_constraints(self):
        """Create workspace-specific constraints"""
        constraints = [
            f"CREATE CONSTRAINT lightrag_{self.workspace}_entity_name IF NOT EXISTS FOR (n:{self.workspace_label}) REQUIRE n.name IS UNIQUE",
            f"CREATE INDEX lightrag_{self.workspace}_type IF NOT EXISTS FOR (n:{self.workspace_label}) ON (n.type)",
            f"CREATE INDEX lightrag_{self.workspace}_coordinate IF NOT EXISTS FOR (n:{self.workspace_label}) ON (n.source_coordinate)"
        ]
        
        config = self._get_config()
        with GraphDatabase.driver(**config) as driver:
            with driver.session() as session:
                for constraint in constraints:
                    try:
                        session.run(constraint)
                        print(f"Created constraint: {constraint}")
                    except Exception as e:
                        print(f"Constraint creation warning: {e}")
    
    def create_entity(self, name: str, entity_type: str, **properties):
        """Create entity with workspace label"""
        properties["workspace"] = self.workspace
        query = f"""
        CREATE (e:Entity:{self.workspace_label} {{
            name: $name,
            type: $entity_type,
            workspace: $workspace,
            created_at: datetime()
        }})
        SET e += $properties
        RETURN e
        """
        
        params = {
            "name": name,
            "entity_type": entity_type,
            "workspace": self.workspace,
            "properties": properties
        }
        
        return self.execute_query(query, params)
    
    def execute_query(self, query: str, parameters: Optional[Dict] = None):
        """Execute Neo4j query with workspace context"""
        config = self._get_config()
        with GraphDatabase.driver(**config) as driver:
            with driver.session() as session:
                result = session.run(query, parameters or {})
                return [record for record in result]