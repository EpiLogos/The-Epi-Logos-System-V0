"""
Password hashing service using Argon2.
Provides secure password hashing and verification for user authentication.
"""
import secrets
from typing import Tuple, List
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, HashingError
import logging

logger = logging.getLogger(__name__)


class PasswordService:
    """Service for secure password hashing using Argon2id."""
    
    def __init__(self):
        """Initialize password hasher with secure parameters."""
        # Argon2id parameters optimized for security and performance
        self.hasher = PasswordHasher(
            time_cost=3,        # Number of iterations
            memory_cost=65536,  # Memory usage in KB (64MB)
            parallelism=4,      # Number of parallel threads
            hash_len=32,        # Hash length in bytes
            salt_len=16,        # Salt length in bytes
            encoding='utf-8',   # Encoding for password
            type=Type.ID # Argon2id variant (most secure)
        )
    
    async def hash_password(self, password: str) -> str:
        """
        Hash a password using Argon2id.
        
        Args:
            password: Plain text password to hash
            
        Returns:
            Hashed password string
            
        Raises:
            ValueError: If password is empty or hashing fails
        """
        if not password or len(password.strip()) == 0:
            raise ValueError("Password cannot be empty")
        
        try:
            # Generate a cryptographically secure salt
            salt = secrets.token_bytes(16)
            
            # Hash the password with Argon2id
            hashed_password = self.hasher.hash(password)
            
            logger.info("Password hashed successfully")
            return hashed_password
            
        except HashingError as e:
            logger.error(f"Password hashing failed: {e}")
            raise ValueError("Password hashing failed") from e
        except Exception as e:
            logger.error(f"Unexpected error during password hashing: {e}")
            raise ValueError("Password hashing failed") from e
    
    async def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify a password against its hash.
        
        Args:
            password: Plain text password to verify
            hashed_password: Previously hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        if not password or not hashed_password:
            return False
        
        try:
            # Verify password using Argon2
            self.hasher.verify(hashed_password, password)
            
            # Check if password needs rehashing (parameters changed)
            if self.hasher.check_needs_rehash(hashed_password):
                logger.info("Password hash needs updating with new parameters")
                # Note: In a real application, you might want to rehash here
                # and update the stored hash in the database
            
            logger.debug("Password verification successful")
            return True
            
        except VerifyMismatchError:
            logger.debug("Password verification failed - incorrect password")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during password verification: {e}")
            return False
    
    def validate_password_strength(self, password: str) -> Tuple[bool, List[str]]:
        """
        Validate password strength against security requirements.
        
        Args:
            password: Password to validate
            
        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []
        
        if not password:
            errors.append("Password is required")
            return False, errors
        
        # Length requirement
        if len(password) < 8:
            errors.append("Password must be at least 8 characters long")
        
        if len(password) > 128:
            errors.append("Password cannot exceed 128 characters")
        
        # Character requirements
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*(),.?\":{}|<>" for c in password)
        
        if not has_upper:
            errors.append("Password must contain at least one uppercase letter")
        
        if not has_lower:
            errors.append("Password must contain at least one lowercase letter")
        
        if not has_digit:
            errors.append("Password must contain at least one digit")
        
        if not has_special:
            errors.append("Password must contain at least one special character")
        
        # Common password checks
        common_passwords = [
            "password", "123456", "password123", "admin", "qwerty",
            "letmein", "welcome", "monkey", "dragon", "master"
        ]
        
        if password.lower() in common_passwords:
            errors.append("Password is too common")
        
        # Sequential character check - DISABLED to match Pydantic validation
        # if self._has_sequential_chars(password):
        #     errors.append("Password should not contain long sequences of characters")

        # Repeated character check - DISABLED to match Pydantic validation
        # if self._has_repeated_chars(password):
        #     errors.append("Password should not contain too many repeated characters")
        
        is_valid = len(errors) == 0
        return is_valid, errors
    
    def _has_sequential_chars(self, password: str, max_sequence: int = 4) -> bool:
        """Check for sequential characters in password."""
        for i in range(len(password) - max_sequence + 1):
            sequence = password[i:i + max_sequence]
            
            # Check for ascending sequences (e.g., "1234", "abcd")
            is_ascending = all(
                ord(sequence[j + 1]) - ord(sequence[j]) == 1
                for j in range(len(sequence) - 1)
            )
            
            # Check for descending sequences (e.g., "4321", "dcba")
            is_descending = all(
                ord(sequence[j]) - ord(sequence[j + 1]) == 1
                for j in range(len(sequence) - 1)
            )
            
            if is_ascending or is_descending:
                return True
        
        return False
    
    def _has_repeated_chars(self, password: str, max_repeats: int = 3) -> bool:
        """Check for repeated characters in password."""
        char_count = {}
        for char in password:
            char_count[char] = char_count.get(char, 0) + 1
            if char_count[char] > max_repeats:
                return True
        
        return False
    
    def generate_temporary_password(self, length: int = 12) -> str:
        """
        Generate a secure temporary password.
        
        Args:
            length: Length of the temporary password
            
        Returns:
            Secure temporary password
        """
        if length < 8:
            length = 8
        if length > 64:
            length = 64
        
        # Character sets for password generation
        uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        lowercase = "abcdefghijklmnopqrstuvwxyz"
        digits = "0123456789"
        special = "!@#$%^&*(),.?\":{}|<>"
        
        all_chars = uppercase + lowercase + digits + special
        
        # Ensure at least one character from each set
        password = [
            secrets.choice(uppercase),
            secrets.choice(lowercase),
            secrets.choice(digits),
            secrets.choice(special)
        ]
        
        # Fill remaining length with random characters
        for _ in range(length - 4):
            password.append(secrets.choice(all_chars))
        
        # Shuffle the password
        secrets.SystemRandom().shuffle(password)
        
        return ''.join(password)
    
    async def check_password_breach(self, password: str) -> bool:
        """
        Check if password has been found in data breaches.
        Uses k-anonymity with HaveIBeenPwned API.
        
        Args:
            password: Password to check
            
        Returns:
            True if password found in breaches, False otherwise
        """
        import hashlib
        import aiohttp
        
        try:
            # Create SHA-1 hash of password
            sha1_hash = hashlib.sha1(password.encode('utf-8')).hexdigest().upper()
            prefix = sha1_hash[:5]
            suffix = sha1_hash[5:]
            
            # Query HaveIBeenPwned API using k-anonymity
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"https://api.pwnedpasswords.com/range/{prefix}",
                    timeout=aiohttp.ClientTimeout(total=5)
                ) as response:
                    if response.status == 200:
                        hashes = await response.text()
                        return suffix in hashes
                    else:
                        logger.warning(f"Could not check password breach status: HTTP {response.status}")
                        return False
        
        except Exception as e:
            logger.warning(f"Password breach check failed: {e}")
            return False  # Assume safe if check fails