"""
Rate Limiting middleware for authentication endpoints.
Implements MVP Security Baseline - Basic rate limiting for brute force protection.
"""

from typing import Dict, Optional, Any
from fastapi import Request

from ..core.exceptions import RateLimitExceededError


class RateLimitingMiddleware:
    """Middleware for rate limiting authentication and security endpoints."""
    
    def __init__(self, redis_client):
        """
        Initialize rate limiting middleware.
        
        Args:
            redis_client: Redis client for rate limit tracking
        """
        self.redis_client = redis_client
        
        # Rate limit configuration for MVP security baseline
        self.rate_limits = {
            "login": {
                "limit": 10,      # 10 attempts
                "window": 900,    # 15 minutes
                "scope": "ip"     # IP-based limiting
            },
            "password_reset": {
                "limit": 3,       # 3 attempts
                "window": 900,    # 15 minutes
                "scope": "ip"     # IP-based limiting
            },
            "mfa_verify": {
                "limit": 5,       # 5 attempts
                "window": 300,    # 5 minutes
                "scope": "user"   # User-based limiting
            },
            "register": {
                "limit": 5,       # 5 attempts
                "window": 3600,   # 1 hour
                "scope": "ip"     # IP-based limiting
            }
        }
    
    async def check_rate_limit(
        self, 
        request: Request, 
        endpoint: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check if request is within rate limits.
        
        Args:
            request: FastAPI request object
            endpoint: Endpoint type (login, password_reset, mfa_verify, etc.)
            user_id: Optional user ID for user-based limiting
            
        Returns:
            Dict with rate limit status
            
        Raises:
            RateLimitExceededError: If rate limit is exceeded
        """
        if endpoint not in self.rate_limits:
            # No rate limiting configured for this endpoint
            return {"allowed": True, "remaining": float('inf')}
        
        config = self.rate_limits[endpoint]
        rate_limit_key = self.get_rate_limit_key(endpoint, request.client.host, user_id)
        
        # Get current count
        current_count = await self.redis_client.get(rate_limit_key)
        current_count = int(current_count) if current_count else 0
        
        # Check if limit exceeded
        if current_count >= config["limit"]:
            ttl = await self.redis_client.ttl(rate_limit_key)
            raise RateLimitExceededError(
                f"Rate limit exceeded for {endpoint}. Try again in {ttl} seconds.",
                retry_after=ttl
            )
        
        return {
            "allowed": True,
            "remaining": config["limit"] - current_count,
            "limit": config["limit"],
            "window": config["window"]
        }
    
    async def increment_counter(
        self, 
        request: Request, 
        endpoint: str,
        user_id: Optional[str] = None
    ) -> None:
        """
        Increment rate limit counter for endpoint.
        
        Args:
            request: FastAPI request object
            endpoint: Endpoint type
            user_id: Optional user ID for user-based limiting
        """
        if endpoint not in self.rate_limits:
            return
        
        config = self.rate_limits[endpoint]
        rate_limit_key = self.get_rate_limit_key(endpoint, request.client.host, user_id)
        
        # Increment counter
        current_count = await self.redis_client.incr(rate_limit_key)
        
        # Set expiration on first increment
        if current_count == 1:
            await self.redis_client.expire(rate_limit_key, config["window"])
    
    def get_rate_limit_key(
        self, 
        endpoint: str, 
        ip_address: str, 
        user_id: Optional[str] = None
    ) -> str:
        """
        Generate rate limit key based on endpoint configuration.
        
        Args:
            endpoint: Endpoint type
            ip_address: Client IP address
            user_id: Optional user ID
            
        Returns:
            Redis key for rate limiting
        """
        config = self.rate_limits.get(endpoint, {"scope": "ip"})
        
        if config["scope"] == "user" and user_id:
            return f"rate_limit:{endpoint}:user:{user_id}"
        else:
            return f"rate_limit:{endpoint}:ip:{ip_address}"
    
    async def get_rate_limit_info(
        self, 
        request: Request, 
        endpoint: str,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get current rate limit information.
        
        Args:
            request: FastAPI request object
            endpoint: Endpoint type
            user_id: Optional user ID
            
        Returns:
            Dict with current rate limit status
        """
        if endpoint not in self.rate_limits:
            return {"unlimited": True}
        
        config = self.rate_limits[endpoint]
        rate_limit_key = self.get_rate_limit_key(endpoint, request.client.host, user_id)
        
        current_count = await self.redis_client.get(rate_limit_key)
        current_count = int(current_count) if current_count else 0
        
        ttl = await self.redis_client.ttl(rate_limit_key)
        ttl = max(0, ttl) if ttl > 0 else 0
        
        return {
            "current_count": current_count,
            "limit": config["limit"],
            "remaining": max(0, config["limit"] - current_count),
            "reset_time": ttl,
            "window_seconds": config["window"]
        }
    
    def get_rate_limit_config(self) -> Dict[str, Any]:
        """
        Get rate limit configuration.
        
        Returns:
            Dict with rate limit configuration
        """
        return self.rate_limits.copy()
    
    def get_endpoint_type(self, path: str) -> str:
        """
        Determine endpoint type from request path.
        
        Args:
            path: Request path
            
        Returns:
            Endpoint type string
        """
        # Map request paths to endpoint types
        path_mappings = {
            "/api/auth/login": "login",
            "/api/security/password-reset/request": "password_reset",
            "/api/security/mfa/verify": "mfa_verify",
            "/api/auth/register": "register"
        }
        
        # Check exact matches first
        if path in path_mappings:
            return path_mappings[path]
        
        # Check partial matches
        if "/password-reset" in path:
            return "password_reset"
        elif "/mfa" in path:
            return "mfa_verify"
        elif path.endswith("/login"):
            return "login"
        elif path.endswith("/register"):
            return "register"
        
        # Default to unknown (no rate limiting)
        return "unknown"
    
    def add_rate_limit_headers(
        self, 
        response, 
        limit: int, 
        remaining: int, 
        reset_time: int
    ) -> None:
        """
        Add rate limit headers to response.
        
        Args:
            response: FastAPI response object
            limit: Rate limit maximum
            remaining: Remaining requests
            reset_time: Time until reset (seconds)
        """
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)
    
    async def cleanup_expired_keys(self) -> Dict[str, Any]:
        """
        Clean up expired rate limit keys (maintenance function).
        
        Returns:
            Dict with cleanup statistics
        """
        # This would be called by a background task
        # For MVP, Redis TTL handles cleanup automatically
        return {
            "status": "auto_cleanup",
            "note": "Redis TTL handles automatic cleanup"
        }