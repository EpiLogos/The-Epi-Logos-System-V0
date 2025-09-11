"""
OAuth provider handling for Google and GitHub authentication.
"""

import os
import logging
from typing import Dict, Any, Optional
from urllib.parse import urlencode


logger = logging.getLogger(__name__)


class OAuthHandler:
    """OAuth provider configuration and handling."""
    
    def __init__(self):
        """Initialize OAuth handler with provider configurations."""
        self.providers = {
            "google": {
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "auth_url": "https://accounts.google.com/o/oauth2/v2/auth",
                "token_url": "https://oauth2.googleapis.com/token",
                "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo",
                "scope": "openid email profile"
            },
            "github": {
                "client_id": os.getenv("GITHUB_CLIENT_ID"),
                "client_secret": os.getenv("GITHUB_CLIENT_SECRET"),
                "auth_url": "https://github.com/login/oauth/authorize",
                "token_url": "https://github.com/login/oauth/access_token",
                "user_info_url": "https://api.github.com/user",
                "scope": "user:email"
            }
        }
    
    def get_provider_config(self, provider: str) -> Optional[Dict[str, Any]]:
        """Get configuration for a specific OAuth provider."""
        return self.providers.get(provider)
    
    def get_authorization_url(self, provider: str, state: str, 
                            redirect_uri: str = None) -> Optional[str]:
        """Generate OAuth authorization URL for a provider."""
        try:
            config = self.get_provider_config(provider)
            if not config:
                logger.error(f"Unknown OAuth provider: {provider}")
                return None
            
            if not config["client_id"]:
                logger.error(f"Client ID not configured for {provider}")
                return None
            
            # Default redirect URI
            if not redirect_uri:
                redirect_uri = f"http://localhost:3000/auth/callback/{provider}"
            
            # Build authorization URL
            params = {
                "client_id": config["client_id"],
                "redirect_uri": redirect_uri,
                "scope": config["scope"],
                "state": state,
                "response_type": "code"
            }
            
            # Provider-specific parameters
            if provider == "google":
                params["access_type"] = "offline"
                params["prompt"] = "consent"
            
            auth_url = f"{config['auth_url']}?{urlencode(params)}"
            return auth_url
            
        except Exception as e:
            logger.error(f"Error generating OAuth URL for {provider}: {e}")
            return None
    
    def handle_callback(self, provider: str, callback_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle OAuth callback and exchange code for tokens."""
        try:
            config = self.get_provider_config(provider)
            if not config:
                raise ValueError(f"Unknown OAuth provider: {provider}")
            
            auth_code = callback_data.get("code")
            if not auth_code:
                raise ValueError("Authorization code not provided")
            
            # This is a placeholder implementation
            # In a real implementation, you would:
            # 1. Exchange the authorization code for access token
            # 2. Use the access token to get user information
            # 3. Create or update user in the database
            # 4. Generate JWT tokens for the user
            
            raise NotImplementedError("OAuth callback handling not fully implemented yet")
            
        except Exception as e:
            logger.error(f"Error handling OAuth callback for {provider}: {e}")
            raise
    
    def validate_state(self, received_state: str, expected_state: str) -> bool:
        """Validate OAuth state parameter to prevent CSRF attacks."""
        return received_state == expected_state
