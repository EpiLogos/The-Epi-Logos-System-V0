"""
Redis connection wrapper for user session and caching services.
Provides easy access to Redis client for session management.
"""
import logging
from shared.database import RedisClient

logger = logging.getLogger(__name__)

# Global Redis client instance
_redis_client: RedisClient = None


async def get_redis_client() -> RedisClient:
    """
    Get the global Redis client instance.
    
    Returns:
        RedisClient instance
    """
    global _redis_client
    
    if _redis_client is None:
        _redis_client = RedisClient()
        logger.info("Redis client initialized")
    
    return _redis_client


async def close_redis_client():
    """Close the Redis client connection."""
    global _redis_client
    
    if _redis_client:
        await _redis_client.close()
        _redis_client = None
        logger.info("Redis client closed")