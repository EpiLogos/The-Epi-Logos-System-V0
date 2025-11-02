"""
Conversation Service - Unified Dual-Write Pattern

Manages conversation persistence across two collections:
1. conversation_threads - Fast retrieval with embedded message arrays
2. conversation_turns - Individual turn documents for analytics

This service ensures consistency between both collections and provides
a clean API for conversation operations.
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo import ASCENDING, DESCENDING

from shared.database.mongodb_client import MongoDBClient
from shared.database.conversation_models import (
    ConversationThread,
    ConversationTurn,
    MessageTurn,
    ThreadSummary
)

logger = logging.getLogger(__name__)


class ConversationService:
    """Unified conversation persistence with dual-write pattern"""
    
    def __init__(self, mongo_client: Optional[MongoDBClient] = None):
        """Initialize conversation service with MongoDB client"""
        self._mongo = mongo_client or MongoDBClient()
        self.db: Database = self._mongo.get_database()
        self.threads_coll: Collection = self.db.get_collection("conversation_threads")
        self.turns_coll: Collection = self.db.get_collection("conversation_turns")
        
        # Create indexes for performance
        self._ensure_indexes()
    
    def _ensure_indexes(self):
        """Create indexes for both collections"""
        try:
            # conversation_threads indexes
            self.threads_coll.create_index([("thread_id", ASCENDING)], unique=True, background=True)
            self.threads_coll.create_index([("user_id", ASCENDING), ("last_activity", DESCENDING)], background=True)
            self.threads_coll.create_index([("context", ASCENDING), ("last_activity", DESCENDING)], background=True)
            
            # conversation_turns indexes
            self.turns_coll.create_index([("thread_id", ASCENDING), ("created_at", ASCENDING)], background=True)
            self.turns_coll.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)], background=True)
            
            logger.debug("Conversation indexes created successfully")
        except Exception as e:
            logger.warning(f"Failed to create indexes (non-fatal): {e}")
    
    async def add_turn(
        self,
        thread_id: str,
        user_id: str,
        user_message: str,
        agent_response: str,
        persona: str = "system",
        context: Optional[str] = None,
        etymology_session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        context_used: Optional[Dict[str, Any]] = None,
        pydantic_messages: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Add conversation turn with DUAL-WRITE pattern.
        
        Writes to BOTH:
        1. conversation_turns (individual document)
        2. conversation_threads (array push or create)
        
        Args:
            thread_id: Thread identifier
            user_id: User identifier
            user_message: User's message
            agent_response: Agent's response
            persona: Agent persona
            context: Coordinate context (e.g., "#5-5")
            etymology_session_id: Parent etymology session (if applicable)
            metadata: Turn metadata (execution_time_ms, etc)
            context_used: Agent context used
            pydantic_messages: Serialized Pydantic AI messages
        
        Returns:
            Dict with success status and turn info
        """
        try:
            now = datetime.now(timezone.utc)
            
            # Get current thread to determine turn number
            thread_doc = self.threads_coll.find_one({"thread_id": thread_id})
            turn_number = (len(thread_doc["messages"]) + 1) if thread_doc else 1
            
            # Serialize pydantic_messages if provided
            serialized_pydantic = None
            if pydantic_messages:
                try:
                    from pydantic_core import to_jsonable_python
                    serialized_pydantic = to_jsonable_python(pydantic_messages)
                except Exception as e:
                    logger.warning(f"Failed to serialize pydantic_messages: {e}")
            
            # WRITE 1: conversation_turns (individual document)
            turn_doc = {
                "thread_id": thread_id,
                "user_id": user_id,
                "turn_number": turn_number,
                "user_message": user_message,
                "agent_response": agent_response,
                "persona": persona,
                "metadata": metadata or {},
                "created_at": now
            }
            
            if context:
                turn_doc["context"] = context
            if context_used:
                turn_doc["context_used"] = context_used
            if serialized_pydantic:
                turn_doc["pydantic_messages"] = serialized_pydantic
            
            turn_result = self.turns_coll.insert_one(turn_doc)
            
            # WRITE 2: conversation_threads (array push or create)
            if thread_doc:
                # Thread exists - push new messages
                user_turn = MessageTurn(
                    turn_number=turn_number,
                    role="user",
                    content=user_message,
                    timestamp=now,
                    metadata=None,
                    context_used=None,
                    pydantic_messages=None
                )
                
                assistant_turn = MessageTurn(
                    turn_number=turn_number,
                    role="assistant",
                    content=agent_response,
                    timestamp=now,
                    metadata=metadata,
                    context_used=context_used,
                    pydantic_messages=serialized_pydantic
                )
                
                self.threads_coll.update_one(
                    {"thread_id": thread_id},
                    {
                        "$push": {
                            "messages": {
                                "$each": [
                                    user_turn.model_dump(mode='json'),
                                    assistant_turn.model_dump(mode='json')
                                ]
                            }
                        },
                        "$set": {"last_activity": now}
                    }
                )
            else:
                # Thread doesn't exist - create new thread document
                user_turn = MessageTurn(
                    turn_number=1,
                    role="user",
                    content=user_message,
                    timestamp=now,
                    metadata=None,
                    context_used=None,
                    pydantic_messages=None
                )
                
                assistant_turn = MessageTurn(
                    turn_number=1,
                    role="assistant",
                    content=agent_response,
                    timestamp=now,
                    metadata=metadata,
                    context_used=context_used,
                    pydantic_messages=serialized_pydantic
                )
                
                thread = ConversationThread(
                    thread_id=thread_id,
                    user_id=user_id,
                    persona=persona,
                    etymology_session_id=etymology_session_id,
                    context=context,
                    messages=[user_turn, assistant_turn],
                    created_at=now,
                    last_activity=now,
                    metadata={}
                )
                
                self.threads_coll.insert_one(thread.model_dump(mode='json'))
            
            logger.debug(f"Added turn to thread {thread_id} (turn #{turn_number})")
            
            return {
                "success": True,
                "thread_id": thread_id,
                "turn_number": turn_number,
                "turn_id": str(turn_result.inserted_id)
            }
            
        except Exception as e:
            logger.error(f"Failed to add turn to thread {thread_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_thread(self, thread_id: str) -> Optional[ConversationThread]:
        """
        Get conversation thread with all messages (fast retrieval).
        
        Args:
            thread_id: Thread identifier
        
        Returns:
            ConversationThread or None if not found
        """
        try:
            thread_doc = self.threads_coll.find_one({"thread_id": thread_id})
            if not thread_doc:
                return None
            
            # Remove MongoDB _id field
            thread_doc.pop("_id", None)
            
            return ConversationThread(**thread_doc)
            
        except Exception as e:
            logger.error(f"Failed to get thread {thread_id}: {e}")
            return None
    
    async def get_thread_messages(
        self,
        thread_id: str,
        limit: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        Get thread messages in simple role/content format.
        
        Args:
            thread_id: Thread identifier
            limit: Maximum messages to return
        
        Returns:
            List of {"role": "user|assistant", "content": "..."}
        """
        try:
            thread = await self.get_thread(thread_id)
            if not thread:
                return []
            
            messages = []
            for msg in thread.messages:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            if limit:
                messages = messages[-limit:]
            
            return messages
            
        except Exception as e:
            logger.error(f"Failed to get messages for thread {thread_id}: {e}")
            return []

    async def list_threads(
        self,
        user_id: str,
        limit: int = 50,
        page: int = 1,
        context: Optional[str] = None
    ) -> List[ThreadSummary]:
        """
        List threads for a user (fast - no aggregation needed).

        Args:
            user_id: User identifier
            limit: Maximum threads to return
            page: Page number (1-indexed)
            context: Optional coordinate context filter

        Returns:
            List of ThreadSummary objects
        """
        try:
            skip = max(0, (page - 1) * max(1, limit))

            # Build filter
            filter_query = {"user_id": user_id}
            if context:
                filter_query["context"] = context

            # Query conversation_threads directly (no aggregation!)
            cursor = self.threads_coll.find(filter_query).sort("last_activity", DESCENDING).skip(skip).limit(limit)

            threads = []
            for doc in cursor:
                # Get first user message for title
                first_user_msg = next((m for m in doc.get("messages", []) if m.get("role") == "user"), None)
                last_msg = doc.get("messages", [])[-1] if doc.get("messages") else None

                # Check for custom title in metadata
                title = doc.get("metadata", {}).get("thread_title")
                if not title and first_user_msg:
                    title = first_user_msg.get("content", "Untitled")[:100]

                threads.append(ThreadSummary(
                    thread_id=doc["thread_id"],
                    title=title or "Untitled",
                    last_message=last_msg.get("content") if last_msg else None,
                    created_at=doc["created_at"].isoformat() if doc.get("created_at") else None,
                    last_activity=doc["last_activity"].isoformat() if doc.get("last_activity") else None,
                    persona=doc.get("persona"),
                    message_count=len(doc.get("messages", []))
                ))

            return threads

        except Exception as e:
            logger.error(f"Failed to list threads for user {user_id}: {e}")
            return []

    async def delete_thread(self, thread_id: str) -> Dict[str, Any]:
        """
        Delete thread from BOTH collections.

        Args:
            thread_id: Thread identifier

        Returns:
            Dict with deletion status
        """
        try:
            # Delete from conversation_threads
            thread_result = self.threads_coll.delete_one({"thread_id": thread_id})

            # Delete from conversation_turns
            turns_result = self.turns_coll.delete_many({"thread_id": thread_id})

            logger.info(f"Deleted thread {thread_id}: {turns_result.deleted_count} turns")

            return {
                "success": True,
                "thread_id": thread_id,
                "turns_deleted": turns_result.deleted_count,
                "thread_deleted": thread_result.deleted_count > 0
            }

        except Exception as e:
            logger.error(f"Failed to delete thread {thread_id}: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def update_thread_title(self, thread_id: str, title: str) -> Dict[str, Any]:
        """
        Update thread title in metadata.

        Args:
            thread_id: Thread identifier
            title: New title

        Returns:
            Dict with update status
        """
        try:
            result = self.threads_coll.update_one(
                {"thread_id": thread_id},
                {
                    "$set": {
                        "metadata.thread_title": title,
                        "metadata.title_updated_at": datetime.now(timezone.utc)
                    }
                }
            )

            if result.modified_count == 0:
                return {
                    "success": False,
                    "error": f"Thread {thread_id} not found"
                }

            return {
                "success": True,
                "thread_id": thread_id,
                "title": title
            }

        except Exception as e:
            logger.error(f"Failed to update thread title: {e}")
            return {
                "success": False,
                "error": str(e)
            }

    async def get_pydantic_message_history(
        self,
        thread_id: str,
        max_turns: int = 10
    ) -> List[Any]:
        """
        Get Pydantic AI message history for a thread.

        Args:
            thread_id: Thread identifier
            max_turns: Maximum turns to retrieve

        Returns:
            List of Pydantic AI messages
        """
        try:
            from pydantic_ai.messages import ModelMessagesTypeAdapter

            thread = await self.get_thread(thread_id)
            if not thread:
                return []

            # Collect all Pydantic AI messages from assistant turns
            all_messages = []
            for msg in thread.messages[-max_turns * 2:]:  # *2 because user+assistant per turn
                if msg.role == "assistant" and msg.pydantic_messages:
                    stored_messages = ModelMessagesTypeAdapter.validate_python(msg.pydantic_messages)
                    all_messages.extend(stored_messages)

            return all_messages

        except Exception as e:
            logger.error(f"Failed to get Pydantic message history: {e}")
            return []

