"""
Environment configuration for AG-UI integration
"""
import os
from typing import Optional
from pydantic import BaseModel, Field


class Config(BaseModel):
    """Application configuration with enhanced JWT settings"""
    database_uri: str = "neo4j://localhost:7687"
    jwt_secret: str = Field(default_factory=lambda: os.getenv("JWT_SECRET", "test-secret-key-change-in-production"))
    jwt_algorithm: str = Field(default="HS256")
    jwt_issuer: str = Field(default_factory=lambda: os.getenv("JWT_ISSUER", "epi-logos-system"))
    jwt_audience: str = Field(default_factory=lambda: os.getenv("JWT_AUDIENCE", "ag-ui-protocol"))
    jwt_expiry_minutes: int = Field(default=60)
    jwt_clock_skew_seconds: int = Field(default=10)
    

def get_config() -> Config:
    """Get application configuration"""
    return Config()