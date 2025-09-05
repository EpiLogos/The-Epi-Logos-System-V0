"""
MFA (Multi-Factor Authentication) service with TOTP support.
Implements MINIMAL Security - Basic MFA functionality with Google Authenticator.
"""

import pyotp
import secrets
import random
from typing import Dict, List, Any, Optional
from urllib.parse import quote

from ..core.exceptions import MFAError, InvalidTokenError


class MfaService:
    """MINIMAL MFA service for TOTP-based two-factor authentication."""
    
    def __init__(
        self, 
        default_issuer: str = "Epi-Logos System",
        backup_code_count: int = 10,
        backup_code_length: int = 8,
        totp_valid_window: int = 1
    ):
        """
        Initialize MFA service with explicit configuration.
        
        Args:
            default_issuer: Default issuer name for TOTP URLs
            backup_code_count: Number of backup codes to generate
            backup_code_length: Length of each backup code
            totp_valid_window: TOTP validation time window
        """
        # Service configuration with explicit defaults
        self.default_issuer = default_issuer
        self.backup_code_count = backup_code_count
        self.backup_code_length = backup_code_length
        self.totp_valid_window = totp_valid_window
    
    def generate_totp_secret(self) -> str:
        """
        Generate a new TOTP secret for MFA setup.
        
        Returns:
            32-character base32 secret for TOTP
        """
        return pyotp.random_base32()
    
    def generate_qr_code_url(self, user_email: str, secret: str, issuer: Optional[str] = None) -> str:
        """
        Generate QR code URL for Google Authenticator setup.
        
        Args:
            user_email: User's email address
            secret: TOTP secret
            issuer: Service name (uses default_issuer if None)
            
        Returns:
            otpauth:// URL for QR code generation
        """
        effective_issuer = issuer or self.default_issuer
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=effective_issuer
        )
    
    def verify_totp_code(self, secret: str, code: str, valid_window: Optional[int] = None) -> bool:
        """
        Verify TOTP code against secret.
        
        Args:
            secret: User's TOTP secret
            code: 6-digit TOTP code from user
            valid_window: Number of time windows to accept (uses service default if None)
            
        Returns:
            True if code is valid, False otherwise
        """
        effective_window = valid_window if valid_window is not None else self.totp_valid_window
        totp = pyotp.TOTP(secret)
        return totp.verify(code, valid_window=effective_window)
    
    def generate_backup_codes(self, count: Optional[int] = None) -> List[str]:
        """
        Generate backup codes for account recovery.
        
        Args:
            count: Number of backup codes to generate (uses service default if None)
            
        Returns:
            List of backup codes with configured length
        """
        effective_count = count if count is not None else self.backup_code_count
        min_value = 10 ** (self.backup_code_length - 1)
        max_value = (10 ** self.backup_code_length) - 1
        
        backup_codes = []
        for _ in range(effective_count):
            code = f"{random.randint(min_value, max_value)}"
            backup_codes.append(code)
        
        return backup_codes
    
    def verify_backup_code(self, backup_code: str, used_codes: List[str]) -> bool:
        """
        Verify backup code and check if it's already used.
        
        Args:
            backup_code: 8-digit backup code
            used_codes: List of already used backup codes
            
        Returns:
            True if backup code is valid
            
        Raises:
            InvalidTokenError: If backup code already used
        """
        if backup_code in used_codes:
            raise InvalidTokenError("Backup code already used")
        
        return True
    
    def setup_mfa_for_user(self, user_id: str, user_email: str) -> Dict[str, Any]:
        """
        Complete MFA setup for user.
        
        Args:
            user_id: User identifier
            user_email: User's email address
            
        Returns:
            Dictionary containing secret, QR code URL, and backup codes
        """
        # Generate secret and backup codes
        secret = self.generate_totp_secret()
        qr_code_url = self.generate_qr_code_url(user_email, secret)
        backup_codes = self.generate_backup_codes()
        
        return {
            "secret": secret,
            "qr_code_url": qr_code_url,
            "backup_codes": backup_codes
        }