"""
MongoDB implementation of UserRepository.
Provides MongoDB-specific user data persistence operations.
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from bson import ObjectId
from ..models.user import User
from .user_repository import UserRepository
from ..core.exceptions import (
    UserServiceError, ValidationError, UserNotFoundError, map_database_exception
)

logger = logging.getLogger(__name__)


class MongoUserRepository(UserRepository):
    """MongoDB implementation of the UserRepository interface."""
    
    def __init__(self, mongo_client=None):
        """
        Initialize MongoDB user repository.
        
        Args:
            mongo_client: MongoDB client instance (injected via DI)
        """
        self.mongo_client = mongo_client
        self.collection_name = "users"
    
    async def _get_mongo_client(self):
        """Get MongoDB client (lazy initialization if needed)."""
        if not self.mongo_client:
            from ..database.mongodb import get_mongodb_client
            self.mongo_client = await get_mongodb_client()
        return self.mongo_client
    
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user in MongoDB.
        
        Args:
            user_data: Dictionary containing user information
            
        Returns:
            Dictionary with creation result including user ID
            
        Raises:
            ValidationError: If user data is invalid or email already exists
            UserServiceError: If creation fails
        """
        try:
            mongo_client = await self._get_mongo_client()
            
            # Add timestamps
            now = datetime.now(timezone.utc)
            user_data.update({
                "createdAt": now,
                "lastLoginAt": now,
                "lastActiveAt": now
            })
            
            # Validate required fields
            if not user_data.get("email"):
                raise ValidationError(
                    "Email is required",
                    field_errors={"email": ["Email address is required"]}
                )
            
            # Normalize email
            user_data["email"] = user_data["email"].lower().strip()
            
            # Insert user document
            result = await mongo_client.insert_one(self.collection_name, user_data)
            
            logger.info(f"Created user {user_data['email']} with ID {result.inserted_id}")
            
            return {
                "inserted_id": str(result.inserted_id),
                "acknowledged": result.acknowledged
            }
            
        except Exception as exc:
            logger.error(f"Failed to create user: {exc}")
            raise map_database_exception(exc)
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Retrieve a user by their ID.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            User object if found, None otherwise
            
        Raises:
            UserServiceError: If retrieval operation fails
        """
        try:
            mongo_client = await self._get_mongo_client()
            
            # Convert string ID to ObjectId if needed
            try:
                object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except Exception:
                logger.warning(f"Invalid user ID format: {user_id}")
                return None
            
            user_data = await mongo_client.find_one(
                self.collection_name, 
                {"_id": object_id}
            )
            
            if user_data:
                # Convert ObjectId to string for User model
                user_data["_id"] = str(user_data["_id"])
                return User(**user_data)
            
            return None
            
        except Exception as exc:
            logger.error(f"Failed to get user by ID {user_id}: {exc}")
            raise map_database_exception(exc)
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Retrieve a user by their email address.
        
        Args:
            email: User email address
            
        Returns:
            User object if found, None otherwise
            
        Raises:
            UserServiceError: If retrieval operation fails
        """
        try:
            mongo_client = await self._get_mongo_client()
            
            user_data = await mongo_client.find_one(
                self.collection_name,
                {"email": email.lower().strip()}
            )
            
            if user_data:
                # Convert ObjectId to string for User model
                user_data["_id"] = str(user_data["_id"])
                return User(**user_data)
            
            return None
            
        except Exception as exc:
            logger.error(f"Failed to get user by email {email}: {exc}")
            raise map_database_exception(exc)
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> Any:
        """
        Update user information.
        
        Args:
            user_id: Unique user identifier
            update_data: Dictionary containing fields to update
            
        Returns:
            Update result object
            
        Raises:
            UserNotFoundError: If user doesn't exist
            ValidationError: If update data is invalid
            UserServiceError: If update operation fails
        """
        try:
            mongo_client = await self._get_mongo_client()
            
            # Convert string ID to ObjectId
            try:
                object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except Exception:
                raise ValidationError(f"Invalid user ID format: {user_id}")
            
            # Remove None values and prepare update document
            filtered_data = {k: v for k, v in update_data.items() if v is not None}
            if not filtered_data:
                raise ValidationError("No valid update data provided")
            
            # Add update timestamp
            filtered_data["updatedAt"] = datetime.now(timezone.utc)
            
            # Perform update
            result = await mongo_client.update_one(
                self.collection_name,
                {"_id": object_id},
                {"$set": filtered_data}
            )
            
            if result.matched_count == 0:
                raise UserNotFoundError(f"User not found", user_id=user_id)
            
            logger.info(f"Updated user {user_id}, modified_count: {result.modified_count}")
            return result
            
        except UserNotFoundError:
            raise
        except ValidationError:
            raise
        except Exception as exc:
            logger.error(f"Failed to update user {user_id}: {exc}")
            raise map_database_exception(exc)
    
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from MongoDB.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            True if user was deleted, False otherwise
            
        Raises:
            UserNotFoundError: If user doesn't exist
            UserServiceError: If deletion fails
        """
        try:
            mongo_client = await self._get_mongo_client()
            
            # Convert string ID to ObjectId
            try:
                object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except Exception:
                raise ValidationError(f"Invalid user ID format: {user_id}")
            
            result = await mongo_client.delete_one(
                self.collection_name,
                {"_id": object_id}
            )
            
            if result.deleted_count == 0:
                raise UserNotFoundError(f"User not found", user_id=user_id)
            
            logger.info(f"Deleted user {user_id}")
            return True
            
        except UserNotFoundError:
            raise
        except Exception as exc:
            logger.error(f"Failed to delete user {user_id}: {exc}")
            raise map_database_exception(exc)
    
    async def get_user_stats(self) -> Dict[str, Any]:
        """
        Get aggregated user statistics from MongoDB.
        
        Returns:
            Dictionary containing user statistics
            
        Raises:
            UserServiceError: If statistics retrieval fails
        """
        try:
            mongo_client = await self._get_mongo_client()
            
            # Count total users
            total_users = await mongo_client.count_documents(self.collection_name, {})
            
            # Count by tier
            free_users = await mongo_client.count_documents(
                self.collection_name, 
                {"tier": "free"}
            )
            patron_users = await mongo_client.count_documents(
                self.collection_name,
                {"tier": "patron"}
            )
            
            # Count by registration source
            email_users = await mongo_client.count_documents(
                self.collection_name,
                {"metadata.registrationSource": "email"}
            )
            oauth_users = await mongo_client.count_documents(
                self.collection_name,
                {"metadata.registrationSource": "oauth"}
            )
            
            # Count verified users
            verified_users = await mongo_client.count_documents(
                self.collection_name,
                {"isEmailVerified": True}
            )
            
            # Calculate verification rate
            verification_rate = (verified_users / total_users * 100) if total_users > 0 else 0
            
            return {
                "total_users": total_users,
                "free_tier_users": free_users,
                "patron_tier_users": patron_users,
                "email_registered_users": email_users,
                "oauth_registered_users": oauth_users,
                "verified_users": verified_users,
                "verification_rate": round(verification_rate, 2)
            }
            
        except Exception as exc:
            logger.error(f"Failed to get user stats: {exc}")
            raise map_database_exception(exc)
    
    async def user_exists_by_email(self, email: str) -> bool:
        """
        Check if a user exists with the given email.
        
        Args:
            email: Email address to check
            
        Returns:
            True if user exists, False otherwise
            
        Raises:
            UserServiceError: If check operation fails
        """
        try:
            user = await self.get_user_by_email(email)
            return user is not None
            
        except Exception as exc:
            logger.error(f"Failed to check user existence by email {email}: {exc}")
            raise map_database_exception(exc)
    
    async def link_oauth_provider(
        self, 
        user_id: str, 
        provider: str, 
        provider_id: str
    ) -> bool:
        """
        Link an OAuth provider to a user account.
        
        Args:
            user_id: Unique user identifier
            provider: OAuth provider name
            provider_id: Provider user identifier
            
        Returns:
            True if successfully linked
            
        Raises:
            UserNotFoundError: If user doesn't exist
            ValidationError: If provider data is invalid
            UserServiceError: If linking fails
        """
        try:
            # Get current user to check existing providers
            user = await self.get_user_by_id(user_id)
            if not user:
                raise UserNotFoundError("User not found", user_id=user_id)
            
            # Check if provider is already linked
            for oauth_provider in user.oauthProviders:
                if oauth_provider.provider == provider:
                    logger.info(f"OAuth provider {provider} already linked for user {user_id}")
                    return True
            
            # Add new OAuth provider
            oauth_provider_data = {
                "provider": provider,
                "providerId": provider_id,
                "linkedAt": datetime.now(timezone.utc)
            }
            
            mongo_client = await self._get_mongo_client()
            object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            
            result = await mongo_client.update_one(
                self.collection_name,
                {"_id": object_id},
                {
                    "$push": {"oauthProviders": oauth_provider_data},
                    "$set": {"updatedAt": datetime.now(timezone.utc)}
                }
            )
            
            success = result.modified_count > 0
            if success:
                logger.info(f"Linked {provider} OAuth for user {user_id}")
            
            return success
            
        except UserNotFoundError:
            raise
        except Exception as exc:
            logger.error(f"Failed to link OAuth provider for user {user_id}: {exc}")
            raise map_database_exception(exc)
    
    async def unlink_oauth_provider(self, user_id: str, provider: str) -> bool:
        """
        Unlink an OAuth provider from a user account.
        
        Args:
            user_id: Unique user identifier
            provider: OAuth provider name to unlink
            
        Returns:
            True if successfully unlinked
            
        Raises:
            UserNotFoundError: If user doesn't exist
            ValidationError: If unlinking would leave user without authentication
            UserServiceError: If unlinking fails
        """
        try:
            # Get current user to validate unlinking is safe
            user = await self.get_user_by_id(user_id)
            if not user:
                raise UserNotFoundError("User not found", user_id=user_id)
            
            # Check if user has password or other OAuth providers
            has_password = bool(user.passwordHash)
            oauth_providers = [p.provider for p in user.oauthProviders]
            other_providers = [p for p in oauth_providers if p != provider]
            
            if not has_password and len(other_providers) == 0:
                raise ValidationError(
                    "Cannot remove OAuth provider. User must have password or other OAuth providers.",
                    field_errors={
                        "provider": ["Removing this provider would leave user unable to authenticate"]
                    }
                )
            
            # Remove OAuth provider
            mongo_client = await self._get_mongo_client()
            object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            
            result = await mongo_client.update_one(
                self.collection_name,
                {"_id": object_id},
                {
                    "$pull": {"oauthProviders": {"provider": provider}},
                    "$set": {"updatedAt": datetime.now(timezone.utc)}
                }
            )
            
            success = result.modified_count > 0
            if success:
                logger.info(f"Unlinked {provider} OAuth for user {user_id}")
            
            return success
            
        except UserNotFoundError:
            raise
        except ValidationError:
            raise
        except Exception as exc:
            logger.error(f"Failed to unlink OAuth provider for user {user_id}: {exc}")
            raise map_database_exception(exc)
    
    async def search_users(
        self, 
        query: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> List[User]:
        """
        Search for users matching a query.
        
        Args:
            query: Search query string
            limit: Maximum number of results
            offset: Number of results to skip
            
        Returns:
            List of User objects matching the query
            
        Raises:
            ValidationError: If query parameters are invalid
            UserServiceError: If search operation fails
        """
        try:
            if not query or not query.strip():
                raise ValidationError("Search query cannot be empty")
            
            if limit <= 0 or limit > 1000:
                raise ValidationError("Limit must be between 1 and 1000")
            
            if offset < 0:
                raise ValidationError("Offset cannot be negative")
            
            mongo_client = await self._get_mongo_client()
            
            # Create text search filter
            search_filter = {
                "$or": [
                    {"email": {"$regex": query, "$options": "i"}},
                    {"firstName": {"$regex": query, "$options": "i"}},
                    {"lastName": {"$regex": query, "$options": "i"}}
                ]
            }
            
            # Find users with pagination
            cursor = mongo_client.find(
                self.collection_name,
                search_filter
            ).skip(offset).limit(limit)
            
            users = []
            async for user_data in cursor:
                user_data["_id"] = str(user_data["_id"])
                users.append(User(**user_data))
            
            logger.info(f"Found {len(users)} users matching query: {query}")
            return users
            
        except ValidationError:
            raise
        except Exception as exc:
            logger.error(f"Failed to search users with query '{query}': {exc}")
            raise map_database_exception(exc)

    async def update_password(self, user_id: str, password_hash: str) -> bool:
        """
        Update user's password hash.
        
        Args:
            user_id: Unique user identifier
            password_hash: New password hash to set
            
        Returns:
            True if password was updated successfully
            
        Raises:
            UserNotFoundError: If user doesn't exist
            UserServiceError: If update fails
        """
        try:
            mongo_client = await self._get_mongo_client()
            
            # Convert string ID to ObjectId
            try:
                object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except Exception:
                raise ValidationError(f"Invalid user ID format: {user_id}")
            
            # Update password hash and hasPassword flag
            result = await mongo_client.update_one(
                self.collection_name,
                {"_id": object_id},
                {
                    "$set": {
                        "passwordHash": password_hash,
                        "hasPassword": True,
                        "updatedAt": datetime.now(timezone.utc)
                    }
                }
            )
            
            if result.matched_count == 0:
                raise UserNotFoundError(f"User not found", user_id=user_id)
            
            logger.info(f"Updated password for user {user_id}")
            return True
            
        except UserNotFoundError:
            raise
        except ValidationError:
            raise
        except Exception as exc:
            logger.error(f"Failed to update password for user {user_id}: {exc}")
            raise map_database_exception(exc)