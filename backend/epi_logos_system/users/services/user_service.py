"""
User service for user account management operations.
Handles user creation, retrieval, updates, and business logic.
"""
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

# Updated absolute imports for new domain structure
from backend.epi_logos_system.users.models.user import User, UserRegistrationRequest, UserProfileUpdateRequest
from backend.epi_logos_system.users.repositories.user_repository import UserRepository
from backend.epi_logos_system.shared.exceptions import UserNotFoundError, ValidationError, UserServiceError
from backend.epi_logos_system.auth.services.password_service import PasswordService
from backend.epi_logos_system.auth.services.jwt_service import JWTService
# Session service removed for stateless JWT architecture

logger = logging.getLogger(__name__)


class UserService:
    """Service for user account management."""
    
    def __init__(
        self, 
        user_repository: UserRepository = None,
        password_service: PasswordService = None, 
        jwt_service: JWTService = None
    ):
        """Initialize user service with dependencies."""
        # Use dependency injection if provided, otherwise create instances
        self.user_repository = user_repository  # Will be injected by container
        self.password_service = password_service or PasswordService()
        self.jwt_service = jwt_service or JWTService()
        # Session service removed for stateless JWT architecture
    
    async def create_user(
        self,
        registration_data: UserRegistrationRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new user account.
        
        Args:
            registration_data: User registration information
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            Dictionary with user data and tokens
            
        Raises:
            ValidationError: If user data is invalid or user already exists
            UserServiceError: If creation fails
        """
        try:
            # Check if user already exists
            if await self.user_repository.user_exists_by_email(registration_data.email):
                raise ValidationError(
                    "User with this email already exists",
                    field_errors={"email": ["Email address is already registered"]}
                )
            
            # Hash password if provided
            password_hash = None
            if registration_data.password:
                # Validate password strength
                is_valid, errors = self.password_service.validate_password_strength(
                    registration_data.password
                )
                if not is_valid:
                    logger.warning(f"Password validation failed for {registration_data.email}: {errors}")
                    raise ValidationError(
                        "Password validation failed",
                        field_errors={"password": errors}
                    )
                
                password_hash = await self.password_service.hash_password(
                    registration_data.password
                )
            
            # Create user data
            user_data = {
                "email": registration_data.email.lower(),
                "passwordHash": password_hash,
                "firstName": registration_data.firstName,
                "lastName": registration_data.lastName,
                "tier": "free",
                "isEmailVerified": False,
                "oauthProviders": [],
                "preferences": {
                    "notifications": True,
                    "theme": "auto",
                    "language": "en"
                },
                "metadata": {
                    "registrationSource": "oauth" if registration_data.linkOAuthAccount else "email",
                    "ipAddress": ip_address,
                    "userAgent": user_agent
                }
            }
            
            # Add OAuth provider if linking account
            if registration_data.linkOAuthAccount and registration_data.oauthProvider:
                oauth_provider = {
                    "provider": registration_data.oauthProvider,
                    "providerId": registration_data.oauthId,
                    "linkedAt": datetime.now(timezone.utc)
                }
                user_data["oauthProviders"] = [oauth_provider]
                user_data["isEmailVerified"] = True  # OAuth emails are pre-verified
            
            # Create user via repository
            result = await self.user_repository.create_user(user_data)
            user_id = result["inserted_id"]
            
            # Get created user for token generation
            user = await self.user_repository.get_user_by_id(user_id)
            if not user:
                raise UserServiceError("Failed to retrieve created user")
            
            # Generate JWT tokens (stateless authentication)
            access_token = await self.jwt_service.create_access_token(user)
            refresh_token = await self.jwt_service.create_refresh_token(user)
            
            logger.info(f"Created user {user.email} with ID {user_id}")
            
            # Return user data with tokens (no session ID in stateless JWT)
            response_data = user.to_public_dict()
            response_data.update({
                "accessToken": access_token,
                "refreshToken": refresh_token
            })
            
            return response_data
            
        except (ValidationError, UserServiceError):
            # Re-raise custom errors
            raise
        except Exception as e:
            logger.error(f"Failed to create user {registration_data.email}: {e}")
            raise UserServiceError("User creation failed") from e
    
    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User identifier
            
        Returns:
            User object if found, None otherwise
        """
        try:
            return await self.user_repository.get_user_by_id(user_id)
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {e}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        Args:
            email: User email address
            
        Returns:
            User object if found, None otherwise
        """
        try:
            return await self.user_repository.get_user_by_email(email)
        except Exception as e:
            logger.error(f"Failed to get user by email {email}: {e}")
            return None
    
    async def update_user(
        self,
        user_id: str,
        update_data: UserProfileUpdateRequest
    ) -> Optional[Dict[str, Any]]:
        """
        Update user profile information.
        
        Args:
            user_id: User identifier
            update_data: Profile update information
            
        Returns:
            Updated user data if successful, None otherwise
        """
        try:
            if not update_data.has_updates():
                raise ValidationError("No updates provided")
            
            # Build update document
            update_dict = {}
            
            if update_data.firstName is not None:
                update_dict["firstName"] = update_data.firstName
            
            if update_data.lastName is not None:
                update_dict["lastName"] = update_data.lastName
            
            if update_data.profilePicture is not None:
                update_dict["profilePicture"] = update_data.profilePicture
            
            if update_data.preferences is not None:
                update_dict["preferences"] = update_data.preferences.model_dump()

            if update_data.isAdmin is not None:
                update_dict["isAdmin"] = update_data.isAdmin

            # Update via repository
            result = await self.user_repository.update_user(user_id, update_dict)
            
            if result.modified_count == 0:
                return None
            
            # Return updated user
            updated_user = await self.get_user_by_id(user_id)
            if updated_user:
                logger.info(f"Updated user {user_id}")
                return updated_user.to_public_dict()
            
            return None
            
        except (ValidationError, UserNotFoundError):
            raise
        except Exception as e:
            logger.error(f"Failed to update user {user_id}: {e}")
            raise UserServiceError("User update failed") from e
    
    async def authenticate_user(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Authenticate user with email and password.
        
        Args:
            email: User email
            password: User password
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            Authentication data with tokens if successful, None otherwise
        """
        try:
            # Get user by email
            user = await self.get_user_by_email(email)
            if not user or not user.has_password():
                return None
            
            # Verify password
            is_valid = await self.password_service.verify_password(
                password,
                user.passwordHash
            )
            
            if not is_valid:
                logger.info(f"Failed authentication attempt for {email}")
                return None
            
            # Update last login
            user.update_last_login()
            user.update_last_active()
            
            # Update in database via repository
            await self.user_repository.update_user(
                str(user.id),
                {
                    "lastLoginAt": user.lastLoginAt,
                    "lastActiveAt": user.lastActiveAt
                }
            )
            
            # Generate tokens (stateless authentication)
            access_token = await self.jwt_service.create_access_token(user)
            refresh_token = await self.jwt_service.create_refresh_token(user)
            
            logger.info(f"Authenticated user {email}")
            
            # Return user data with tokens (no session ID in stateless JWT)
            response_data = user.to_public_dict()
            response_data.update({
                "accessToken": access_token,
                "refreshToken": refresh_token
            })
            
            return response_data
            
        except Exception as e:
            logger.error(f"Authentication failed for {email}: {e}")
            return None
    
    async def link_oauth_provider(
        self,
        user_id: str,
        provider: str,
        provider_id: str
    ) -> bool:
        """
        Link OAuth provider to user account.
        
        Args:
            user_id: User identifier
            provider: OAuth provider name
            provider_id: Provider user identifier
            
        Returns:
            True if successfully linked, False otherwise
        """
        try:
            return await self.user_repository.link_oauth_provider(
                user_id, provider, provider_id
            )
            
        except Exception as e:
            logger.error(f"Failed to link OAuth provider for user {user_id}: {e}")
            return False
    
    async def unlink_oauth_provider(
        self,
        user_id: str,
        provider: str
    ) -> bool:
        """
        Unlink OAuth provider from user account.
        
        Args:
            user_id: User identifier
            provider: OAuth provider to unlink
            
        Returns:
            True if successfully unlinked, False otherwise
        """
        try:
            return await self.user_repository.unlink_oauth_provider(user_id, provider)
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Failed to unlink OAuth provider for user {user_id}: {e}")
            return False
    
    async def setup_password_for_oauth_user(
        self,
        user_id: str,
        password: str
    ) -> Dict[str, Any]:
        """
        Set up password for OAuth user who doesn't have one.
        
        This method allows OAuth users to add password authentication
        to their account for hybrid authentication support.
        
        Args:
            user_id: User identifier
            password: Password to set up
            
        Returns:
            Dict with success status and updated user data
            
        Raises:
            UserNotFoundError: If user doesn't exist
            ValidationError: If password is invalid or user already has password
        """
        try:
            # Get user
            user = await self.user_repository.get_user_by_id(user_id)
            if not user:
                raise UserNotFoundError(f"User not found: {user_id}")
            
            # Check if user already has password
            if user.has_password():
                raise ValidationError(
                    "User already has a password. Use password change instead.",
                    field_errors={"password": ["User already has password authentication"]}
                )
            
            # Validate password strength
            is_valid, errors = self.password_service.validate_password_strength(password)
            if not is_valid:
                raise ValidationError(
                    "Password validation failed",
                    field_errors={"password": errors}
                )
            
            # Hash password
            password_hash = await self.password_service.hash_password(password)
            
            # Update user with password hash
            update_result = await self.user_repository.update_user(
                user_id,
                {"passwordHash": password_hash}
            )
            
            if not update_result:
                raise UserServiceError("Failed to update user with password")
            
            logger.info(f"Password set up for OAuth user: {user.email}")
            
            # Return updated user data (excluding sensitive info)
            updated_user = await self.user_repository.get_user_by_id(user_id)
            return {
                "success": True,
                "message": "Password set up successfully",
                "user": updated_user.to_public_dict() if updated_user else None,
                "hasPassword": True
            }
            
        except (UserNotFoundError, ValidationError):
            raise
        except Exception as e:
            logger.error(f"Failed to setup password for user {user_id}: {e}")
            raise UserServiceError(f"Password setup failed: {str(e)}")

    async def update_2fa_setting(self, user_id: str, enabled: bool) -> bool:
        """
        Update user's 2FA enabled setting.

        Args:
            user_id: User identifier
            enabled: Whether to enable or disable 2FA

        Returns:
            True if successfully updated, False otherwise

        Raises:
            UserNotFoundError: If user doesn't exist
            UserServiceError: If update fails
        """
        try:
            # Get user to verify existence
            user = await self.user_repository.get_user_by_id(user_id)
            if not user:
                raise UserNotFoundError(f"User not found: {user_id}")

            # If disabling MFA, clear secret and backup codes
            update_data = {"mfaEnabled": enabled}
            if not enabled:
                update_data.update({
                    "mfaSecret": None,
                    "backupCodes": []
                })

            # Update via repository
            result = await self.user_repository.update_user(user_id, update_data)

            if result.modified_count == 0:
                return False

            action = "enabled" if enabled else "disabled"
            logger.info(f"2FA {action} for user {user_id}")
            return True

        except UserNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to update 2FA setting for user {user_id}: {e}")
            raise UserServiceError(f"2FA update failed: {str(e)}")

    async def delete_user(self, user_id: str) -> bool:
        """
        Delete user account and associated data.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if successfully deleted, False otherwise
        """
        try:
            # In stateless JWT, no server-side sessions to terminate
            # Delete user via repository
            success = await self.user_repository.delete_user(user_id)
            
            if success:
                logger.info(f"Deleted user {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete user {user_id}: {e}")
            return False
    
    async def get_user_stats(self) -> Dict[str, Any]:
        """
        Get user statistics.
        
        Returns:
            Dictionary with user statistics
        """
        try:
            return await self.user_repository.get_user_stats()
            
        except Exception as e:
            logger.error(f"Failed to get user stats: {e}")
            return {"error": "Failed to retrieve statistics"}
    
    async def delete_user_account(self, user_id: str) -> bool:
        """
        Delete user account and all associated data.
        
        WARNING: This is irreversible and removes all user data.
        """
        try:
            # Delete user from repository
            success = await self.user_repository.delete_user(user_id)
            
            if success:
                logger.info(f"User account deleted: {user_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"Failed to delete user account {user_id}: {e}")
            return False
    
    async def export_user_data(self, user_id: str) -> dict:
        """
        Export comprehensive user data for GDPR compliance.
        
        Returns all user data in a structured format for data portability.
        """
        try:
            user = await self.user_repository.get_user_by_id(user_id)
            if not user:
                raise ValueError("User not found")
            
            # Compile comprehensive user data export
            export_data = {
                "account_info": {
                    "id": str(user.id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "tier": user.tier,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "updated_at": user.updated_at.isoformat() if user.updated_at else None,
                    "last_login": user.last_login.isoformat() if user.last_login else None
                },
                "preferences": user.preferences,
                "oauth_providers": user.oauth_providers,
                "export_timestamp": datetime.now().isoformat(),
                "export_format_version": "1.0"
            }
            
            logger.info(f"User data exported for: {user_id}")
            return export_data

        except Exception as e:
            logger.error(f"Failed to export user data for {user_id}: {e}")
            raise UserServiceError("User data export failed") from e

    async def update_user_with_admin_check(
        self,
        user_id: str,
        update_data: UserProfileUpdateRequest,
        requesting_user_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Update user with admin permission validation.

        Args:
            user_id: ID of user to update
            update_data: Update data
            requesting_user_id: ID of user making the request

        Returns:
            Updated user data if successful, None otherwise

        Raises:
            ValidationError: If admin permission is required but not granted
            UserNotFoundError: If user doesn't exist
            UserServiceError: If update fails
        """
        try:
            # Check if admin status is being changed
            if update_data.isAdmin is not None:
                # Get requesting user to check admin status
                requesting_user = await self.get_user_by_id(requesting_user_id)
                if not requesting_user or not requesting_user.isAdmin:
                    raise ValidationError(
                        "Admin privileges required to change admin status",
                        field_errors={"isAdmin": ["Only admins can change admin status"]}
                    )

                # Prevent self-demotion (optional safety check)
                if user_id == requesting_user_id and not update_data.isAdmin:
                    raise ValidationError(
                        "Cannot remove your own admin privileges",
                        field_errors={"isAdmin": ["Cannot demote yourself from admin"]}
                    )

            # Proceed with normal update
            return await self.update_user(user_id, update_data)

        except (ValidationError, UserNotFoundError):
            raise
        except Exception as e:
            logger.error(f"Failed to update user with admin check {user_id}: {e}")
            raise UserServiceError("User update failed") from e

        except Exception as e:
            logger.error(f"Failed to export user data {user_id}: {e}")
            raise