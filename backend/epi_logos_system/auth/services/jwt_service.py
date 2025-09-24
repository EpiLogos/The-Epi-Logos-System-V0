"""
JWT token service for user authentication.
Handles JWT token creation, validation, and refresh functionality.
"""
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import jwt
from jwt import PyJWTError
import logging

# Updated absolute imports for new domain structure
from backend.epi_logos_system.shared.config import get_config
from backend.epi_logos_system.users.models.user import User

logger = logging.getLogger(__name__)


class JWTService:
    """Service for JWT token management."""
    
    def __init__(self, secret_key: str = None, algorithm: str = "HS256", expiration_hours: int = None):
        """Initialize JWT service with configuration."""
        # Use dependency injection if provided, otherwise fallback to env config
        if secret_key is None or expiration_hours is None:
            env_config = get_config()
            self.secret_key = secret_key or env_config.jwt_secret
            self.algorithm = algorithm
            self.access_token_expire_hours = expiration_hours or env_config.jwt_expiration_hours
        else:
            self.secret_key = secret_key
            self.algorithm = algorithm
            self.access_token_expire_hours = expiration_hours
        
        self.refresh_token_expire_days = 7
    
    async def create_access_token(self, user: User) -> str:
        """
        Create a JWT access token for a user.
        
        Args:
            user: User object to create token for
            
        Returns:
            JWT access token string
        """
        now = datetime.now(timezone.utc)
        expires = now + timedelta(hours=self.access_token_expire_hours)
        
        payload = {
            "sub": str(user.id),  # Subject - user ID
            "email": user.email,
            "tier": user.tier,
            "isAdmin": user.isAdmin,  # Admin status for authorization
            "iat": now,  # Issued at
            "exp": expires,  # Expiration
            "type": "access"
        }
        
        try:
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.debug(f"Created access token for user {user.email}")
            return token
        except Exception as e:
            logger.error(f"Failed to create access token: {e}")
            raise ValueError("Token creation failed") from e
    
    async def create_refresh_token(self, user: User) -> str:
        """
        Create a JWT refresh token for a user.
        
        Args:
            user: User object to create token for
            
        Returns:
            JWT refresh token string
        """
        now = datetime.now(timezone.utc)
        expires = now + timedelta(days=self.refresh_token_expire_days)
        
        payload = {
            "sub": str(user.id),
            "email": user.email,
            "iat": now,
            "exp": expires,
            "type": "refresh"
        }
        
        try:
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.debug(f"Created refresh token for user {user.email}")
            return token
        except Exception as e:
            logger.error(f"Failed to create refresh token: {e}")
            raise ValueError("Token creation failed") from e
    
    async def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token to verify
            token_type: Expected token type (access or refresh)
            
        Returns:
            Decoded token payload
            
        Raises:
            ValueError: If token is invalid or expired
        """
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                options={"verify_exp": True}
            )
            
            # Verify token type
            if payload.get("type") != token_type:
                raise ValueError(f"Invalid token type. Expected {token_type}")
            
            logger.debug(f"Verified {token_type} token for user {payload.get('email')}")
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.debug("Token has expired")
            raise ValueError("Token expired")
        except jwt.InvalidTokenError as e:
            logger.debug(f"Invalid token: {e}")
            raise ValueError("Invalid token")
        except Exception as e:
            logger.error(f"Token verification failed: {e}")
            raise ValueError("Token verification failed") from e
    
    async def verify_access_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verify an access token and return payload.
        
        Args:
            token: JWT access token to verify
            
        Returns:
            Token payload if valid, None if invalid
        """
        try:
            payload = await self.verify_token(token, token_type="access")
            return payload
        except ValueError:
            return None
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, str]:
        """
        Create a new access token using a valid refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            Dictionary with new access_token and refresh_token
            
        Raises:
            ValueError: If refresh token is invalid
        """
        try:
            # Verify refresh token
            payload = await self.verify_token(refresh_token, token_type="refresh")
            
            # Extract user information
            user_id = payload["sub"]
            email = payload["email"]
            
            # Create a minimal user object for token creation
            # In a real implementation, you might want to fetch fresh user data
            user_data = {
                "id": user_id,
                "email": email,
                "tier": payload.get("tier", "free"),
                "isAdmin": payload.get("isAdmin", False)
            }

            # Create new tokens
            # Note: We create both new access and refresh tokens for security
            new_access_token = jwt.encode({
                "sub": user_id,
                "email": email,
                "tier": user_data["tier"],
                "isAdmin": user_data["isAdmin"],
                "iat": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc) + timedelta(hours=self.access_token_expire_hours),
                "type": "access"
            }, self.secret_key, algorithm=self.algorithm)
            
            new_refresh_token = jwt.encode({
                "sub": user_id,
                "email": email,
                "iat": datetime.now(timezone.utc),
                "exp": datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days),
                "type": "refresh"
            }, self.secret_key, algorithm=self.algorithm)
            
            logger.info(f"Refreshed tokens for user {email}")
            return {
                "access_token": new_access_token,
                "refresh_token": new_refresh_token
            }
            
        except ValueError:
            # Re-raise token verification errors
            raise
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            raise ValueError("Token refresh failed") from e
    
    def extract_user_id(self, token: str) -> Optional[str]:
        """
        Extract user ID from token without full verification.
        Useful for logging or debugging, but should not be used for auth decisions.
        
        Args:
            token: JWT token
            
        Returns:
            User ID if extractable, None otherwise
        """
        try:
            # Decode without verification (for debugging only)
            payload = jwt.decode(
                token, 
                options={"verify_signature": False, "verify_exp": False}
            )
            return payload.get("sub")
        except Exception:
            return None
    
    def is_token_expired(self, token: str) -> bool:
        """
        Check if a token is expired without full verification.
        
        Args:
            token: JWT token to check
            
        Returns:
            True if token is expired, False otherwise
        """
        try:
            payload = jwt.decode(
                token, 
                options={"verify_signature": False, "verify_exp": False}
            )
            
            exp_timestamp = payload.get("exp")
            if exp_timestamp:
                expiry = datetime.fromtimestamp(exp_timestamp)
                return datetime.now(timezone.utc) > expiry
            
            return True  # Consider expired if no expiry
            
        except Exception:
            return True  # Consider expired if can't decode
    
    def get_token_info(self, token: str) -> Dict[str, Any]:
        """
        Get token information without verification (for debugging).
        
        Args:
            token: JWT token
            
        Returns:
            Token information dictionary
        """
        try:
            payload = jwt.decode(
                token, 
                options={"verify_signature": False, "verify_exp": False}
            )
            
            info = {
                "user_id": payload.get("sub"),
                "email": payload.get("email"),
                "tier": payload.get("tier"),
                "type": payload.get("type"),
                "issued_at": None,
                "expires_at": None,
                "is_expired": self.is_token_expired(token)
            }
            
            # Convert timestamps to datetime objects
            if payload.get("iat"):
                info["issued_at"] = datetime.fromtimestamp(payload["iat"])
            
            if payload.get("exp"):
                info["expires_at"] = datetime.fromtimestamp(payload["exp"])
            
            return info
            
        except Exception as e:
            logger.debug(f"Could not extract token info: {e}")
            return {"error": "Invalid token format"}
    
    async def revoke_token(self, token: str) -> bool:
        """
        Revoke a JWT token by adding it to a blacklist.
        Note: This requires a token blacklist storage mechanism.
        
        Args:
            token: Token to revoke
            
        Returns:
            True if successfully revoked
        """
        # TODO: Implement token blacklist storage (Redis recommended)
        # For now, this is a placeholder implementation
        try:
            payload = await self.verify_token(token)
            user_id = payload["sub"]
            
            # In a real implementation, store the token in a blacklist
            # with expiration matching the token's expiry
            logger.info(f"Token revoked for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Token revocation failed: {e}")
            return False