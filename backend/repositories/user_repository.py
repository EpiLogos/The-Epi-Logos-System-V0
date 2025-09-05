"""
Abstract UserRepository interface.
Defines the contract for user data persistence operations.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from ..models.user import User


class UserRepository(ABC):
    """Abstract base class for user data persistence operations."""
    
    @abstractmethod
    async def create_user(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user in the data store.
        
        Args:
            user_data: Dictionary containing user information
            
        Returns:
            Dictionary with creation result including user ID
            
        Raises:
            ValidationError: If user data is invalid
            UserServiceError: If creation fails
        """
        pass
    
    @abstractmethod 
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
    async def delete_user(self, user_id: str) -> bool:
        """
        Delete a user from the data store.
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            True if user was deleted, False otherwise
            
        Raises:
            UserNotFoundError: If user doesn't exist
            UserServiceError: If deletion fails
        """
        pass
    
    @abstractmethod
    async def get_user_stats(self) -> Dict[str, Any]:
        """
        Get aggregated user statistics.
        
        Returns:
            Dictionary containing user statistics
            
        Raises:
            UserServiceError: If statistics retrieval fails
        """
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass
    
    @abstractmethod
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
        pass