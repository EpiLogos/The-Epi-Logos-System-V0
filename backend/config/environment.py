"""
Environment configuration management for the Epi-Logos System.

This module handles environment variable validation, type conversion,
and secure configuration management.
"""

import os
import logging
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import validator


logger = logging.getLogger(__name__)


class EnvironmentConfig(BaseSettings):
    """Environment configuration with validation and type conversion."""
    
    # Application settings
    environment: str = "development"
    debug: bool = True
    testing: bool = False
    log_level: str = "INFO"
    
    # Database configurations
    neo4j_uri: Optional[str] = None
    neo4j_username: str = "neo4j"
    neo4j_password: Optional[str] = None
    neo4j_database: str = "neo4j"
    
    mongodb_uri: Optional[str] = None
    mongodb_database: str = "epi-logos"
    
    redis_url: Optional[str] = None
    redis_password: Optional[str] = None
    
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    
    # Security configurations
    jwt_secret: Optional[str] = None
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24
    
    # OAuth configurations
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    github_client_id: Optional[str] = None
    github_client_secret: Optional[str] = None
    
    # Stripe configurations
    stripe_public_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None
    stripe_price_id_patron: Optional[str] = None
    
    # API keys
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    
    # External services
    cloudflare_r2_account_id: Optional[str] = None
    cloudflare_r2_access_key_id: Optional[str] = None
    cloudflare_r2_secret_access_key: Optional[str] = None
    cloudflare_r2_bucket_name: Optional[str] = None
    
    langsmith_api_key: Optional[str] = None
    langsmith_project: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"  # Ignore extra fields from .env files
    
    @validator("environment")
    def validate_environment(cls, v):
        """Validate environment value."""
        valid_environments = ["development", "testing", "staging", "production"]
        if v not in valid_environments:
            raise ValueError(f"Environment must be one of: {valid_environments}")
        return v
    
    @validator("debug")
    def set_debug_based_on_environment(cls, v, values):
        """Set debug based on environment."""
        environment = values.get("environment", "development")
        if environment == "production":
            return False
        return v
    
    @validator("jwt_secret")
    def validate_jwt_secret(cls, v):
        """Validate JWT secret strength."""
        if v and len(v) < 32:
            raise ValueError("JWT secret must be at least 32 characters long")
        return v
    
    @validator("jwt_expiration_hours")
    def validate_jwt_expiration(cls, v):
        """Validate JWT expiration is positive."""
        if v <= 0:
            raise ValueError("JWT expiration hours must be positive")
        return v
    
    def __str__(self) -> str:
        """String representation with sensitive data masked."""
        sensitive_fields = [
            "jwt_secret", "neo4j_password", "redis_password",
            "google_client_secret", "github_client_secret",
            "stripe_secret_key", "stripe_webhook_secret",
            "openai_api_key", "anthropic_api_key",
            "cloudflare_r2_secret_access_key"
        ]
        
        config_dict = self.dict()
        for field in sensitive_fields:
            if field in config_dict and config_dict[field]:
                config_dict[field] = "***REDACTED***"
        
        return f"EnvironmentConfig({config_dict})"


def validate_environment() -> None:
    """Validate that all required environment variables are set."""
    required_vars = [
        "NEO4J_URI",
        "NEO4J_PASSWORD", 
        "MONGODB_URI",
        "REDIS_URL",
        "JWT_SECRET",
        "OPENAI_API_KEY"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
    
    logger.info("Environment validation passed")


def get_config() -> EnvironmentConfig:
    """Get the current environment configuration."""
    return EnvironmentConfig()
