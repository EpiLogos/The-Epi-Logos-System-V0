"""
Centralized configuration management for the Epi-Logos System.
Provides a single source of truth for all configuration settings.
"""
import os
import logging
from functools import lru_cache
from typing import Optional
from backend.config.environment import EnvironmentConfig, validate_environment

logger = logging.getLogger(__name__)


class Settings:
    """Centralized settings management with validation and caching."""
    
    def __init__(self):
        """Initialize settings with validation."""
        self._config: Optional[EnvironmentConfig] = None
        self._validated = False
    
    @property
    def config(self) -> EnvironmentConfig:
        """Get validated configuration instance."""
        if self._config is None:
            self._config = EnvironmentConfig()
            logger.info(f"Configuration loaded for environment: {self._config.environment}")
        return self._config
    
    def validate(self) -> bool:
        """Validate configuration and environment variables."""
        if self._validated:
            return True
        
        try:
            # Validate environment variables
            validate_environment()
            
            # Validate configuration instance
            config = self.config
            
            # Additional validation checks
            self._validate_database_urls(config)
            self._validate_security_settings(config)
            self._validate_oauth_settings(config)
            
            self._validated = True
            logger.info("Configuration validation passed")
            return True
            
        except Exception as e:
            logger.error(f"Configuration validation failed: {e}")
            raise
    
    def _validate_database_urls(self, config: EnvironmentConfig):
        """Validate database connection URLs."""
        if not config.mongodb_uri:
            raise ValueError("MongoDB URI is required")
        
        if not config.neo4j_uri:
            logger.warning("Neo4j URI not configured")
        
        if not config.redis_url:
            raise ValueError("Redis URL is required")
    
    def _validate_security_settings(self, config: EnvironmentConfig):
        """Validate security-related settings."""
        if not config.jwt_secret:
            raise ValueError("JWT secret is required")
        
        if len(config.jwt_secret) < 32:
            raise ValueError("JWT secret must be at least 32 characters")
        
        if config.environment == "production" and config.debug:
            raise ValueError("Debug mode cannot be enabled in production")
    
    def _validate_oauth_settings(self, config: EnvironmentConfig):
        """Validate OAuth configuration."""
        if config.google_client_id and not config.google_client_secret:
            raise ValueError("Google client secret is required when client ID is provided")
        
        if config.github_client_id and not config.github_client_secret:
            raise ValueError("GitHub client secret is required when client ID is provided")
    
    def get_database_config(self) -> dict:
        """Get database configuration dictionary."""
        config = self.config
        return {
            "mongodb": {
                "uri": config.mongodb_uri,
                "database": config.mongodb_database,
            },
            "neo4j": {
                "uri": config.neo4j_uri,
                "username": config.neo4j_username,
                "password": config.neo4j_password,
                "database": config.neo4j_database,
            },
            "redis": {
                "url": config.redis_url,
                "password": config.redis_password,
            },
            "qdrant": {
                "url": config.qdrant_url,
                "api_key": config.qdrant_api_key,
            }
        }
    
    def get_security_config(self) -> dict:
        """Get security configuration dictionary."""
        config = self.config
        return {
            "jwt": {
                "secret": config.jwt_secret,
                "algorithm": config.jwt_algorithm,
                "expiration_hours": config.jwt_expiration_hours,
            },
            "oauth": {
                "google": {
                    "client_id": config.google_client_id,
                    "client_secret": config.google_client_secret,
                },
                "github": {
                    "client_id": config.github_client_id,
                    "client_secret": config.github_client_secret,
                }
            }
        }
    
    def get_api_keys(self) -> dict:
        """Get API keys configuration."""
        config = self.config
        return {
            "openai": config.openai_api_key,
            "anthropic": config.anthropic_api_key,
            "langsmith": config.langsmith_api_key,
        }
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.config.environment == "production"
    
    def is_testing(self) -> bool:
        """Check if running in testing environment."""
        return self.config.testing or self.config.environment == "testing"
    
    def is_debug(self) -> bool:
        """Check if debug mode is enabled."""
        return self.config.debug and not self.is_production()


# Global settings instance
_settings: Optional[Settings] = None


@lru_cache()
def get_settings() -> Settings:
    """Get the global settings instance (cached)."""
    global _settings
    if _settings is None:
        _settings = Settings()
        _settings.validate()
        logger.info("Settings initialized and validated")
    return _settings


def get_config() -> EnvironmentConfig:
    """Get the environment configuration."""
    return get_settings().config


def reset_settings():
    """Reset the global settings cache."""
    global _settings
    _settings = None
    get_settings.cache_clear()
    logger.info("Settings cache reset")


# Convenience functions for common configuration access
def get_jwt_secret() -> str:
    """Get JWT secret key."""
    return get_config().jwt_secret


def get_mongodb_uri() -> str:
    """Get MongoDB connection URI."""
    return get_config().mongodb_uri


def get_redis_url() -> str:
    """Get Redis connection URL."""
    return get_config().redis_url


def is_production() -> bool:
    """Check if running in production."""
    return get_settings().is_production()


def is_debug() -> bool:
    """Check if debug mode is enabled."""
    return get_settings().is_debug()