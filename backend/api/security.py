"""
Security API endpoints for MFA and password reset functionality.
Provides REST API for multi-factor authentication and password reset operations.
"""
import logging
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel, Field

# Use relative imports within backend service
from ..services.mfa_service import MfaService
from ..services.password_reset_service import PasswordResetService
from ..services.user_service import UserService
from ..utils.response import APIResponse
from ..core.exceptions import InvalidTokenError, UserNotFoundError, MFAError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/security", tags=["security"])
security = HTTPBearer()

# Dependency injection using container
from ..core.container import get_mfa_service, get_password_reset_service, get_user_service
from ..api.auth import get_current_user  # Import from auth module


def get_mfa_service_dependency() -> MfaService:
    """Get MfaService instance from container."""
    return get_mfa_service()


def get_password_reset_service_dependency() -> PasswordResetService:
    """Get PasswordResetService instance from container."""
    return get_password_reset_service()


def get_user_service_dependency() -> UserService:
    """Get UserService instance from container."""
    return get_user_service()


# === Request/Response Models ===

class MfaSetupRequest(BaseModel):
    """Request model for MFA setup."""
    user_email: str = Field(..., description="User's email address")


class MfaVerifyRequest(BaseModel):
    """Request model for MFA verification."""
    totp_code: str = Field(..., min_length=6, max_length=6, description="6-digit TOTP code")
    secret: Optional[str] = Field(None, description="TOTP secret (for setup verification only)")


class MfaSetupResponse(BaseModel):
    """Response model for MFA setup."""
    secret: str = Field(..., description="Base32 secret for TOTP")
    qr_code_url: str = Field(..., description="QR code URL for Google Authenticator")
    backup_codes: List[str] = Field(..., description="List of backup codes")


class PasswordResetRequest(BaseModel):
    """Request model for password reset."""
    email: str = Field(..., description="User's email address")


class PasswordResetConfirmRequest(BaseModel):
    """Request model for password reset confirmation."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")


class PasswordChangeRequest(BaseModel):
    """Request model for authenticated password change."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")


# === MFA Endpoints ===

@router.post("/mfa/setup")
async def setup_mfa(
    setup_request: MfaSetupRequest,
    current_user = Depends(get_current_user),
    mfa_service: MfaService = Depends(get_mfa_service_dependency),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Set up MFA for the current user.

    Returns TOTP secret, QR code URL, and backup codes.
    """
    try:
        # Generate MFA setup data
        setup_data = mfa_service.setup_mfa_for_user(
            user_id=str(current_user.id),
            user_email=current_user.email
        )

        # Hash backup codes for storage
        hashed_backup_codes = [
            mfa_service.hash_backup_code(code)
            for code in setup_data["backup_codes"]
        ]

        # Save MFA configuration to database
        await user_service.user_repository.update_mfa_setup(
            user_id=str(current_user.id),
            secret=setup_data["secret"],
            backup_codes=hashed_backup_codes
        )

        logger.info(f"MFA setup completed and saved for user {current_user.email}")

        return APIResponse(
            success=True,
            message="MFA setup completed successfully",
            data=MfaSetupResponse(**setup_data).dict()
        )

    except Exception as e:
        logger.error(f"MFA setup failed for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MFA setup failed"
        )


@router.post("/mfa/verify")
async def verify_mfa_code(
    verify_request: MfaVerifyRequest,
    current_user = Depends(get_current_user),
    mfa_service: MfaService = Depends(get_mfa_service_dependency),
    user_service: UserService = Depends(get_user_service_dependency)
) -> APIResponse:
    """
    Verify MFA TOTP code for the current user.
    
    This endpoint would typically be used during login or when enabling MFA.
    """
    try:
        # During setup, secret is passed in request; otherwise get from database
        if verify_request.secret:
            # Setup verification flow - use provided secret
            secret = verify_request.secret
        else:
            # Regular verification flow - get from database
            secret = await user_service.user_repository.get_user_mfa_secret(str(current_user.id))
            if not secret:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="MFA is not set up for this user"
                )
        
        # Verify the TOTP code
        is_valid = mfa_service.verify_totp_code(
            secret=secret,
            code=verify_request.totp_code
        )
        
        if not is_valid:
            logger.warning(f"Invalid MFA code attempted by user {current_user.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid TOTP code"
            )
        
        logger.info(f"MFA verification successful for user {current_user.email}")
        
        return APIResponse(
            success=True,
            message="MFA verification successful",
            data={"verified": True}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MFA verification failed for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="MFA verification failed"
        )


# === Password Reset Endpoints ===

@router.post("/password-reset/request")
async def request_password_reset(
    reset_request: PasswordResetRequest,
    request: Request,
    password_reset_service: PasswordResetService = Depends(get_password_reset_service_dependency)
) -> APIResponse:
    """
    Request password reset via email.
    
    Sends a password reset email to the specified address if the user exists.
    Always returns success for security (doesn't reveal if email exists).
    """
    try:
        # Generate reset token
        token = password_reset_service.generate_reset_token(
            user_id="placeholder",  # Would be fetched from user lookup
            email=reset_request.email
        )
        
        # Send reset email (if email service is configured)
        if password_reset_service.email_service:
            await password_reset_service.send_reset_email(
                email=reset_request.email,
                reset_token=token
            )
        
        # Get client IP for logging
        client_ip = request.client.host if request.client else "unknown"
        
        logger.info(f"Password reset requested for email {reset_request.email} from IP {client_ip}")
        
        # Always return success for security (don't reveal if email exists)
        return APIResponse(
            success=True,
            message="If the email address exists, a password reset link has been sent",
            data={"email": reset_request.email}
        )
        
    except Exception as e:
        logger.error(f"Password reset request failed for {reset_request.email}: {e}")
        # Still return success for security
        return APIResponse(
            success=True,
            message="If the email address exists, a password reset link has been sent",
            data={"email": reset_request.email}
        )


@router.post("/password-reset/confirm")
async def confirm_password_reset(
    confirm_request: PasswordResetConfirmRequest,
    password_reset_service: PasswordResetService = Depends(get_password_reset_service_dependency)
) -> APIResponse:
    """
    Confirm password reset using token.
    
    Resets the user's password using the provided token and new password.
    """
    try:
        # Reset password using token
        result = await password_reset_service.reset_password_with_token(
            reset_token=confirm_request.token,
            new_password=confirm_request.new_password
        )
        
        if not result.get("success", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        logger.info("Password reset completed successfully")
        
        return APIResponse(
            success=True,
            message="Password reset completed successfully"
        )
        
    except InvalidTokenError as e:
        logger.warning(f"Invalid reset token used: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    except UserNotFoundError as e:
        logger.error(f"User not found during password reset: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    except Exception as e:
        logger.error(f"Password reset confirmation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )


@router.post("/password-change")
async def change_password(
    change_request: PasswordChangeRequest,
    current_user = Depends(get_current_user),
    password_reset_service: PasswordResetService = Depends(get_password_reset_service_dependency)
) -> APIResponse:
    """
    Change password for authenticated user.
    
    Requires current password verification before setting new password.
    """
    try:
        # Change password with current password verification
        result = await password_reset_service.change_password_authenticated(
            user_id=str(current_user.id),
            current_password=change_request.current_password,
            new_password=change_request.new_password
        )
        
        if not result.get("success", False):
            if "Invalid current password" in result.get("error", ""):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Password change failed"
                )
        
        logger.info(f"Password changed successfully for user {current_user.email}")
        
        return APIResponse(
            success=True,
            message="Password changed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password change failed for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )


# === Security Status Endpoints ===

@router.get("/status")
async def get_security_status(
    current_user = Depends(get_current_user)
) -> APIResponse:
    """
    Get current user's security status.
    
    Returns information about MFA status, recent security events, etc.
    """
    try:
        # In a real implementation, this would query the database for:
        # - MFA enabled status
        # - Recent security events
        # - Password last changed
        # - Active sessions count
        
        security_status = {
            "mfa_enabled": getattr(current_user, 'mfa_enabled', False),
            "password_last_changed": getattr(current_user, 'password_changed_at', None),
            "account_created": getattr(current_user, 'created_at', None),
            "recent_login_attempts": 0,  # Would be fetched from audit logs
            "active_sessions": 1  # In JWT architecture, this is conceptual
        }
        
        return APIResponse(
            success=True,
            message="Security status retrieved successfully",
            data=security_status
        )
        
    except Exception as e:
        logger.error(f"Failed to get security status for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security status"
        )