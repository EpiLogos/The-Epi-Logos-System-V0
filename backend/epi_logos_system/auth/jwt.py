"""
JWT token utilities for testing
"""
from typing import Dict, Any


def create_test_jwt_token(user_id: str, **kwargs) -> str:
    """Create a test JWT token (mock implementation)"""
    # In real implementation, this would create an actual JWT token
    return f"test.jwt.token.{user_id}"