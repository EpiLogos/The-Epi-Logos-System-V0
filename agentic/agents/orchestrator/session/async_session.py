"""
Async Session Manager for AG-UI Integration

This module provides async session management using redis.asyncio,
designed to work with AG-UI's async request handling while maintaining
the same interface as the original deleted redis_session_tools.py
"""

import os
import json
import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import redis.asyncio as aioredis
from redis.exceptions import ConnectionError, RedisError

from ..types import PersonaType

logger = logging.getLogger(__name__)

# Session TTL (default 24 hours)
SESSION_TTL_SECONDS = int(os.getenv("ORCHESTRATOR_SESSION_TTL", "86400"))


class AsyncOrchestratorSessionManager:
    """
    Async session manager using redis.asyncio for AG-UI integration.
    
    Maintains thread_id to session_id mapping and handles session lifecycle
    with async/await patterns required by AG-UI request handlers.
    """
    
    def __init__(self, redis_url: Optional[str] = None):
        """Initialize async session manager with Redis connection."""
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        if not self.redis_url:
            raise ValueError("Redis connection URL must be configured")
        
        self._redis: Optional[aioredis.Redis] = None
    
    async def _get_redis(self) -> aioredis.Redis:
        """Get or create Redis connection."""
        if self._redis is None:
            self._redis = aioredis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=30,
                socket_timeout=30,
                retry_on_timeout=True
            )
        return self._redis
    
    async def _test_connection(self) -> bool:
        """Test Redis connection."""
        try:
            redis = await self._get_redis()
            return await redis.ping()
        except (ConnectionError, RedisError) as e:
            logger.error(f"Redis connection test failed: {e}")
            return False
    
    def _session_key(self, session_id: str) -> str:
        """Get Redis key for session data."""
        return f"orch:session:{session_id}"
    
    def _thread_mapping_key(self, thread_id: str) -> str:
        """Get Redis key for thread_id to session_id mapping."""
        return f"orch:thread_mapping:{thread_id}"
    
    async def get_session_id_for_thread(self, thread_id: str) -> Optional[str]:
        """Get session_id associated with thread_id."""
        try:
            redis = await self._get_redis()
            session_id = await redis.get(self._thread_mapping_key(thread_id))
            return session_id
        except Exception as e:
            logger.warning(f"Failed to get session_id for thread {thread_id}: {e}")
            return None
    
    async def create_session(
        self,
        user_id: str,
        session_data: Optional[Dict[str, Any]] = None,
        thread_id: Optional[str] = None
    ) -> str:
        """
        Create new session with optional thread mapping.
        Returns session_id (UUID).
        
        Matches original deleted interface: async def create_session(user_id, session_data)
        """
        try:
            redis = await self._get_redis()
            
            # Generate new session UUID (separate from thread_id)
            session_id = str(uuid.uuid4())
            
            # Prepare session data
            now = datetime.now(timezone.utc)
            session_payload = {
                "session_id": session_id,
                "user_id": user_id,
                "created_at": now.isoformat(),
                "last_activity": now.isoformat(),
                "persona": PersonaType.SYSTEM.value,
                "status": "active",
                **(session_data or {})
            }
            
            # Store session data
            session_key = self._session_key(session_id)
            await redis.setex(session_key, SESSION_TTL_SECONDS, json.dumps(session_payload))
            
            # Create thread mapping if thread_id provided
            if thread_id:
                mapping_key = self._thread_mapping_key(thread_id)
                await redis.setex(mapping_key, SESSION_TTL_SECONDS, session_id)
                logger.info(f"✅ Created session {session_id} with thread mapping {thread_id}")
            else:
                logger.info(f"✅ Created session {session_id}")
            
            return session_id
            
        except Exception as e:
            logger.error(f"Failed to create session for user {user_id}: {e}")
            raise
    
    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data by session_id.
        
        Matches original interface expectations.
        """
        try:
            redis = await self._get_redis()
            session_key = self._session_key(session_id)
            session_data = await redis.get(session_key)
            
            if session_data:
                return json.loads(session_data)
            return None
            
        except Exception as e:
            logger.warning(f"Failed to get session {session_id}: {e}")
            return None
    
    async def update_session_activity(self, session_id: str) -> bool:
        """Update session last_activity timestamp."""
        try:
            redis = await self._get_redis()
            session_key = self._session_key(session_id)
            
            # Get current session
            session_data = await redis.get(session_key)
            if not session_data:
                return False
            
            # Update activity timestamp
            session_payload = json.loads(session_data)
            session_payload["last_activity"] = datetime.now(timezone.utc).isoformat()
            
            # Save back with TTL refresh
            await redis.setex(session_key, SESSION_TTL_SECONDS, json.dumps(session_payload))
            return True
            
        except Exception as e:
            logger.warning(f"Failed to update session activity {session_id}: {e}")
            return False
    
    async def close(self):
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None


async def create_async_session_manager(redis_url: Optional[str] = None) -> AsyncOrchestratorSessionManager:
    """
    Factory function to create async session manager.
    
    Matches original deleted pattern: async def create_redis_session_client()
    """
    manager = AsyncOrchestratorSessionManager(redis_url)
    
    # Test connection on creation
    if not await manager._test_connection():
        raise ConnectionError("Failed to connect to Redis for async session management")
    
    logger.info("✅ Async session manager created and connected")
    return manager