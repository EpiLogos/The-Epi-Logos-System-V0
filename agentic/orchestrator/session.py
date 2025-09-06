"""
Redis Session Management Implementation

Redis-based session management for active orchestrator conversations with
session lifecycle management and context sharing protocols.

Implements AC3: Redis-based session management for active conversations
Implements AC5: Clean slate persona re-instantiation with session state
"""

import json
import logging
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta

import redis.asyncio as aioredis
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class OrchestratorSession(BaseModel):
    """
    Model for orchestrator session data stored in Redis.
    
    Represents active conversation state for a user session with
    context sharing and persona tracking capabilities.
    """
    session_id: str
    user_id: str
    active_persona: Optional[str] = None
    conversation_id: str
    context: Dict[str, Any] = Field(default_factory=dict)
    bimba_context: List[str] = Field(default_factory=list)
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Optional persona history for clean slate transitions
    persona_history: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Session metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SessionManager:
    """
    Manages Redis-based session storage for orchestrator conversations.
    
    Provides session lifecycle management, timeout handling, and context
    sharing protocols for persona switches within conversations.
    """
    
    def __init__(
        self, 
        redis_url: str,
        session_timeout_hours: int = 24,
        cleanup_interval_minutes: int = 60
    ):
        """Initialize SessionManager with Redis connection and configuration"""
        self.redis_url = redis_url
        self.session_timeout = timedelta(hours=session_timeout_hours)
        self.cleanup_interval = timedelta(minutes=cleanup_interval_minutes)
        
        # Redis connection pool
        self.redis: Optional[aioredis.Redis] = None
        
        # Key prefixes for Redis storage
        self.session_prefix = "orchestrator:session:"
        self.user_sessions_prefix = "orchestrator:user_sessions:"
        self.active_sessions_key = "orchestrator:active_sessions"
        
        logger.info(f"SessionManager initialized with timeout: {session_timeout_hours}h")
    
    async def _get_redis(self) -> aioredis.Redis:
        """Get or create Redis connection"""
        if self.redis is None:
            self.redis = aioredis.from_url(
                self.redis_url,
                encoding="utf-8",
                decode_responses=True,
                retry_on_timeout=True,
                retry_on_error=[ConnectionError, TimeoutError]
            )
        return self.redis
    
    def _session_key(self, session_id: str) -> str:
        """Generate Redis key for session storage"""
        return f"{self.session_prefix}{session_id}"
    
    def _user_sessions_key(self, user_id: str) -> str:
        """Generate Redis key for user's active sessions"""
        return f"{self.user_sessions_prefix}{user_id}"
    
    async def create_session(
        self, 
        user_id: str, 
        initial_context: Optional[Dict[str, Any]] = None
    ) -> OrchestratorSession:
        """
        Create a new orchestrator session for a user.
        
        Returns newly created session with unique session_id and conversation_id.
        """
        try:
            # Generate unique IDs
            session_id = str(uuid.uuid4())
            conversation_id = str(uuid.uuid4())
            
            # Create session object
            session = OrchestratorSession(
                session_id=session_id,
                user_id=user_id,
                conversation_id=conversation_id,
                context=initial_context or {},
                metadata={
                    'created_by': 'orchestrator',
                    'version': '1.0'
                }
            )
            
            # Store in Redis
            await self._store_session(session)
            
            # Track session for user
            await self._add_user_session(user_id, session_id)
            
            # Add to active sessions set
            redis = await self._get_redis()
            await redis.sadd(self.active_sessions_key, session_id)
            
            logger.info(f"Created session {session_id} for user {user_id}")
            
            return session
            
        except Exception as e:
            logger.error(f"Error creating session for user {user_id}: {e}")
            raise
    
    async def get_session(self, session_id: str) -> Optional[OrchestratorSession]:
        """
        Retrieve a session by ID.
        
        Returns None if session doesn't exist or has expired.
        """
        try:
            redis = await self._get_redis()
            session_data = await redis.get(self._session_key(session_id))
            
            if not session_data:
                return None
            
            # Parse session data
            session_dict = json.loads(session_data)
            session = OrchestratorSession(**session_dict)
            
            # Check if session has expired
            if self._is_session_expired(session):
                await self.cleanup_session(session_id)
                return None
            
            return session
            
        except Exception as e:
            logger.error(f"Error retrieving session {session_id}: {e}")
            return None
    
    async def update_session(self, session: OrchestratorSession) -> bool:
        """
        Update an existing session in Redis.
        
        Updates last_activity timestamp and stores modified session data.
        """
        try:
            # Update last activity
            session.last_activity = datetime.now(timezone.utc)
            
            # Store updated session
            await self._store_session(session)
            
            logger.debug(f"Updated session {session.session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating session {session.session_id}: {e}")
            return False
    
    async def _store_session(self, session: OrchestratorSession):
        """Store session data in Redis with expiration"""
        redis = await self._get_redis()
        session_key = self._session_key(session.session_id)
        
        # Convert to JSON with datetime handling
        session_data = session.model_dump_json()
        
        # Store with expiration
        expire_seconds = int(self.session_timeout.total_seconds())
        await redis.setex(session_key, expire_seconds, session_data)
    
    async def _add_user_session(self, user_id: str, session_id: str):
        """Add session to user's active sessions set"""
        redis = await self._get_redis()
        user_key = self._user_sessions_key(user_id)
        
        # Add session to user's set
        await redis.sadd(user_key, session_id)
        
        # Set expiration on user sessions key
        expire_seconds = int(self.session_timeout.total_seconds())
        await redis.expire(user_key, expire_seconds)
    
    def _is_session_expired(self, session: OrchestratorSession) -> bool:
        """Check if session has exceeded timeout period"""
        age = datetime.now(timezone.utc) - session.last_activity
        return age > self.session_timeout
    
    async def cleanup_session(self, session_id: str) -> bool:
        """
        Clean up expired or terminated session.
        
        Removes session data and updates tracking structures.
        """
        try:
            redis = await self._get_redis()
            
            # Get session to find user_id
            session = await self.get_session(session_id)
            if session:
                # Remove from user's sessions
                user_key = self._user_sessions_key(session.user_id)
                await redis.srem(user_key, session_id)
            
            # Remove session data
            session_key = self._session_key(session_id)
            await redis.delete(session_key)
            
            # Remove from active sessions
            await redis.srem(self.active_sessions_key, session_id)
            
            logger.info(f"Cleaned up session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error cleaning up session {session_id}: {e}")
            return False
    
    async def get_user_sessions(self, user_id: str) -> List[str]:
        """Get all active session IDs for a user"""
        try:
            redis = await self._get_redis()
            user_key = self._user_sessions_key(user_id)
            
            session_ids = await redis.smembers(user_key)
            return list(session_ids) if session_ids else []
            
        except Exception as e:
            logger.error(f"Error getting sessions for user {user_id}: {e}")
            return []
    
    async def get_active_sessions_count(self) -> int:
        """Get count of all active sessions"""
        try:
            redis = await self._get_redis()
            return await redis.scard(self.active_sessions_key)
        except Exception as e:
            logger.error(f"Error getting active sessions count: {e}")
            return 0
    
    async def cleanup_expired_sessions(self) -> int:
        """
        Clean up all expired sessions.
        
        Returns count of sessions cleaned up.
        """
        try:
            redis = await self._get_redis()
            
            # Get all active session IDs
            session_ids = await redis.smembers(self.active_sessions_key)
            if not session_ids:
                return 0
            
            cleaned_count = 0
            
            for session_id in session_ids:
                session = await self.get_session(session_id)
                if not session or self._is_session_expired(session):
                    await self.cleanup_session(session_id)
                    cleaned_count += 1
            
            logger.info(f"Cleaned up {cleaned_count} expired sessions")
            return cleaned_count
            
        except Exception as e:
            logger.error(f"Error during expired session cleanup: {e}")
            return 0
    
    async def update_session_context(
        self, 
        session_id: str, 
        context_updates: Dict[str, Any]
    ) -> bool:
        """
        Update session context with new data.
        
        Merges context_updates into existing session context.
        """
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # Merge context updates
            session.context.update(context_updates)
            
            # Save updated session
            return await self.update_session(session)
            
        except Exception as e:
            logger.error(f"Error updating context for session {session_id}: {e}")
            return False
    
    async def add_bimba_context(
        self, 
        session_id: str, 
        coordinates: List[str]
    ) -> bool:
        """
        Add Bimba coordinates to session context.
        
        Appends new coordinates while avoiding duplicates.
        """
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # Add coordinates avoiding duplicates
            for coord in coordinates:
                if coord not in session.bimba_context:
                    session.bimba_context.append(coord)
            
            # Save updated session
            return await self.update_session(session)
            
        except Exception as e:
            logger.error(f"Error adding Bimba context to session {session_id}: {e}")
            return False
    
    async def switch_persona_in_session(
        self, 
        session_id: str, 
        new_persona: str,
        preserve_context: bool = True
    ) -> bool:
        """
        Switch persona for a session with optional context preservation.
        
        Implements clean slate re-instantiation protocol for persona transitions.
        """
        try:
            session = await self.get_session(session_id)
            if not session:
                return False
            
            # Create context snapshot if preserving context
            if preserve_context and session.active_persona:
                context_snapshot = {
                    'previous_persona': session.active_persona,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'context': session.context.copy(),
                    'bimba_context': session.bimba_context.copy()
                }
                session.persona_history.append(context_snapshot)
            
            # Switch persona
            old_persona = session.active_persona
            session.active_persona = new_persona
            
            # Clear context if not preserving (true clean slate)
            if not preserve_context:
                session.context = {}
                session.bimba_context = []
            
            # Update session
            success = await self.update_session(session)
            
            if success:
                logger.info(
                    f"Switched persona: {old_persona} -> {new_persona} "
                    f"for session {session_id} (preserve_context: {preserve_context})"
                )
            
            return success
            
        except Exception as e:
            logger.error(f"Error switching persona for session {session_id}: {e}")
            return False
    
    async def get_session_metrics(self) -> Dict[str, Any]:
        """Get metrics about session management"""
        try:
            redis = await self._get_redis()
            
            active_count = await self.get_active_sessions_count()
            
            # Get memory usage info
            memory_info = await redis.memory_stats()
            
            return {
                'active_sessions': active_count,
                'session_timeout_hours': self.session_timeout.total_seconds() / 3600,
                'redis_memory_used': memory_info.get('total.allocated', 0),
                'redis_connected': True
            }
            
        except Exception as e:
            logger.error(f"Error getting session metrics: {e}")
            return {
                'active_sessions': 0,
                'redis_connected': False,
                'error': str(e)
            }
    
    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            logger.info("SessionManager Redis connection closed")