"""
Prakāśa Cache

Redis performance cache for agent identity prompts.

NOTE: This is NOT the source of truth.
Source of truth is f_system_prompt on agent node.

No TTL - manual invalidation only.

Reference: /memory/sprint_tracking/sprint-3/active_sprint/prakasa-layered-architecture-refactor-plan.md
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class PrakasaCache:
    """
    Redis performance cache for identity prompts.

    ASCP Layered Architecture:
    - Layer 1 (Identity Prakāśa): Cached here for performance
    - Source of truth: f_system_prompt property on agent node
    - Invalidation: Manual, triggered by significant property changes
    """

    def __init__(self, redis_client):
        """
        Initialize Prakāśa cache.

        Args:
            redis_client: Redis client instance
        """
        self.redis = redis_client
        logger.info("PrakasaCache initialized")

    async def get(self, agent_coordinate: str) -> Optional[str]:
        """
        Get cached identity prompt.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Cached prompt string, or None if not cached
        """
        key = self._cache_key(agent_coordinate)

        try:
            cached = self.redis.get(key)
            if cached:
                prompt = cached.decode('utf-8') if isinstance(cached, bytes) else cached
                logger.debug(f"Cache HIT for {agent_coordinate}")
                return prompt
            else:
                logger.debug(f"Cache MISS for {agent_coordinate}")
                return None
        except Exception as e:
            logger.error(f"Error getting cache for {agent_coordinate}: {e}")
            return None

    async def set(self, agent_coordinate: str, prompt: str) -> bool:
        """
        Set cached identity prompt (no TTL - persists until invalidated).

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            prompt: Identity prompt to cache

        Returns:
            True if successful, False otherwise
        """
        key = self._cache_key(agent_coordinate)

        try:
            self.redis.set(key, prompt)
            logger.info(
                f"Cached identity prompt for {agent_coordinate} "
                f"({len(prompt)} chars, no TTL)"
            )
            return True
        except Exception as e:
            logger.error(f"Error setting cache for {agent_coordinate}: {e}")
            return False

    async def invalidate(self, agent_coordinate: str) -> bool:
        """
        Delete from cache (manual invalidation).

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            True if deleted, False if not found or error
        """
        key = self._cache_key(agent_coordinate)

        try:
            deleted = self.redis.delete(key)
            if deleted > 0:
                logger.info(f"Invalidated cache for {agent_coordinate}")
                return True
            else:
                logger.debug(f"No cache to invalidate for {agent_coordinate}")
                return False
        except Exception as e:
            logger.error(f"Error invalidating cache for {agent_coordinate}: {e}")
            return False

    def _cache_key(self, agent_coordinate: str) -> str:
        """
        Generate cache key for agent coordinate.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Redis key (e.g., "prakasa:identity:#5-4.5")
        """
        # Format: "prakasa:identity:{coordinate}"
        return f"prakasa:identity:{agent_coordinate}"
