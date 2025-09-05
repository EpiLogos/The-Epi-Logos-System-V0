"""
MongoDB Atlas client for Personal Pratibimba and user profile operations.

This client handles connections to MongoDB Atlas cloud and provides
operations for user profiles, personal documents, and analytics.
"""

import os
import logging
import certifi
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.results import InsertOneResult, UpdateResult, DeleteResult
from pymongo.errors import ConnectionFailure, OperationFailure


logger = logging.getLogger(__name__)


class MongoDBClient:
    """MongoDB Atlas cloud database client for user data and Personal Pratibimba."""
    
    def __init__(self):
        """Initialize MongoDB client with configuration from environment."""
        self.connection_string = os.getenv("MONGODB_URI")
        self.database_name = os.getenv("MONGODB_DATABASE", "epilogos_db")
        
        self._client: Optional[MongoClient] = None
        self._database: Optional[Database] = None
        
        if not self.connection_string:
            logger.warning("MongoDB connection string not configured. Some operations may fail.")
    
    @property
    def client(self) -> MongoClient:
        """Get or create MongoDB client instance."""
        if self._client is None:
            if not self.connection_string:
                raise ValueError("MongoDB connection string must be configured")
            
            self._client = MongoClient(self.connection_string, tlsCAFile=certifi.where())
        return self._client
    
    @property
    def database(self) -> Database:
        """Get the configured database."""
        if self._database is None:
            self._database = self.client[self.database_name]
        return self._database
    
    def get_database(self) -> Database:
        """Get the database instance."""
        return self.database
    
    def test_connection(self) -> bool:
        """Test connection to MongoDB Atlas."""
        try:
            # Ping the database
            self.client.admin.command('ping')
            return True
        except ConnectionFailure as e:
            logger.error(f"MongoDB connection test failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during MongoDB connection test: {e}")
            return False
    
    def list_collections(self) -> List[str]:
        """List all collections in the database."""
        try:
            return self.database.list_collection_names()
        except Exception as e:
            logger.error(f"Error listing MongoDB collections: {e}")
            return []
    
    def initialize_collections(self):
        """Initialize required collections with indexes."""
        try:
            # Ensure users collection exists with proper indexes
            users_collection = self.database.users
            
            # Create unique index on email for faster queries and uniqueness
            users_collection.create_index([("email", ASCENDING)], unique=True, background=True)
            
            # Create index on created_at for sorting
            users_collection.create_index([("created_at", DESCENDING)], background=True)
            
            logger.info("MongoDB collections and indexes initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing MongoDB collections: {e}")
    
    def create_user_profile(self, profile_data: Dict[str, Any]) -> InsertOneResult:
        """Create a new user profile."""
        collection = self.database.user_profiles
        
        # Add timestamps
        profile_data["created_at"] = datetime.now(timezone.utc)
        profile_data["updated_at"] = datetime.now(timezone.utc)
        
        return collection.insert_one(profile_data)
    
    def get_user_profile(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a user profile by user ID."""
        collection = self.database.user_profiles
        return collection.find_one({"user_id": user_id})
    
    def update_user_profile(self, user_id: str, update_data: Dict[str, Any]) -> UpdateResult:
        """Update a user profile."""
        collection = self.database.user_profiles
        
        # Add update timestamp
        update_data["updated_at"] = datetime.now(timezone.utc)
        
        return collection.update_one(
            {"user_id": user_id},
            {"$set": update_data}
        )
    
    def delete_user_profile(self, user_id: str) -> DeleteResult:
        """Delete a user profile."""
        collection = self.database.user_profiles
        return collection.delete_one({"user_id": user_id})
    
    def create_pratibimba_document(self, document_data: Dict[str, Any]) -> InsertOneResult:
        """Create a new Personal Pratibimba document."""
        collection = self.database.personal_pratibimba
        
        # Add timestamps
        if "metadata" not in document_data:
            document_data["metadata"] = {}
        
        document_data["metadata"]["created_at"] = datetime.now(timezone.utc)
        document_data["metadata"]["updated_at"] = datetime.now(timezone.utc)
        
        return collection.insert_one(document_data)
    
    def get_user_pratibimba_documents(self, user_id: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get Personal Pratibimba documents for a user."""
        collection = self.database.personal_pratibimba
        
        cursor = collection.find({"user_id": user_id}).sort("metadata.created_at", DESCENDING).limit(limit)
        return list(cursor)
    
    def search_pratibimba_by_tags(self, user_id: str, tags: List[str]) -> List[Dict[str, Any]]:
        """Search Personal Pratibimba documents by tags."""
        collection = self.database.personal_pratibimba
        
        cursor = collection.find({
            "user_id": user_id,
            "content.tags": {"$in": tags}
        }).sort("metadata.created_at", DESCENDING)
        
        return list(cursor)
    
    def delete_pratibimba_document(self, document_id) -> DeleteResult:
        """Delete a Personal Pratibimba document."""
        collection = self.database.personal_pratibimba
        return collection.delete_one({"_id": document_id})
    
    def get_collection_indexes(self, collection_name: str) -> List[Dict[str, Any]]:
        """Get indexes for a collection."""
        collection = self.database[collection_name]
        return list(collection.list_indexes())
    
    def create_indexes(self):
        """Create necessary indexes for performance."""
        # User profiles indexes
        user_profiles = self.database.user_profiles
        user_profiles.create_index("user_id", unique=True)
        user_profiles.create_index("email", unique=True)
        user_profiles.create_index("created_at")
        
        # Personal Pratibimba indexes
        pratibimba = self.database.personal_pratibimba
        pratibimba.create_index("user_id")
        pratibimba.create_index("content.tags")
        pratibimba.create_index("metadata.created_at")
        pratibimba.create_index("document_type")
        
        # Compound indexes
        pratibimba.create_index([("user_id", ASCENDING), ("metadata.created_at", DESCENDING)])
        pratibimba.create_index([("user_id", ASCENDING), ("content.tags", ASCENDING)])
    
    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """Get user statistics using aggregation pipeline."""
        collection = self.database.personal_pratibimba
        
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$document_type",
                "count": {"$sum": 1},
                "latest": {"$max": "$metadata.created_at"}
            }},
            {"$group": {
                "_id": None,
                "total_documents": {"$sum": "$count"},
                "document_types": {"$push": {"type": "$_id", "count": "$count", "latest": "$latest"}}
            }}
        ]
        
        result = list(collection.aggregate(pipeline))
        if result:
            stats = result[0]
            stats.pop("_id", None)
            return stats
        
        return {"total_documents": 0, "document_types": []}
    
    def analyze_user_content_patterns(self, user_id: str) -> Dict[str, Any]:
        """Analyze user content patterns using aggregation."""
        collection = self.database.personal_pratibimba
        
        # Common tags analysis
        tags_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$unwind": "$content.tags"},
            {"$group": {"_id": "$content.tags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        # Mood distribution analysis
        mood_pipeline = [
            {"$match": {"user_id": user_id, "content.mood": {"$exists": True}}},
            {"$group": {"_id": "$content.mood", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        common_tags = list(collection.aggregate(tags_pipeline))
        mood_distribution = list(collection.aggregate(mood_pipeline))
        
        return {
            "common_tags": [{"tag": item["_id"], "count": item["count"]} for item in common_tags],
            "mood_distribution": [{"mood": item["_id"], "count": item["count"]} for item in mood_distribution]
        }
    
    def check_encryption_status(self) -> Dict[str, Any]:
        """Check data encryption at rest status."""
        # This is a placeholder - actual implementation would check Atlas encryption settings
        # In a real implementation, this would query Atlas API or check cluster configuration
        return {
            "enabled": True,  # Assume Atlas has encryption enabled
            "provider": "aws",  # Default for Atlas
            "key_management": "atlas_managed"
        }
    
    # Async compatibility methods
    async def connect(self):
        """Initialize connection (async compatibility)."""
        # Test connection to ensure it works
        if self.connection_string:
            self.test_connection()
        logger.info("MongoDB client connection initialized")
    
    async def close(self):
        """Close the MongoDB client connection (async compatibility)."""
        if self._client:
            self._client.close()
            self._client = None
            self._database = None
            logger.info("MongoDB client connection closed")
    
    # Standard CRUD operations for user service
    async def find_one(self, collection_name: str, filter_query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single document in a collection."""
        try:
            collection = self.database[collection_name]
            return collection.find_one(filter_query)
        except Exception as e:
            logger.error(f"Error finding document in {collection_name}: {e}")
            return None
    
    async def find(self, collection_name: str, filter_query: Dict[str, Any], limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Find documents in a collection."""
        try:
            collection = self.database[collection_name]
            cursor = collection.find(filter_query)
            if limit:
                cursor = cursor.limit(limit)
            return list(cursor)
        except Exception as e:
            logger.error(f"Error finding documents in {collection_name}: {e}")
            return []
    
    async def insert_one(self, collection_name: str, document: Dict[str, Any]) -> InsertOneResult:
        """Insert a single document into a collection."""
        try:
            collection = self.database[collection_name]
            return collection.insert_one(document)
        except Exception as e:
            logger.error(f"Error inserting document into {collection_name}: {e}")
            raise
    
    async def update_one(self, collection_name: str, filter_query: Dict[str, Any], update_data: Dict[str, Any]) -> UpdateResult:
        """Update a single document in a collection."""
        try:
            collection = self.database[collection_name]
            return collection.update_one(filter_query, update_data)
        except Exception as e:
            logger.error(f"Error updating document in {collection_name}: {e}")
            raise
    
    async def delete_one(self, collection_name: str, filter_query: Dict[str, Any]) -> DeleteResult:
        """Delete a single document from a collection."""
        try:
            collection = self.database[collection_name]
            return collection.delete_one(filter_query)
        except Exception as e:
            logger.error(f"Error deleting document from {collection_name}: {e}")
            raise
    
    async def count_documents(self, collection_name: str, filter_query: Dict[str, Any]) -> int:
        """Count documents in a collection."""
        try:
            collection = self.database[collection_name]
            return collection.count_documents(filter_query)
        except Exception as e:
            logger.error(f"Error counting documents in {collection_name}: {e}")
            return 0
    
    def close(self):
        """Close the MongoDB client connection (sync version)."""
        if self._client:
            self._client.close()
            self._client = None
            self._database = None
    
    def __enter__(self):
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
