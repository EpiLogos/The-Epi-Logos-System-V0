"""
MongoDB Conversation Tools - REAL MongoDB integration for conversation history

This module provides REAL tools for conversation history management using MongoDB Atlas,
including conversation storage, retrieval, and analytics.
"""

import logging
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

logger = logging.getLogger(__name__)


class MongoConversationError(Exception):
    """Exception raised for MongoDB conversation-related errors"""
    pass


class RealMongoConversationClient:
    """REAL MongoDB client for conversation history management"""
    
    def __init__(self, mongo_uri: str = None, database: str = None):
        self.mongo_uri = mongo_uri or os.getenv("MONGODB_URI")
        self.database = database or os.getenv("MONGODB_DATABASE", "epilogos_db")
        
        if not self.mongo_uri:
            raise MongoConversationError("MONGODB_URI environment variable not set")
        
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        
    async def connect(self):
        """Connect to MongoDB Atlas"""
        try:
            self.client = AsyncIOMotorClient(self.mongo_uri)
            # Test connection
            await self.client.admin.command('ismaster')
            self.db = self.client[self.database]
            
            # Ensure indexes
            await self._ensure_indexes()
            
            logger.info(f"Connected to MongoDB: {self.database}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
    
    async def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
    
    async def _ensure_indexes(self):
        """Ensure required indexes exist"""
        try:
            conversations = self.db.conversations
            
            # Index on session_id for fast lookups
            await conversations.create_index("session_id")
            
            # Index on user_id for user-specific queries
            await conversations.create_index("user_id")
            
            # Compound index on user_id and created_at for chronological queries
            await conversations.create_index([("user_id", 1), ("created_at", -1)])
            
            # Index on persona for persona-specific analytics
            await conversations.create_index("persona")
            
            logger.info("MongoDB indexes ensured")
            
        except Exception as e:
            logger.warning(f"Could not ensure MongoDB indexes: {e}")
    
    async def create_conversation(self, session_id: str, user_id: str, persona: str = "system", metadata: Dict[str, Any] = None) -> str:
        """Create a new conversation record"""
        try:
            conversation_doc = {
                'session_id': session_id,
                'user_id': user_id,
                'persona': persona,
                'created_at': datetime.now(timezone.utc),
                'updated_at': datetime.now(timezone.utc),
                'messages': [],
                'metadata': metadata or {},
                'status': 'active'
            }
            
            result = await self.db.conversations.insert_one(conversation_doc)
            conversation_id = str(result.inserted_id)
            
            logger.info(f"Created conversation: {conversation_id} for session {session_id}")
            return conversation_id
            
        except Exception as e:
            logger.error(f"Error creating conversation: {e}")
            raise MongoConversationError(f"Failed to create conversation: {e}")
    
    async def add_message(self, session_id: str, message: Dict[str, Any]) -> bool:
        """Add a message to a conversation"""
        try:
            # Prepare message with timestamp and ID
            message_doc = {
                '_id': str(ObjectId()),
                'timestamp': datetime.now(timezone.utc),
                'role': message.get('role', 'user'),
                'content': message.get('content', ''),
                'metadata': message.get('metadata', {}),
                'tools_used': message.get('tools_used', []),
                'persona': message.get('persona'),
                'model_config': message.get('model_config')
            }
            
            # Find conversation by session_id and add message
            result = await self.db.conversations.update_one(
                {'session_id': session_id},
                {
                    '$push': {'messages': message_doc},
                    '$set': {'updated_at': datetime.now(timezone.utc)}
                }
            )
            
            if result.matched_count == 0:
                # Try to create a conversation if it doesn't exist
                try:
                    await self.create_conversation(
                        session_id=session_id,
                        user_id=message.get('user_id', 'unknown'),
                        persona=message.get('persona', 'system')
                    )
                    # Retry adding message
                    result = await self.db.conversations.update_one(
                        {'session_id': session_id},
                        {
                            '$push': {'messages': message_doc},
                            '$set': {'updated_at': datetime.now(timezone.utc)}
                        }
                    )
                except Exception as create_error:
                    logger.warning(f"Could not create conversation for session {session_id}: {create_error}")
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error adding message to session {session_id}: {e}")
            return False
    
    async def get_conversation_history(self, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get conversation history for a session"""
        try:
            conversation = await self.db.conversations.find_one(
                {'session_id': session_id},
                {'messages': {'$slice': -limit}}
            )
            
            if conversation and 'messages' in conversation:
                return conversation['messages']
            return []
            
        except Exception as e:
            logger.error(f"Error getting conversation history for {session_id}: {e}")
            return []
    
    async def get_user_conversations(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get all conversations for a user"""
        try:
            cursor = self.db.conversations.find(
                {'user_id': user_id},
                {'messages': 0}  # Exclude messages for overview
            ).sort('created_at', -1).limit(limit)
            
            conversations = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for conv in conversations:
                conv['_id'] = str(conv['_id'])
                
            return conversations
            
        except Exception as e:
            logger.error(f"Error getting user conversations for {user_id}: {e}")
            return []
    
    async def search_conversations(self, user_id: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search conversations by content"""
        try:
            # Text search in message content
            search_filter = {
                'user_id': user_id,
                'messages.content': {'$regex': query, '$options': 'i'}
            }
            
            cursor = self.db.conversations.find(
                search_filter
            ).sort('updated_at', -1).limit(limit)
            
            conversations = []
            async for conv in cursor:
                # Find matching messages
                matching_messages = []
                for msg in conv.get('messages', []):
                    if query.lower() in msg.get('content', '').lower():
                        matching_messages.append(msg)
                
                conv['_id'] = str(conv['_id'])
                conv['matching_messages'] = matching_messages[:5]  # Include up to 5 matching messages
                del conv['messages']  # Remove full message history
                conversations.append(conv)
            
            return conversations
            
        except Exception as e:
            logger.error(f"Error searching conversations for {user_id}: {e}")
            return []
    
    async def get_conversation_analytics(self, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get conversation analytics for a user"""
        try:
            since_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Aggregation pipeline for analytics
            pipeline = [
                {
                    '$match': {
                        'user_id': user_id,
                        'created_at': {'$gte': since_date}
                    }
                },
                {
                    '$group': {
                        '_id': None,
                        'total_conversations': {'$sum': 1},
                        'personas_used': {'$addToSet': '$persona'},
                        'avg_messages_per_conversation': {'$avg': {'$size': '$messages'}},
                        'total_messages': {'$sum': {'$size': '$messages'}}
                    }
                }
            ]
            
            result = await self.db.conversations.aggregate(pipeline).to_list(length=1)
            
            if result:
                analytics = result[0]
                analytics['period_days'] = days
                analytics['user_id'] = user_id
                del analytics['_id']
                return analytics
            
            return {
                'user_id': user_id,
                'period_days': days,
                'total_conversations': 0,
                'personas_used': [],
                'avg_messages_per_conversation': 0,
                'total_messages': 0
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation analytics for {user_id}: {e}")
            return {}
    
    async def get_persona_usage(self, user_id: str, days: int = 30) -> Dict[str, int]:
        """Get persona usage statistics"""
        try:
            since_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            pipeline = [
                {
                    '$match': {
                        'user_id': user_id,
                        'created_at': {'$gte': since_date}
                    }
                },
                {
                    '$group': {
                        '_id': '$persona',
                        'count': {'$sum': 1}
                    }
                }
            ]
            
            result = await self.db.conversations.aggregate(pipeline).to_list(length=None)
            
            usage = {}
            for item in result:
                usage[item['_id']] = item['count']
            
            return usage
            
        except Exception as e:
            logger.error(f"Error getting persona usage for {user_id}: {e}")
            return {}
    
    async def update_conversation_metadata(self, session_id: str, metadata: Dict[str, Any]) -> bool:
        """Update conversation metadata"""
        try:
            result = await self.db.conversations.update_one(
                {'session_id': session_id},
                {
                    '$set': {
                        'metadata': metadata,
                        'updated_at': datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error updating conversation metadata for {session_id}: {e}")
            return False
    
    async def archive_conversation(self, session_id: str) -> bool:
        """Archive a conversation"""
        try:
            result = await self.db.conversations.update_one(
                {'session_id': session_id},
                {
                    '$set': {
                        'status': 'archived',
                        'archived_at': datetime.now(timezone.utc),
                        'updated_at': datetime.now(timezone.utc)
                    }
                }
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error archiving conversation {session_id}: {e}")
            return False


# Async functions for tool integration
async def add_message_sync(session_id: str, message: Dict[str, Any], mongo_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL message addition using MongoDB"""
    
    # Use real MongoDB client if provided, otherwise create one
    if isinstance(mongo_client, RealMongoConversationClient):
        client = mongo_client
    else:
        client = RealMongoConversationClient()
        await client.connect()
    
    try:
        success = await client.add_message(session_id, message)
        return {
            'success': success,
            'session_id': session_id,
            'message_preview': message.get('content', '')[:100],
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'source': 'real_mongodb'
        }
    except Exception as e:
        logger.error(f"Real MongoDB message addition error: {e}")
        return {
            'success': False,
            'error': str(e),
            'session_id': session_id
        }
    finally:
        # Close client if we created it
        if not isinstance(mongo_client, RealMongoConversationClient):
            await client.close()


async def get_conversation_history_sync(session_id: str, limit: int = 50, mongo_client: Optional[Any] = None) -> Dict[str, Any]:
    """REAL conversation history retrieval using MongoDB"""
    
    # Use real MongoDB client if provided, otherwise create one
    if isinstance(mongo_client, RealMongoConversationClient):
        client = mongo_client
    else:
        client = RealMongoConversationClient()
        await client.connect()
    
    try:
        history = await client.get_conversation_history(session_id, limit)
        return {
            'success': True,
            'session_id': session_id,
            'messages': history,
            'count': len(history),
            'source': 'real_mongodb'
        }
    except Exception as e:
        logger.error(f"Real MongoDB conversation history error: {e}")
        return {
            'success': False,
            'error': str(e),
            'session_id': session_id,
            'messages': []
        }
    finally:
        # Close client if we created it
        if not isinstance(mongo_client, RealMongoConversationClient):
            await client.close()


# Factory function to create a real MongoDB client
async def create_mongo_conversation_client() -> RealMongoConversationClient:
    """Create and connect a real MongoDB conversation client"""
    client = RealMongoConversationClient()
    connected = await client.connect()
    if not connected:
        raise MongoConversationError("Failed to connect to MongoDB")
    return client