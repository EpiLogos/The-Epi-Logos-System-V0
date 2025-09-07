"""
Database layer for the Epi-Logos System backend.

This module provides database clients for all data storage systems:
- Neo4j Aura (unified graph for Bimba Map, LightRAG, Graphiti)
- MongoDB Atlas (Personal Pratibimba and user profiles)
- Redis Cloud (caching and event streaming)
- Qdrant (local vector database for semantic search)
"""

# Import from shared database package
from shared.database import Neo4jClient, MongoDBClient, RedisClient, QdrantClient

__all__ = [
    "Neo4jClient",
    "MongoDBClient", 
    "RedisClient",
    "QdrantClient"
]
