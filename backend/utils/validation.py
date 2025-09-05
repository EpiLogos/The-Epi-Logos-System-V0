"""
Request validation utilities.
Provides comprehensive validation helpers for API requests.
"""
import re
from typing import Any, List, Dict, Optional
from dataclasses import dataclass
from pydantic import BaseModel, ValidationError


@dataclass
class ValidationResult:
    """Result of validation operation."""
    is_valid: bool
    errors: List[str]
    warnings: List[str] = None
    
    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []


def validate_request_data(request_model: BaseModel) -> ValidationResult:
    """
    Validate request data using Pydantic model validation.
    
    Args:
        request_model: Pydantic model instance to validate
        
    Returns:
        ValidationResult with validation status and errors
    """
    try:
        # If model is already instantiated and valid, return success
        if hasattr(request_model, 'model_validate'):
            # For Pydantic v2, validate the model
            request_model.model_validate(request_model.model_dump())
        
        return ValidationResult(is_valid=True, errors=[])
        
    except ValidationError as e:
        error_messages = []
        for error in e.errors():
            field = ".".join(str(loc) for loc in error.get("loc", []))
            message = error.get("msg", "Validation error")
            
            if field:
                error_messages.append(f"{field}: {message}")
            else:
                error_messages.append(message)
        
        return ValidationResult(is_valid=False, errors=error_messages)
    except Exception as e:
        return ValidationResult(is_valid=False, errors=[f"Validation error: {str(e)}"])


def validate_email_format(email: str) -> ValidationResult:
    """
    Validate email format using regex pattern.
    
    Args:
        email: Email address to validate
        
    Returns:
        ValidationResult with validation status
    """
    if not email or not isinstance(email, str):
        return ValidationResult(is_valid=False, errors=["Email is required"])
    
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email.strip()):
        return ValidationResult(is_valid=False, errors=["Invalid email format"])
    
    return ValidationResult(is_valid=True, errors=[])


def validate_password_strength(password: str) -> ValidationResult:
    """
    Validate password strength requirements.
    
    Args:
        password: Password to validate
        
    Returns:
        ValidationResult with validation status and specific errors
    """
    if not password or not isinstance(password, str):
        return ValidationResult(is_valid=False, errors=["Password is required"])
    
    errors = []
    warnings = []
    
    # Length check
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    elif len(password) < 12:
        warnings.append("Consider using a longer password for better security")
    
    # Character requirements
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'\d', password):
        errors.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append("Password must contain at least one special character")
    
    # Common password patterns
    common_patterns = [
        r'123456', r'password', r'qwerty', r'abc123',
        r'admin', r'letmein', r'welcome', r'monkey'
    ]
    
    password_lower = password.lower()
    for pattern in common_patterns:
        if pattern in password_lower:
            errors.append("Password contains common patterns and is not secure")
            break
    
    # Sequential characters
    if re.search(r'(012|123|234|345|456|567|678|789|890)', password):
        warnings.append("Avoid using sequential numbers in passwords")
    
    if re.search(r'(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)', password.lower()):
        warnings.append("Avoid using sequential letters in passwords")
    
    is_valid = len(errors) == 0
    return ValidationResult(is_valid=is_valid, errors=errors, warnings=warnings)


def validate_oauth_provider(provider: str) -> ValidationResult:
    """
    Validate OAuth provider name.
    
    Args:
        provider: OAuth provider name to validate
        
    Returns:
        ValidationResult with validation status
    """
    if not provider or not isinstance(provider, str):
        return ValidationResult(is_valid=False, errors=["OAuth provider is required"])
    
    supported_providers = ["google", "github", "microsoft", "discord", "twitter"]
    
    if provider.lower() not in supported_providers:
        return ValidationResult(
            is_valid=False, 
            errors=[f"Unsupported OAuth provider: {provider}. Supported providers: {', '.join(supported_providers)}"]
        )
    
    return ValidationResult(is_valid=True, errors=[])


def validate_user_tier(tier: str) -> ValidationResult:
    """
    Validate user tier value.
    
    Args:
        tier: User tier to validate
        
    Returns:
        ValidationResult with validation status
    """
    if not tier or not isinstance(tier, str):
        return ValidationResult(is_valid=False, errors=["User tier is required"])
    
    valid_tiers = ["free", "patron"]
    
    if tier.lower() not in valid_tiers:
        return ValidationResult(
            is_valid=False,
            errors=[f"Invalid user tier: {tier}. Valid tiers: {', '.join(valid_tiers)}"]
        )
    
    return ValidationResult(is_valid=True, errors=[])


def validate_theme_preference(theme: str) -> ValidationResult:
    """
    Validate theme preference value.
    
    Args:
        theme: Theme preference to validate
        
    Returns:
        ValidationResult with validation status
    """
    if not theme or not isinstance(theme, str):
        return ValidationResult(is_valid=False, errors=["Theme preference is required"])
    
    valid_themes = ["light", "dark", "auto"]
    
    if theme.lower() not in valid_themes:
        return ValidationResult(
            is_valid=False,
            errors=[f"Invalid theme: {theme}. Valid themes: {', '.join(valid_themes)}"]
        )
    
    return ValidationResult(is_valid=True, errors=[])


def sanitize_user_input(input_string: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize user input by removing potentially dangerous characters.
    
    Args:
        input_string: String to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    if not input_string or not isinstance(input_string, str):
        return ""
    
    # Remove potential script injection characters
    sanitized = re.sub(r'[<>"\']', '', input_string)
    
    # Remove excessive whitespace
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    
    # Truncate if max_length specified
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length].strip()
    
    return sanitized


def validate_file_upload(file_data: Dict[str, Any]) -> ValidationResult:
    """
    Validate file upload data.
    
    Args:
        file_data: Dictionary containing file information
        
    Returns:
        ValidationResult with validation status
    """
    errors = []
    
    # Check required fields
    if not file_data.get("filename"):
        errors.append("Filename is required")
    
    if not file_data.get("content_type"):
        errors.append("Content type is required")
    
    if not file_data.get("size"):
        errors.append("File size is required")
    
    # Validate file size (max 5MB)
    max_size = 5 * 1024 * 1024  # 5MB in bytes
    if file_data.get("size", 0) > max_size:
        errors.append(f"File size exceeds maximum limit of {max_size / (1024*1024):.1f}MB")
    
    # Validate file type for profile pictures
    allowed_image_types = [
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    ]
    
    content_type = file_data.get("content_type", "").lower()
    if content_type and content_type not in allowed_image_types:
        errors.append(f"Invalid file type: {content_type}. Allowed types: {', '.join(allowed_image_types)}")
    
    # Validate filename
    filename = file_data.get("filename", "")
    if filename and not re.match(r'^[a-zA-Z0-9._-]+\.[a-zA-Z0-9]{2,4}$', filename):
        errors.append("Invalid filename format")
    
    is_valid = len(errors) == 0
    return ValidationResult(is_valid=is_valid, errors=errors)