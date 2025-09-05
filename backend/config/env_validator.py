"""
Environment Configuration Validator for Epi-Logos System

Validates all required environment variables are properly configured
and accessible for the tri-laminar architecture.
"""

import os
import re
from typing import Dict, List, Optional, Any
from enum import Enum
from dataclasses import dataclass
from urllib.parse import urlparse
import logging

logger = logging.getLogger(__name__)


class ValidationLevel(Enum):
    """Validation severity levels"""
    CRITICAL = "critical"
    WARNING = "warning" 
    INFO = "info"


@dataclass
class ValidationResult:
    """Result of environment variable validation"""
    variable: str
    is_valid: bool
    level: ValidationLevel
    message: str
    value: Optional[str] = None


class EnvironmentValidator:
    """Validates environment configuration for Epi-Logos System"""
    
    # Required environment variables with validation rules
    REQUIRED_VARS = {
        # Database Connections
        "NEO4J_URI": {
            "required": True,
            "pattern": r"^neo4j\+s://.*",
            "description": "Neo4j Aura connection URI"
        },
        "NEO4J_USERNAME": {
            "required": True,
            "min_length": 1,
            "description": "Neo4j username"
        },
        "NEO4J_PASSWORD": {
            "required": True,
            "min_length": 8,
            "description": "Neo4j password"
        },
        "NEO4J_DATABASE": {
            "required": True,
            "default": "neo4j",
            "description": "Neo4j database name"
        },
        "MONGODB_URI": {
            "required": True,
            "pattern": r"^mongodb://.*",
            "description": "MongoDB Atlas connection URI"
        },
        "MONGODB_DB_NAME": {
            "required": True,
            "min_length": 1,
            "description": "MongoDB database name"
        },
        "REDIS_URL": {
            "required": True,
            "pattern": r"^.*\.redis-cloud\.com:\d+$",
            "description": "Redis Cloud URL"
        },
        "REDIS_PASSWORD": {
            "required": True,
            "min_length": 8,
            "description": "Redis password"
        },
        "QDRANT_URL": {
            "required": True,
            "pattern": r"^https?://.*:\d+$",
            "description": "Qdrant local instance URL"
        },
        "QDRANT_API_KEY": {
            "required": False,
            "description": "Qdrant API key (optional for local)"
        },
        
        # Security Configuration
        "JWT_SECRET": {
            "required": True,
            "min_length": 32,
            "description": "JWT secret key (minimum 32 characters)"
        },
        "JWT_ALGORITHM": {
            "required": True,
            "default": "HS256",
            "allowed_values": ["HS256", "HS384", "HS512"],
            "description": "JWT signing algorithm"
        },
        "JWT_EXPIRATION_HOURS": {
            "required": True,
            "type": "int",
            "min_value": 1,
            "max_value": 168,  # 1 week
            "description": "JWT expiration in hours"
        },
        
        # OAuth Configuration
        "GOOGLE_CLIENT_ID": {
            "required": True,
            "pattern": r"^\d+-.*\.apps\.googleusercontent\.com$",
            "description": "Google OAuth client ID"
        },
        "GOOGLE_CLIENT_SECRET": {
            "required": True,
            "pattern": r"^GOCSPX-.*",
            "description": "Google OAuth client secret"
        },
        
        # AI Services (at least one required)
        "GEMINI_API_KEY": {
            "required": False,
            "pattern": r"^AIza.*",
            "description": "Google Gemini API key"
        },
        "OPENAI_API_KEY": {
            "required": False,
            "pattern": r"^sk-.*",
            "description": "OpenAI API key"
        },
        "ANTHROPIC_API_KEY": {
            "required": False,
            "pattern": r"^sk-ant-.*",
            "description": "Anthropic API key"
        },
        
        # Development URLs
        "NEXT_PUBLIC_API_URL": {
            "required": True,
            "default": "http://localhost:8000",
            "pattern": r"^https?://.*:\d+$",
            "description": "Frontend API URL"
        },
        "BACKEND_URL": {
            "required": True,
            "default": "http://localhost:8000",
            "pattern": r"^https?://.*:\d+$",
            "description": "Backend service URL"
        },
        "AGENTIC_URL": {
            "required": True,
            "default": "http://localhost:8001",
            "pattern": r"^https?://.*:\d+$",
            "description": "Agentic service URL"
        },
        
        # Application Settings
        "ENVIRONMENT": {
            "required": True,
            "default": "development",
            "allowed_values": ["development", "staging", "production"],
            "description": "Application environment"
        },
        "DEBUG": {
            "required": False,
            "type": "bool",
            "default": "true",
            "description": "Debug mode flag"
        }
    }
    
    def __init__(self, env_file_path: Optional[str] = None):
        """Initialize validator with optional env file path"""
        self.env_file_path = env_file_path
        self.results: List[ValidationResult] = []
        
    def validate_all(self) -> Dict[str, Any]:
        """Validate all environment variables and return comprehensive results"""
        self.results.clear()
        
        # Load environment file if specified
        if self.env_file_path and os.path.exists(self.env_file_path):
            self._load_env_file()
        
        # Validate each required variable
        for var_name, config in self.REQUIRED_VARS.items():
            result = self._validate_variable(var_name, config)
            self.results.append(result)
        
        # Special validations
        self._validate_ai_services()
        self._validate_url_consistency()
        
        # Generate summary
        return self._generate_summary()
    
    def _validate_variable(self, var_name: str, config: Dict[str, Any]) -> ValidationResult:
        """Validate a single environment variable"""
        value = os.getenv(var_name)
        
        # Check if required
        if config.get("required", False) and not value:
            # Use default if available
            default = config.get("default")
            if default:
                value = default
                os.environ[var_name] = default
                return ValidationResult(
                    variable=var_name,
                    is_valid=True,
                    level=ValidationLevel.INFO,
                    message=f"Using default value: {default}",
                    value=default
                )
            else:
                return ValidationResult(
                    variable=var_name,
                    is_valid=False,
                    level=ValidationLevel.CRITICAL,
                    message=f"Required variable missing: {config.get('description', '')}"
                )
        
        if not value:
            return ValidationResult(
                variable=var_name,
                is_valid=True,
                level=ValidationLevel.INFO,
                message="Optional variable not set"
            )
        
        # Type validation
        var_type = config.get("type", "str")
        if var_type == "int":
            try:
                int_value = int(value)
                min_val = config.get("min_value")
                max_val = config.get("max_value")
                
                if min_val is not None and int_value < min_val:
                    return ValidationResult(
                        variable=var_name,
                        is_valid=False,
                        level=ValidationLevel.WARNING,
                        message=f"Value {int_value} below minimum {min_val}",
                        value=value
                    )
                
                if max_val is not None and int_value > max_val:
                    return ValidationResult(
                        variable=var_name,
                        is_valid=False,
                        level=ValidationLevel.WARNING,
                        message=f"Value {int_value} above maximum {max_val}",
                        value=value
                    )
                    
            except ValueError:
                return ValidationResult(
                    variable=var_name,
                    is_valid=False,
                    level=ValidationLevel.CRITICAL,
                    message=f"Invalid integer value: {value}"
                )
        
        elif var_type == "bool":
            if value.lower() not in ["true", "false", "1", "0", "yes", "no"]:
                return ValidationResult(
                    variable=var_name,
                    is_valid=False,
                    level=ValidationLevel.WARNING,
                    message=f"Invalid boolean value: {value}",
                    value=value
                )
        
        # Pattern validation
        pattern = config.get("pattern")
        if pattern and not re.match(pattern, value):
            return ValidationResult(
                variable=var_name,
                is_valid=False,
                level=ValidationLevel.CRITICAL,
                message=f"Value doesn't match required pattern",
                value=value
            )
        
        # Length validation
        min_length = config.get("min_length")
        if min_length and len(value) < min_length:
            return ValidationResult(
                variable=var_name,
                is_valid=False,
                level=ValidationLevel.WARNING,
                message=f"Value too short (minimum {min_length} characters)",
                value=value
            )
        
        # Allowed values validation
        allowed_values = config.get("allowed_values")
        if allowed_values and value not in allowed_values:
            return ValidationResult(
                variable=var_name,
                is_valid=False,
                level=ValidationLevel.WARNING,
                message=f"Value must be one of: {', '.join(allowed_values)}",
                value=value
            )
        
        # URL validation
        if "URL" in var_name or "URI" in var_name:
            try:
                parsed = urlparse(value)
                if not parsed.scheme or not parsed.netloc:
                    return ValidationResult(
                        variable=var_name,
                        is_valid=False,
                        level=ValidationLevel.CRITICAL,
                        message="Invalid URL format",
                        value=value
                    )
            except Exception:
                return ValidationResult(
                    variable=var_name,
                    is_valid=False,
                    level=ValidationLevel.CRITICAL,
                    message="URL parsing failed",
                    value=value
                )
        
        return ValidationResult(
            variable=var_name,
            is_valid=True,
            level=ValidationLevel.INFO,
            message="Valid",
            value=value
        )
    
    def _validate_ai_services(self):
        """Ensure at least one AI service API key is configured"""
        ai_keys = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
        has_ai_key = any(os.getenv(key) for key in ai_keys)
        
        if not has_ai_key:
            self.results.append(ValidationResult(
                variable="AI_SERVICES",
                is_valid=False,
                level=ValidationLevel.CRITICAL,
                message="At least one AI service API key must be configured"
            ))
    
    def _validate_url_consistency(self):
        """Validate URL consistency across services"""
        backend_url = os.getenv("BACKEND_URL")
        api_url = os.getenv("NEXT_PUBLIC_API_URL")
        
        if backend_url and api_url and backend_url != api_url:
            self.results.append(ValidationResult(
                variable="URL_CONSISTENCY",
                is_valid=False,
                level=ValidationLevel.WARNING,
                message="BACKEND_URL and NEXT_PUBLIC_API_URL should match for development"
            ))
    
    def _load_env_file(self):
        """Load environment variables from file"""
        try:
            with open(self.env_file_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        key = key.strip()
                        value = value.strip()
                        if not os.getenv(key):  # Don't override existing env vars
                            os.environ[key] = value
        except Exception as e:
            logger.error(f"Failed to load env file {self.env_file_path}: {e}")
    
    def _generate_summary(self) -> Dict[str, Any]:
        """Generate validation summary"""
        critical_issues = [r for r in self.results if r.level == ValidationLevel.CRITICAL and not r.is_valid]
        warnings = [r for r in self.results if r.level == ValidationLevel.WARNING and not r.is_valid]
        valid_count = len([r for r in self.results if r.is_valid])
        
        return {
            "is_valid": len(critical_issues) == 0,
            "summary": {
                "total_variables": len(self.results),
                "valid_variables": valid_count,
                "critical_issues": len(critical_issues),
                "warnings": len(warnings)
            },
            "critical_issues": [
                {
                    "variable": r.variable,
                    "message": r.message
                }
                for r in critical_issues
            ],
            "warnings": [
                {
                    "variable": r.variable,
                    "message": r.message
                }
                for r in warnings
            ],
            "details": [
                {
                    "variable": r.variable,
                    "is_valid": r.is_valid,
                    "level": r.level.value,
                    "message": r.message,
                    "has_value": r.value is not None
                }
                for r in self.results
            ]
        }
    
    def get_validation_errors(self) -> List[str]:
        """Get list of critical validation errors"""
        errors = []
        for result in self.results:
            if result.level == ValidationLevel.CRITICAL and not result.is_valid:
                errors.append(f"{result.variable}: {result.message}")
        return errors
    
    def is_configuration_valid(self) -> bool:
        """Check if configuration is valid (no critical issues)"""
        return all(
            result.is_valid or result.level != ValidationLevel.CRITICAL
            for result in self.results
        )


# Convenience functions
def validate_environment(env_file_path: Optional[str] = None) -> Dict[str, Any]:
    """Validate environment configuration and return results"""
    validator = EnvironmentValidator(env_file_path)
    return validator.validate_all()


def check_critical_config() -> List[str]:
    """Quick check for critical configuration issues"""
    validator = EnvironmentValidator()
    validator.validate_all()
    return validator.get_validation_errors()