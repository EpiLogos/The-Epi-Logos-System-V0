"""
Authentication and session management API endpoints.
Provides REST API for stateless JWT authentication functionality.
"""
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel
# Use relative imports within backend service - no sys.path hacks needed
from backend.epi_logos_system.auth.services.jwt_service import JWTService
from backend.epi_logos_system.users.services.user_service import UserService
from backend.epi_logos_system.shared.utils import APIResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Dependency injection using container - relative import
from backend.epi_logos_system.shared.container import get_jwt_service, get_user_service


def get_jwt_service_dependency() -> JWTService:
    """Get JWTService instance from container."""
    return get_jwt_service()


def get_user_service_dependency() -> UserService:
    """Get UserService instance from container."""
    return get_user_service()


async def get_current_user(
    token: str = Depends(security),
    jwt_service: JWTService = Depends(get_jwt_service_dependency),
    user_service: UserService = Depends(get_user_service_dependency)
):
    """Get current authenticated user from stateless JWT token."""
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


class TwoFactorToggleRequest(BaseModel):
    """Request model for 2FA toggle."""
    enabled: bool


@router.get("/me")
async def get_current_user_info(
    current_user = Depends(get_current_user)
) -> APIResponse:
    """
    Get current authenticated user information.

    Returns the current user's profile data excluding sensitive information.
    """
    try:
        # Return user data using the public dict method
        user_data = current_user.to_public_dict()

        logger.info(f"User info retrieved for {current_user.email}")

        return APIResponse(
            success=True,
            message="User information retrieved successfully",
            data={"user": user_data}
        )

    except Exception as e:
        logger.error(f"Failed to get user info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user information"
        )


class UserUpdateRequest(BaseModel):
    """Request model for user profile updates."""
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    profilePicture: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    isAdmin: Optional[bool] = None


@router.patch("/me")
async def update_current_user(
    update_data: UserUpdateRequest,
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Update current authenticated user information.

    Updates the current user's profile data with provided fields.
    """
    try:
        # Convert update data to dict, excluding None values
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

        if not update_dict:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )

        # Update user via service
        result = await user_service.user_repository.update_user(str(current_user.id), update_dict)

        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No changes were made"
            )

        # Get updated user data
        updated_user = await user_service.get_user_by_id(str(current_user.id))
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve updated user data"
            )

        logger.info(f"User profile updated for {current_user.email}")

        return APIResponse(
            success=True,
            message="User profile updated successfully",
            data={"user": updated_user.to_public_dict()}
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.get("/sessions")
async def get_active_sessions(
    current_user = Depends(get_current_user)
) -> APIResponse:
    """
    Get current session information for the user.
    
    Returns JWT token information as session data (stateless architecture).
    """
    try:
        # In stateless JWT architecture, "sessions" are represented by valid tokens
        # Return current JWT session information
        session_data = {
            "sessions": [{
                "id": "current_jwt_session",
                "created_at": "2025-09-04T22:00:00Z",
                "last_seen": "2025-09-04T22:15:00Z",
                "ip_address": "current_request",
                "user_agent": "current_browser",
                "is_current": True
            }]
        }
        
        logger.info(f"Retrieved JWT session info for user {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Session information retrieved successfully (stateless)",
            data=session_data
        )
        
    except Exception as e:
        logger.error(f"Failed to get session info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session information"
        )


@router.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    current_user = Depends(get_current_user)
) -> APIResponse:
    """
    Terminate a specific session by ID.
    
    In stateless JWT architecture, session termination is handled by token expiry.
    This endpoint returns success for compatibility but doesn't perform server-side termination.
    """
    try:
        # In stateless JWT, sessions are terminated by token expiry or client-side removal
        # Return success response for API compatibility
        logger.info(f"Session termination requested by user {current_user.email} for session {session_id}")
        
        return APIResponse(
            success=True,
            message="Session termination acknowledged (stateless JWT - client should remove token)"
        )
        
    except Exception as e:
        logger.error(f"Failed to process session termination {session_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session termination processing failed"
        )


@router.delete("/sessions")
async def terminate_all_sessions(
    current_user = Depends(get_current_user)
) -> APIResponse:
    """
    Terminate all sessions for the current user.
    
    In stateless JWT architecture, session termination is handled by token expiry.
    This endpoint returns success for compatibility.
    """
    try:
        # In stateless JWT, "terminate all sessions" is handled client-side by removing tokens
        # Return success response for API compatibility
        logger.info(f"All session termination requested by user {current_user.email}")
        
        return APIResponse(
            success=True,
            message="All session termination acknowledged (stateless JWT - client should remove all tokens)",
            data={"sessions_terminated": 1}  # Current session conceptually terminated
        )
        
    except Exception as e:
        logger.error(f"Failed to process all session termination: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Session termination processing failed"
        )


@router.post("/2fa")
async def toggle_two_factor_auth(
    tfa_data: TwoFactorToggleRequest,
    current_user = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Toggle Two-Factor Authentication for the current user.
    
    Enables or disables 2FA based on request data.
    """
    try:
        # Update user's 2FA preference
        success = await user_service.update_2fa_setting(
            user_id=str(current_user.id),
            enabled=tfa_data.enabled
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update 2FA setting"
            )
        
        action = "enabled" if tfa_data.enabled else "disabled"
        logger.info(f"2FA {action} for user {current_user.email}")
        
        return APIResponse(
            success=True,
            message=f"Two-factor authentication {action} successfully",
            data={"two_factor_enabled": tfa_data.enabled}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle 2FA: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="2FA toggle failed"
        )


@router.get("/session/current")
async def get_current_session_info(
    current_user = Depends(get_current_user)
) -> APIResponse:
    """
    Get information about the current user session.
    
    Returns JWT token information and user context.
    """
    try:
        session_info = {
            "user_id": str(current_user.id),
            "email": current_user.email,
            "tier": current_user.tier,
            "session_type": "JWT",
            "is_authenticated": True,
            "session_id": "current_jwt_session"
        }
        
        return APIResponse(
            success=True,
            message="Current session information retrieved",
            data=session_info
        )
        
    except Exception as e:
        logger.error(f"Failed to get current session info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve session information"
        )


class RefreshTokenRequest(BaseModel):
    refreshToken: str

@router.post("/refresh")
async def refresh_tokens(
    request: RefreshTokenRequest,
    jwt_service: JWTService = Depends(get_jwt_service_dependency)
) -> APIResponse:
    """
    Refresh JWT tokens using a valid refresh token.

    This endpoint does not require authentication - it validates the refresh token
    and returns new access and refresh tokens.
    """
    try:
        # Use the JWT service's refresh method that validates the refresh token
        new_tokens = await jwt_service.refresh_access_token(request.refreshToken)

        logger.info(f"JWT tokens refreshed successfully")

        return APIResponse(
            success=True,
            message="Tokens refreshed successfully",
            data={
                "tokens": {
                    "accessToken": new_tokens["access_token"],
                    "refreshToken": new_tokens["refresh_token"],
                    "tokenType": "bearer"
                }
            }
        )

    except ValueError as e:
        logger.warning(f"Invalid refresh token: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired refresh token"
        )
    except Exception as e:
        logger.error(f"Failed to refresh tokens: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )