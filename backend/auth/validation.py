"""
Authentication Framework Validation for Epi-Logos System

Validates JWT configuration, OAuth provider setup, session management,
and API key management for secure authentication across the tri-laminar architecture.

Implements authentication validation requirements for Story 00.02.
"""

import os
import jwt
import time
import re
import secrets
import hashlib
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class AuthValidationStatus(Enum):
    """Authentication validation status levels"""
    SECURE = "secure"
    WARNING = "warning"
    INSECURE = "insecure"
    ERROR = "error"
    NOT_CONFIGURED = "not_configured"


@dataclass
class AuthValidationResult:
    """Result of authentication component validation"""
    component: str
    status: AuthValidationStatus
    message: str
    details: Optional[Dict[str, Any]] = None
    recommendations: Optional[list] = None


class AuthenticationValidator:
    """Validates authentication framework configuration"""
    
    # Minimum security requirements
    MIN_JWT_SECRET_LENGTH = 32
    STRONG_JWT_SECRET_LENGTH = 64
    SUPPORTED_JWT_ALGORITHMS = ["HS256", "HS384", "HS512", "RS256", "RS384", "RS512"]
    SECURE_JWT_ALGORITHMS = ["HS256", "RS256"]
    
    def __init__(self):
        """Initialize authentication validator"""
        pass
    
    def validate_authentication_framework(self) -> Dict[str, Any]:
        """Comprehensive authentication framework validation"""
        start_time = time.time()
        
        # Run all authentication validations
        jwt_result = self._validate_jwt_configuration()
        oauth_result = self._validate_oauth_configuration()
        session_result = self._validate_session_management()
        api_key_result = self._validate_api_key_management()
        
        # Calculate overall security score
        results = [jwt_result, oauth_result, session_result, api_key_result]
        overall_status, security_score = self._calculate_overall_status(results)
        
        validation_time = (time.time() - start_time) * 1000
        
        return {
            "timestamp": time.time(),
            "overall_status": overall_status.value,
            "security_score": security_score,
            "validation_time_ms": validation_time,
            "components": {
                "jwt": self._result_to_dict(jwt_result),
                "oauth": self._result_to_dict(oauth_result), 
                "session_management": self._result_to_dict(session_result),
                "api_key_management": self._result_to_dict(api_key_result)
            },
            "recommendations": self._generate_security_recommendations(results)
        }
    
    def _validate_jwt_configuration(self) -> AuthValidationResult:
        """Validate JWT configuration security"""
        try:
            secret = os.getenv("JWT_SECRET")
            algorithm = os.getenv("JWT_ALGORITHM", "HS256")
            expiration = os.getenv("JWT_EXPIRATION_HOURS", "24")
            
            details = {}
            recommendations = []
            
            # Check if JWT is configured
            if not secret:
                return AuthValidationResult(
                    component="jwt",
                    status=AuthValidationStatus.NOT_CONFIGURED,
                    message="JWT secret not configured",
                    recommendations=["Set JWT_SECRET environment variable", "Use a cryptographically secure secret"]
                )
            
            # Validate secret strength
            secret_length = len(secret)
            details["secret_length"] = secret_length
            
            if secret_length < self.MIN_JWT_SECRET_LENGTH:
                return AuthValidationResult(
                    component="jwt",
                    status=AuthValidationStatus.INSECURE,
                    message=f"JWT secret too short: {secret_length} characters (minimum: {self.MIN_JWT_SECRET_LENGTH})",
                    details=details,
                    recommendations=[
                        f"Use a JWT secret with at least {self.MIN_JWT_SECRET_LENGTH} characters",
                        "Generate secret using cryptographically secure random generator"
                    ]
                )
            
            # Check secret entropy/randomness
            entropy_score = self._calculate_entropy(secret)
            details["entropy_score"] = entropy_score
            
            if entropy_score < 3.0:  # Low entropy
                recommendations.append("Use a more random JWT secret with higher entropy")
            
            # Validate algorithm
            details["algorithm"] = algorithm
            
            if algorithm not in self.SUPPORTED_JWT_ALGORITHMS:
                return AuthValidationResult(
                    component="jwt",
                    status=AuthValidationStatus.ERROR,
                    message=f"Unsupported JWT algorithm: {algorithm}",
                    details=details,
                    recommendations=[f"Use a supported algorithm: {', '.join(self.SUPPORTED_JWT_ALGORITHMS)}"]
                )
            
            if algorithm not in self.SECURE_JWT_ALGORITHMS:
                recommendations.append(f"Consider using a more secure algorithm: {', '.join(self.SECURE_JWT_ALGORITHMS)}")
            
            # Validate expiration time
            try:
                exp_hours = int(expiration)
                details["expiration_hours"] = exp_hours
                
                if exp_hours > 168:  # More than 1 week
                    recommendations.append("Consider shorter JWT expiration for better security")
                elif exp_hours < 1:  # Less than 1 hour
                    recommendations.append("JWT expiration might be too short for user experience")
                
            except ValueError:
                return AuthValidationResult(
                    component="jwt",
                    status=AuthValidationStatus.ERROR,
                    message=f"Invalid JWT expiration value: {expiration}",
                    details=details,
                    recommendations=["Set JWT_EXPIRATION_HOURS to a valid integer"]
                )
            
            # Test JWT operations
            try:
                # Test token generation and validation
                test_payload = {"test": True, "exp": int(time.time()) + 3600}
                test_token = jwt.encode(test_payload, secret, algorithm=algorithm)
                decoded_payload = jwt.decode(test_token, secret, algorithms=[algorithm])
                
                details["token_operations"] = "working"
                
            except Exception as e:
                return AuthValidationResult(
                    component="jwt",
                    status=AuthValidationStatus.ERROR,
                    message=f"JWT operations failed: {str(e)}",
                    details=details,
                    recommendations=["Check JWT secret and algorithm configuration"]
                )
            
            # Determine status based on validation results
            if secret_length >= self.STRONG_JWT_SECRET_LENGTH and entropy_score >= 3.5 and not recommendations:
                status = AuthValidationStatus.SECURE
                message = "JWT configuration is secure"
            elif secret_length >= self.MIN_JWT_SECRET_LENGTH and algorithm in self.SECURE_JWT_ALGORITHMS:
                status = AuthValidationStatus.WARNING
                message = "JWT configuration is acceptable but could be improved"
            else:
                status = AuthValidationStatus.WARNING
                message = "JWT configuration has security concerns"
            
            return AuthValidationResult(
                component="jwt",
                status=status,
                message=message,
                details=details,
                recommendations=recommendations if recommendations else None
            )
            
        except Exception as e:
            logger.error(f"JWT validation failed: {e}")
            return AuthValidationResult(
                component="jwt",
                status=AuthValidationStatus.ERROR,
                message=f"JWT validation error: {str(e)}"
            )
    
    def _validate_oauth_configuration(self) -> AuthValidationResult:
        """Validate OAuth provider configuration"""
        try:
            google_client_id = os.getenv("GOOGLE_CLIENT_ID")
            google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
            
            details = {}
            recommendations = []
            
            # Check Google OAuth configuration
            details["google_oauth_configured"] = bool(google_client_id and google_client_secret)
            
            if not google_client_id or not google_client_secret:
                return AuthValidationResult(
                    component="oauth",
                    status=AuthValidationStatus.NOT_CONFIGURED,
                    message="Google OAuth not configured",
                    details=details,
                    recommendations=[
                        "Set GOOGLE_CLIENT_ID environment variable",
                        "Set GOOGLE_CLIENT_SECRET environment variable",
                        "Configure OAuth consent screen in Google Cloud Console"
                    ]
                )
            
            # Validate Google Client ID format
            if not re.match(r'^\d+-.*\.apps\.googleusercontent\.com$', google_client_id):
                return AuthValidationResult(
                    component="oauth",
                    status=AuthValidationStatus.ERROR,
                    message="Invalid Google Client ID format",
                    details=details,
                    recommendations=["Verify Google Client ID from Google Cloud Console"]
                )
            
            # Validate Google Client Secret format
            if not re.match(r'^GOCSPX-.*', google_client_secret):
                recommendations.append("Google Client Secret format seems unusual - verify it's correct")
            
            # Check client secret strength
            secret_length = len(google_client_secret)
            details["client_secret_length"] = secret_length
            
            if secret_length < 20:
                recommendations.append("Google Client Secret seems too short")
            
            # Additional OAuth security checks
            details["redirect_uris_configured"] = "manual_verification_required"
            recommendations.extend([
                "Ensure OAuth redirect URIs are properly configured",
                "Verify OAuth consent screen is configured",
                "Consider implementing PKCE for additional security"
            ])
            
            status = AuthValidationStatus.SECURE if not recommendations else AuthValidationStatus.WARNING
            message = "Google OAuth is configured" + (" with recommendations" if recommendations else "")
            
            return AuthValidationResult(
                component="oauth",
                status=status,
                message=message,
                details=details,
                recommendations=recommendations if recommendations else None
            )
            
        except Exception as e:
            logger.error(f"OAuth validation failed: {e}")
            return AuthValidationResult(
                component="oauth",
                status=AuthValidationStatus.ERROR,
                message=f"OAuth validation error: {str(e)}"
            )
    
    def _validate_session_management(self) -> AuthValidationResult:
        """Validate session management configuration"""
        try:
            redis_url = os.getenv("REDIS_URL")
            redis_password = os.getenv("REDIS_PASSWORD")
            
            details = {}
            recommendations = []
            
            # Check Redis configuration for session storage
            details["redis_configured"] = bool(redis_url and redis_password)
            
            if not redis_url or not redis_password:
                return AuthValidationResult(
                    component="session_management",
                    status=AuthValidationStatus.NOT_CONFIGURED,
                    message="Redis session storage not configured",
                    details=details,
                    recommendations=[
                        "Configure Redis for session storage",
                        "Set REDIS_URL environment variable",
                        "Set REDIS_PASSWORD environment variable"
                    ]
                )
            
            # Validate Redis URL format
            if not re.match(r'^.*\.redis-cloud\.com:\d+$', redis_url):
                recommendations.append("Redis URL format should match expected cloud provider pattern")
            
            # Check password strength
            password_length = len(redis_password)
            details["redis_password_length"] = password_length
            
            if password_length < 8:
                recommendations.append("Redis password should be at least 8 characters long")
            
            # Session security recommendations
            recommendations.extend([
                "Implement session timeout and cleanup",
                "Use secure session cookies with HttpOnly and Secure flags",
                "Consider session rotation on privilege escalation"
            ])
            
            status = AuthValidationStatus.WARNING  # Always warning due to additional recommendations
            message = "Session management configured with Redis"
            
            return AuthValidationResult(
                component="session_management",
                status=status,
                message=message,
                details=details,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"Session management validation failed: {e}")
            return AuthValidationResult(
                component="session_management",
                status=AuthValidationStatus.ERROR,
                message=f"Session management validation error: {str(e)}"
            )
    
    def _validate_api_key_management(self) -> AuthValidationResult:
        """Validate API key management for external services"""
        try:
            api_keys = {
                "gemini": os.getenv("GEMINI_API_KEY"),
                "openai": os.getenv("OPENAI_API_KEY"),
                "anthropic": os.getenv("ANTHROPIC_API_KEY"),
                "deepseek": os.getenv("DEEPSEEK_API_KEY")
            }
            
            details = {}
            recommendations = []
            
            # Count configured API keys
            configured_keys = {name: bool(key) for name, key in api_keys.items()}
            configured_count = sum(configured_keys.values())
            
            details["configured_api_keys"] = configured_keys
            details["configured_count"] = configured_count
            details["total_keys"] = len(api_keys)
            
            if configured_count == 0:
                return AuthValidationResult(
                    component="api_key_management",
                    status=AuthValidationStatus.NOT_CONFIGURED,
                    message="No external API keys configured",
                    details=details,
                    recommendations=["Configure at least one AI service API key"]
                )
            
            # Validate key formats
            format_checks = {}
            
            if api_keys["gemini"]:
                format_checks["gemini"] = api_keys["gemini"].startswith("AIza")
                if not format_checks["gemini"]:
                    recommendations.append("Gemini API key format appears invalid")
            
            if api_keys["openai"]:
                format_checks["openai"] = api_keys["openai"].startswith("sk-")
                if not format_checks["openai"]:
                    recommendations.append("OpenAI API key format appears invalid")
            
            if api_keys["anthropic"]:
                format_checks["anthropic"] = api_keys["anthropic"].startswith("sk-ant-")
                if not format_checks["anthropic"]:
                    recommendations.append("Anthropic API key format appears invalid")
            
            details["format_validation"] = format_checks
            
            # Security recommendations
            recommendations.extend([
                "Store API keys securely and never commit them to version control",
                "Implement API key rotation policies",
                "Monitor API key usage for suspicious activity",
                "Use environment-specific API keys"
            ])
            
            # Determine status
            if configured_count >= 2 and all(format_checks.values()):
                status = AuthValidationStatus.SECURE
                message = f"API key management configured ({configured_count} keys)"
            elif configured_count >= 1:
                status = AuthValidationStatus.WARNING
                message = f"Limited API key configuration ({configured_count} keys)"
            else:
                status = AuthValidationStatus.INSECURE
                message = "Insufficient API key configuration"
            
            return AuthValidationResult(
                component="api_key_management",
                status=status,
                message=message,
                details=details,
                recommendations=recommendations
            )
            
        except Exception as e:
            logger.error(f"API key management validation failed: {e}")
            return AuthValidationResult(
                component="api_key_management",
                status=AuthValidationStatus.ERROR,
                message=f"API key management validation error: {str(e)}"
            )
    
    def _calculate_entropy(self, text: str) -> float:
        """Calculate entropy of a string (measure of randomness)"""
        if not text:
            return 0.0
        
        # Count character frequencies
        char_counts = {}
        for char in text:
            char_counts[char] = char_counts.get(char, 0) + 1
        
        # Calculate entropy
        length = len(text)
        entropy = 0.0
        
        for count in char_counts.values():
            probability = count / length
            if probability > 0:
                entropy -= probability * (probability.bit_length() - 1)
        
        return entropy
    
    def _calculate_overall_status(self, results: list) -> Tuple[AuthValidationStatus, int]:
        """Calculate overall authentication security status and score"""
        status_weights = {
            AuthValidationStatus.SECURE: 4,
            AuthValidationStatus.WARNING: 3,
            AuthValidationStatus.INSECURE: 1,
            AuthValidationStatus.NOT_CONFIGURED: 0,
            AuthValidationStatus.ERROR: 0
        }
        
        total_weight = 0
        max_possible = len(results) * 4  # Maximum score if all components are secure
        
        for result in results:
            total_weight += status_weights.get(result.status, 0)
        
        # Calculate percentage score
        security_score = int((total_weight / max_possible) * 100) if max_possible > 0 else 0
        
        # Determine overall status
        if security_score >= 90:
            overall_status = AuthValidationStatus.SECURE
        elif security_score >= 70:
            overall_status = AuthValidationStatus.WARNING
        elif security_score >= 40:
            overall_status = AuthValidationStatus.INSECURE
        else:
            overall_status = AuthValidationStatus.ERROR
        
        return overall_status, security_score
    
    def _generate_security_recommendations(self, results: list) -> list:
        """Generate comprehensive security recommendations"""
        all_recommendations = []
        
        for result in results:
            if result.recommendations:
                all_recommendations.extend(result.recommendations)
        
        # Add general security recommendations
        general_recommendations = [
            "Implement regular security audits",
            "Use HTTPS for all authentication endpoints",
            "Implement rate limiting for authentication attempts",
            "Log authentication events for monitoring",
            "Consider implementing multi-factor authentication"
        ]
        
        # Remove duplicates and combine
        unique_recommendations = list(dict.fromkeys(all_recommendations + general_recommendations))
        
        return unique_recommendations[:10]  # Limit to top 10 recommendations
    
    def _result_to_dict(self, result: AuthValidationResult) -> dict:
        """Convert validation result to dictionary"""
        return {
            "status": result.status.value,
            "message": result.message,
            "details": result.details,
            "recommendations": result.recommendations
        }


# Convenience functions
def validate_authentication_framework() -> Dict[str, Any]:
    """Validate authentication framework and return results"""
    validator = AuthenticationValidator()
    return validator.validate_authentication_framework()


def check_authentication_security() -> Tuple[str, int]:
    """Quick check of authentication security status"""
    validator = AuthenticationValidator()
    result = validator.validate_authentication_framework()
    return result["overall_status"], result["security_score"]