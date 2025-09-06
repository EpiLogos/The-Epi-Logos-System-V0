"""
MongoDB Conversation Management Implementation

MongoDB-based conversation history persistence for long-term context and
cross-persona context sharing within conversations.

Supports context evolution tracking across persona switches and provides
conversation history for session restoration and analysis.
"""

import logging
import certifi
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from pymongo import DESCENDING
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ConversationTurn(BaseModel):
    """
    Single turn in a conversation between user and orchestrator.
    
    Represents one interaction cycle with user message and agent response,
    including persona and context information.
    """
    turn_id: str
    session_id: str
    conversation_id: str
    user_id: str
    
    # Turn content
    user_message: str
    agent_response: str
    persona: str
    
    # Context and metadata
    context_used: Optional[Dict[str, Any]] = None
    bimba_coordinates: List[str] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Response metadata
    response_time_ms: Optional[int] = None
    token_count: Optional[int] = None
    error: Optional[str] = None
    
    # Tracking
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ConversationSummary(BaseModel):
    """
    Summary of a conversation for efficient context loading.
    
    Contains key themes, topics, and context evolution across
    the conversation lifecycle.
    """
    conversation_id: str
    session_id: str
    user_id: str
    
    # Summary content
    key_topics: List[str] = Field(default_factory=list)
    main_themes: List[str] = Field(default_factory=list)
    personas_used: List[str] = Field(default_factory=list)
    bimba_coordinates: List[str] = Field(default_factory=list)
    
    # Conversation stats
    turn_count: int = 0
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Context evolution
    context_evolution: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Summary metadata
    summary_generated_at: Optional[datetime] = None
    auto_generated: bool = True


class ConversationManager:
    """
    Manages MongoDB-based conversation history persistence.
    
    Provides conversation turn storage, context evolution tracking,
    and conversation summary generation for efficient context loading
    in persona workflows.
    """
    
    def __init__(self, mongodb_url: str, database_name: str = "epi_logos_conversations"):
        """Initialize ConversationManager with MongoDB connection"""
        self.mongodb_url = mongodb_url
        self.database_name = database_name
        
        # MongoDB components (initialized lazily)
        self.client: Optional[AsyncIOMotorClient] = None
        self.database: Optional[AsyncIOMotorDatabase] = None
        self.turns_collection: Optional[AsyncIOMotorCollection] = None
        self.summaries_collection: Optional[AsyncIOMotorCollection] = None
        
        logger.info(f"ConversationManager initialized for database: {database_name}")
    
    async def _get_database(self) -> AsyncIOMotorDatabase:
        """Get or create MongoDB database connection"""
        if self.client is None:
            # Configure SSL for MongoDB Atlas
            self.client = AsyncIOMotorClient(
                self.mongodb_url,
                tlsCAFile=certifi.where()
            )
            self.database = self.client[self.database_name]
            self.turns_collection = self.database.conversation_turns
            self.summaries_collection = self.database.conversation_summaries

            # Create indexes for efficient queries
            await self._create_indexes()

        return self.database
    
    async def _create_indexes(self):
        """Create MongoDB indexes for efficient queries"""
        try:
            # Indexes for conversation turns
            await self.turns_collection.create_index([("conversation_id", 1), ("timestamp", DESCENDING)])
            await self.turns_collection.create_index([("session_id", 1), ("timestamp", DESCENDING)]) 
            await self.turns_collection.create_index([("user_id", 1), ("timestamp", DESCENDING)])
            await self.turns_collection.create_index("turn_id", unique=True)
            
            # Indexes for conversation summaries
            await self.summaries_collection.create_index("conversation_id", unique=True)
            await self.summaries_collection.create_index([("user_id", 1), ("last_activity", DESCENDING)])
            
            logger.info("MongoDB indexes created successfully")
            
        except Exception as e:
            logger.warning(f"Error creating MongoDB indexes: {e}")
    
    async def add_interaction(
        self,
        session_id: str,
        user_message: str,
        agent_response: str,
        persona: str,
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        context_used: Optional[Dict[str, Any]] = None,
        bimba_coordinates: Optional[List[str]] = None,
        response_time_ms: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> ConversationTurn:
        """
        Add a new interaction turn to the conversation history.
        
        Stores user message, agent response, and associated context
        for future retrieval and analysis.
        """
        try:
            await self._get_database()
            
            # Generate unique turn ID
            import uuid
            turn_id = str(uuid.uuid4())
            
            # Use session_id as conversation_id if not provided
            if not conversation_id:
                conversation_id = session_id
            
            # Create conversation turn
            turn = ConversationTurn(
                turn_id=turn_id,
                session_id=session_id,
                conversation_id=conversation_id,
                user_id=user_id or "unknown",
                user_message=user_message,
                agent_response=agent_response,
                persona=persona,
                context_used=context_used,
                bimba_coordinates=bimba_coordinates or [],
                response_time_ms=response_time_ms,
                metadata=metadata or {}
            )
            
            # Store in MongoDB
            await self.turns_collection.insert_one(turn.model_dump())
            
            # Update conversation summary
            await self._update_conversation_summary(turn)
            
            logger.debug(f"Added conversation turn {turn_id} for session {session_id}")
            
            return turn
            
        except Exception as e:
            logger.error(f"Error adding interaction to conversation: {e}")
            raise
    
    async def get_conversation_history(
        self,
        conversation_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[ConversationTurn]:
        """
        Get conversation history for a specific conversation.
        
        Returns turns in chronological order (oldest first).
        """
        try:
            await self._get_database()
            
            cursor = self.turns_collection.find(
                {"conversation_id": conversation_id}
            ).sort("timestamp", 1).skip(offset).limit(limit)
            
            turns = []
            async for turn_doc in cursor:
                turns.append(ConversationTurn(**turn_doc))
            
            logger.debug(f"Retrieved {len(turns)} turns for conversation {conversation_id}")
            
            return turns
            
        except Exception as e:
            logger.error(f"Error getting conversation history for {conversation_id}: {e}")
            return []
    
    async def get_session_history(
        self,
        session_id: str,
        limit: int = 50
    ) -> List[ConversationTurn]:
        """
        Get conversation history for a specific session.
        
        Returns recent turns in reverse chronological order (newest first).
        """
        try:
            await self._get_database()
            
            cursor = self.turns_collection.find(
                {"session_id": session_id}
            ).sort("timestamp", DESCENDING).limit(limit)
            
            turns = []
            async for turn_doc in cursor:
                turns.append(ConversationTurn(**turn_doc))
            
            logger.debug(f"Retrieved {len(turns)} turns for session {session_id}")
            
            return turns
            
        except Exception as e:
            logger.error(f"Error getting session history for {session_id}: {e}")
            return []
    
    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[ConversationSummary]:
        """
        Get conversation summaries for a user.
        
        Returns recent conversations in reverse chronological order.
        """
        try:
            await self._get_database()
            
            cursor = self.summaries_collection.find(
                {"user_id": user_id}
            ).sort("last_activity", DESCENDING).limit(limit)
            
            summaries = []
            async for summary_doc in cursor:
                summaries.append(ConversationSummary(**summary_doc))
            
            logger.debug(f"Retrieved {len(summaries)} conversation summaries for user {user_id}")
            
            return summaries
            
        except Exception as e:
            logger.error(f"Error getting user conversations for {user_id}: {e}")
            return []
    
    async def _update_conversation_summary(self, turn: ConversationTurn):
        """Update conversation summary with new turn information"""
        try:
            # Get existing summary or create new one
            existing_summary = await self.summaries_collection.find_one(
                {"conversation_id": turn.conversation_id}
            )
            
            if existing_summary:
                summary = ConversationSummary(**existing_summary)
            else:
                summary = ConversationSummary(
                    conversation_id=turn.conversation_id,
                    session_id=turn.session_id,
                    user_id=turn.user_id,
                    start_time=turn.timestamp
                )
            
            # Update summary with turn information
            summary.turn_count += 1
            summary.last_activity = turn.timestamp
            
            # Track persona usage
            if turn.persona not in summary.personas_used:
                summary.personas_used.append(turn.persona)
            
            # Merge Bimba coordinates
            for coord in turn.bimba_coordinates:
                if coord not in summary.bimba_coordinates:
                    summary.bimba_coordinates.append(coord)
            
            # Add context evolution entry
            if turn.context_used:
                context_entry = {
                    'turn_id': turn.turn_id,
                    'persona': turn.persona,
                    'timestamp': turn.timestamp.isoformat(),
                    'context_keys': list(turn.context_used.keys()) if turn.context_used else []
                }
                summary.context_evolution.append(context_entry)
            
            # Simple topic extraction (can be enhanced with NLP)
            user_words = turn.user_message.lower().split()
            for word in user_words:
                if len(word) > 4 and word not in summary.key_topics:
                    summary.key_topics.append(word)
                    if len(summary.key_topics) > 20:  # Limit topic count
                        summary.key_topics = summary.key_topics[-20:]
            
            # Update or insert summary
            await self.summaries_collection.replace_one(
                {"conversation_id": turn.conversation_id},
                summary.model_dump(),
                upsert=True
            )
            
        except Exception as e:
            logger.error(f"Error updating conversation summary: {e}")
    
    async def get_conversation_summary(
        self, 
        conversation_id: str
    ) -> Optional[ConversationSummary]:
        """Get summary for a specific conversation"""
        try:
            await self._get_database()
            
            summary_doc = await self.summaries_collection.find_one(
                {"conversation_id": conversation_id}
            )
            
            if summary_doc:
                return ConversationSummary(**summary_doc)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting conversation summary for {conversation_id}: {e}")
            return None
    
    async def search_conversations(
        self,
        user_id: str,
        query: str,
        limit: int = 10
    ) -> List[ConversationTurn]:
        """
        Search conversations by text content.
        
        Basic text search in user messages and agent responses.
        """
        try:
            await self._get_database()
            
            # Simple text search (can be enhanced with full-text search indexes)
            search_filter = {
                "user_id": user_id,
                "$or": [
                    {"user_message": {"$regex": query, "$options": "i"}},
                    {"agent_response": {"$regex": query, "$options": "i"}}
                ]
            }
            
            cursor = self.turns_collection.find(search_filter).sort(
                "timestamp", DESCENDING
            ).limit(limit)
            
            results = []
            async for turn_doc in cursor:
                results.append(ConversationTurn(**turn_doc))
            
            logger.debug(f"Found {len(results)} turns matching query '{query}' for user {user_id}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching conversations: {e}")
            return []
    
    async def get_persona_usage_stats(self, user_id: str) -> Dict[str, Any]:
        """Get statistics about persona usage for a user"""
        try:
            await self._get_database()
            
            # Aggregate persona usage
            pipeline = [
                {"$match": {"user_id": user_id}},
                {"$group": {
                    "_id": "$persona",
                    "count": {"$sum": 1},
                    "last_used": {"$max": "$timestamp"}
                }},
                {"$sort": {"count": -1}}
            ]
            
            persona_stats = {}
            async for result in self.turns_collection.aggregate(pipeline):
                persona_stats[result["_id"]] = {
                    "usage_count": result["count"],
                    "last_used": result["last_used"]
                }
            
            return persona_stats
            
        except Exception as e:
            logger.error(f"Error getting persona usage stats for {user_id}: {e}")
            return {}
    
    async def cleanup_old_conversations(self, days_old: int = 90) -> int:
        """
        Clean up conversations older than specified days.
        
        Returns count of conversations cleaned up.
        """
        try:
            await self._get_database()
            
            cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_old)
            
            # Delete old turns
            turns_result = await self.turns_collection.delete_many(
                {"timestamp": {"$lt": cutoff_date}}
            )
            
            # Delete old summaries
            summaries_result = await self.summaries_collection.delete_many(
                {"last_activity": {"$lt": cutoff_date}}
            )
            
            total_cleaned = turns_result.deleted_count + summaries_result.deleted_count
            
            logger.info(
                f"Cleaned up {turns_result.deleted_count} turns and "
                f"{summaries_result.deleted_count} summaries older than {days_old} days"
            )
            
            return total_cleaned
            
        except Exception as e:
            logger.error(f"Error cleaning up old conversations: {e}")
            return 0
    
    async def get_conversation_metrics(self) -> Dict[str, Any]:
        """Get metrics about conversation storage"""
        try:
            await self._get_database()
            
            # Count documents
            turns_count = await self.turns_collection.count_documents({})
            summaries_count = await self.summaries_collection.count_documents({})
            
            # Get database stats
            db_stats = await self.database.command("dbStats")
            
            return {
                'total_conversation_turns': turns_count,
                'total_conversation_summaries': summaries_count,
                'database_size_bytes': db_stats.get('dataSize', 0),
                'storage_size_bytes': db_stats.get('storageSize', 0),
                'mongodb_connected': True
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation metrics: {e}")
            return {
                'total_conversation_turns': 0,
                'total_conversation_summaries': 0,
                'mongodb_connected': False,
                'error': str(e)
            }
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("ConversationManager MongoDB connection closed")