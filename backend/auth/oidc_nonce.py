"""
OIDC nonce parameter management for preventing replay attacks.
Implements secure nonce generation, storage, and validation.
"""

import secrets
import base64
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from .exceptions import InvalidNonceError, NonceExpiredError, NonceReplayError


logger = logging.getLogger(__name__)


class NonceValidationError(Exception):
    """Raised when nonce validation fails."""
    pass


class NonceManager:
    """OIDC nonce parameter manager with Redis storage."""
    
    def __init__(self, redis_client, enable_security_logging: bool = False):
        """Initialize nonce manager with Redis client."""
        self.redis_client = redis_client
        self.enable_security_logging = enable_security_logging
        self.default_expiration = 300  # 5 minutes
    
    def generate_nonce(self) -> str:
        """Generate cryptographically secure nonce."""
        # Generate 24 bytes of randomness = 32 characters base64url encoded
        random_bytes = secrets.token_bytes(24)
        nonce = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
        return nonce
    
    async def store_nonce(self, nonce: str, state: str, 
                         expiration_seconds: int = None):
        """Store nonce in Redis with expiration."""
        expiration = expiration_seconds or self.default_expiration
        
        await self.redis_client.setex(
            f"oauth_nonce:{nonce}",
            expiration,
            state
        )
        
        logger.debug(f"Stored nonce {nonce[:8]}... with {expiration}s expiration")
    
    async def validate_and_consume_nonce(self, received_nonce: str, 
                                       expected_state: str,
                                       client_ip: str = None,
                                       user_agent: str = None) -> str:
        """Validate nonce and consume it (one-time use)."""
        try:
            # Retrieve nonce from Redis
            stored_state = await self.redis_client.get(f"oauth_nonce:{received_nonce}")
            
            if stored_state is None:
                # Check if this might be a replay attack
                await self._handle_nonce_validation_failure(
                    received_nonce, "expired_or_invalid", client_ip, user_agent
                )
                raise NonceExpiredError("Nonce not found - expired or invalid")
            
            stored_state = stored_state.decode('utf-8')
            
            # Validate state association
            if stored_state != expected_state:
                await self._handle_nonce_validation_failure(
                    received_nonce, "state_mismatch", client_ip, user_agent
                )
                raise InvalidNonceError("Nonce state mismatch")
            
            # Delete nonce immediately (one-time use)
            deleted = await self.redis_client.delete(f"oauth_nonce:{received_nonce}")
            if deleted == 0:
                # Race condition - nonce was already consumed
                await self._handle_nonce_validation_failure(
                    received_nonce, "replay_attack", client_ip, user_agent
                )
                raise NonceReplayError("Nonce already consumed - possible replay attack")
            
            logger.debug(f"Successfully validated and consumed nonce {received_nonce[:8]}...")
            return stored_state
            
        except (InvalidNonceError, NonceExpiredError, NonceReplayError):
            raise
        except Exception as e:
            logger.error(f"Unexpected error during nonce validation: {e}")
            raise InvalidNonceError(f"Nonce validation failed: {e}")
    
    async def cleanup_nonce(self, nonce: str):
        """Clean up nonce on OAuth flow errors."""
        try:
            await self.redis_client.delete(f"oauth_nonce:{nonce}")
            logger.debug(f"Cleaned up nonce {nonce[:8]}...")
        except Exception as e:
            logger.warning(f"Failed to cleanup nonce {nonce[:8]}...: {e}")
    
    async def cleanup_expired_nonces(self) -> int:
        """Batch cleanup of expired nonces."""
        try:
            # Scan for nonce keys
            nonce_keys = []
            async for key in self.redis_client.scan_iter(match="oauth_nonce:*"):
                if isinstance(key, bytes):
                    key = key.decode('utf-8')
                nonce_keys.append(key)
            
            if nonce_keys:
                # Check which ones are expired and delete them
                deleted_count = await self.redis_client.delete(*nonce_keys)
                logger.info(f"Cleaned up {deleted_count} expired nonces")
                return deleted_count
            
            return 0
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired nonces: {e}")
            return 0
    
    async def _handle_nonce_validation_failure(self, nonce: str, failure_type: str,
                                             client_ip: str = None, 
                                             user_agent: str = None):
        """Handle nonce validation failures with security logging."""
        if not self.enable_security_logging:
            return
        
        try:
            # Log security event
            security_event = {
                'event_type': 'oauth_nonce_validation_failure',
                'failure_type': failure_type,
                'nonce_prefix': nonce[:8] if nonce else None,
                'client_ip': client_ip,
                'user_agent': user_agent,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            # This would typically log to a security monitoring system
            logger.warning(f"Nonce validation failure: {json.dumps(security_event)}")
            
            # Rate limiting check for suspicious activity
            if client_ip and failure_type == 'replay_attack':
                await self._check_rate_limiting(client_ip, user_agent)
                
        except Exception as e:
            logger.error(f"Failed to handle nonce validation failure logging: {e}")
    
    async def _check_rate_limiting(self, client_ip: str, user_agent: str = None):
        """Check rate limiting for suspicious nonce validation failures."""
        try:
            rate_limit_key = f"nonce_failures:{client_ip}"
            
            # Get current failure count
            current_failures = await self.redis_client.get(rate_limit_key)
            failure_count = int(current_failures) if current_failures else 0
            
            # Increment failure count
            await self.redis_client.setex(rate_limit_key, 3600, failure_count + 1)  # 1 hour window
            
            # Check if rate limit exceeded
            if failure_count >= 5:  # More than 5 failures per hour
                logger.critical(
                    f"Rate limit exceeded for nonce validation failures from {client_ip}. "
                    f"Possible attack in progress. User-Agent: {user_agent}"
                )
                # This could trigger additional security measures
                raise Exception("Rate limit exceeded for nonce validation failures")
                
        except Exception as e:
            logger.error(f"Rate limiting check failed: {e}")
    
    def _serialize_state_data(self, state_data: Dict[str, Any]) -> str:
        """Serialize state data for storage."""
        return json.dumps(state_data, default=str)
    
    def _deserialize_state_data(self, serialized_data: str) -> Dict[str, Any]:
        """Deserialize state data from storage."""
        return json.loads(serialized_data)