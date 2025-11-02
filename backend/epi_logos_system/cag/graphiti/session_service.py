"""
Etymology Session Service

Manages etymology exploration sessions (word projects) that span multiple chat threads.
Provides CRUD operations with MongoDB persistence and Redis caching.

Story 08.07 Enhancement - Personal Exploration Tracking
"""

import logging
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from pymongo import DESCENDING
from pymongo.database import Database

from shared.database.mongodb_client import MongoDBClient
from shared.database.redis_client import RedisClient
from backend.epi_logos_system.cag.graphiti.models import (
    EtymologySession,
    EtymologySessionStatus,
    EtymologySessionRequest,
    EtymologySessionResponse,
    EtymologySessionUpdateRequest,
    EtymologySessionListResponse
)

logger = logging.getLogger(__name__)


class EtymologySessionService:
    """
    Service for managing etymology exploration sessions.

    Architecture:
    - MongoDB: Durable storage (etymology_sessions collection)
    - Redis: Active session cache (24h TTL, fast access)
    - Write-through pattern: Update both on change
    """

    COLLECTION_NAME = "etymology_sessions"
    REDIS_KEY_PREFIX = "ea:session:"
    USER_SESSIONS_PREFIX = "ea:user:"
    CACHE_TTL = 86400  # 24 hours

    def __init__(self, mongo_client: Optional[MongoDBClient] = None, redis_client: Optional[RedisClient] = None):
        """
        Initialize service with database clients.

        Args:
            mongo_client: MongoDB client (creates new if None)
            redis_client: Redis client (creates new if None)
        """
        self.mongo_client = mongo_client or MongoDBClient()
        self.redis_client = redis_client or RedisClient()
        self._db: Optional[Database] = None

    @property
    def db(self) -> Database:
        """Get MongoDB database instance."""
        if self._db is None:
            self._db = self.mongo_client.get_database()
        return self._db

    @property
    def collection(self):
        """Get etymology_sessions collection."""
        return self.db.get_collection(self.COLLECTION_NAME)

    def _redis_session_key(self, session_id: str) -> str:
        """Get Redis key for session cache."""
        return f"{self.REDIS_KEY_PREFIX}{session_id}"

    def _redis_user_sessions_key(self, user_id: str) -> str:
        """Get Redis key for user's session set."""
        return f"{self.USER_SESSIONS_PREFIX}{user_id}:sessions"

    async def create_session(self, request: EtymologySessionRequest) -> EtymologySessionResponse:
        """
        Create a new etymology exploration session.

        Args:
            request: Session creation request

        Returns:
            EtymologySessionResponse with created session
        """
        try:
            session_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc)

            session = EtymologySession(
                session_id=session_id,
                user_id=request.user_id,
                title=request.title,
                description=request.description,
                coordinate_context=request.coordinate_context,
                status=EtymologySessionStatus.ACTIVE,
                created_at=now,
                last_activity=now
            )

            # Insert into MongoDB
            session_dict = session.model_dump()
            self.collection.insert_one(session_dict)

            # Cache in Redis
            session_json = session.model_dump_json()
            self.redis_client.setex(
                self._redis_session_key(session_id),
                self.CACHE_TTL,
                session_json
            )

            # Add to user's session set
            self.redis_client.sadd(
                self._redis_user_sessions_key(request.user_id),
                session_id
            )
            self.redis_client.expire(
                self._redis_user_sessions_key(request.user_id),
                self.CACHE_TTL
            )

            logger.info(f"Created etymology session {session_id} for user {request.user_id}")

            return EtymologySessionResponse(
                success=True,
                session=session,
                message=f"Session '{request.title}' created successfully"
            )

        except Exception as e:
            logger.error(f"Error creating etymology session: {e}")
            return EtymologySessionResponse(
                success=False,
                message=f"Failed to create session: {str(e)}"
            )

    async def get_session(self, session_id: str) -> Optional[EtymologySession]:
        """
        Get etymology session by ID.

        Checks Redis cache first, falls back to MongoDB.

        Args:
            session_id: Session identifier

        Returns:
            EtymologySession or None if not found
        """
        try:
            # Check Redis cache first
            cached = self.redis_client.get(self._redis_session_key(session_id))
            if cached:
                logger.debug(f"Session {session_id} found in Redis cache")
                return EtymologySession.model_validate_json(cached)

            # Fallback to MongoDB
            session_doc = self.collection.find_one({"session_id": session_id})
            if not session_doc:
                logger.warning(f"Session {session_id} not found")
                return None

            # Remove MongoDB _id field
            session_doc.pop("_id", None)

            session = EtymologySession(**session_doc)

            # Update Redis cache
            session_json = session.model_dump_json()
            self.redis_client.setex(
                self._redis_session_key(session_id),
                self.CACHE_TTL,
                session_json
            )

            logger.debug(f"Session {session_id} loaded from MongoDB and cached")
            return session

        except Exception as e:
            logger.error(f"Error getting session {session_id}: {e}")
            return None

    async def get_session_by_thread_id(self, thread_id: str) -> Optional[EtymologySession]:
        """
        Get etymology session by thread ID.

        Looks up which session contains this thread_id in its thread_ids array.

        Args:
            thread_id: Thread identifier (e.g., "thread-d230bfdb-70f9-48f7-b10d-a32bff5319e5")

        Returns:
            EtymologySession or None if not found
        """
        try:
            # Query MongoDB for session containing this thread_id
            session_doc = self.collection.find_one({"thread_ids": thread_id})
            if not session_doc:
                logger.warning(f"No session found containing thread {thread_id}")
                return None

            # Remove MongoDB _id field
            session_doc.pop("_id", None)

            session = EtymologySession(**session_doc)

            # Update Redis cache for future lookups by session_id
            session_json = session.model_dump_json()
            self.redis_client.setex(
                self._redis_session_key(session.session_id),
                self.CACHE_TTL,
                session_json
            )

            logger.debug(f"Session {session.session_id} found by thread_id {thread_id}")
            return session

        except Exception as e:
            logger.error(f"Error getting session by thread_id {thread_id}: {e}")
            return None

    async def update_session(self, request: EtymologySessionUpdateRequest) -> EtymologySessionResponse:
        """
        Update etymology session data.

        Uses write-through pattern: updates both MongoDB and Redis cache.

        Args:
            request: Session update request

        Returns:
            EtymologySessionResponse with updated session
        """
        try:
            session = await self.get_session(request.session_id)
            if not session:
                return EtymologySessionResponse(
                    success=False,
                    message=f"Session {request.session_id} not found"
                )

            # Update scalar fields
            if request.title is not None:
                session.title = request.title
            if request.description is not None:
                session.description = request.description
            if request.status is not None:
                session.status = request.status

            # Append to list fields (avoiding duplicates)
            for word in request.words_to_add:
                if word not in session.words_explored:
                    session.words_explored.append(word)

            for community_id in request.communities_to_add:
                if community_id not in session.communities_created:
                    session.communities_created.append(community_id)

            for aphorism_id in request.aphorisms_to_add:
                if aphorism_id not in session.aphorisms:
                    session.aphorisms.append(aphorism_id)

            for pie_root in request.pie_roots_to_add:
                if pie_root not in session.pie_roots_discovered:
                    session.pie_roots_discovered.append(pie_root)

            for pattern in request.semantic_patterns_to_add:
                if pattern not in session.semantic_patterns:
                    session.semantic_patterns.append(pattern)

            # Add resonances (can have duplicates with different data)
            session.resonances_found.extend(request.resonances_to_add)

            # Add thread if provided
            if request.thread_id_to_add and request.thread_id_to_add not in session.thread_ids:
                session.thread_ids.append(request.thread_id_to_add)

            # Update last activity
            session.last_activity = datetime.now(timezone.utc)

            # Write-through update
            session_dict = session.model_dump()
            self.collection.update_one(
                {"session_id": request.session_id},
                {"$set": session_dict}
            )

            # Update Redis cache
            session_json = session.model_dump_json()
            self.redis_client.setex(
                self._redis_session_key(request.session_id),
                self.CACHE_TTL,
                session_json
            )

            logger.info(f"Updated etymology session {request.session_id}")

            return EtymologySessionResponse(
                success=True,
                session=session,
                message="Session updated successfully"
            )

        except Exception as e:
            logger.error(f"Error updating session {request.session_id}: {e}")
            return EtymologySessionResponse(
                success=False,
                message=f"Failed to update session: {str(e)}"
            )

    async def list_user_sessions(
        self,
        user_id: str,
        status: Optional[EtymologySessionStatus] = None,
        limit: int = 50
    ) -> EtymologySessionListResponse:
        """
        List etymology sessions for a user.

        Args:
            user_id: User identifier
            status: Optional status filter
            limit: Maximum sessions to return

        Returns:
            EtymologySessionListResponse with user's sessions
        """
        try:
            # Build query filter - exclude archived by default
            query_filter = {"user_id": user_id}
            if status:
                query_filter["status"] = status.value
            else:
                # Default: exclude archived sessions
                query_filter["status"] = {"$ne": EtymologySessionStatus.ARCHIVED.value}

            # Query MongoDB
            cursor = self.collection.find(query_filter).sort("last_activity", DESCENDING).limit(limit)

            sessions = []
            for session_doc in cursor:
                session_doc.pop("_id", None)
                session = EtymologySession(**session_doc)
                sessions.append(session)

            total_count = self.collection.count_documents(query_filter)

            logger.info(f"Retrieved {len(sessions)} sessions for user {user_id}")

            return EtymologySessionListResponse(
                success=True,
                sessions=sessions,
                total_count=total_count,
                message=f"Found {total_count} sessions"
            )

        except Exception as e:
            logger.error(f"Error listing sessions for user {user_id}: {e}")
            return EtymologySessionListResponse(
                success=False,
                total_count=0,
                message=f"Failed to list sessions: {str(e)}"
            )

    async def add_thread_to_session(self, session_id: str, thread_id: str) -> EtymologySessionResponse:
        """
        Link a chat thread to an etymology session.

        Args:
            session_id: Session identifier
            thread_id: Thread identifier to link

        Returns:
            EtymologySessionResponse with updated session
        """
        try:
            update_request = EtymologySessionUpdateRequest(
                session_id=session_id,
                thread_id_to_add=thread_id
            )

            return await self.update_session(update_request)

        except Exception as e:
            logger.error(f"Error adding thread {thread_id} to session {session_id}: {e}")
            return EtymologySessionResponse(
                success=False,
                message=f"Failed to add thread: {str(e)}"
            )

    async def archive_session(self, session_id: str) -> EtymologySessionResponse:
        """
        Archive an etymology session.

        Args:
            session_id: Session identifier

        Returns:
            EtymologySessionResponse with archived session
        """
        try:
            update_request = EtymologySessionUpdateRequest(
                session_id=session_id,
                status=EtymologySessionStatus.ARCHIVED
            )

            response = await self.update_session(update_request)

            if response.success:
                logger.info(f"Archived etymology session {session_id}")

            return response

        except Exception as e:
            logger.error(f"Error archiving session {session_id}: {e}")
            return EtymologySessionResponse(
                success=False,
                message=f"Failed to archive session: {str(e)}"
            )

    async def delete_session(self, session_id: str) -> bool:
        """
        Delete an etymology session (simple hard delete without cascade).

        ⚠️ Use delete_session_cascade() for proper cleanup of related data.
        This method only deletes the session document and cache.

        Args:
            session_id: Session identifier

        Returns:
            True if deleted successfully
        """
        try:
            # Delete from MongoDB
            result = self.collection.delete_one({"session_id": session_id})

            # Delete from Redis cache
            self.redis_client.delete(self._redis_session_key(session_id))

            logger.info(f"Deleted etymology session {session_id} (no cascade)")
            return result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error deleting session {session_id}: {e}")
            return False

    async def delete_session_cascade(self, session_id: str) -> bool:
        """
        Permanently delete session with CASCADE cleanup of all related data.

        Deletion order (important for referential integrity):
        1. Load session to get thread_ids and related data
        2. Delete thread messages from conversations collection
        3. Delete session document from MongoDB
        4. Clear all Redis cache entries
        5. Remove from user's session set

        Note: Does NOT delete Graphiti communities/episodes as they may be
        referenced by other sessions or have independent value in the knowledge graph.

        Args:
            session_id: Session identifier

        Returns:
            True if successfully deleted (False if session not found)
        """
        try:
            # Step 1: Load session to access relationships
            session = await self.get_session(session_id)
            if not session:
                logger.warning(f"Session {session_id} not found for cascade deletion")
                return False

            logger.info(
                f"CASCADE DELETE: Session {session_id} with "
                f"{len(session.thread_ids)} threads, "
                f"{len(session.communities_created)} communities"
            )

            # Step 2: Delete all linked threads from BOTH conversation collections
            from shared.database.conversation_service import ConversationService

            conv_service = ConversationService()
            total_messages = 0
            if session.thread_ids:
                for thread_id in session.thread_ids:
                    result = await conv_service.delete_thread(thread_id)
                    deleted_count = result.get("turns_deleted", 0)
                    total_messages += deleted_count
                    logger.info(f"  Deleted {deleted_count} messages from thread {thread_id}")

            # Step 3: Delete session document from MongoDB
            delete_result = self.collection.delete_one({"session_id": session_id})

            # Step 4: Clear Redis cache for session
            self.redis_client.delete(self._redis_session_key(session_id))

            # Step 5: Remove from user's session set in Redis
            if session.user_id:
                self.redis_client.srem(
                    self._redis_user_sessions_key(session.user_id),
                    session_id
                )

            logger.info(
                f"✅ CASCADE DELETE completed: Session {session_id}, "
                f"{len(session.thread_ids)} threads, {total_messages} messages deleted"
            )

            return delete_result.deleted_count > 0

        except Exception as e:
            logger.error(f"Error in cascade delete for session {session_id}: {e}")
            return False
