"""
External token revocation detection and cleanup flows.
Handles tokens revoked directly from Google Account settings.
"""

import logging
import asyncio
import aiohttp
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

from backend.epi_logos_system.auth.exceptions import TokenValidationError, RevocationCleanupError, TokenRevocationError


logger = logging.getLogger(__name__)


class TokenRevocationHandler:
    """Handler for external OAuth token revocation detection and cleanup."""
    
    def __init__(self, google_client_id: str, google_client_secret: str):
        """Initialize token revocation handler."""
        self.google_client_id = google_client_id
        self.google_client_secret = google_client_secret
        
        # Google token validation endpoints
        self.token_info_url = "https://oauth2.googleapis.com/tokeninfo"
        self.revocation_url = "https://oauth2.googleapis.com/revoke"
        
        # Dependencies (will be injected)
        self.db = None
        self.notification_service = None
    
    async def validate_token_with_google(self, access_token: str) -> bool:
        """Validate token with Google token introspection endpoint."""
        try:
            async with aiohttp.ClientSession() as session:
                # Use token info endpoint for validation
                url = f"{self.token_info_url}?access_token={access_token}"
                
                async with session.get(url) as response:
                    if response.status == 200:
                        token_info = await response.json()
                        
                        # Check if token is active and not expired
                        if token_info.get('error'):
                            return False
                        
                        exp = token_info.get('exp')
                        active = token_info.get('active', True)
                        client_ok = (
                            token_info.get('aud') == self.google_client_id
                            or token_info.get('client_id') == self.google_client_id
                            or token_info.get('aud') is None
                        )
                        if active and client_ok and (not exp or int(exp) > datetime.now(timezone.utc).timestamp()):
                            return True
                        return False
                    
                    elif response.status == 400:
                        # Invalid or revoked token
                        error_data = await response.json()
                        if error_data.get('error') == 'invalid_token':
                            return False
                    
                    elif response.status == 429:
                        # Rate limited - handle gracefully
                        retry_after = response.headers.get('Retry-After', '60')
                        logger.warning(f"Google API rate limited, retrying after {retry_after}s")
                        await asyncio.sleep(int(retry_after))
                        return False  # Will be retried later
                    
                    else:
                        logger.warning(f"Unexpected response from Google token validation: {response.status}")
                        return True  # Fail-open approach for better UX
            
        except aiohttp.ClientConnectorError:
            logger.warning("Google API connection failed")
            return True  # Fail-open when Google is unavailable
        except aiohttp.ClientError as e:
            logger.error(f"HTTP error during token validation: {e}")
            raise TokenValidationError(f"Token validation failed: {e}")
        except Exception as e:
            logger.error(f"Unexpected error during token validation: {e}")
            raise TokenValidationError(f"Unexpected token validation error: {e}")
    
    async def cleanup_revoked_token(self, user_id: str, revoked_token: str):
        """Clean up revoked tokens and invalidate user sessions."""
        if not self.db:
            raise RevocationCleanupError("Database client not configured")
        
        try:
            # Find OAuth token record
            oauth_token = self.db.get_oauth_token_by_token(revoked_token)
            if not oauth_token:
                logger.warning(f"OAuth token not found for cleanup: {revoked_token[:8]}...")
                return
            
            try:
                oauth_token_id = oauth_token['id'] if isinstance(oauth_token, dict) else getattr(oauth_token, 'id', None)
            except Exception:
                oauth_token_id = None
            if oauth_token_id is None:
                oauth_token_id = str(oauth_token)
            
            # Delete OAuth token from database
            self.db.delete_oauth_token(oauth_token_id)
            
            # Invalidate all user sessions to force re-authentication
            self.db.invalidate_user_sessions(user_id)
            
            # Log security event
            self.db.create_security_log(
                event_type='oauth_token_revoked',
                user_id=user_id,
                description=f'OAuth token revoked externally',
                ip_address=None,  # External revocation
                user_agent=None,
                metadata={
                    'oauth_token_id': oauth_token_id,
                    'token_prefix': revoked_token[:8] + "..." if revoked_token else None,
                    'revocation_source': 'external'
                }
            )
            
            logger.info(f"Successfully cleaned up revoked token for user {user_id}")
            
        except Exception as e:
            logger.error(f"Token cleanup failed for user {user_id}: {e}")
            raise RevocationCleanupError(f"Cleanup failed: {e}")
    
    async def handle_token_revocation(self, user_id: str, revoked_token: str):
        """Handle complete token revocation flow including user notification."""
        try:
            # Clean up revoked token
            await self.cleanup_revoked_token(user_id, revoked_token)
            
            # Send notification to user
            if self.notification_service:
                await self._notify_user_of_revocation(user_id)
            else:
                logger.warning("Notification service not configured - skipping user notification")
            
        except Exception as e:
            logger.error(f"Token revocation handling failed for user {user_id}: {e}")
            raise
    
    async def _notify_user_of_revocation(self, user_id: str):
        """Send notification to user about token revocation."""
        try:
            # Get user information
            user = self.db.get_user_by_id(user_id)
            if not user:
                logger.warning(f"User not found for notification: {user_id}")
                return
            
            # Send notification
            await self.notification_service.send_notification(
                user_id=user_id,
                type='oauth_revocation',
                title='Google Account Access Revoked',
                message=(
                    'Your Google account access has been revoked. '
                    'Please sign in again to continue using your account.'
                ),
                priority='high',
                metadata={
                    'action_required': True,
                    'revocation_timestamp': datetime.now(timezone.utc).isoformat()
                }
            )
            
            logger.info(f"Sent revocation notification to user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to send revocation notification to user {user_id}: {e}")
    
    async def run_background_validation(self, batch_size: int = 50) -> Dict[str, Any]:
        """Run background job to validate all OAuth tokens."""
        if not self.db:
            return {'error': 'Database not configured'}
        
        try:
            # Get all active OAuth tokens
            oauth_tokens = self.db.get_all_active_oauth_tokens()
            
            if not oauth_tokens:
                return {
                    'total_validated': 0,
                    'revoked_count': 0,
                    'active_count': 0,
                    'batches_processed': 0
                }
            
            total_tokens = len(oauth_tokens)
            revoked_count = 0
            active_count = 0
            batches_processed = 0
            
            # Process in batches to avoid overwhelming Google API
            for i in range(0, total_tokens, batch_size):
                batch = oauth_tokens[i:i + batch_size]
                batches_processed += 1
                
                # Validate batch concurrently (with rate limiting)
                batch_tasks = []
                for token_record in batch:
                    task = self._validate_token_record(token_record)
                    batch_tasks.append(task)
                
                # Wait for batch completion with some delay to respect rate limits
                batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)
                
                # Process results
                for token_record, result in zip(batch, batch_results):
                    if isinstance(result, Exception):
                        logger.warning(f"Token validation failed: {result}")
                        continue
                    
                    if result:
                        active_count += 1
                    else:
                        revoked_count += 1
                        # Handle revoked token
                        await self.handle_token_revocation(
                            token_record['user_id'], 
                            token_record['access_token']
                        )
                
                # Rate limiting delay between batches
                if i + batch_size < total_tokens:
                    await asyncio.sleep(1)  # 1 second delay between batches
            
            logger.info(f"Background validation completed: {total_tokens} tokens, {revoked_count} revoked")
            
            return {
                'total_validated': total_tokens,
                'revoked_count': revoked_count,
                'active_count': active_count,
                'batches_processed': batches_processed,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Background token validation failed: {e}")
            return {'error': str(e)}
    
    async def _validate_token_record(self, token_record: Dict[str, Any]) -> bool:
        """Validate a single token record."""
        try:
            access_token = token_record['access_token']
            return await self.validate_token_with_google(access_token)
        except Exception as e:
            logger.warning(f"Failed to validate token for user {token_record.get('user_id')}: {e}")
            return True  # Assume valid on error to avoid false positives
    
    async def handle_revocation_webhook(self, webhook_payload: Dict[str, Any]):
        """Handle Google revocation webhook notifications."""
        try:
            # Validate webhook security
            await self._validate_webhook_payload(webhook_payload)
            
            # Extract user information
            google_user_id = webhook_payload.get('sub')
            if not google_user_id:
                raise TokenRevocationError("Missing user ID in webhook payload")
            
            # Find user by Google ID
            user = self.db.get_user_by_google_id(google_user_id)
            if not user:
                logger.warning(f"User not found for Google ID in webhook: {google_user_id}")
                return
            
            user_id = user['id']
            
            # Get all OAuth tokens for this user
            oauth_tokens = self.db.get_oauth_tokens_by_user(user_id)
            
            # Clean up all tokens for this user
            for token_record in oauth_tokens:
                await self.cleanup_revoked_token(user_id, token_record['access_token'])
            
            logger.info(f"Processed revocation webhook for user {user_id}")
            
        except Exception as e:
            logger.error(f"Webhook handling failed: {e}")
            raise TokenRevocationError(f"Webhook processing failed: {e}")
    
    async def _validate_webhook_payload(self, payload: Dict[str, Any]):
        """Validate security of webhook payload."""
        # Verify issuer
        issuer = payload.get('iss')
        if issuer != 'https://accounts.google.com':
            raise TokenRevocationError("Invalid webhook issuer")
        
        # Verify audience (should be our client ID)
        audience = payload.get('aud')
        if audience != self.google_client_id:
            raise TokenRevocationError("Invalid webhook audience")
        
        # Verify event type
        events = payload.get('events', [])
        expected_event = 'https://schemas.openid.net/secevent/oauth/event-type/token-revoked'
        if expected_event not in events:
            raise TokenRevocationError("Invalid webhook event type")
        
        # Verify timestamp (not too old)
        issued_at = payload.get('iat')
        if issued_at:
            issued_time = datetime.fromtimestamp(issued_at, tz=timezone.utc)
            if datetime.now(timezone.utc) - issued_time > timedelta(minutes=5):
                raise TokenRevocationError("Webhook payload too old")


class RevocationScheduler:
    """Scheduler for token revocation background jobs."""
    
    def __init__(self):
        """Initialize revocation scheduler."""
        self.job_scheduler = None
        self.revocation_handler = None
    
    async def schedule_daily_validation(self, hour: int = 2, minute: int = 0):
        """Schedule daily token validation job."""
        if not self.job_scheduler:
            raise Exception("Job scheduler not configured")
        
        # Schedule job with cron expression
        self.job_scheduler.add_job(
            self._run_daily_validation,
            trigger='cron',
            hour=hour,
            minute=minute,
            id='daily_token_validation',
            replace_existing=True
        )
        
        logger.info(f"Scheduled daily token validation at {hour:02d}:{minute:02d}")
    
    async def _run_daily_validation(self):
        """Execute daily token validation job."""
        if not self.revocation_handler:
            logger.error("Revocation handler not configured")
            return
        
        try:
            results = await self.revocation_handler.run_background_validation()
            logger.info(f"Daily validation completed: {results}")
        except Exception as e:
            logger.error(f"Daily validation job failed: {e}")
    
    async def handle_suspicious_activity(self, activity: Dict[str, Any]):
        """Handle suspicious activity by triggering immediate validation."""
        user_id = activity.get('user_id')
        if user_id:
            await self.trigger_immediate_validation(user_id)
    
    async def trigger_immediate_validation(self, user_id: str):
        """Trigger immediate token validation for a specific user."""
        if not self.revocation_handler:
            logger.error("Revocation handler not configured")
            return
        
        try:
            # Get user's OAuth tokens
            if self.revocation_handler.db:
                oauth_tokens = self.revocation_handler.db.get_oauth_tokens_by_user(user_id)
                
                # Validate each token
                for token_record in oauth_tokens:
                    is_valid = await self.revocation_handler.validate_token_with_google(
                        token_record['access_token']
                    )
                    
                    if not is_valid:
                        await self.revocation_handler.handle_token_revocation(
                            user_id, token_record['access_token']
                        )
                
                logger.info(f"Immediate validation completed for user {user_id}")
                
        except Exception as e:
            logger.error(f"Immediate validation failed for user {user_id}: {e}")
    
    def get_validation_config(self) -> Dict[str, Any]:
        """Get validation job configuration."""
        return {
            'timeout_seconds': 60,
            'max_retries': 3,
            'batch_size': 50,
            'rate_limit_delay': 1
        }
