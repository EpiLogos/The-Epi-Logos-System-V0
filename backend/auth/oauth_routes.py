"""
FastAPI routes for Google OAuth 2.0 authentication with PKCE and security enhancements.
"""

import logging
import json
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
import os
import ssl
import certifi
import aiohttp

from .google_oauth_client import GoogleOAuthClientFactory
from .account_linking import AccountLinkingService
from .exceptions import (
    OAuthError, InvalidStateError, PKCEValidationError, 
    InvalidNonceError, AuthenticationRequiredError,
    ReauthenticationRequiredError, DuplicateAccountError
)


logger = logging.getLogger(__name__)

# Create router
oauth_router = APIRouter(prefix="/api/auth/oauth", tags=["OAuth Authentication"])


# Pydantic models
class OAuthStatusResponse(BaseModel):
    """OAuth connection status response."""
    connected: bool
    provider: str
    google_id: Optional[str] = None
    email: Optional[str] = None
    linked_at: Optional[str] = None


class OAuthError(BaseModel):
    """OAuth error response."""
    error: str
    error_description: Optional[str] = None
    error_code: Optional[str] = None


class OAuthSuccessResponse(BaseModel):
    """OAuth success response."""
    success: bool
    access_token: str
    refresh_token: str
    user: Dict[str, Any]
    security_validations: Optional[Dict[str, bool]] = None
    account_linked: Optional[bool] = None
    existing_user: Optional[bool] = None


# Dependency injection
async def get_oauth_client(request: Request):
    """Get configured Google OAuth client."""
    try:
        redis_client = getattr(request.app.state, 'redis_client', None)
        db_client = getattr(request.app.state, 'db_client', None)
        
        return GoogleOAuthClientFactory.create_client(
            redis_client=redis_client,
            db_client=db_client
        )
    except Exception as e:
        logger.error(f"Failed to create OAuth client: {e}")
        raise HTTPException(status_code=500, detail="OAuth service unavailable")


async def get_account_linking_service(request: Request):
    """Get configured account linking service."""
    service = AccountLinkingService()
    
    # Inject dependencies
    service.db = getattr(request.app.state, 'db_client', None)
    service.redis_client = getattr(request.app.state, 'redis_client', None)
    service.security_logger = getattr(request.app.state, 'security_logger', None)
    
    return service


async def get_current_session(request: Request) -> Optional[Dict[str, Any]]:
    """Get current user session (placeholder - implement based on JWT system)."""
    # This would integrate with the existing JWT system
    # For now, return None to simulate unauthenticated state
    authorization = request.headers.get("Authorization")
    if authorization and authorization.startswith("Bearer "):
        # JWT validation would happen here
        # Return session data if valid
        pass
    return None


# OAuth Routes

@oauth_router.get("/google/authorize")
async def google_oauth_authorize(
    request: Request,
    link_account: bool = Query(False, description="Whether this is for account linking"),
    oauth_client = Depends(get_oauth_client),
    current_session = Depends(get_current_session)
):
    """
    Initiate Google OAuth 2.0 authorization flow with PKCE and OIDC nonce.
    
    Security features:
    - PKCE (Proof Key for Code Exchange) for enhanced security
    - OIDC nonce parameter for replay attack prevention  
    - Secure state parameter for CSRF protection
    - IP binding for enhanced security
    """
    try:
        # Generate security parameters
        state = oauth_client.generate_state()
        nonce = oauth_client.generate_nonce()
        code_verifier, code_challenge = oauth_client.generate_pkce_parameters()
        
        # Prepare state data
        state_data = {
            'state': state,
            'nonce': nonce,
            'code_verifier': code_verifier,
            'code_challenge': code_challenge,
            'redirect_uri': oauth_client.redirect_uri,
            'link_account': link_account,
            'client_ip': request.client.host,
            'user_agent': request.headers.get('User-Agent', ''),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        # For account linking, store user session info
        if link_account and current_session:
            state_data['user_id'] = current_session['user_id']
        
        # Store OAuth state with expiration
        await oauth_client.store_oauth_state(state_data)
        
        # Store nonce with state association
        if oauth_client.nonce_manager:
            await oauth_client.nonce_manager.store_nonce(nonce, state)
        
        # Generate authorization URL
        auth_url = oauth_client.generate_authorization_url(
            state=state,
            nonce=nonce,
            code_challenge=code_challenge
        )
        
        logger.info(f"OAuth authorization initiated for IP {request.client.host}")
        
        # Redirect to Google OAuth
        return RedirectResponse(url=auth_url, status_code=302)
        
    except Exception as e:
        logger.error(f"OAuth authorization failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "oauth_initialization_failed",
                "error_description": "Failed to initialize OAuth flow"
            }
        )


@oauth_router.get("/google/callback")
async def google_oauth_callback(
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    oauth_client = Depends(get_oauth_client),
    linking_service = Depends(get_account_linking_service)
):
    """
    Handle Google OAuth 2.0 callback with comprehensive security validations.
    
    Security validations:
    - State parameter validation (CSRF protection)
    - PKCE validation during token exchange
    - OIDC nonce validation in ID token
    - Token revocation detection
    - Secure account linking flow
    """
    try:
        # Handle OAuth errors
        if error:
            error_msg = f"OAuth authorization failed: {error}"
            if error_description:
                error_msg += f" - {error_description}"
            
            logger.warning(f"OAuth error from Google: {error} - {error_description}")
            
            return JSONResponse(
                status_code=400,
                content={
                    "error": error,
                    "error_description": error_description or "OAuth authorization failed"
                }
            )
        
        # Validate required parameters
        if not code or not state:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "invalid_request",
                    "error_description": "Missing required parameters"
                }
            )
        
        # Process OAuth callback with all security validations
        callback_data = {
            'code': code,
            'state': state,
            'client_ip': request.client.host,
            'user_agent': request.headers.get('User-Agent', '')
        }
        
        result = await oauth_client.process_callback(callback_data)
        
        if not result['success']:
            raise OAuthError("OAuth callback processing failed")
        
        tokens = result['tokens']
        user_profile = result['user_profile']
        security_validations = result['security_validations']
        
        # Check if this is account linking flow
        if oauth_client.redis_client:
            stored_state_data = await oauth_client.redis_client.get(f"oauth_state:{state}")
            if stored_state_data:
                state_data = json.loads(stored_state_data.decode())
                is_linking = state_data.get('link_account', False)
                linking_user_id = state_data.get('user_id')
                
                if is_linking and linking_user_id:
                    # Handle secure account linking
                    current_session = {
                        'user_id': linking_user_id,
                        'last_password_auth': datetime.now(timezone.utc),  # Would be from actual session
                        'ip_address': request.client.host,
                        'user_agent': request.headers.get('User-Agent', '')
                    }
                    
                    linking_result = await linking_service.link_google_account(
                        user_session=current_session,
                        google_tokens=tokens,
                        google_profile=user_profile
                    )
                    
                    return JSONResponse(
                        status_code=200,
                        content={
                            "success": True,
                            "account_linked": True,
                            "user": {
                                "id": linking_user_id,
                                "google_id": user_profile['google_id'],
                                "email": user_profile['email'],
                                "name": user_profile['name']
                            },
                            "security_validations": security_validations,
                            "oauth_token_id": linking_result['oauth_token_id']
                        }
                    )
        
        # Handle new user creation or existing user login
        # This would integrate with your existing user management system
        user_data = await _handle_oauth_user(user_profile, tokens, oauth_client.db)
        
        # Generate JWT tokens for session
        from .jwt_handler import JWTHandler
        jwt_handler = JWTHandler()
        
        access_token = jwt_handler.create_token({
            'user_id': user_data['id'],
            'email': user_data['email'],
            'name': user_data['name'],
            'oauth_provider': 'google'
        })
        
        refresh_token = jwt_handler.create_token({
            'user_id': user_data['id'],
            'email': user_data['email']
        }, token_type='refresh')
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "access_token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": user_data['id'],
                    "email": user_data['email'],
                    "name": user_data['name'],
                    "google_id": user_data['google_id'],
                    "email_verified": user_data['email_verified']
                },
                "security_validations": security_validations,
                "existing_user": user_data.get('existing_user', False)
            }
        )
        
    except (InvalidStateError, PKCEValidationError, InvalidNonceError) as e:
        logger.warning(f"OAuth security validation failed: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "error": "security_validation_failed",
                "error_description": str(e)
            }
        )
    except OAuthError as e:
        logger.error(f"OAuth processing failed: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "error": "oauth_failed",
                "error_description": str(e)
            }
        )
    except Exception as e:
        logger.error(f"Unexpected error in OAuth callback: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "internal_server_error",
                "error_description": "OAuth callback processing failed"
            }
        )


@oauth_router.post("/google/link")
async def link_google_account(
    request: Request,
    linking_service = Depends(get_account_linking_service),
    current_session = Depends(get_current_session)
):
    """
    Link Google account to existing user with security validations.
    Requires recent password re-authentication.
    """
    try:
        if not current_session:
            raise AuthenticationRequiredError("Active session required for account linking")
        
        # This would typically receive OAuth tokens from a completed flow
        # For now, return instructions for proper linking flow
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Use /oauth/google/authorize?link_account=true to start account linking",
                "requirements": [
                    "Active user session",
                    "Recent password re-authentication (within 5 minutes)",
                    "Complete OAuth flow"
                ]
            }
        )
        
    except (AuthenticationRequiredError, ReauthenticationRequiredError, DuplicateAccountError) as e:
        return JSONResponse(
            status_code=400,
            content={
                "error": "account_linking_failed",
                "error_description": str(e)
            }
        )


@oauth_router.delete("/google/unlink")
async def unlink_google_account(
    request: Request,
    google_id: str = Query(..., description="Google ID to unlink"),
    linking_service = Depends(get_account_linking_service),
    current_session = Depends(get_current_session)
):
    """
    Unlink Google account from user with proper cleanup.
    """
    try:
        if not current_session:
            raise AuthenticationRequiredError("Authentication required for account unlinking")
        
        result = await linking_service.unlink_google_account(current_session, google_id)
        
        return JSONResponse(
            status_code=200,
            content=result
        )
        
    except AuthenticationRequiredError as e:
        return JSONResponse(
            status_code=401,
            content={
                "error": "authentication_required",
                "error_description": str(e)
            }
        )
    except Exception as e:
        logger.error(f"Account unlinking failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "unlinking_failed", 
                "error_description": "Failed to unlink Google account"
            }
        )


@oauth_router.get("/status", response_model=OAuthStatusResponse)
async def get_oauth_status(
    request: Request,
    current_session = Depends(get_current_session)
):
    """
    Get OAuth connection status for current user.
    """
    try:
        if not current_session:
            return OAuthStatusResponse(
                connected=False,
                provider="google"
            )
        
        user_id = current_session['user_id']
        db_client = getattr(request.app.state, 'db_client', None)
        
        if db_client:
            oauth_token = db_client.get_oauth_token_by_user(user_id, provider='google')
            
            if oauth_token:
                return OAuthStatusResponse(
                    connected=True,
                    provider="google",
                    google_id=oauth_token.get('google_id'),
                    email=oauth_token.get('email'),
                    linked_at=oauth_token.get('linked_at')
                )
        
        return OAuthStatusResponse(
            connected=False,
            provider="google"
        )
        
    except Exception as e:
        logger.error(f"OAuth status check failed: {e}")
        raise HTTPException(status_code=500, detail="OAuth status check failed")


@oauth_router.post("/refresh")
async def refresh_oauth_tokens(
    request: Request,
):
    """
    Refresh OAuth access token using a Google refresh token.

    Expects JSON body: { "refresh_token": string }
    Returns: { access_token, id_token?, refresh_token?, token_type, expires_in }
    """
    try:
        payload = await request.json()
        refresh_token = payload.get('refresh_token')
        if not refresh_token:
            raise HTTPException(status_code=400, detail="Missing refresh_token")

        client_id = os.getenv('GOOGLE_CLIENT_ID')
        client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
        if not client_id or not client_secret:
            logger.error("Refresh failed: missing GOOGLE_CLIENT_ID/SECRET in environment")
            raise HTTPException(status_code=500, detail="Google OAuth credentials not configured")

        token_url = "https://oauth2.googleapis.com/token"
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
        }

        # Create SSL context using certifi's CA bundle
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        connector = aiohttp.TCPConnector(ssl=ssl_context)
        
        async with aiohttp.ClientSession(connector=connector) as session:
            async with session.post(token_url, data=data) as resp:
                resp_json = await resp.json()
                if resp.status != 200:
                    err = resp_json.get('error') or 'refresh_failed'
                    desc = resp_json.get('error_description') or 'Failed to refresh token'
                    logger.warning(
                        "Google token refresh failed: status=%s error=%s desc=%s",
                        resp.status,
                        err,
                        desc,
                    )
                    return JSONResponse(status_code=resp.status, content={"error": err, "error_description": desc})

                # Pass through Google's fields to frontend
                result = {
                    'access_token': resp_json.get('access_token'),
                    'id_token': resp_json.get('id_token'),
                    'refresh_token': resp_json.get('refresh_token') or refresh_token,  # may be omitted
                    'token_type': resp_json.get('token_type', 'Bearer'),
                    'expires_in': resp_json.get('expires_in', 3600),
                }
                return JSONResponse(status_code=200, content=result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(status_code=500, detail="Token refresh failed")


# Helper functions

async def _handle_oauth_user(user_profile: Dict[str, Any], 
                           tokens: Dict[str, Any],
                           db_client) -> Dict[str, Any]:
    """Handle OAuth user creation or login."""
    if not db_client:
        raise OAuthError("Database not configured")
    
    google_id = user_profile['google_id']
    
    # Check if user already exists
    existing_user = db_client.get_user_by_google_id(google_id)
    
    if existing_user:
        # Update OAuth tokens for existing user
        db_client.update_oauth_token(
            user_id=existing_user['id'],
            provider='google',
            access_token=tokens['access_token'],
            refresh_token=tokens.get('refresh_token'),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=tokens.get('expires_in', 3600))
        )
        
        return {
            **existing_user,
            'existing_user': True
        }
    
    else:
        # Create new user from OAuth profile
        user_data = {
            'email': user_profile['email'],
            'name': user_profile['name'],
            'google_id': google_id,
            'email_verified': user_profile.get('email_verified', False),
            'profile_picture': user_profile.get('picture'),
            'locale': user_profile.get('locale'),
            'auth_provider': 'google',
            'created_at': datetime.now(timezone.utc)
        }
        
        user_id = db_client.create_user_from_oauth(user_data)
        
        # Store OAuth tokens
        db_client.store_oauth_token(
            user_id=user_id,
            provider='google',
            google_id=google_id,
            access_token=tokens['access_token'],
            refresh_token=tokens.get('refresh_token'),
            expires_at=datetime.now(timezone.utc) + timedelta(seconds=tokens.get('expires_in', 3600)),
            scope=['openid', 'email', 'profile']
        )
        
        return {
            'id': user_id,
            **user_data,
            'existing_user': False
        }
