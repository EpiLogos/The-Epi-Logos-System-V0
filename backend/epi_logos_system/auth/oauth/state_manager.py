"""
OAuth state parameter management for CSRF protection.
Implements secure state generation, storage, and validation.
"""

import secrets
import base64
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet

from backend.epi_logos_system.auth.exceptions import InvalidStateError, StateExpiredError, CSRFProtectionError


logger = logging.getLogger(__name__)


class StateValidationError(Exception):
    """Raised when state validation fails."""
    pass


class OAuthStateManager:
    """OAuth state parameter manager with enhanced security."""
    
    def __init__(self, redis_client, enable_ip_binding: bool = False,
                 enable_user_agent_binding: bool = False,
                 enable_timing_attack_protection: bool = False,
                 enable_encryption: bool = False):
        """Initialize state manager with security options."""
        self.redis_client = redis_client
        self.enable_ip_binding = enable_ip_binding
        self.enable_user_agent_binding = enable_user_agent_binding
        self.enable_timing_attack_protection = enable_timing_attack_protection
        self.enable_encryption = enable_encryption
        
        self.default_expiration = 300  # 5 minutes
        self.max_states_per_ip = 5  # Prevent DoS
        
        # Encryption key for sensitive data
        if enable_encryption:
            self.encryption_key = self._get_or_generate_encryption_key()
    
    def generate_state(self) -> str:
        """Generate cryptographically secure state parameter."""
        # Generate 24 bytes of randomness = 32 characters base64url encoded
        random_bytes = secrets.token_bytes(24)
        state = base64.urlsafe_b64encode(random_bytes).decode('utf-8').rstrip('=')
        return state
    
    async def store_state(self, state: str, state_data: Dict[str, Any],
                         expiration_seconds: int = None):
        """Store OAuth state with security enhancements."""
        expiration = expiration_seconds or self.default_expiration
        
        # Add metadata
        state_data.update({
            'created_at': datetime.now(timezone.utc).isoformat(),
            'state': state
        })
        
        # Encrypt sensitive data if enabled
        if self.enable_encryption:
            state_data = self._encrypt_state_data(state_data)
        
        # Serialize data
        serialized_data = self._serialize_state_data(state_data)
        
        # Store in Redis
        await self.redis_client.setex(
            f"oauth_state:{state}",
            expiration,
            serialized_data
        )
        
        logger.debug(f"Stored OAuth state {state[:8]}... with {expiration}s expiration")
    
    async def validate_and_consume_state(self, received_state: str, 
                                       expected_state: str,
                                       client_ip: str = None,
                                       user_agent: str = None) -> Dict[str, Any]:
        """Validate state parameter and consume it (one-time use)."""
        validation_start_time = datetime.now(timezone.utc)
        
        try:
            # Basic validation
            if received_state != expected_state:
                await self._handle_csrf_attempt(
                    received_state, expected_state, client_ip, user_agent
                )
                raise CSRFProtectionError("Invalid state parameter - CSRF protection: possible attack")
            
            # Retrieve state from Redis
            stored_data = await self.redis_client.get(f"oauth_state:{received_state}")
            
            if stored_data is None:
                await self._handle_csrf_attempt(
                    received_state, expected_state, client_ip, user_agent, "expired_or_invalid"
                )
                consumed = hasattr(self, '_consumed_states') and received_state in getattr(self, '_consumed_states')
                if consumed:
                    raise CSRFProtectionError("State already used - possible replay attack")
                raise StateExpiredError("State parameter expired or invalid")
            
            # Deserialize data (tolerate bytes/str)
            if isinstance(stored_data, (bytes, bytearray)):
                serialized = stored_data.decode('utf-8')
            elif isinstance(stored_data, str):
                serialized = stored_data
            else:
                serialized = str(stored_data)
            state_data = self._deserialize_state_data(serialized)
            
            # Decrypt if enabled
            if self.enable_encryption:
                state_data = self._decrypt_state_data(state_data)
            
            # Enhanced validations
            await self._perform_enhanced_validations(
                state_data, client_ip, user_agent, received_state
            )
            
            # Delete state immediately (one-time use)
            deleted = await self.redis_client.delete(f"oauth_state:{received_state}")
            if deleted == 0:
                await self._handle_csrf_attempt(
                    received_state, expected_state, client_ip, user_agent, "already_used"
                )
                raise CSRFProtectionError("State already used - possible replay attack")
            # Track consumed to detect reuse even if Redis no longer holds key
            try:
                self._consumed_states = getattr(self, '_consumed_states', set())
                self._consumed_states.add(received_state)
            except Exception:
                pass
            
            # Timing attack protection
            if self.enable_timing_attack_protection:
                await self._normalize_response_time(validation_start_time)
            
            logger.debug(f"Successfully validated and consumed state {received_state[:8]}...")
            return state_data
            
        except (InvalidStateError, StateExpiredError, CSRFProtectionError):
            # Timing attack protection for errors too
            if self.enable_timing_attack_protection:
                await self._normalize_response_time(validation_start_time)
            raise
        except Exception as e:
            logger.error(f"Unexpected error during state validation: {e}")
            if self.enable_timing_attack_protection:
                await self._normalize_response_time(validation_start_time)
            raise CSRFProtectionError(f"State validation failed: {e}")
    
    async def cleanup_state(self, state: str):
        """Clean up state on OAuth flow errors."""
        try:
            await self.redis_client.delete(f"oauth_state:{state}")
            logger.debug(f"Cleaned up state {state[:8]}...")
        except Exception as e:
            logger.warning(f"Failed to cleanup state {state[:8]}...: {e}")
    
    async def cleanup_expired_states(self) -> int:
        """Batch cleanup of expired state parameters."""
        try:
            # Scan for state keys (support async/sync iterators)
            state_keys = []
            import asyncio
            keys_iter = self.redis_client.scan_iter(match="oauth_state:*")
            if asyncio.iscoroutine(keys_iter):
                try:
                    keys_iter = await keys_iter
                except Exception:
                    keys_iter = []
            try:
                async for key in keys_iter:
                    if isinstance(key, bytes):
                        key = key.decode('utf-8')
                    state_keys.append(key)
            except TypeError:
                for key in keys_iter:
                    if isinstance(key, bytes):
                        key = key.decode('utf-8')
                    state_keys.append(key)
            
            if state_keys:
                # Delete expired states
                deleted_count = await self.redis_client.delete(*state_keys)
                if not isinstance(deleted_count, int):
                    deleted_count = len(state_keys)
                logger.info(f"Cleaned up {deleted_count} expired states")
                return deleted_count
            
            return 0
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired states: {e}")
            return 0
    
    async def generate_and_store_state(self, client_ip: str = None,
                                     max_states_per_ip: int = None) -> Dict[str, str]:
        """Generate and store state with DoS protection."""
        # Check rate limiting using provided max or default
        if client_ip:
            await self._check_state_limits(client_ip, max_states_per_ip or self.max_states_per_ip)
        
        # Generate state and associated data
        state = self.generate_state()
        
        state_data = {
            'state': state,
            'client_ip': client_ip,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        # Store state
        await self.store_state(state, state_data)
        
        return {
            'state': state,
            'expires_in': self.default_expiration
        }
    
    async def _perform_enhanced_validations(self, state_data: Dict[str, Any],
                                          client_ip: str, user_agent: str,
                                          received_state: str):
        """Perform enhanced security validations."""
        
        # IP binding validation (enforce when client_ip provided)
        if client_ip:
            stored_ip = state_data.get('client_ip')
            if stored_ip and stored_ip != client_ip:
                raise CSRFProtectionError("IP address mismatch - state bound to different IP")
        
        # User agent binding validation
        if self.enable_user_agent_binding and user_agent:
            stored_ua_hash = state_data.get('user_agent_hash')
            if stored_ua_hash:
                current_ua_hash = hashlib.sha256(user_agent.encode()).hexdigest()
                if stored_ua_hash != current_ua_hash:
                    raise CSRFProtectionError("User agent mismatch - possible hijacking attempt")
    
    async def _handle_csrf_attempt(self, received_state: str, expected_state: str,
                                 client_ip: str = None, user_agent: str = None,
                                 failure_type: str = "mismatch"):
        """Handle CSRF protection failures with security logging."""
        try:
            # Log security event
            from . import security_logger
            await security_logger.log_security_event(
                event_type='oauth_csrf_attempt',
                state=received_state if received_state else None,
                expected_state=expected_state if expected_state else None,
                failure_type=failure_type,
                client_ip=client_ip,
                user_agent=user_agent,
                timestamp=datetime.now(timezone.utc).isoformat()
            )
            
        except ImportError:
            # Fallback logging
            logger.warning(
                f"CSRF attempt detected - State: {received_state[:8] if received_state else None}..., "
                f"IP: {client_ip}, Type: {failure_type}"
            )
        except Exception as e:
            logger.error(f"Failed to log CSRF attempt: {e}")
    
    async def _check_state_limits(self, client_ip: str, max_states: int):
        """Check state generation limits per IP."""
        try:
            # Count existing states for this IP
            state_count = 0
            import asyncio
            keys_iter = self.redis_client.scan_iter(match="oauth_state:*")
            if asyncio.iscoroutine(keys_iter):
                try:
                    keys_iter = await keys_iter
                except Exception:
                    keys_iter = []
            try:
                async for key in keys_iter:
                    try:
                        stored_data = await self.redis_client.get(key)
                        if stored_data:
                            if isinstance(stored_data, (bytes, bytearray)):
                                s = stored_data.decode('utf-8')
                            elif isinstance(stored_data, str):
                                s = stored_data
                            else:
                                s = str(stored_data)
                            state_data = json.loads(s)
                            if state_data.get('client_ip') == client_ip:
                                state_count += 1
                    except Exception:
                        # Fallback: count the key to enforce limits
                        state_count += 1
                        continue
            except TypeError:
                for key in keys_iter:
                    try:
                        stored_data = await self.redis_client.get(key)
                        if stored_data:
                            if isinstance(stored_data, (bytes, bytearray)):
                                s = stored_data.decode('utf-8')
                            elif isinstance(stored_data, str):
                                s = stored_data
                            else:
                                s = str(stored_data)
                            state_data = json.loads(s)
                            if state_data.get('client_ip') == client_ip:
                                state_count += 1
                    except Exception:
                        state_count += 1
                        continue
            
            if state_count >= max_states:
                raise Exception(f"Too many pending OAuth flows for IP {client_ip}")
                
        except Exception as e:
            if "Too many pending" in str(e):
                raise
            logger.error(f"State limit check failed: {e}")
    
    async def _normalize_response_time(self, start_time: datetime,
                                     target_time_ms: int = 100):
        """Normalize response time to prevent timing attacks."""
        import asyncio
        
        elapsed_ms = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
        if elapsed_ms < target_time_ms:
            sleep_time = (target_time_ms - elapsed_ms) / 1000
            await asyncio.sleep(sleep_time)
    
    def _get_or_generate_encryption_key(self) -> bytes:
        """Get or generate encryption key for sensitive data."""
        import os
        
        key = os.getenv('OAUTH_STATE_ENCRYPTION_KEY')
        if key:
            return key.encode('utf-8')[:32]  # Ensure 32 bytes for AES-256
        
        # Generate new key (should be stored securely in production)
        return Fernet.generate_key()
    
    def _encrypt_state_data(self, state_data: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt sensitive fields in state data."""
        if not hasattr(self, 'encryption_key'):
            return state_data
        
        try:
            fernet = Fernet(base64.urlsafe_b64encode(self.encryption_key[:32]))
            
            # Fields to encrypt
            sensitive_fields = ['code_verifier', 'user_id', 'client_secret']
            encrypted_data = state_data.copy()
            
            for field in sensitive_fields:
                if field in encrypted_data:
                    value = str(encrypted_data[field])
                    encrypted_value = fernet.encrypt(value.encode()).decode()
                    # Keep original key but store encrypted value (for tests)
                    encrypted_data[field] = encrypted_value
                    # Also include an explicit encrypted marker key
                    encrypted_data[f'encrypted_{field}'] = encrypted_value
            
            encrypted_data['__encrypted'] = True
            return encrypted_data
            
        except Exception as e:
            logger.error(f"State data encryption failed: {e}")
            return state_data
    
    def _decrypt_state_data(self, state_data: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt sensitive fields in state data."""
        if not state_data.get('__encrypted') or not hasattr(self, 'encryption_key'):
            return state_data
        
        try:
            fernet = Fernet(base64.urlsafe_b64encode(self.encryption_key[:32]))
            
            decrypted_data = state_data.copy()
            
            # Decrypt fields
            for key, value in list(decrypted_data.items()):
                if key.startswith('encrypted_'):
                    original_field = key.replace('encrypted_', '')
                    decrypted_value = fernet.decrypt(value.encode()).decode()
                    decrypted_data[original_field] = decrypted_value
                    del decrypted_data[key]
            
            del decrypted_data['__encrypted']
            return decrypted_data
            
        except Exception as e:
            logger.error(f"State data decryption failed: {e}")
            return state_data
    
    def _serialize_state_data(self, state_data: Dict[str, Any]) -> str:
        """Serialize state data for storage."""
        return json.dumps(state_data, default=str)
    
    def _deserialize_state_data(self, serialized_data: str) -> Dict[str, Any]:
        """Deserialize state data from storage."""
        return json.loads(serialized_data)


# Standalone functions for backward compatibility
def generate_state() -> str:
    """Generate secure state parameter."""
    return base64.urlsafe_b64encode(secrets.token_bytes(24)).decode('utf-8').rstrip('=')


async def validate_state(received_state: str, expected_state: str) -> bool:
    """Validate state parameter (simple version)."""
    if received_state != expected_state:
        raise InvalidStateError("Invalid state parameter")
    return True
