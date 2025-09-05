"""
Password Reset service with email verification.
Implements MVP Security Baseline - Simple password reset functionality.
"""

import secrets
import json
import jwt
from typing import Dict, Optional, Any
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext

from ..core.exceptions import (
    PasswordResetError, 
    InvalidTokenError, 
    ExpiredTokenError,
    UserNotFoundError
)
from ..core.config import get_jwt_secret


class PasswordResetService:
    """Service for managing password reset with email verification."""
    
    def __init__(
        self, 
        user_repository, 
        audit_service, 
        jwt_secret: Optional[str] = None,
        redis_client=None, 
        email_service=None,
        token_expiry: int = 3600,
        rate_limit_window: int = 900,
        max_requests_per_window: int = 3
    ):
        """
        Initialize password reset service with dependency injection.
        
        Args:
            user_repository: Repository for user data operations
            audit_service: Service for security event logging
            jwt_secret: JWT secret for token signing (uses centralized config if None)
            redis_client: Redis client for token storage (optional for JWT-only mode)
            email_service: Service for sending reset emails (optional)
            token_expiry: Token expiration time in seconds
            rate_limit_window: Rate limiting window in seconds
            max_requests_per_window: Max requests per rate limit window
        """
        # Core dependencies
        self.user_repository = user_repository
        self.audit_service = audit_service
        
        # Optional dependencies
        self.redis_client = redis_client
        self.email_service = email_service
        
        # Security configuration
        self.jwt_secret = jwt_secret or get_jwt_secret()
        
        # Password hashing context
        self.pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")
        
        # Service configuration with explicit defaults
        self.token_expiry = token_expiry
        self.rate_limit_window = rate_limit_window
        self.max_requests_per_window = max_requests_per_window
    
    def generate_reset_token(self, user_id: str, email: str) -> str:
        """
        Generate JWT token for password reset.
        
        Args:
            user_id: User identifier
            email: User email address
            
        Returns:
            JWT token string
        """
        payload = {
            "user_id": user_id,
            "email": email,
            "type": "password_reset",
            "exp": datetime.now(timezone.utc) + timedelta(seconds=self.token_expiry)
        }
        return jwt.encode(payload, self.jwt_secret, algorithm="HS256")
    
    def validate_reset_token(self, token: str) -> Dict[str, Any]:
        """
        Validate JWT password reset token.
        
        Args:
            token: JWT token to validate
            
        Returns:
            Dict with validation result and user info
            
        Raises:
            InvalidTokenError: If token is invalid or expired
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
            
            # Verify token type
            if payload.get("type") != "password_reset":
                raise InvalidTokenError("Invalid reset token")
            
            return {
                "valid": True,
                "user_id": payload["user_id"],
                "email": payload["email"]
            }
        except jwt.ExpiredSignatureError:
            raise InvalidTokenError("Reset token has expired")
        except (jwt.InvalidTokenError, KeyError):
            raise InvalidTokenError("Invalid reset token")
    
    async def send_reset_email(self, email: str, reset_token: str) -> None:
        """
        Send password reset email.
        
        Args:
            email: User email address
            reset_token: Reset token to include in email
        """
        if not self.email_service:
            return  # Skip if no email service configured
        
        reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
        
        await self.email_service.send_email(
            to=email,
            subject="Password Reset - Epi-Logos System",
            html_content=f"""
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="{reset_url}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            """
        )
    
    async def reset_password_with_token(self, reset_token: str, new_password: str) -> Dict[str, Any]:
        """
        Reset password using valid token (test-compatible version).
        
        Args:
            reset_token: Valid reset token
            new_password: New password to set
            
        Returns:
            Dict with success status
            
        Raises:
            UserNotFoundError: If user doesn't exist
            InvalidTokenError: If token is invalid
        """
        # Validate token
        token_data = self.validate_reset_token(reset_token)
        user_id = token_data["user_id"]
        
        # Get user to verify existence
        user = await self.user_repository.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")
        
        # Update password
        await self.user_repository.update_password(user_id, new_password)
        
        return {"success": True}
    
    async def change_password_authenticated(
        self, 
        user_id: str, 
        current_password: str, 
        new_password: str
    ) -> Dict[str, Any]:
        """
        Change password for authenticated user.
        
        Args:
            user_id: User identifier
            current_password: Current password for verification
            new_password: New password to set
            
        Returns:
            Dict with success status
        """
        # Import here to avoid circular imports
        from .password_service import PasswordService
        
        # Get user
        user = await self.user_repository.get_user_by_id(user_id)
        if not user:
            raise UserNotFoundError("User not found")
        
        # Verify current password
        password_service = PasswordService()
        if not await password_service.verify_password(current_password, user.passwordHash):
            return {"success": False, "error": "Invalid current password"}
        
        # Hash and update new password
        new_hash = await password_service.hash_password(new_password)
        await self.user_repository.update_password(user_id, new_hash)
        
        return {"success": True}

    async def request_password_reset(
        self, 
        email: str, 
        ip_address: str, 
        user_agent: str
    ) -> Dict[str, Any]:
        """
        Request password reset by generating secure token and sending email.
        
        Args:
            email: User email address
            ip_address: IP address of request
            user_agent: User agent string
            
        Returns:
            Dict with success status and token info
            
        Raises:
            UserNotFoundError: If user with email not found
            PasswordResetError: If rate limit exceeded or other error
        """
        # Check rate limit first
        await self._check_rate_limit(email, ip_address)
        
        # Get user by email
        user = await self.user_repository.get_by_email(email)
        if not user:
            raise UserNotFoundError("User not found", email=email)
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Create token data
        token_data = {
            "user_id": str(user["_id"]),
            "email": email,
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=self.token_expiry)).isoformat(),
            "ip_address": ip_address,
            "user_agent": user_agent,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Store token in Redis with expiration
        token_key = f"password_reset:{token}"
        await self.redis_client.set(
            token_key, 
            json.dumps(token_data, default=str),
            ex=self.token_expiry
        )
        
        # Generate reset URL (in production, this would use actual domain)
        reset_url = f"http://localhost:3000/reset-password?token={token}"
        
        # Send reset email
        await self.email_service.send_password_reset_email(
            email,
            user["name"],
            reset_url=reset_url
        )
        
        # Log security event
        await self.audit_service.log_security_event(
            user_id=str(user["_id"]),
            event_type="password_reset_requested",
            severity="medium",
            ip_address=ip_address,
            metadata={
                "user_agent": user_agent,
                "token_id": token[:8]  # Log only first 8 chars for debugging
            }
        )
        
        return {
            "success": True,
            "token_id": token[:8],  # Return first 8 chars for reference
            "expires_in": self.token_expiry
        }
    
    
    
    async def _check_rate_limit(self, email: str, ip_address: str) -> None:
        """
        Check rate limit for password reset requests.
        
        Args:
            email: User email (for user-based limiting)
            ip_address: IP address (for IP-based limiting)
            
        Raises:
            PasswordResetError: If rate limit exceeded
        """
        # Check IP-based rate limit
        ip_key = f"password_reset_rate_limit:ip:{ip_address}"
        if await self.redis_client.exists(ip_key):
            current_count = int(await self.redis_client.get(ip_key) or 0)
            if current_count >= self.max_requests_per_window:
                ttl = await self.redis_client.ttl(ip_key)
                raise PasswordResetError(
                    f"Too many password reset requests. Try again in {ttl} seconds."
                )
        
        # Check email-based rate limit
        email_key = f"password_reset_rate_limit:email:{email}"
        if await self.redis_client.exists(email_key):
            current_count = int(await self.redis_client.get(email_key) or 0)
            if current_count >= self.max_requests_per_window:
                ttl = await self.redis_client.ttl(email_key)
                raise PasswordResetError(
                    f"Too many password reset requests for this email. Try again in {ttl} seconds."
                )
        
        # Increment counters
        await self._increment_rate_limit_counter(ip_key)
        await self._increment_rate_limit_counter(email_key)
    
    async def _increment_rate_limit_counter(self, key: str) -> None:
        """Increment rate limit counter with expiration."""
        current = await self.redis_client.incr(key)
        if current == 1:
            # Set expiration only on first increment
            await self.redis_client.expire(key, self.rate_limit_window)
    
    async def get_reset_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Get password reset statistics for user.
        
        Args:
            user_id: User ID to get stats for
            
        Returns:
            Dict with reset statistics
        """
        # This would query audit logs for password reset events
        # For MVP, return basic info
        return {
            "total_resets": 0,  # Would be calculated from audit logs
            "last_reset_at": None,
            "pending_requests": 0  # Would check Redis for active tokens
        }