#!/usr/bin/env python3
"""
Database initialization script for the Epi-Logos System.

This script initializes all databases with proper schemas, indexes,
and seed data for development and testing.
"""

import os
import sys
import logging
import asyncio
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.database import Neo4jClient, MongoDBClient, RedisClient, QdrantClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init_neo4j():
    """Initialize Neo4j with constraints and indexes."""
    logger.info("Initializing Neo4j...")
    
    try:
        with Neo4jClient() as client:
            if not client.test_connection():
                logger.warning("Neo4j connection failed - skipping initialization")
                return False
            
            # Create constraints for unique properties
            constraints = [
                "CREATE CONSTRAINT bimba_coordinate IF NOT EXISTS FOR (n:Bimba) REQUIRE n.coordinate IS UNIQUE",
                "CREATE CONSTRAINT concept_coordinate IF NOT EXISTS FOR (n:Concept) REQUIRE n.coordinate IS UNIQUE",
                "CREATE CONSTRAINT lightrag_entity_name IF NOT EXISTS FOR (n:LightRAG) REQUIRE n.name IS UNIQUE",
                "CREATE CONSTRAINT graphiti_episode_id IF NOT EXISTS FOR (n:Graphiti) REQUIRE n.id IS UNIQUE"
            ]
            
            for constraint in constraints:
                try:
                    client.execute_query(constraint)
                    logger.info(f"Created constraint: {constraint.split('FOR')[1].split('REQUIRE')[0].strip()}")
                except Exception as e:
                    logger.warning(f"Constraint creation failed (may already exist): {e}")
            
            # Create indexes for performance
            indexes = [
                "CREATE INDEX bimba_subsystem IF NOT EXISTS FOR (n:Bimba) ON (n.subsystem)",
                "CREATE INDEX bimba_node_type IF NOT EXISTS FOR (n:Bimba) ON (n.nodeType)",
                "CREATE INDEX lightrag_type IF NOT EXISTS FOR (n:LightRAG) ON (n.type)",
                "CREATE INDEX lightrag_source IF NOT EXISTS FOR (n:LightRAG) ON (n.source_document)",
                "CREATE INDEX graphiti_user IF NOT EXISTS FOR (n:Graphiti) ON (n.user_id)",
                "CREATE INDEX graphiti_date IF NOT EXISTS FOR (n:Graphiti) ON (n.date)"
            ]
            
            for index in indexes:
                try:
                    client.execute_query(index)
                    logger.info(f"Created index: {index.split('FOR')[1].split('ON')[0].strip()}")
                except Exception as e:
                    logger.warning(f"Index creation failed (may already exist): {e}")
            
            logger.info("Neo4j initialization completed")
            return True
            
    except Exception as e:
        logger.error(f"Neo4j initialization failed: {e}")
        return False


async def init_mongodb():
    """Initialize MongoDB with collections and indexes."""
    logger.info("Initializing MongoDB...")
    
    try:
        with MongoDBClient() as client:
            if not client.test_connection():
                logger.warning("MongoDB connection failed - skipping initialization")
                return False
            
            # Create indexes
            client.create_indexes()
            logger.info("MongoDB indexes created")
            
            # Create sample collections if they don't exist
            db = client.get_database()
            
            collections = ["user_profiles", "personal_pratibimba", "wisdom_packets"]
            for collection_name in collections:
                if collection_name not in db.list_collection_names():
                    db.create_collection(collection_name)
                    logger.info(f"Created collection: {collection_name}")
            
            logger.info("MongoDB initialization completed")
            return True
            
    except Exception as e:
        logger.error(f"MongoDB initialization failed: {e}")
        return False


async def init_redis():
    """Initialize Redis with basic configuration."""
    logger.info("Initializing Redis...")
    
    try:
        with RedisClient() as client:
            if not client.test_connection():
                logger.warning("Redis connection failed - skipping initialization")
                return False
            
            # Test basic operations
            client.set("init:test", "success", ex=60)
            test_value = client.get("init:test")
            
            if test_value == "success":
                logger.info("Redis basic operations verified")
                client.delete("init:test")
            
            # Create test streams for event system
            test_streams = ["system:events", "wisdom:events", "user:events"]
            for stream in test_streams:
                try:
                    client.publish_event(stream, {
                        "event_type": "INITIALIZATION",
                        "message": "Database initialization",
                        "source": "init_script"
                    })
                    logger.info(f"Created test stream: {stream}")
                except Exception as e:
                    logger.warning(f"Stream creation failed: {e}")
            
            logger.info("Redis initialization completed")
            return True
            
    except Exception as e:
        logger.error(f"Redis initialization failed: {e}")
        return False


async def init_qdrant():
    """Initialize Qdrant with collections for vector search."""
    logger.info("Initializing Qdrant...")
    
    try:
        with QdrantClient() as client:
            if not client.test_connection():
                logger.warning("Qdrant connection failed - skipping initialization")
                return False
            
            # Create standard collections
            collections_config = [
                {"name": "wisdom_synthesis", "size": 384, "distance": "Cosine"},
                {"name": "lightrag_vectors", "size": 384, "distance": "Cosine"},
                {"name": "bimba_embeddings", "size": 384, "distance": "Cosine"},
                {"name": "user_content", "size": 384, "distance": "Cosine"}
            ]
            
            for config in collections_config:
                try:
                    if client.create_collection(
                        collection_name=config["name"],
                        vector_size=config["size"],
                        distance=config["distance"]
                    ):
                        logger.info(f"Created Qdrant collection: {config['name']}")
                    else:
                        logger.warning(f"Failed to create collection: {config['name']}")
                except Exception as e:
                    logger.warning(f"Collection creation failed (may already exist): {e}")
            
            logger.info("Qdrant initialization completed")
            return True
            
    except Exception as e:
        logger.error(f"Qdrant initialization failed: {e}")
        return False


async def main():
    """Main initialization function."""
    logger.info("Starting database initialization...")
    
    results = {
        "neo4j": await init_neo4j(),
        "mongodb": await init_mongodb(),
        "redis": await init_redis(),
        "qdrant": await init_qdrant()
    }
    
    logger.info("Database initialization summary:")
    for db, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        logger.info(f"  {db.upper()}: {status}")
    
    total_success = sum(results.values())
    total_databases = len(results)
    
    logger.info(f"Initialization completed: {total_success}/{total_databases} databases initialized")
    
    if total_success == total_databases:
        logger.info("🎉 All databases initialized successfully!")
        return 0
    else:
        logger.warning("⚠️  Some databases failed to initialize")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
