"""
JWT token handling for authentication and authorization.
"""

import os
import jwt
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional


logger = logging.getLogger(__name__)


class JWTHandler:
    """JWT token creation and validation handler."""
    
    def __init__(self):
        """Initialize JWT handler with configuration."""
        self.secret = os.getenv("JWT_SECRET", "default-secret-change-in-production")
        self.algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.default_expiration_hours = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
        
        if len(self.secret) < 32:
            logger.warning("JWT secret is too short. Use at least 32 characters in production.")
    
    def create_token(self, user_data: Dict[str, Any], 
                    expires_in_seconds: Optional[int] = None,
                    token_type: str = "access") -> str:
        """Create a JWT token with user data and expiration."""
        try:
            # Set expiration
            if expires_in_seconds:
                expiration = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
            else:
                hours = self.default_expiration_hours
                if token_type == "refresh":
                    hours = hours * 7  # Refresh tokens last 7x longer
                expiration = datetime.now(timezone.utc) + timedelta(hours=hours)
            
            # Create payload
            payload = {
                **user_data,
                "exp": expiration,
                "iat": datetime.now(timezone.utc),
                "type": token_type
            }
            
            # Create token
            token = jwt.encode(payload, self.secret, algorithm=self.algorithm)
            return token
            
        except Exception as e:
            logger.error(f"Error creating JWT token: {e}")
            raise
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate a JWT token and return decoded data."""
        try:
            decoded_data = jwt.decode(token, self.secret, algorithms=[self.algorithm])
            return decoded_data
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token has expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            return None
        except Exception as e:
            logger.error(f"Error validating JWT token: {e}")
            return None
    
    def refresh_token(self, refresh_token: str) -> Optional[str]:
        """Create a new access token from a valid refresh token."""
        try:
            decoded_data = self.validate_token(refresh_token)
            if not decoded_data:
                return None
            
            # Verify it's a refresh token
            if decoded_data.get("type") != "refresh":
                logger.warning("Token is not a refresh token")
                return None
            
            # Create new access token
            user_data = {k: v for k, v in decoded_data.items() 
                        if k not in ["exp", "iat", "type"]}
            
            return self.create_token(user_data, token_type="access")
            
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")
            return None
