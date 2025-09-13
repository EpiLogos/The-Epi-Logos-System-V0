"""
Custom exception hierarchy for standardized error handling.
Provides consistent error responses and proper HTTP status mapping.
"""
import logging
import traceback
from typing import Dict, Any, Optional, List, Union
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


class ServiceError(Exception):
    """Base exception for all service-level errors."""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None, 
        context: Optional[Dict[str, Any]] = None
    ):
        """
        Initialize service error.
        
        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            context: Additional context for debugging
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self._get_default_error_code()
        self.context = context or {}
        self.http_status_code = 500  # Default to Internal Server Error
    
    def _get_default_error_code(self) -> str:
        """Get default error code based on exception class name."""
        return f"SVC_{self.__class__.__name__.upper()}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for serialization."""
        return {
            "error_type": self.__class__.__name__,
            "message": self.message,
            "error_code": self.error_code,
            "context": self.context
        }
    
    def to_response_dict(self) -> Dict[str, Any]:
        """Convert exception to standardized API response format."""
        return {
            "success": False,
            "message": self.message,
            "error_code": self.error_code,
            "errors": [self.message],
            "data": None,
            "metadata": self.context
        }
    
    def get_logging_context(self) -> Dict[str, Any]:
        """Get context for structured logging."""
        return {
            "error_type": self.__class__.__name__,
            "error_code": self.error_code,
            "message": self.message,
            "context": self.context
        }
    
    def get_stack_trace(self) -> str:
        """Get formatted stack trace."""
        return traceback.format_exc()
    
    @classmethod
    def from_dict(cls, error_dict: Dict[str, Any]) -> 'ServiceError':
        """Reconstruct exception from dictionary."""
        error_type = error_dict.get("error_type", "ServiceError")
        message = error_dict.get("message", "Unknown error")
        error_code = error_dict.get("error_code")
        context = error_dict.get("context", {})
        
        # Map error types to exception classes
        exception_map = {
            "ValidationError": ValidationError,
            "UserNotFoundError": UserNotFoundError,
            "NotFoundError": NotFoundError,
            "AuthenticationError": AuthenticationError,
            "AuthorizationError": AuthorizationError,
            "ExternalServiceError": ExternalServiceError,
            "UserServiceError": UserServiceError
        }
        
        exception_class = exception_map.get(error_type, ServiceError)
        return exception_class(message, error_code=error_code, context=context)


class UserServiceError(ServiceError):
    """Base exception for user service operations."""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[str] = None, 
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 500
    
    def _get_default_error_code(self) -> str:
        return f"USR_{self.__class__.__name__.upper()}"


class ValidationError(UserServiceError):
    """Exception for data validation errors."""
    
    def __init__(
        self, 
        message: str, 
        field_errors: Optional[Dict[str, List[str]]] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.field_errors = field_errors or {}
        self.http_status_code = 400  # Bad Request
    
    def _get_default_error_code(self) -> str:
        return "VAL_VALIDATION_FAILED"
    
    def to_dict(self) -> Dict[str, Any]:
        """Include field errors in serialization."""
        result = super().to_dict()
        result["field_errors"] = self.field_errors
        return result
    
    def to_response_dict(self) -> Dict[str, Any]:
        """Include field errors in API response."""
        result = super().to_response_dict()
        result["field_errors"] = self.field_errors
        
        # Flatten field errors into errors array
        all_errors = [self.message]
        for field, errors in self.field_errors.items():
            for error in errors:
                all_errors.append(f"{field}: {error}")
        result["errors"] = all_errors
        
        return result


class UserNotFoundError(UserServiceError):
    """Exception for when a user cannot be found."""
    
    def __init__(
        self, 
        message: str = "User not found", 
        user_id: Optional[str] = None,
        email: Optional[str] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        context = context or {}
        if user_id:
            context["user_id"] = user_id
        if email:
            context["email"] = email
            
        super().__init__(message, error_code, context)
        self.user_id = user_id
        self.email = email
        self.http_status_code = 404  # Not Found
    
    def _get_default_error_code(self) -> str:
        return "NOT_FOUND_USER"
    
    def to_dict(self) -> Dict[str, Any]:
        """Include user identification in serialization."""
        result = super().to_dict()
        if self.user_id:
            result["user_id"] = self.user_id
        if self.email:
            result["email"] = self.email
        return result


class AuthenticationError(UserServiceError):
    """Exception for authentication failures."""
    
    def __init__(
        self, 
        message: str = "Authentication failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 401  # Unauthorized
    
    def _get_default_error_code(self) -> str:
        return "AUTH_AUTHENTICATION_FAILED"


class AuthorizationError(UserServiceError):
    """Exception for authorization failures."""
    
    def __init__(
        self, 
        message: str = "Access denied", 
        required_permission: Optional[str] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        context = context or {}
        if required_permission:
            context["required_permission"] = required_permission
            
        super().__init__(message, error_code, context)
        self.required_permission = required_permission
        self.http_status_code = 403  # Forbidden
    
    def _get_default_error_code(self) -> str:
        return "AUTHZ_ACCESS_DENIED"
    
    def to_dict(self) -> Dict[str, Any]:
        """Include permission information in serialization."""
        result = super().to_dict()
        if self.required_permission:
            result["required_permission"] = self.required_permission
        return result


class NotFoundError(ServiceError):
    """Exception for when a resource cannot be found."""
    
    def __init__(
        self, 
        message: str = "Resource not found", 
        resource_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        context = context or {}
        if resource_id:
            context["resource_id"] = resource_id
        if resource_type:
            context["resource_type"] = resource_type
            
        super().__init__(message, error_code, context)
        self.resource_id = resource_id
        self.resource_type = resource_type
        self.http_status_code = 404  # Not Found
    
    def _get_default_error_code(self) -> str:
        return "NOT_FOUND_RESOURCE"


class ExternalServiceError(ServiceError):
    """Exception for external service integration failures."""
    
    def __init__(
        self, 
        message: str = "External service error", 
        service_name: Optional[str] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        context = context or {}
        if service_name:
            context["service_name"] = service_name
            
        super().__init__(message, error_code, context)
        self.service_name = service_name
        self.http_status_code = 502  # Bad Gateway
    
    def _get_default_error_code(self) -> str:
        return "EXT_SERVICE_ERROR"


# MFA-specific exceptions
class MFAError(ServiceError):
    """Base exception for MFA-related errors."""
    
    def __init__(
        self, 
        message: str = "MFA operation failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 400  # Bad Request
    
    def _get_default_error_code(self) -> str:
        return "MFA_OPERATION_FAILED"


class InvalidTOTPError(MFAError):
    """Exception for invalid TOTP codes."""
    
    def __init__(
        self, 
        message: str = "Invalid TOTP code", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 401  # Unauthorized
    
    def _get_default_error_code(self) -> str:
        return "MFA_INVALID_TOTP"


class MFANotEnabledError(MFAError):
    """Exception when MFA is not enabled but required."""
    
    def __init__(
        self, 
        message: str = "MFA is not enabled", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 428  # Precondition Required
    
    def _get_default_error_code(self) -> str:
        return "MFA_NOT_ENABLED"


# Password reset exceptions
class PasswordResetError(ServiceError):
    """Base exception for password reset errors."""
    
    def __init__(
        self, 
        message: str = "Password reset operation failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 400  # Bad Request
    
    def _get_default_error_code(self) -> str:
        return "PASSWORD_RESET_FAILED"


class InvalidTokenError(PasswordResetError):
    """Exception for invalid password reset tokens."""
    
    def __init__(
        self, 
        message: str = "Invalid or expired token", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 401  # Unauthorized
    
    def _get_default_error_code(self) -> str:
        return "PASSWORD_RESET_INVALID_TOKEN"


class ExpiredTokenError(PasswordResetError):
    """Exception for expired password reset tokens."""
    
    def __init__(
        self, 
        message: str = "Password reset token has expired", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 401  # Unauthorized
    
    def _get_default_error_code(self) -> str:
        return "PASSWORD_RESET_TOKEN_EXPIRED"


# Rate limiting exceptions
class RateLimitExceededError(ServiceError):
    """Exception when rate limit is exceeded."""
    
    def __init__(
        self, 
        message: str = "Rate limit exceeded", 
        retry_after: Optional[int] = None,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        context = context or {}
        if retry_after:
            context["retry_after"] = retry_after
            
        super().__init__(message, error_code, context)
        self.retry_after = retry_after
        self.http_status_code = 429  # Too Many Requests
    
    def _get_default_error_code(self) -> str:
        return "RATE_LIMIT_EXCEEDED"
    
    def to_dict(self) -> Dict[str, Any]:
        """Include retry-after information in serialization."""
        result = super().to_dict()
        if self.retry_after:
            result["retry_after"] = self.retry_after
        return result


# Audit and data export exceptions
class AuditError(ServiceError):
    """Exception for audit logging errors."""
    
    def __init__(
        self, 
        message: str = "Audit operation failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 500  # Internal Server Error
    
    def _get_default_error_code(self) -> str:
        return "AUDIT_OPERATION_FAILED"


class DataExportError(ServiceError):
    """Exception for data export errors."""
    
    def __init__(
        self, 
        message: str = "Data export failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 500  # Internal Server Error
    
    def _get_default_error_code(self) -> str:
        return "DATA_EXPORT_FAILED"


# Data sovereignty exceptions
class DataSovereigntyError(ServiceError):
    """Exception for data sovereignty operations."""
    
    def __init__(
        self, 
        message: str = "Data sovereignty operation failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 500  # Internal Server Error
    
    def _get_default_error_code(self) -> str:
        return "DATA_SOVEREIGNTY_FAILED"


class EncryptionError(DataSovereigntyError):
    """Exception for encryption/decryption errors."""
    
    def __init__(
        self, 
        message: str = "Encryption operation failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 500  # Internal Server Error
    
    def _get_default_error_code(self) -> str:
        return "ENCRYPTION_FAILED"


class InvalidKeyError(DataSovereigntyError):
    """Exception for invalid encryption keys."""
    
    def __init__(
        self, 
        message: str = "Invalid encryption key", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 401  # Unauthorized
    
    def _get_default_error_code(self) -> str:
        return "INVALID_ENCRYPTION_KEY"


# Session security exceptions
class SessionSecurityError(ServiceError):
    """Exception for session security operations."""
    
    def __init__(
        self, 
        message: str = "Session security operation failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 500  # Internal Server Error
    
    def _get_default_error_code(self) -> str:
        return "SESSION_SECURITY_FAILED"


class SuspiciousActivityError(SessionSecurityError):
    """Exception for detected suspicious activity."""
    
    def __init__(
        self, 
        message: str = "Suspicious activity detected", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 403  # Forbidden
    
    def _get_default_error_code(self) -> str:
        return "SUSPICIOUS_ACTIVITY_DETECTED"


class DeviceFingerprintError(SessionSecurityError):
    """Exception for device fingerprinting errors."""
    
    def __init__(
        self, 
        message: str = "Device fingerprinting failed", 
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, error_code, context)
        self.http_status_code = 400  # Bad Request
    
    def _get_default_error_code(self) -> str:
        return "DEVICE_FINGERPRINT_FAILED"


# FastAPI exception handlers
async def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
    """Handle ServiceError exceptions."""
    logger.error(
        f"Service error occurred: {exc.message}",
        extra=exc.get_logging_context()
    )
    
    return JSONResponse(
        status_code=exc.http_status_code,
        content=exc.to_response_dict()
    )


async def validation_error_handler(request: Request, exc: ValidationError) -> JSONResponse:
    """Handle ValidationError exceptions."""
    logger.warning(
        f"Validation error: {exc.message}",
        extra={**exc.get_logging_context(), "field_errors": exc.field_errors}
    )
    
    return JSONResponse(
        status_code=exc.http_status_code,
        content=exc.to_response_dict()
    )


async def user_not_found_handler(request: Request, exc: UserNotFoundError) -> JSONResponse:
    """Handle UserNotFoundError exceptions."""
    logger.info(
        f"User not found: {exc.message}",
        extra=exc.get_logging_context()
    )
    
    return JSONResponse(
        status_code=exc.http_status_code,
        content=exc.to_response_dict()
    )


async def authentication_error_handler(request: Request, exc: AuthenticationError) -> JSONResponse:
    """Handle AuthenticationError exceptions."""
    logger.warning(
        f"Authentication failed: {exc.message}",
        extra=exc.get_logging_context()
    )
    
    return JSONResponse(
        status_code=exc.http_status_code,
        content=exc.to_response_dict()
    )


async def authorization_error_handler(request: Request, exc: AuthorizationError) -> JSONResponse:
    """Handle AuthorizationError exceptions."""
    logger.warning(
        f"Authorization failed: {exc.message}",
        extra=exc.get_logging_context()
    )
    
    return JSONResponse(
        status_code=exc.http_status_code,
        content=exc.to_response_dict()
    )


def register_exception_handlers(app):
    """Register all custom exception handlers with FastAPI app."""
    app.add_exception_handler(ServiceError, service_error_handler)
    app.add_exception_handler(ValidationError, validation_error_handler)
    app.add_exception_handler(UserNotFoundError, user_not_found_handler)
    app.add_exception_handler(AuthenticationError, authentication_error_handler)
    app.add_exception_handler(AuthorizationError, authorization_error_handler)
    
    logger.info("Custom exception handlers registered")


# Utility functions for exception mapping
def map_database_exception(exc: Exception) -> ServiceError:
    """Map database exceptions to custom service exceptions."""
    try:
        from pymongo.errors import (
            DuplicateKeyError, 
            ConnectionFailure, 
            ServerSelectionTimeoutError,
            WriteError
        )
        
        if isinstance(exc, DuplicateKeyError):
            if "email" in str(exc):
                return ValidationError(
                    "User with this email already exists",
                    field_errors={"email": ["Email address is already registered"]}
                )
            return ValidationError("Duplicate data detected")
        
        elif isinstance(exc, ConnectionFailure):
            return UserServiceError(
                "Database connection failed",
                error_code="DB_CONNECTION_FAILED",
                context={"original_error": str(exc)}
            )
        
        elif isinstance(exc, ServerSelectionTimeoutError):
            return UserServiceError(
                "Database timeout occurred",
                error_code="DB_TIMEOUT",
                context={"original_error": str(exc)}
            )
        
        elif isinstance(exc, WriteError):
            details = getattr(exc, 'details', {}) or {}
            code_val = details.get('code') if isinstance(details, dict) else getattr(details, 'code', None)
            if code_val == 121:  # Document validation error
                return ValidationError(
                    "Document failed validation",
                    context={"validation_details": details}
                )
            return UserServiceError(
                "Database write error",
                context={"error_details": details}
            )
    
    except ImportError:
        # pymongo not available, return generic error
        pass
    
    # Default mapping for unknown exceptions
    return UserServiceError(
        f"Database operation failed: {str(exc)}",
        error_code="DB_UNKNOWN_ERROR",
        context={"original_error": str(exc)}
    )
