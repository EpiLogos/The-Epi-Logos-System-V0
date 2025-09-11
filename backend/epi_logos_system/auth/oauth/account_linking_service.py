"""
Secure account linking flow with re-authentication requirements.
Prevents account takeover attacks through mandatory security validations.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
import hashlib
import base64

from backend.epi_logos_system.auth.exceptions import (
    AuthenticationRequiredError, 
    ReauthenticationRequiredError, 
    DuplicateAccountError, 
    AccountLinkingError
)


logger = logging.getLogger(__name__)


class AccountLinkingService:
    """Secure OAuth account linking service."""
    
    def __init__(self):
        """Initialize account linking service."""
        # Dependencies (will be injected)
        self.db = None
        self.auth_service = None
        self.security_logger = None
        self.security_validator = None
        self.redis_client = None
        
        # Security configuration
        self.password_reauth_window = timedelta(minutes=5)  # Require recent password auth
        self.account_linking_timeout = 300  # 5 minutes for complete linking flow
    
    async def link_google_account(self, user_session: Dict[str, Any],
                                 google_tokens: Dict[str, Any],
                                 google_profile: Dict[str, Any],
                                 force_email_mismatch: bool = False) -> Dict[str, Any]:
        """Link Google account to existing user with security validations."""
        
        # Security validation 1: Require active user session
        if not user_session:
            raise AuthenticationRequiredError("Active user session required for account linking")
        
        user_id = user_session['user_id']
        
        # Security validation 2: Require recent password re-authentication
        await self._validate_recent_password_auth(user_session)
        
        # Security validation 3: Prevent duplicate Google account linking
        await self._validate_no_duplicate_google_account(google_profile['google_id'], user_id)
        
        # Security validation 4: Prevent user having multiple Google accounts
        await self._validate_no_existing_google_link(user_id)
        
        # Security validation 5: Email verification and mismatch handling
        await self._validate_email_consistency(user_session, google_profile, force_email_mismatch)
        
        # Security validation 6: Suspicious activity detection
        if self.security_validator:
            await self._validate_linking_security(user_session, google_profile)
        
        # Security validation 7: Acquire distributed lock for concurrency control
        async with self._acquire_linking_lock(user_id):
            try:
                # Store encrypted OAuth tokens
                oauth_token_id = await self._store_encrypted_oauth_tokens(
                    user_id, google_tokens, google_profile
                )
                
                # Update user profile with Google information
                await self._update_user_oauth_profile(user_id, google_profile)
                
                # Log successful linking
                await self._log_account_linking_success(user_session, google_profile)
                
                return {
                    'success': True,
                    'oauth_token_id': oauth_token_id,
                    'user_id': user_id,
                    'google_id': google_profile['google_id'],
                    'linked_at': datetime.now(timezone.utc).isoformat()
                }
                
            except Exception as e:
                await self._log_account_linking_failure(user_session, google_profile, str(e))
                raise AccountLinkingError(f"Account linking failed: {e}")
    
    async def unlink_google_account(self, user_session: Dict[str, Any],
                                   google_id: str) -> Dict[str, Any]:
        """Unlink Google account with proper security and cleanup."""
        
        # Require authentication
        if not user_session:
            raise AuthenticationRequiredError("Authentication required for account unlinking")
        
        user_id = user_session['user_id']
        
        try:
            # Find OAuth token record
            oauth_token = self.db.get_oauth_token_by_google_id(google_id)
            if not oauth_token:
                raise AccountLinkingError("Google account not linked to this user")
            
            if oauth_token['user_id'] != user_id:
                raise AccountLinkingError("Google account belongs to different user")
            
            # Delete OAuth token
            self.db.delete_oauth_token(oauth_token['id'])
            
            # Clear user's Google profile information
            self.db.clear_user_oauth_info(user_id, 'google')
            
            # Invalidate all sessions to force re-authentication
            self.db.invalidate_user_sessions(user_id)
            
            # Log unlinking activity
            if self.security_logger:
                await self.security_logger.log_account_linking(
                    user_id=user_id,
                    provider='google',
                    google_id=google_id,
                    action='unlink',
                    ip_address=user_session.get('ip_address'),
                    user_agent=user_session.get('user_agent')
                )
            
            return {
                'success': True,
                'unlinked_google_id': google_id,
                'unlinked_at': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Account unlinking failed for user {user_id}: {e}")
            raise AccountLinkingError(f"Account unlinking failed: {e}")
    
    async def _validate_recent_password_auth(self, user_session: Dict[str, Any]):
        """Validate that user has recent password authentication."""
        last_password_auth = user_session.get('last_password_auth')
        
        if not last_password_auth:
            raise ReauthenticationRequiredError(
                "Password re-authentication required within 5 minutes for account linking"
            )
        
        if isinstance(last_password_auth, str):
            last_password_auth = datetime.fromisoformat(last_password_auth.replace('Z', '+00:00'))
        
        time_since_auth = datetime.now(timezone.utc) - last_password_auth
        
        if time_since_auth > self.password_reauth_window:
            raise ReauthenticationRequiredError(
                f"Password re-authentication required within 5 minutes for account linking. "
                f"Last authentication was {int(time_since_auth.total_seconds() / 60)} minutes ago."
            )
    
    async def _validate_no_duplicate_google_account(self, google_id: str, current_user_id: str):
        """Validate that Google account is not already linked to another user."""
        if not self.db:
            return
        
        existing_user = self.db.get_user_by_google_id(google_id)
        
        if existing_user and existing_user['user_id'] != current_user_id:
            raise DuplicateAccountError(
                f"Google account already linked to another user. "
                f"Each Google account can only be linked to one user account."
            )
    
    async def _validate_no_existing_google_link(self, user_id: str):
        """Validate that user doesn't already have a Google account linked."""
        if not self.db:
            return
        
        existing_oauth = self.db.get_oauth_token_by_user(user_id, provider='google')
        
        if existing_oauth:
            raise DuplicateAccountError(
                "User already has Google account linked. "
                "Please unlink the existing account first."
            )
    
    async def _validate_email_consistency(self, user_session: Dict[str, Any],
                                        google_profile: Dict[str, Any],
                                        force_email_mismatch: bool):
        """Validate email consistency between user and Google accounts."""
        if not self.db:
            return
        
        user = self.db.get_user_by_id(user_session['user_id'])
        if not user:
            raise AccountLinkingError("User account not found")
        
        user_email = user['email']
        google_email = google_profile['email']
        
        if user_email != google_email:
            if not force_email_mismatch:
                raise AccountLinkingError(
                    f"Email mismatch detected. User account: {user_email}, "
                    f"Google account: {google_email}. Explicit confirmation required."
                )
            
            # Return warning for successful linking with mismatch
            return {
                'warning': f"Email mismatch: User account ({user_email}) differs "
                          f"from Google account ({google_email})"
            }
    
    async def _validate_linking_security(self, user_session: Dict[str, Any],
                                       google_profile: Dict[str, Any]):
        """Perform security validation for suspicious linking activity."""
        validation_result = self.security_validator.validate_linking_request({
            'user_session': user_session,
            'google_profile': google_profile,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
        if validation_result.get('is_suspicious'):
            risk_factors = validation_result.get('risk_factors', [])
            risk_score = validation_result.get('risk_score', 0)
            
            # Log security alert
            if self.security_logger:
                await self.security_logger.log_security_alert(
                    event_type='suspicious_account_linking',
                    user_id=user_session['user_id'],
                    risk_factors=risk_factors,
                    risk_score=risk_score,
                    google_id=google_profile['google_id'],
                    ip_address=user_session.get('ip_address')
                )
            
            # Block high-risk linking attempts
            if risk_score > 0.8:  # High risk threshold
                raise AccountLinkingError(
                    "Suspicious activity detected during account linking. "
                    "Please contact support if this is a legitimate request."
                )
    
    async def _acquire_linking_lock(self, user_id: str):
        """Acquire distributed lock to prevent concurrent linking attempts."""
        class LinkingLock:
            def __init__(self, redis_client, user_id):
                self.redis_client = redis_client
                self.user_id = user_id
                self.lock_key = f"account_linking:{user_id}"
                self.lock_timeout = 60  # 60 seconds
            
            async def __aenter__(self):
                if self.redis_client:
                    # Try to acquire lock
                    acquired = await self.redis_client.set(
                        self.lock_key, 
                        "locked", 
                        ex=self.lock_timeout, 
                        nx=True
                    )
                    if not acquired:
                        raise AccountLinkingError(
                            "Another account linking operation is in progress. Please try again."
                        )
                return self
            
            async def __aexit__(self, exc_type, exc_val, exc_tb):
                if self.redis_client:
                    await self.redis_client.delete(self.lock_key)
        
        return LinkingLock(self.redis_client, user_id)
    
    async def _store_encrypted_oauth_tokens(self, user_id: str,
                                          google_tokens: Dict[str, Any],
                                          google_profile: Dict[str, Any]) -> str:
        """Store OAuth tokens with encryption."""
        if not self.db:
            raise AccountLinkingError("Database not configured")
        
        # Encrypt tokens
        encrypted_access_token = self._encrypt_token(google_tokens['access_token'])
        encrypted_refresh_token = self._encrypt_token(google_tokens.get('refresh_token', ''))
        
        # Calculate expiration
        expires_in = google_tokens.get('expires_in', 3600)
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        
        # Store in database
        oauth_token_id = self.db.store_oauth_token(
            user_id=user_id,
            provider='google',
            google_id=google_profile['google_id'],
            encrypted_access_token=encrypted_access_token,
            encrypted_refresh_token=encrypted_refresh_token,
            expires_at=expires_at,
            scope=['openid', 'email', 'profile'],
            token_type='Bearer',
            metadata={
                'email_verified': google_profile.get('email_verified', False),
                'locale': google_profile.get('locale')
            }
        )
        
        return oauth_token_id
    
    async def _update_user_oauth_profile(self, user_id: str,
                                       google_profile: Dict[str, Any]):
        """Update user profile with Google information."""
        if not self.db:
            return
        
        self.db.update_user_oauth_info(
            user_id=user_id,
            provider='google',
            google_profile={
                'google_id': google_profile['google_id'],
                'email': google_profile['email'],
                'name': google_profile.get('name', ''),
                'picture': google_profile.get('picture'),
                'email_verified': google_profile.get('email_verified', False),
                'locale': google_profile.get('locale')
            },
            linked_at=datetime.now(timezone.utc)
        )
    
    def _encrypt_token(self, token: str) -> str:
        """Encrypt OAuth token for secure storage."""
        try:
            # Use application's encryption key
            import os
            encryption_key = os.getenv('OAUTH_TOKEN_ENCRYPTION_KEY')
            if not encryption_key:
                # Generate key if not configured (should be done properly in production)
                encryption_key = Fernet.generate_key().decode()
                logger.warning("Using generated encryption key - configure OAUTH_TOKEN_ENCRYPTION_KEY")
            
            fernet = Fernet(encryption_key.encode()[:44])  # Ensure proper key length
            encrypted_token = fernet.encrypt(token.encode()).decode()
            return encrypted_token
            
        except Exception as e:
            logger.error(f"Token encryption failed: {e}")
            # Fallback: hash token (less secure but better than plaintext)
            return hashlib.sha256(token.encode()).hexdigest()
    
    async def _log_account_linking_success(self, user_session: Dict[str, Any],
                                         google_profile: Dict[str, Any]):
        """Log successful account linking."""
        if not self.security_logger:
            return
        
        await self.security_logger.log_account_linking(
            user_id=user_session['user_id'],
            provider='google',
            google_id=google_profile['google_id'],
            action='link',
            success=True,
            ip_address=user_session.get('ip_address'),
            user_agent=user_session.get('user_agent'),
            timestamp=datetime.now(timezone.utc).isoformat()
        )
    
    async def _log_account_linking_failure(self, user_session: Dict[str, Any],
                                         google_profile: Dict[str, Any],
                                         error_message: str):
        """Log failed account linking attempt."""
        if not self.security_logger:
            return
        
        await self.security_logger.log_account_linking(
            user_id=user_session['user_id'],
            provider='google',
            google_id=google_profile.get('google_id'),
            action='link',
            success=False,
            error=error_message,
            ip_address=user_session.get('ip_address'),
            user_agent=user_session.get('user_agent'),
            timestamp=datetime.now(timezone.utc).isoformat()
        )