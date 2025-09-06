#!/usr/bin/env python3
"""
Graphiti database initialization script.

This script sets up the Neo4j database constraints and indexes needed
for the Graphiti MCP Foundation service with proper namespace isolation.
"""

import os
import sys
import logging
from typing import List

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database.neo4j_client import Neo4jClient


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_graphiti_constraints(client: Neo4jClient) -> List[str]:
    """Create constraints for Graphiti episodic memory data."""
    constraints = [
        # Episode constraints
        "CREATE CONSTRAINT episode_id_unique IF NOT EXISTS FOR (ep:Episode) REQUIRE ep.id IS UNIQUE",
        "CREATE CONSTRAINT episode_graphiti_id_unique IF NOT EXISTS FOR (ep:Episode:Graphiti) REQUIRE ep.id IS UNIQUE",
        
        # Community constraints
        "CREATE CONSTRAINT community_id_unique IF NOT EXISTS FOR (c:Community) REQUIRE c.id IS UNIQUE",
        "CREATE CONSTRAINT community_graphiti_id_unique IF NOT EXISTS FOR (c:Community:Graphiti) REQUIRE c.id IS UNIQUE",
        
        # Group ID constraints for multi-tenancy
        "CREATE CONSTRAINT episode_group_id_not_null IF NOT EXISTS FOR (ep:Episode:Graphiti) REQUIRE ep.group_id IS NOT NULL",
        "CREATE CONSTRAINT community_group_id_not_null IF NOT EXISTS FOR (c:Community:Graphiti) REQUIRE c.group_id IS NOT NULL"
    ]
    
    created = []
    for constraint in constraints:
        try:
            client.execute_query(constraint)
            created.append(constraint)
            logger.info(f"Created constraint: {constraint}")
        except Exception as e:
            if "already exists" in str(e).lower() or "equivalent constraint already exists" in str(e).lower():
                logger.info(f"Constraint already exists: {constraint}")
            else:
                logger.error(f"Error creating constraint: {e}")
    
    return created


def create_graphiti_indexes(client: Neo4jClient) -> List[str]:
    """Create indexes for Graphiti episodic memory queries."""
    indexes = [
        # Episode indexes
        "CREATE INDEX episode_group_id IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.group_id)",
        "CREATE INDEX episode_type IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.episode_type)",
        "CREATE INDEX episode_user_id IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.user_id)",
        "CREATE INDEX episode_session_id IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.session_id)",
        "CREATE INDEX episode_agent_id IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.agent_id)",
        "CREATE INDEX episode_occurred_at IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.occurred_at)",
        "CREATE INDEX episode_ingested_at IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.ingested_at)",
        
        # Community indexes
        "CREATE INDEX community_group_id IF NOT EXISTS FOR (c:Community:Graphiti) ON (c.group_id)",
        "CREATE INDEX community_quaternary_position IF NOT EXISTS FOR (c:Community:Graphiti) ON (c.quaternary_position)",
        "CREATE INDEX community_context_frame_type IF NOT EXISTS FOR (c:Community:Graphiti) ON (c.context_frame_type)",
        "CREATE INDEX community_formed_at IF NOT EXISTS FOR (c:Community:Graphiti) ON (c.formed_at)",
        
        # Full-text search indexes
        "CREATE FULLTEXT INDEX episode_content_search IF NOT EXISTS FOR (ep:Episode:Graphiti) ON EACH [ep.content]",
        "CREATE FULLTEXT INDEX community_name_search IF NOT EXISTS FOR (c:Community:Graphiti) ON EACH [c.name]",
        
        # Composite indexes for common query patterns
        "CREATE INDEX episode_group_session IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.group_id, ep.session_id)",
        "CREATE INDEX episode_group_agent IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.group_id, ep.agent_id)",
        "CREATE INDEX episode_group_type_time IF NOT EXISTS FOR (ep:Episode:Graphiti) ON (ep.group_id, ep.episode_type, ep.occurred_at)"
    ]
    
    created = []
    for index in indexes:
        try:
            client.execute_query(index)
            created.append(index)
            logger.info(f"Created index: {index}")
        except Exception as e:
            if "already exists" in str(e).lower() or "equivalent index already exists" in str(e).lower():
                logger.info(f"Index already exists: {index}")
            else:
                logger.error(f"Error creating index: {e}")
    
    return created


def verify_graphiti_setup(client: Neo4jClient) -> bool:
    """Verify that Graphiti database setup is working correctly."""
    try:
        # Test creating a sample episode
        test_query = """
        CREATE (ep:Episode:Graphiti {
            id: 'test-episode-init',
            group_id: 'test-group',
            episode_type: 'user_session',
            content: 'Test episode for database initialization',
            occurred_at: datetime(),
            ingested_at: datetime(),
            workspace_id: 'episodic'
        })
        RETURN ep.id as created_id
        """
        
        records, _, _ = client.execute_query(test_query)
        if records and records[0]['created_id'] == 'test-episode-init':
            logger.info("Successfully created test episode")
            
            # Clean up test episode
            cleanup_query = "MATCH (ep:Episode:Graphiti {id: 'test-episode-init'}) DELETE ep"
            client.execute_query(cleanup_query)
            logger.info("Cleaned up test episode")
            
            return True
        else:
            logger.error("Failed to create test episode")
            return False
            
    except Exception as e:
        logger.error(f"Error verifying Graphiti setup: {e}")
        return False


def init_graphiti_database():
    """Initialize Graphiti database with constraints, indexes, and verification."""
    logger.info("Starting Graphiti database initialization...")
    
    # Initialize Neo4j client
    client = Neo4jClient()
    
    # Test connection
    if not client.test_connection():
        logger.error("Failed to connect to Neo4j. Check configuration.")
        sys.exit(1)
    
    logger.info("Connected to Neo4j successfully")
    
    try:
        # Create constraints
        logger.info("Creating Graphiti constraints...")
        constraints_created = create_graphiti_constraints(client)
        logger.info(f"Created {len(constraints_created)} constraints")
        
        # Create indexes
        logger.info("Creating Graphiti indexes...")
        indexes_created = create_graphiti_indexes(client)
        logger.info(f"Created {len(indexes_created)} indexes")
        
        # Verify setup
        logger.info("Verifying Graphiti setup...")
        if verify_graphiti_setup(client):
            logger.info("✅ Graphiti database initialization completed successfully!")
            
            # Print summary
            print("\n" + "="*60)
            print("GRAPHITI DATABASE INITIALIZATION SUMMARY")
            print("="*60)
            print(f"Neo4j URI: {client.uri}")
            print(f"Database: {client.database}")
            print(f"Constraints created: {len(constraints_created)}")
            print(f"Indexes created: {len(indexes_created)}")
            print("Status: ✅ READY")
            print("\nThe Graphiti MCP Foundation service is ready to use!")
            print("="*60)
            
        else:
            logger.error("❌ Graphiti database verification failed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"Error during Graphiti database initialization: {e}")
        sys.exit(1)
    
    finally:
        client.close()


if __name__ == "__main__":
    init_graphiti_database()