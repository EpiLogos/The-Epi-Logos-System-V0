"""
Rate Limiting middleware utilities for authentication/security endpoints.

This implementation is intentionally lightweight and test-friendly. It provides
helpers that can be used from a Starlette/FastAPI middleware or directly in
route handlers/services. Tests exercise these helpers in isolation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, Tuple
from fastapi import Request

from backend.epi_logos_system.shared.exceptions import RateLimitExceededError


@dataclass
class RateLimitRule:
    limit: int
    window: int  # seconds


class RateLimitingMiddleware:
    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.rules: Dict[str, RateLimitRule] = {
            "login": RateLimitRule(limit=10, window=900),  # 10 per 15 minutes
            "password_reset": RateLimitRule(limit=3, window=900),  # 3 per 15 minutes
            "mfa_verify": RateLimitRule(limit=5, window=300),  # 5 per 5 minutes
            # Defaults for other endpoints can be added here
        }

    def get_rate_limit_config(self) -> Dict[str, Dict[str, int]]:
        return {k: {"limit": v.limit, "window": v.window} for k, v in self.rules.items()}

    def get_endpoint_type(self, path: str) -> str:
        if path.startswith("/api/security/password-reset/"):
            return "password_reset"
        if path.startswith("/api/security/mfa/verify"):
            return "mfa_verify"
        if path.startswith("/api/auth/login"):
            return "login"
        if path.startswith("/api/auth/register"):
            return "register"
        return "login"

    def get_rate_limit_key(self, *, endpoint: str, ip_address: str, user_id: Optional[str]) -> str:
        if endpoint == "mfa_verify" and user_id:
            return f"rate_limit:{endpoint}:user:{user_id}"
        return f"rate_limit:{endpoint}:ip:{ip_address}"

    async def check_rate_limit(
        self,
        *,
        request: Request,
        endpoint: str,
        user_id: Optional[str],
    ) -> Dict[str, int | bool]:
        rule = self.rules.get(endpoint)
        if not rule:
            # No rule configured: allow by default
            return {"allowed": True, "remaining": 1_000_000}

        ip = request.client.host if request and request.client else "unknown"
        key = self.get_rate_limit_key(endpoint=endpoint, ip_address=ip, user_id=user_id)

        current_raw = await self.redis_client.get(key)
        current = int(current_raw) if current_raw else 0

        if current >= rule.limit:
            ttl = await self.redis_client.ttl(key)
            # Provide Retry-After info in message for tests
            raise RateLimitExceededError(f"Rate limit exceeded. Try again in {ttl} seconds")

        remaining = max(0, rule.limit - current)
        return {"allowed": True, "remaining": remaining}

    async def increment_counter(
        self,
        *,
        request: Request,
        endpoint: str,
        user_id: Optional[str],
    ) -> None:
        rule = self.rules.get(endpoint)
        if not rule:
            return

        ip = request.client.host if request and request.client else "unknown"
        key = self.get_rate_limit_key(endpoint=endpoint, ip_address=ip, user_id=user_id)

        new_val = await self.redis_client.incr(key)
        if new_val == 1:
            await self.redis_client.expire(key, rule.window)

    async def get_rate_limit_info(
        self,
        *,
        request: Request,
        endpoint: str,
        user_id: Optional[str],
    ) -> Dict[str, int]:
        rule = self.rules[endpoint]
        ip = request.client.host if request and request.client else "unknown"
        key = self.get_rate_limit_key(endpoint=endpoint, ip_address=ip, user_id=user_id)

        current_raw = await self.redis_client.get(key)
        current = int(current_raw) if current_raw else 0
        ttl = await self.redis_client.ttl(key)
        return {
            "current_count": current,
            "limit": rule.limit,
            "remaining": max(0, rule.limit - current),
            "reset_time": ttl if ttl is not None else rule.window,
            "window_seconds": rule.window,
        }

    def add_rate_limit_headers(self, *, response, limit: int, remaining: int, reset_time: int) -> None:
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_time)

