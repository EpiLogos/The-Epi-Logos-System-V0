"""
Token exchange endpoint for Google OAuth 2.0 (PKCE).

This provides the exact path the frontend expects:
POST /auth/oauth/google/exchange

It validates the provided redirect URI against an allowlist, then exchanges
the authorization code for tokens with Google using PKCE (code_verifier).
"""

import os
import logging
import json
import base64
from typing import Optional

import aiohttp
import ssl
import certifi
from fastapi import APIRouter, HTTPException, Depends
from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, AnyHttpUrl
from ..core.container import get_user_service
from ..services.user_service import UserService
from ..models.user import UserRegistrationRequest


logger = logging.getLogger(__name__)


exchange_router = APIRouter(prefix="/auth/oauth/google", tags=["OAuth Exchange"])


class TokenExchangeRequest(BaseModel):
    code: str
    state: str
    codeVerifier: str
    redirectUri: AnyHttpUrl


class TokenExchangeResponse(BaseModel):
    access_token: str
    id_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int


def _get_redirect_allowlist() -> set[str]:
    allowlist = os.getenv("GOOGLE_REDIRECT_ALLOWLIST", "")
    items = [u.strip() for u in allowlist.split(",") if u.strip()]
    # Provide sensible defaults for local dev if not configured
    if not items:
        items = [
            "http://localhost:3000/auth/callback",
            "http://localhost:3000/auth/oauth/google/callback",
        ]
    return set(items)


def _decode_google_id_token(id_token: str) -> Optional[dict]:
    """
    Decode Google ID token (JWT) to extract user information.
    Note: In production, you should verify the token signature.
    """
    try:
        # Split the token into parts
        parts = id_token.split('.')
        if len(parts) != 3:
            return None
        
        # Decode the payload (second part)
        payload = parts[1]
        # Add padding if necessary
        padding = '=' * (4 - len(payload) % 4)
        payload += padding
        
        # Base64 decode
        decoded_bytes = base64.urlsafe_b64decode(payload)
        payload_json = json.loads(decoded_bytes)
        
        return payload_json
        
    except Exception as e:
        logger.error(f"Failed to decode Google ID token: {e}")
        return None


@exchange_router.post("/exchange")
async def exchange_code(
    request: Request, 
    payload: TokenExchangeRequest,
    user_service: UserService = Depends(get_user_service),
):
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")

    if not client_id or not client_secret:
        logger.error("Exchange failed: missing GOOGLE_CLIENT_ID/SECRET in environment")
        raise HTTPException(status_code=500, detail="Google OAuth credentials not configured")

    # Validate redirect URI against allowlist
    allowlist = _get_redirect_allowlist()
    if str(payload.redirectUri) not in allowlist:
        logger.warning(f"Blocked token exchange due to redirectUri not in allowlist: {payload.redirectUri}")
        raise HTTPException(status_code=400, detail="Invalid redirect URI")

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "code": payload.code,
        "grant_type": "authorization_code",
        "redirect_uri": str(payload.redirectUri),
        "code_verifier": payload.codeVerifier,
    }

    try:
        # Create SSL context using certifi's CA bundle
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(token_url, data=data) as resp:
                resp_json = await resp.json()
                if resp.status != 200:
                    # Pass through Google-style error for frontend mapping
                    err = resp_json.get("error") or "token_exchange_failed"
                    desc = resp_json.get("error_description") or "Failed to exchange authorization code"
                    logger.warning(
                        "Google token exchange failed: status=%s error=%s desc=%s redirectUri_ok=%s",
                        resp.status,
                        err,
                        desc,
                        str(payload.redirectUri) in allowlist,
                    )
                    return JSONResponse(status_code=resp.status, content={"error": err, "error_description": desc})

                # Extract user information from ID token and create/update MongoDB user
                id_token = resp_json.get("id_token")
                if id_token:
                    user_info = _decode_google_id_token(id_token)
                    if user_info:
                        try:
                            # Extract client information
                            ip_address = request.client.host if request.client else "unknown"
                            user_agent = request.headers.get("user-agent", "unknown")
                            
                            # Check if user already exists
                            existing_user = await user_service.get_user_by_email(user_info.get("email"))
                            
                            if existing_user:
                                # Update existing user's OAuth information
                                if not existing_user.has_oauth_provider("google"):
                                    await user_service.link_oauth_provider(
                                        str(existing_user.id),
                                        "google", 
                                        user_info.get("sub")  # Google user ID
                                    )
                                
                                # Update last login timestamps
                                existing_user.update_last_login()
                                existing_user.update_last_active()
                                
                                # Generate our JWT tokens
                                jwt_service = user_service.jwt_service
                                access_token = await jwt_service.create_access_token(existing_user)
                                refresh_token = await jwt_service.create_refresh_token(existing_user)
                                
                                # Session management removed - using stateless JWT
                                
                                # Return user data with our tokens (same format as registration)
                                user_data = existing_user.to_public_dict()
                                user_data.update({
                                    "accessToken": access_token,
                                    "refreshToken": refresh_token,
                                    "sessionId": None  # Session removed - using stateless JWT
                                })
                                
                                return {
                                    "success": True,
                                    "message": "OAuth login successful",
                                    "data": user_data
                                }
                            else:
                                # Create new user from Google profile
                                registration_data = UserRegistrationRequest(
                                    email=user_info.get("email"),
                                    firstName=user_info.get("given_name"),
                                    lastName=user_info.get("family_name"),
                                    linkOAuthAccount=True,
                                    oauthProvider="google",
                                    oauthId=user_info.get("sub")  # Google user ID
                                )
                                
                                # Use existing user creation logic
                                user_data = await user_service.create_user(
                                    registration_data=registration_data,
                                    ip_address=ip_address,
                                    user_agent=user_agent
                                )
                                
                                return {
                                    "success": True,
                                    "message": "User registered via OAuth successfully",
                                    "data": user_data
                                }
                                
                        except Exception as user_error:
                            logger.error(f"Failed to create/update user from OAuth: {user_error}")
                            # Fall back to returning Google tokens only
                            pass
                
                # Fallback: Shape response to what frontend expects (original behavior)
                result = {
                    "access_token": resp_json.get("access_token"),
                    "id_token": resp_json.get("id_token"),
                    "refresh_token": resp_json.get("refresh_token"),
                    "token_type": resp_json.get("token_type", "Bearer"),
                    "expires_in": resp_json.get("expires_in", 3600),
                }

                return result
    except aiohttp.ClientError as e:
        logger.error(f"Network error during token exchange: {e}")
        raise HTTPException(status_code=502, detail="Network error during token exchange")
    except Exception as e:
        logger.error(f"Unexpected error during token exchange: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during token exchange")
