"""
Consolidated USERS API endpoints for user management, billing, and webhooks.

Merged from backend/api/users.py, backend/api/billing.py, and backend/api/webhooks.py
for strategic consolidation while preserving modular services architecture.
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status, Request, Query
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Updated absolute imports for new domain structure
from backend.epi_logos_system.users.models import (
    UserRegistrationRequest, UserProfileUpdateRequest, UserLoginRequest, 
    UserPreferences, User,
    SubscriptionCreateRequest, SubscriptionResponse, 
    CheckoutSessionResponse, CustomerPortalResponse,
    Subscription, SubscriptionTier, SubscriptionStatus,
    PaymentEvent, PaymentEventMetadata, TIER_LIMITS
)
from backend.epi_logos_system.users.services import UserService
from backend.epi_logos_system.auth.services.jwt_service import JWTService
from backend.epi_logos_system.auth.services.password_service import PasswordService
# TODO: Import billing services once they're migrated
# from backend.epi_logos_system.billing.services import stripe_service
from backend.epi_logos_system.users.services.billing_service import stripe_service
from backend.epi_logos_system.shared.utils import APIResponse, validate_request_data
from backend.epi_logos_system.shared.container import get_user_service, get_jwt_service
from backend.epi_logos_system.shared.exceptions import (
    ValidationError, ExternalServiceError, NotFoundError, AuthorizationError
)


logger = logging.getLogger(__name__)

# Create consolidated routers
users_router = APIRouter(prefix="/api/users", tags=["users"])
billing_router = APIRouter(prefix="/api/billing", tags=["billing"])
webhooks_router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

security = HTTPBearer()


# Dependency injection
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


async def get_current_user_id(
    token: str = Depends(security),
    jwt_service: JWTService = Depends(get_jwt_service_dependency)
) -> str:
    """Get current authenticated user ID from JWT token."""
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
        
        # Return user ID from token
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        return user_id
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


# ============================================================================
# USER MANAGEMENT ENDPOINTS
# ============================================================================

@users_router.post("/register", status_code=status.HTTP_201_CREATED)
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


@users_router.post("/login")
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
                detail={"message": "Validation failed", "code": "validation_error", "errors": validation_result.errors}
            )

        # Specific error detection: check existence and password separately
        # 1) Check if user exists
        user = await user_service.get_user_by_email(login_data.email)
        if not user:
            logger.info(f"Login failed - user not found: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "user_not_found", "message": "No account found with this email"}
            )

        # 2) Ensure password auth is available for the user
        if not user.has_password():
            logger.info(f"Login failed - password auth unavailable for: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "invalid_credentials", "message": "Invalid email or password"}
            )

        # 3) Verify password explicitly for specific error reporting
        password_service = PasswordService()
        is_valid_password = await password_service.verify_password(login_data.password, user.passwordHash)  # type: ignore[arg-type]
        if not is_valid_password:
            logger.info(f"Login failed - invalid password for: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "invalid_password", "message": "Invalid password"}
            )

        # 4) Proceed with standard authentication flow to issue tokens and update last login
        auth_data = await user_service.authenticate_user(
            email=login_data.email,
            password=login_data.password,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if not auth_data:
            # Fallback - treat as invalid credentials if something unexpected happened
            logger.info(f"Failed login attempt for {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"code": "invalid_credentials", "message": "Invalid email or password"}
            )
        
        logger.info(f"User logged in successfully: {login_data.email}")
        
        return APIResponse(
            success=True,
            message="Login successful",
            data=auth_data
        )
        
    except HTTPException:
        # Pass through specific HTTP errors
        raise
    except Exception as e:
        logger.error(f"Login failed for {login_data.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Login failed", "code": "server_error"}
        )


@users_router.get("/me")
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


@users_router.patch("/me")
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
        
        # Update user profile with admin validation if needed
        updated_user_data = await user_service.update_user_with_admin_check(
            user_id=str(current_user.id),
            update_data=update_data,
            requesting_user_id=str(current_user.id)
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


@users_router.put("/profile")
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
        
        # Update user profile with admin validation if needed
        updated_user_data = await user_service.update_user_with_admin_check(
            user_id=str(current_user.id),
            update_data=update_data,
            requesting_user_id=str(current_user.id)
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


@users_router.put("/preferences")
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


@users_router.post("/oauth/link")
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


@users_router.delete("/oauth/{provider}")
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


@users_router.delete("/account")
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


@users_router.get("/export")
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


@users_router.get("/email/{email}")
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


class PasswordSetupRequest(BaseModel):
    """Request model for OAuth user password setup."""
    password: str = Field(..., min_length=8, description="Password to set up for OAuth user")


@users_router.post("/setup-password")
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


@users_router.get("/password-requirements")
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


@users_router.get("/health")
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


@users_router.get("/stats")
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


# ============================================================================
# BILLING ENDPOINTS
# ============================================================================

@billing_router.get("/subscription", response_model=Optional[SubscriptionResponse])
async def get_subscription_status(
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Get current user's subscription status.
    
    Returns subscription details including tier, status, and billing cycle information.
    Returns None if user has no active subscription (free tier).
    
    Required for frontend account management integration.
    """
    try:
        # TODO: Implement subscription repository to get subscription by user_id
        # For now, return free tier as default
        logger.info(f"Getting subscription status for user {current_user_id}")
        
        # Placeholder response - will be replaced with actual database query
        return SubscriptionResponse(
            id="default-free",
            tier=SubscriptionTier.FREE,
            status=SubscriptionStatus.ACTIVE,
            current_period_end=None,
            cancel_at_period_end=False,
            trial_end=None
        )
        
    except Exception as e:
        logger.error(f"Failed to get subscription status for user {current_user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription status"
        )


@billing_router.post("/create-checkout-session", response_model=CheckoutSessionResponse)
async def create_checkout_session(
    request: SubscriptionCreateRequest,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Create a Stripe checkout session for subscription upgrade.
    
    This endpoint creates a Stripe checkout session that redirects users
    to Stripe's hosted checkout page for secure payment processing.
    
    Required for frontend subscription upgrade flow.
    """
    try:
        logger.info(f"Creating checkout session for user {current_user_id}")
        
        # TODO: Get or create Stripe customer for user
        # For now, create a new customer each time (development only)
        customer_id = await stripe_service.create_customer(
            user_id=current_user_id,
            email=f"user-{current_user_id}@example.com",  # TODO: Get real email
            name=f"User {current_user_id}"
        )
        
        # Create checkout session
        session = await stripe_service.create_checkout_session(
            customer_id=customer_id,
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            trial_period_days=request.trial_days
        )
        
        logger.info(f"Created checkout session {session.session_id} for user {current_user_id}")
        return session
        
    except ValidationError as e:
        logger.error(f"Validation error in checkout session creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except ExternalServiceError as e:
        logger.error(f"Stripe error in checkout session creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Payment service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error in checkout session creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@billing_router.post("/customer-portal", response_model=CustomerPortalResponse) 
async def create_customer_portal_session(
    return_url: str,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Create a Stripe customer portal session for subscription management.
    
    This endpoint creates a session URL that redirects users to Stripe's
    customer portal where they can manage billing, download invoices, etc.
    
    Required for frontend billing management integration.
    """
    try:
        logger.info(f"Creating customer portal session for user {current_user_id}")
        
        # TODO: Get Stripe customer ID from subscription record
        # For now, this is a placeholder - will need subscription lookup
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found for customer portal access"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in customer portal creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create customer portal session"
        )


@billing_router.post("/cancel-subscription")
async def cancel_subscription(
    immediate: bool = False,
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Cancel user's active subscription.
    
    Args:
        immediate: If True, cancel immediately. If False, cancel at period end.
    
    Required for frontend subscription cancellation flow.
    """
    try:
        logger.info(f"Canceling subscription for user {current_user_id}")
        
        # TODO: Implement subscription cancellation
        # 1. Get user's active subscription
        # 2. Cancel via Stripe API
        # 3. Update local subscription record
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found to cancel"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in subscription cancellation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@billing_router.get("/tiers")
async def get_subscription_tiers():
    """
    Get available subscription tiers and their feature limits.
    
    Public endpoint for displaying tier comparison on frontend.
    """
    return {
        "tiers": {
            "free": {
                "name": "Free",
                "price": 0,
                "currency": "usd",
                "interval": None,
                "limits": TIER_LIMITS[SubscriptionTier.FREE].dict()
            },
            "patron": {
                "name": "Patron",
                "price": 1200,  # $12.00 in cents
                "currency": "usd", 
                "interval": "month",
                "limits": TIER_LIMITS[SubscriptionTier.PATRON].dict()
            }
        }
    }


@billing_router.get("/history")
async def get_billing_history(
    limit: int = 10,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """
    Get user's billing history and payment events.
    
    Args:
        limit: Maximum number of records to return (default: 10)
        offset: Number of records to skip (default: 0)
    
    Required for frontend billing history display.
    """
    try:
        logger.info(f"Getting billing history for user {current_user.id}")
        
        # TODO: Implement billing history retrieval
        # 1. Query payment events by user_id
        # 2. Format for frontend display
        # 3. Include invoice links and receipt URLs
        
        return {
            "events": [],
            "total": 0,
            "has_more": False
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in billing history retrieval: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve billing history"
        )


# ============================================================================
# WEBHOOK ENDPOINTS
# ============================================================================

@webhooks_router.post("/stripe")
async def handle_stripe_webhook(request: Request):
    """
    Handle incoming Stripe webhook events.
    
    This endpoint receives and processes webhook events from Stripe for
    subscription lifecycle management and payment tracking.
    
    Critical events handled:
    - checkout.session.completed: New subscription created
    - invoice.paid: Successful payment processed  
    - invoice.payment_failed: Payment failure handling
    - customer.subscription.updated: Subscription changes
    - customer.subscription.deleted: Subscription cancellation
    """
    try:
        # Get raw request body and signature header
        body = await request.body()
        signature = request.headers.get("stripe-signature")
        
        if not signature:
            logger.error("Missing Stripe signature header")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature"
            )
        
        # Verify webhook signature and parse event
        try:
            event = await stripe_service.verify_webhook_signature(body, signature)
        except ValidationError as e:
            logger.error(f"Webhook signature verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )
        
        event_type = event["type"]
        event_data = event["data"]["object"]
        
        logger.info(f"Processing Stripe webhook: {event_type} - {event['id']}")
        
        # Route event to appropriate handler
        if event_type == "checkout.session.completed":
            await handle_checkout_session_completed(event_data, event)
        elif event_type == "invoice.paid":
            await handle_invoice_paid(event_data, event)
        elif event_type == "invoice.payment_failed":
            await handle_invoice_payment_failed(event_data, event)
        elif event_type == "customer.subscription.updated":
            await handle_subscription_updated(event_data, event)
        elif event_type == "customer.subscription.deleted":
            await handle_subscription_deleted(event_data, event)
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
        
        return JSONResponse(content={"status": "success"}, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


# Webhook helper functions

async def handle_checkout_session_completed(session_data: Dict[str, Any], event: Dict[str, Any]):
    """Handle completed checkout session - new subscription created."""
    try:
        customer_id = session_data.get("customer")
        subscription_id = session_data.get("subscription")
        
        if not customer_id or not subscription_id:
            logger.error(f"Missing customer or subscription ID in checkout session: {session_data}")
            return
        
        logger.info(f"Checkout completed for customer {customer_id}, subscription {subscription_id}")
        
        # TODO: Implement subscription creation/update logic
        await create_or_update_subscription(customer_id, subscription_id, event)
        
    except Exception as e:
        logger.error(f"Error handling checkout session completed: {e}")
        raise


async def handle_invoice_paid(invoice_data: Dict[str, Any], event: Dict[str, Any]):
    """Handle successful invoice payment."""
    try:
        customer_id = invoice_data.get("customer")
        subscription_id = invoice_data.get("subscription")
        amount_paid = invoice_data.get("amount_paid", 0)
        
        logger.info(f"Invoice paid: customer {customer_id}, amount ${amount_paid/100:.2f}")
        
        await record_payment_event(
            customer_id=customer_id,
            subscription_id=subscription_id,
            event=event,
            amount=amount_paid,
            status="succeeded"
        )
        
    except Exception as e:
        logger.error(f"Error handling invoice paid: {e}")
        raise


async def handle_invoice_payment_failed(invoice_data: Dict[str, Any], event: Dict[str, Any]):
    """Handle failed invoice payment."""
    try:
        customer_id = invoice_data.get("customer")
        subscription_id = invoice_data.get("subscription")
        amount_due = invoice_data.get("amount_due", 0)
        
        logger.warning(f"Invoice payment failed: customer {customer_id}, amount ${amount_due/100:.2f}")
        
        await record_payment_event(
            customer_id=customer_id,
            subscription_id=subscription_id,
            event=event,
            amount=amount_due,
            status="failed"
        )
        
    except Exception as e:
        logger.error(f"Error handling invoice payment failed: {e}")
        raise


async def handle_subscription_updated(subscription_data: Dict[str, Any], event: Dict[str, Any]):
    """Handle subscription updates (tier changes, cancellations, etc.)."""
    try:
        subscription_id = subscription_data.get("id")
        status = subscription_data.get("status")
        
        logger.info(f"Subscription updated: {subscription_id}, status: {status}")
        
        await update_subscription_from_stripe(subscription_data, event)
        
    except Exception as e:
        logger.error(f"Error handling subscription updated: {e}")
        raise


async def handle_subscription_deleted(subscription_data: Dict[str, Any], event: Dict[str, Any]):
    """Handle subscription deletion/cancellation."""
    try:
        subscription_id = subscription_data.get("id")
        customer_id = subscription_data.get("customer")
        
        logger.info(f"Subscription deleted: {subscription_id} for customer {customer_id}")
        
        await handle_subscription_cancellation(subscription_id, customer_id, event)
        
    except Exception as e:
        logger.error(f"Error handling subscription deleted: {e}")
        raise


async def create_or_update_subscription(customer_id: str, stripe_subscription_id: str, event: Dict[str, Any]):
    """Create or update subscription record from Stripe data."""
    try:
        logger.info(f"Creating/updating subscription for customer {customer_id}")
        # TODO: Implement with subscription repository
        pass
    except Exception as e:
        logger.error(f"Failed to create/update subscription: {e}")
        raise


async def record_payment_event(customer_id: str, subscription_id: str, event: Dict[str, Any], amount: int, status: str):
    """Record payment event for audit and analytics."""
    try:
        logger.info(f"Recording payment event: {status} for customer {customer_id}")
        # TODO: Implement with payment event repository
        pass
    except Exception as e:
        logger.error(f"Failed to record payment event: {e}")
        raise


async def update_subscription_from_stripe(subscription_data: Dict[str, Any], event: Dict[str, Any]):
    """Update local subscription record from Stripe subscription data."""
    try:
        subscription_id = subscription_data.get("id")
        logger.info(f"Updating subscription {subscription_id} from Stripe data")
        # TODO: Implement with subscription repository
        pass
    except Exception as e:
        logger.error(f"Failed to update subscription from Stripe: {e}")
        raise


async def handle_subscription_cancellation(subscription_id: str, customer_id: str, event: Dict[str, Any]):
    """Handle subscription cancellation with "Freemium with Conscience" principles."""
    try:
        logger.info(f"Handling cancellation for subscription {subscription_id}")
        # TODO: Implement cancellation handling
        pass
    except Exception as e:
        logger.error(f"Failed to handle subscription cancellation: {e}")
        raise
