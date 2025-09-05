"""
Database layer for the Epi-Logos System agentic layer.

This module provides database clients for all data storage systems
used by the agentic personas and orchestrator.
"""

# Import from backend database clients to avoid duplication
import sys
import os

# Add backend to path to import database clients
backend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
sys.path.insert(0, backend_path)

from backend.database.neo4j_client import Neo4jClient
from backend.database.mongodb_client import MongoDBClient
from backend.database.redis_client import RedisClient
from backend.database.qdrant_client import QdrantClient

__all__ = [
    "Neo4jClient",
    "MongoDBClient", 
    "RedisClient",
    "QdrantClient"
]
