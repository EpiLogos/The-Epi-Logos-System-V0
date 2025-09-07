"""
User management API endpoints.
Provides REST API for user registration, authentication, and profile management.
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field
# Use relative imports within backend service - no sys.path hacks needed
from ..models.user import UserRegistrationRequest, UserProfileUpdateRequest, UserLoginRequest, UserPreferences
from ..services.user_service import UserService
from ..services.jwt_service import JWTService
from ..utils.response import APIResponse
from ..utils.validation import validate_request_data

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()


# Dependency injection using container - relative import
from ..core.container import get_user_service, get_jwt_service


def get_user_service_dependency() -> UserService:
    """Get UserService instance from container."""
    return get_user_service()


def get_jwt_service_dependency() -> JWTService:
    """Get JWTService instance from container.""" 
    return get_jwt_service()


async def get_current_user(
    token: str = Depends(security),
    jwt_service: JWTService = Depends(get_jwt_service_dependency),
    user_service: UserService = Depends(get_user_service_dependency)
):
    """Get current authenticated user from JWT token."""
    try:
        # Extract token from Bearer format
        token_str = token.credentials if hasattr(token, 'credentials') else str(token)
        
        # Validate and decode token
        payload = await jwt_service.verify_access_token(token_str)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        # Get user from database
        user = await user_service.get_user_by_id(payload.get("sub"))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
        
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    registration_data: UserRegistrationRequest,
    request: Request,
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Register a new user account.
    
    Creates a new user with email/password or OAuth provider linking.
    Returns user data with authentication tokens.
    """
    try:
        # Extract client information
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Validate request data
        validation_result = validate_request_data(registration_data)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Validation failed", "errors": validation_result.errors}
            )
        
        # Create user
        user_data = await user_service.create_user(
            registration_data=registration_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(f"User registered successfully: {registration_data.email}")
        
        return APIResponse(
            success=True,
            message="User registered successfully",
            data=user_data
        )
        
    except ValueError as e:
        logger.warning(f"Registration validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)}
        )
    except Exception as e:
        logger.error(f"Registration failed for {registration_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Registration failed"}
        )


@router.post("/login")
async def login_user(
    login_data: UserLoginRequest,
    request: Request,
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Authenticate user with email and password.
    
    Returns user data with authentication tokens if successful.
    """
    try:
        # Extract client information
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Validate request data
        validation_result = validate_request_data(login_data)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Validation failed", "errors": validation_result.errors}
            )
        
        # Authenticate user
        auth_data = await user_service.authenticate_user(
            email=login_data.email,
            password=login_data.password,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if not auth_data:
            logger.info(f"Failed login attempt for {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "Invalid email or password"}
            )
        
        logger.info(f"User logged in successfully: {login_data.email}")
        
        return APIResponse(
            success=True,
            message="Login successful",
            data=auth_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login failed for {login_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Login failed"}
        )


@router.get("/me")
async def get_current_user_profile(
    current_user = Depends(get_current_user)
) -> APIResponse:
    """
    Get current authenticated user's profile.
    
    Returns user profile information excluding sensitive data.
    """
    try:
        user_data = current_user.to_public_dict()
        
        return APIResponse(
            success=True,
            message="Profile retrieved successfully",
            data=user_data
        )
        
    except Exception as e:
        logger.error(f"Failed to get user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Failed to retrieve profile"}
        )


@router.patch("/me")
async def update_user_profile(
    update_data: UserProfileUpdateRequest,
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Update current user's profile information.
    
    Updates user profile fields and returns updated profile data.
    """
    try:
        # Validate request data
        validation_result = validate_request_data(update_data)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Validation failed", "errors": validation_result.errors}
            )
        
        # Update user profile
        updated_user_data = await user_service.update_user(
            user_id=str(current_user.id),
            update_data=update_data
        )
        
        if not updated_user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "No updates applied"}
            )
        
        logger.info(f"User profile updated: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Profile updated successfully",
            data=updated_user_data
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Profile update validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)}
        )
    except Exception as e:
        logger.error(f"Profile update failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Profile update failed"}
        )


@router.post("/oauth/link")
async def link_oauth_provider(
    oauth_data: Dict[str, str],
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Link OAuth provider to current user account.
    
    Connects OAuth provider account to existing user profile.
    """
    try:
        provider = oauth_data.get("provider")
        provider_id = oauth_data.get("provider_id")
        
        if not provider or not provider_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Provider and provider_id are required"}
            )
        
        # Link OAuth provider
        success = await user_service.link_oauth_provider(
            user_id=str(current_user.id),
            provider=provider,
            provider_id=provider_id
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Failed to link OAuth provider"}
            )
        
        logger.info(f"OAuth provider {provider} linked for user {current_user.email}")
        
        return APIResponse(
            success=True,
            message=f"{provider.title()} account linked successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth linking failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "OAuth linking failed"}
        )


@router.delete("/oauth/{provider}")
async def unlink_oauth_provider(
    provider: str,
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Unlink OAuth provider from current user account.
    
    Removes OAuth provider connection from user profile.
    """
    try:
        # Unlink OAuth provider
        success = await user_service.unlink_oauth_provider(
            user_id=str(current_user.id),
            provider=provider
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Failed to unlink OAuth provider"}
            )
        
        logger.info(f"OAuth provider {provider} unlinked for user {current_user.email}")
        
        return APIResponse(
            success=True,
            message=f"{provider.title()} account unlinked successfully"
        )
        
    except ValueError as e:
        logger.warning(f"OAuth unlinking validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth unlinking failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "OAuth unlinking failed"}
        )


@router.get("/password-requirements")
async def get_password_requirements() -> APIResponse:
    """
    Get password requirements for frontend validation.

    Returns the password validation rules that match backend validation.
    """
    requirements = {
        "minLength": 8,
        "requireUppercase": True,
        "requireLowercase": True,
        "requireDigit": True,
        "requireSpecialChar": True,
        "specialChars": "!@#$%^&*(),.?\":{}|<>",
        "rules": [
            "At least 8 characters long",
            "At least one uppercase letter (A-Z)",
            "At least one lowercase letter (a-z)",
            "At least one digit (0-9)",
            "At least one special character (!@#$%^&*(),.?\":{}|<>)"
        ],
        "description": "Password must be at least 8 characters with uppercase, lowercase, digit, and special character"
    }

    return APIResponse(
        success=True,
        message="Password requirements retrieved successfully",
        data=requirements
    )


@router.get("/health")
async def users_health_check() -> APIResponse:
    """
    Health check endpoint for user service.

    Returns health status of user-related functionality.
    """
    try:
        # Basic health check - verify service is responsive
        return APIResponse(
            success=True,
            message="User service is healthy",
            data={
                "status": "healthy",
                "service": "user-authentication",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "endpoints_available": [
                    "/api/users/register",
                    "/api/users/login",
                    "/api/users/me",
                    "/api/users/profile"
                ]
            }
        )

    except Exception as e:
        logger.error(f"User service health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "User service health check failed"}
        )


@router.get("/stats")
async def get_user_stats(
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Get user statistics (admin endpoint).

    Returns aggregated user statistics for monitoring.
    """
    try:
        stats = await user_service.get_user_stats()

        return APIResponse(
            success=True,
            message="User statistics retrieved successfully",
            data=stats
        )

    except Exception as e:
        logger.error(f"Failed to get user statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Failed to retrieve user statistics"}
        )


# MISSING ENDPOINTS - Added for Story 02.10.1

@router.delete("/account")
async def delete_user_account(
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Delete current user's account permanently.
    
    WARNING: This action is irreversible and will delete all user data.
    """
    try:
        # Delete user account and all associated data
        success = await user_service.delete_user_account(str(current_user.id))
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Failed to delete account"}
            )
        
        logger.info(f"User account deleted: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Account deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Account deletion failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Account deletion failed"}
        )


@router.get("/export")
async def export_user_data(
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Export all user data in JSON format.
    
    Returns comprehensive user data for GDPR compliance and data portability.
    """
    try:
        # Get comprehensive user data for export
        user_data = await user_service.export_user_data(str(current_user.id))
        
        logger.info(f"User data exported: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="User data exported successfully", 
            data=user_data
        )
        
    except Exception as e:
        logger.error(f"Data export failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Data export failed"}
        )

@router.put("/profile")
async def update_user_profile_put(
    update_data: UserProfileUpdateRequest,
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Update current user's profile information via PUT method.
    
    This endpoint provides the same functionality as PATCH /api/users/me
    but uses PUT method as expected by the frontend.
    """
    try:
        # Validate request data
        validation_result = validate_request_data(update_data)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Validation failed", "errors": validation_result.errors}
            )
        
        # Update user profile
        updated_user_data = await user_service.update_user(
            user_id=str(current_user.id),
            update_data=update_data
        )
        
        if not updated_user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "No updates applied"}
            )
        
        logger.info(f"User profile updated via PUT: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Profile updated successfully",
            data=updated_user_data
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Profile update validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)}
        )
    except Exception as e:
        logger.error(f"Profile update failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Profile update failed"}
        )


@router.put("/preferences")
async def update_user_preferences(
    preferences: UserPreferences,
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Update user preferences only.
    
    Dedicated endpoint for updating user preferences without affecting
    other profile information.
    """
    try:
        # Create profile update request with only preferences
        update_data = UserProfileUpdateRequest(preferences=preferences)
        
        # Validate preferences data
        validation_result = validate_request_data(preferences)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Validation failed", "errors": validation_result.errors}
            )
        
        # Update user preferences
        updated_user_data = await user_service.update_user(
            user_id=str(current_user.id),
            update_data=update_data
        )
        
        if not updated_user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "No preferences updates applied"}
            )
        
        logger.info(f"User preferences updated: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Preferences updated successfully",
            data={
                "preferences": updated_user_data.get("preferences"),
                "user_id": str(current_user.id)
            }
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Preferences update validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)}
        )
    except Exception as e:
        logger.error(f"Preferences update failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Preferences update failed"}
        )


class PasswordSetupRequest(BaseModel):
    """Request model for OAuth user password setup."""
    password: str = Field(..., min_length=8, description="Password to set up for OAuth user")


@router.get("/email/{email}")
async def check_user_exists_by_email(
    email: str,
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Check if a user exists by email address.
    
    This endpoint is used by OAuth flows to determine if an account
    with the given email already exists.
    """
    try:
        # Check if user exists by email
        user = await user_service.get_user_by_email(email.lower())
        
        if user:
            return APIResponse(
                success=True,
                message="User found",
                data={
                    "exists": True,
                    "user": {
                        "id": str(user.id),
                        "email": user.email,
                        "firstName": user.firstName,
                        "lastName": user.lastName,
                        "hasOAuthProviders": bool(user.oauthProviders),
                        "hasPassword": bool(user.passwordHash)
                    }
                }
            )
        else:
            return APIResponse(
                success=True,
                message="User not found",
                data={"exists": False}
            )
        
    except Exception as e:
        logger.error(f"Failed to check user existence for email {email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Failed to check user existence"}
        )


@router.post("/setup-password")
async def setup_password_for_oauth_user(
    password_data: PasswordSetupRequest,
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Set up password for OAuth user who doesn't have one.
    
    This endpoint allows OAuth users to add password authentication
    to their account for hybrid authentication support.
    """
    try:
        # Validate request data
        validation_result = validate_request_data(password_data)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "Validation failed", "errors": validation_result.errors}
            )
        
        # Set up password for OAuth user
        result = await user_service.setup_password_for_oauth_user(
            user_id=str(current_user.id),
            password=password_data.password
        )
        
        logger.info(f"Password set up for OAuth user: {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Password set up successfully",
            data={
                "hasPassword": result.get("hasPassword", True),
                "user_id": str(current_user.id)
            }
        )
        
    except ValueError as e:
        logger.warning(f"Password setup validation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": str(e)}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password setup failed for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Password setup failed"}
        )