"""
Redis Session Tools - REAL Redis integration for session management

This module provides REAL tools for session management using Redis Cloud,
including session storage, retrieval, and lifecycle management.
"""

import logging
import os
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
import redis.asyncio as redis

logger = logging.getLogger(__name__)


class RedisSessionError(Exception):
    """Exception raised for Redis session-related errors"""
    pass


class RealRedisSessionClient:
    """REAL Redis client for session management"""
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        if not self.redis_url:
            raise RedisSessionError("REDIS_URL environment variable not set")
        
        self.client: Optional[redis.Redis] = None
        self.session_ttl = 86400  # 24 hours
        
    async def connect(self):
        """Connect to Redis Cloud"""
        try:
            self.client = redis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                socket_keepalive=True,
                socket_keepalive_options={}
            )
            
            # Test connection
            await self.client.ping()
            logger.info(f"Connected to Redis: {self.redis_url}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            return False
    
    async def close(self):
        """Close Redis connection"""
        if self.client:
            await self.client.close()
    
    async def create_session(self, user_id: str, session_data: Dict[str, Any] = None) -> str:
        """Create a new session in Redis"""
        if not self.client:
            raise RedisSessionError("Redis client not connected")
        
        session_id = f"session:{user_id}:{int(datetime.now().timestamp())}"
        
        default_data = {
            'user_id': user_id,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'last_activity': datetime.now(timezone.utc).isoformat(),
            'persona': 'system',
            'model_config': None,
            'context': {},
            'conversation_history': []
        }
        
        if session_data:
            default_data.update(session_data)
        
        try:
            # Store session data with TTL
            await self.client.setex(
                session_id,
                self.session_ttl,
                json.dumps(default_data, default=str)
            )
            
            # Add to user's active sessions set
            user_sessions_key = f"user_sessions:{user_id}"
            await self.client.sadd(user_sessions_key, session_id)
            await self.client.expire(user_sessions_key, self.session_ttl)
            
            logger.info(f"Created session: {session_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise RedisSessionError(f"Failed to create session: {e}")
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session data from Redis"""
        if not self.client:
            raise RedisSessionError("Redis client not connected")
        
        try:
            session_data = await self.client.get(session_id)
            if session_data:
                data = json.loads(session_data)
                
                # Update last activity
                data['last_activity'] = datetime.now(timezone.utc).isoformat()
                await self.client.setex(
                    session_id,
                    self.session_ttl,
                    json.dumps(data, default=str)
                )
                
                return data
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving session {session_id}: {e}")
            return None
    
    async def update_session(self, session_id: str, updates: Dict[str, Any]) -> bool:
        """Update session data in Redis"""
        if not self.client:
            raise RedisSessionError("Redis client not connected")
        
        try:
            current_data = await self.get_session(session_id)
            if not current_data:
                return False
            
            # Merge updates
            current_data.update(updates)
            current_data['last_activity'] = datetime.now(timezone.utc).isoformat()
            
            # Store updated data
            await self.client.setex(
                session_id,
                self.session_ttl,
                json.dumps(current_data, default=str)
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating session {session_id}: {e}")
            return False
    
    async def delete_session(self, session_id: str) -> bool:
        """Delete a session from Redis"""
        if not self.client:
            raise RedisSessionError("Redis client not connected")
        
        try:
            # Get session data to find user_id
            session_data = await self.client.get(session_id)
            if session_data:
                data = json.loads(session_data)
                user_id = data.get('user_id')
                
                # Remove from user's active sessions
                if user_id:
                    user_sessions_key = f"user_sessions:{user_id}"
                    await self.client.srem(user_sessions_key, session_id)
            
            # Delete the session
            result = await self.client.delete(session_id)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False
    
    async def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all active sessions for a user"""
        if not self.client:
            raise RedisSessionError("Redis client not connected")
        
        try:
            user_sessions_key = f"user_sessions:{user_id}"
            session_ids = await self.client.smembers(user_sessions_key)
            
            sessions = []
            for session_id in session_ids:
                session_data = await self.get_session(session_id)
                if session_data:
                    sessions.append({
                        'session_id': session_id,
                        'data': session_data
                    })
                else:
                    # Clean up dead session reference
                    await self.client.srem(user_sessions_key, session_id)
            
            return sessions
            
        except Exception as e:
            logger.error(f"Error getting user sessions for {user_id}: {e}")
            return []
    
    async def add_to_conversation_history(self, session_id: str, message: Dict[str, Any]) -> bool:
        """Add a message to the session's conversation history"""
        if not self.client:
            raise RedisSessionError("Redis client not connected")
        
        try:
            session_data = await self.get_session(session_id)
            if not session_data:
                return False
            
            # Add message to history
            history = session_data.get('conversation_history', [])
            message['timestamp'] = datetime.now(timezone.utc).isoformat()
            history.append(message)
            
            # Keep only last 100 messages
            if len(history) > 100:
                history = history[-100:]
            
            # Update session
            return await self.update_session(session_id, {
                'conversation_history': history
            })
            
        except Exception as e:
            logger.error(f"Error adding to conversation history for {session_id}: {e}")
            return False
    
    async def get_conversation_history(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get conversation history for a session"""
        try:
            session_data = await self.get_session(session_id)
            if session_data:
                history = session_data.get('conversation_history', [])
                return history[-limit:] if limit else history
            return []
            
        except Exception as e:
            logger.error(f"Error getting conversation history for {session_id}: {e}")
            return []
    
    async def set_session_persona(self, session_id: str, persona: str) -> bool:
        """Set the active persona for a session"""
        return await self.update_session(session_id, {'persona': persona})
    
    async def set_session_model(self, session_id: str, model_config: str) -> bool:
        """Set the model configuration for a session"""
        return await self.update_session(session_id, {'model_config': model_config})
    
    async def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions and return count of cleaned up sessions"""
        if not self.client:
            raise RedisSessionError("Redis client not connected")
        
        try:
            # This is handled automatically by Redis TTL
            # But we can clean up orphaned user session sets
            pattern = "user_sessions:*"
            keys = await self.client.keys(pattern)
            cleaned = 0
            
            for key in keys:
                # Check if the set has any valid sessions
                session_ids = await self.client.smembers(key)
                valid_sessions = []
                
                for session_id in session_ids:
                    if await self.client.exists(session_id):
                        valid_sessions.append(session_id)
                    else:
                        cleaned += 1
                
                if valid_sessions != session_ids:
                    # Update the set to only contain valid sessions
                    await self.client.delete(key)
                    if valid_sessions:
                        await self.client.sadd(key, *valid_sessions)
                        await self.client.expire(key, self.session_ttl)
            
            return cleaned
            
        except Exception as e:
            logger.error(f"Error during session cleanup: {e}")
            return 0


# Async functions for tool integration
async def create_session_sync(user_id: str, session_data: Dict[str, Any] = None, redis_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL session creation using Redis"""
    
    # Use real Redis client if provided, otherwise create one
    if isinstance(redis_client, RealRedisSessionClient):
        client = redis_client
    else:
        client = RealRedisSessionClient()
        await client.connect()
    
    try:
        session_id = await client.create_session(user_id, session_data)
        return {
            'success': True,
            'session_id': session_id,
            'user_id': user_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'source': 'real_redis'
        }
    except Exception as e:
        logger.error(f"Real Redis session creation error: {e}")
        return {
            'success': False,
            'error': str(e),
            'user_id': user_id
        }
    finally:
        # Close client if we created it
        if not isinstance(redis_client, RealRedisSessionClient):
            await client.close()


async def get_session_sync(session_id: str, redis_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL session retrieval using Redis"""
    
    # Use real Redis client if provided, otherwise create one
    if isinstance(redis_client, RealRedisSessionClient):
        client = redis_client
    else:
        client = RealRedisSessionClient()
        await client.connect()
    
    try:
        session_data = await client.get_session(session_id)
        if session_data:
            return {
                'success': True,
                'session_id': session_id,
                'data': session_data,
                'source': 'real_redis'
            }
        else:
            return {
                'success': False,
                'error': 'Session not found',
                'session_id': session_id
            }
    except Exception as e:
        logger.error(f"Real Redis session retrieval error: {e}")
        return {
            'success': False,
            'error': str(e),
            'session_id': session_id
        }
    finally:
        # Close client if we created it
        if not isinstance(redis_client, RealRedisSessionClient):
            await client.close()


# Factory function to create a real Redis client
async def create_redis_session_client() -> RealRedisSessionClient:
    """Create and connect a real Redis session client"""
    client = RealRedisSessionClient()
    connected = await client.connect()
    if not connected:
        raise RedisSessionError("Failed to connect to Redis")
    return client