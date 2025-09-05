"""
MongoDB connection wrapper for user authentication services.
Provides easy access to MongoDB client for user-related operations.
"""
import logging
from backend.database.mongodb_client import MongoDBClient

logger = logging.getLogger(__name__)

# Global MongoDB client instance
_mongodb_client: MongoDBClient = None


async def get_mongodb_client() -> MongoDBClient:
    """
    Get the global MongoDB client instance.
    
    Returns:
        MongoDBClient instance
    """
    global _mongodb_client
    
    if _mongodb_client is None:
        _mongodb_client = MongoDBClient()
        # Test connection
        if _mongodb_client.test_connection():
            logger.info("MongoDB client connected successfully")
            # Initialize collections and indexes
            _mongodb_client.initialize_collections()
        else:
            logger.error("MongoDB connection failed during initialization")
    
    return _mongodb_client


async def close_mongodb_client():
    """Close the MongoDB client connection."""
    global _mongodb_client
    
    if _mongodb_client:
        await _mongodb_client.close()
        _mongodb_client = None
        logger.info("MongoDB client closed")