"""
Redis Cloud client for caching, session management, and event streaming.

This client handles connections to Redis Cloud and provides operations
for Wisdom Packet caching, JWT session management, and event-driven
architecture using Redis Streams.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timedelta, timezone
import redis
from redis.exceptions import ConnectionError, RedisError


logger = logging.getLogger(__name__)


class RedisClient:
    """Redis Cloud client for caching and event streaming."""
    
    def __init__(self):
        """Initialize Redis client with configuration from environment."""
        self.connection_url = os.getenv("REDIS_URL")
        self.password = os.getenv("REDIS_PASSWORD")
        
        self._client: Optional[redis.Redis] = None
        
        if not self.connection_url:
            raise ValueError("Redis connection URL must be configured")
    
    @property
    def client(self) -> redis.Redis:
        """Get or create Redis client instance."""
        if self._client is None:
            # Use simple redis.from_url approach - let Redis handle SSL automatically
            self._client = redis.from_url(
                self.connection_url,
                decode_responses=True,
                socket_connect_timeout=30,
                socket_timeout=30,
                retry_on_timeout=True
            )
        return self._client
    
    def test_connection(self) -> bool:
        """Test connection to Redis Cloud."""
        try:
            return self.client.ping()
        except (ConnectionError, RedisError) as e:
            logger.error(f"Redis connection test failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during Redis connection test: {e}")
            return False
    
    def ping(self) -> bool:
        """Ping Redis server."""
        try:
            return self.client.ping()
        except Exception as e:
            logger.error(f"Redis ping failed: {e}")
            return False
    
    # Basic key-value operations
    def set(self, key: str, value: Union[str, int, float], ex: Optional[int] = None) -> bool:
        """Set a key-value pair with optional expiration."""
        try:
            return self.client.set(key, value, ex=ex)
        except Exception as e:
            logger.error(f"Error setting Redis key {key}: {e}")
            return False
    
    def get(self, key: str) -> Optional[str]:
        """Get value by key."""
        try:
            return self.client.get(key)
        except Exception as e:
            logger.error(f"Error getting Redis key {key}: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """Delete a key."""
        try:
            return bool(self.client.delete(key))
        except Exception as e:
            logger.error(f"Error deleting Redis key {key}: {e}")
            return False
    
    def ttl(self, key: str) -> int:
        """Get time to live for a key."""
        try:
            return self.client.ttl(key)
        except Exception as e:
            logger.error(f"Error getting TTL for Redis key {key}: {e}")
            return -1
    
    def setex(self, key: str, time: int, value: Union[str, int, float]) -> bool:
        """Set key to hold string value and set key to timeout after time seconds."""
        try:
            return self.client.setex(key, time, value)
        except Exception as e:
            logger.error(f"Error setting Redis key {key} with expiration: {e}")
            return False
    
    def sadd(self, key: str, *values: str) -> int:
        """Add one or more members to a set."""
        try:
            return self.client.sadd(key, *values)
        except Exception as e:
            logger.error(f"Error adding to Redis set {key}: {e}")
            return 0
    
    def expire(self, key: str, time: int) -> bool:
        """Set a timeout on a key."""
        try:
            return self.client.expire(key, time)
        except Exception as e:
            logger.error(f"Error setting expiration on Redis key {key}: {e}")
            return False
    
    def smembers(self, key: str) -> set:
        """Get all members in a set."""
        try:
            return self.client.smembers(key)
        except Exception as e:
            logger.error(f"Error getting Redis set members {key}: {e}")
            return set()
    
    def srem(self, key: str, *values: str) -> int:
        """Remove one or more members from a set."""
        try:
            return self.client.srem(key, *values)
        except Exception as e:
            logger.error(f"Error removing from Redis set {key}: {e}")
            return 0
    
    def keys(self, pattern: str = "*") -> list:
        """Find keys matching a pattern."""
        try:
            return self.client.keys(pattern)
        except Exception as e:
            logger.error(f"Error getting Redis keys with pattern {pattern}: {e}")
            return []
    
    # Wisdom Packet caching operations
    def cache_wisdom_packet(self, wisdom_packet: Dict[str, Any], ttl: int = 3600) -> bool:
        """Cache a Wisdom Packet with TTL."""
        try:
            key = f"wisdom_packet:{wisdom_packet['id']}"
            value = json.dumps(wisdom_packet, default=str)
            return self.client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Error caching wisdom packet: {e}")
            return False
    
    def get_wisdom_packet(self, packet_id: str) -> Optional[Dict[str, Any]]:
        """Get a cached Wisdom Packet."""
        try:
            key = f"wisdom_packet:{packet_id}"
            value = self.client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Error retrieving wisdom packet {packet_id}: {e}")
            return None
    
    def invalidate_wisdom_packet(self, packet_id: str) -> bool:
        """Invalidate a cached Wisdom Packet."""
        key = f"wisdom_packet:{packet_id}"
        return self.delete(key)
    
    # Session management operations
    def create_session(self, session_token: str, session_data: Dict[str, Any], ttl: int = 3600) -> bool:
        """Create a user session."""
        try:
            key = f"session:{session_token}"
            value = json.dumps(session_data, default=str)
            return self.client.setex(key, ttl, value)
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            return False
    
    def get_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """Get session data."""
        try:
            key = f"session:{session_token}"
            value = self.client.get(key)
            return json.loads(value) if value else None
        except Exception as e:
            logger.error(f"Error retrieving session: {e}")
            return None
    
    def update_session(self, session_token: str, update_data: Dict[str, Any]) -> bool:
        """Update session data."""
        try:
            session_data = self.get_session(session_token)
            if session_data:
                session_data.update(update_data)
                key = f"session:{session_token}"
                ttl = self.client.ttl(key)
                if ttl > 0:
                    value = json.dumps(session_data, default=str)
                    return self.client.setex(key, ttl, value)
            return False
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            return False
    
    def delete_session(self, session_token: str) -> bool:
        """Delete a session."""
        key = f"session:{session_token}"
        return self.delete(key)
    
    # Event streaming operations using Redis Streams
    def publish_event(self, stream_name: str, event_data: Dict[str, Any]) -> Optional[str]:
        """Publish an event to a Redis Stream."""
        try:
            # Add timestamp if not present
            if "timestamp" not in event_data:
                event_data["timestamp"] = datetime.now(timezone.utc).isoformat()
            
            # Convert all values to strings for Redis Streams
            stream_data = {k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) 
                          for k, v in event_data.items()}
            
            return self.client.xadd(stream_name, stream_data)
        except Exception as e:
            logger.error(f"Error publishing event to stream {stream_name}: {e}")
            return None
    
    def consume_events(self, stream_name: str, count: int = 10, block: int = 0) -> List[Dict[str, Any]]:
        """Consume events from a Redis Stream."""
        try:
            messages = self.client.xread({stream_name: '$'}, count=count, block=block)
            
            events = []
            for stream, msgs in messages:
                for msg_id, fields in msgs:
                    event = {
                        "id": msg_id,
                        "stream": stream,
                        "data": {}
                    }
                    
                    # Parse JSON fields back to objects
                    for key, value in fields.items():
                        try:
                            event["data"][key] = json.loads(value)
                        except json.JSONDecodeError:
                            event["data"][key] = value
                    
                    events.append(event)
            
            return events
        except Exception as e:
            logger.error(f"Error consuming events from stream {stream_name}: {e}")
            return []
    
    def create_consumer_group(self, stream_name: str, group_name: str, start_id: str = "0") -> bool:
        """Create a consumer group for a stream."""
        try:
            self.client.xgroup_create(stream_name, group_name, start_id, mkstream=True)
            return True
        except redis.ResponseError as e:
            if "BUSYGROUP" in str(e):
                # Group already exists
                return True
            logger.error(f"Error creating consumer group: {e}")
            return False
        except Exception as e:
            logger.error(f"Error creating consumer group: {e}")
            return False
    
    def consume_from_group(self, stream_name: str, group_name: str, consumer_name: str, 
                          count: int = 10) -> List[Dict[str, Any]]:
        """Consume events from a stream using a consumer group."""
        try:
            messages = self.client.xreadgroup(
                group_name, consumer_name, {stream_name: '>'}, count=count
            )
            
            events = []
            for stream, msgs in messages:
                for msg_id, fields in msgs:
                    event = {
                        "id": msg_id,
                        "stream": stream,
                        "data": {}
                    }
                    
                    for key, value in fields.items():
                        try:
                            event["data"][key] = json.loads(value)
                        except json.JSONDecodeError:
                            event["data"][key] = value
                    
                    events.append(event)
            
            return events
        except Exception as e:
            logger.error(f"Error consuming from group {group_name}: {e}")
            return []
    
    # Cache invalidation system
    def invalidate_coordinate_cache(self, coordinate: str) -> bool:
        """Invalidate all cache entries related to a coordinate."""
        try:
            pattern = f"*{coordinate}*"
            keys = self.client.keys(pattern)
            if keys:
                return bool(self.client.delete(*keys))
            return True
        except Exception as e:
            logger.error(f"Error invalidating coordinate cache for {coordinate}: {e}")
            return False
    
    # Pub/Sub operations
    def publish(self, channel: str, message: str) -> int:
        """Publish a message to a channel."""
        try:
            return self.client.publish(channel, message)
        except Exception as e:
            logger.error(f"Error publishing to channel {channel}: {e}")
            return 0
    
    def subscribe(self, channel: str):
        """Subscribe to a channel."""
        try:
            pubsub = self.client.pubsub()
            pubsub.subscribe(channel)
            return pubsub
        except Exception as e:
            logger.error(f"Error subscribing to channel {channel}: {e}")
            return None
    
    def close(self):
        """Close the Redis client connection."""
        if self._client:
            self._client.close()
            self._client = None
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
