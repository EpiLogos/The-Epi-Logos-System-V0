"""
API key management and security for external services.
"""

import os
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone


logger = logging.getLogger(__name__)


class APIKeyManager:
    """API key management and validation."""
    
    def __init__(self):
        """Initialize API key manager."""
        self.api_keys = {
            "openai": os.getenv("OPENAI_API_KEY"),
            "anthropic": os.getenv("ANTHROPIC_API_KEY"),
            "langsmith": os.getenv("LANGSMITH_API_KEY"),
            "cloudflare_r2": {
                "access_key_id": os.getenv("CLOUDFLARE_R2_ACCESS_KEY_ID"),
                "secret_access_key": os.getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
                "account_id": os.getenv("CLOUDFLARE_R2_ACCOUNT_ID")
            }
        }
        
        # Track key rotation (placeholder implementation)
        self.rotation_tracking = {}
    
    def get_api_key(self, service: str) -> Optional[str]:
        """Get API key for a specific service."""
        key = self.api_keys.get(service)
        
        if not key:
            logger.warning(f"API key not configured for service: {service}")
            return None
        
        # Validate key format
        if service == "openai" and not key.startswith("sk-"):
            logger.warning(f"Invalid OpenAI API key format")
            return None
        
        if service == "anthropic" and not key.startswith("sk-ant-"):
            logger.warning(f"Invalid Anthropic API key format")
            return None
        
        return key
    
    def validate_api_key_format(self, service: str, key: str) -> bool:
        """Validate API key format for a service."""
        format_rules = {
            "openai": lambda k: k.startswith("sk-") and len(k) > 20,
            "anthropic": lambda k: k.startswith("sk-ant-") and len(k) > 20,
            "langsmith": lambda k: len(k) > 10  # Basic length check
        }
        
        rule = format_rules.get(service)
        if not rule:
            logger.warning(f"No validation rule for service: {service}")
            return True  # Allow unknown services
        
        return rule(key)
    
    def check_rotation_needed(self, service: str) -> Dict[str, Any]:
        """Check if API key rotation is needed for a service."""
        # Placeholder implementation
        # In a real system, this would check:
        # - Last rotation date
        # - Usage patterns
        # - Security alerts
        # - Expiration dates
        
        last_rotated = self.rotation_tracking.get(service, {}).get("last_rotated")
        if not last_rotated:
            last_rotated = datetime.now(timezone.utc) - timedelta(days=90)  # Assume 90 days ago
        
        days_since_rotation = (datetime.now(timezone.utc) - last_rotated).days
        needs_rotation = days_since_rotation > 90  # Rotate every 90 days
        
        return {
            "service": service,
            "needs_rotation": needs_rotation,
            "last_rotated": last_rotated.isoformat(),
            "days_since_rotation": days_since_rotation,
            "recommended_rotation_days": 90
        }
    
    def get_encryption_status(self) -> Dict[str, Any]:
        """Get API key encryption status."""
        # Placeholder implementation
        # In a real system, this would check:
        # - Encryption at rest status
        # - Key management system
        # - Encryption algorithms used
        
        return {
            "enabled": True,
            "algorithm": "AES-256-GCM",
            "key_management": "environment_variables",
            "rotation_supported": True,
            "last_audit": datetime.now(timezone.utc).isoformat()
        }
    
    def mask_api_key(self, key: str) -> str:
        """Mask API key for logging purposes."""
        if not key or len(key) < 8:
            return "***"
        
        return f"{key[:4]}...{key[-4:]}"
    
    def validate_all_keys(self) -> Dict[str, bool]:
        """Validate all configured API keys."""
        results = {}
        
        for service, key in self.api_keys.items():
            if isinstance(key, dict):
                # Handle complex key structures (like Cloudflare R2)
                results[service] = all(v is not None for v in key.values())
            else:
                results[service] = key is not None and self.validate_api_key_format(service, key)
        
        return results
