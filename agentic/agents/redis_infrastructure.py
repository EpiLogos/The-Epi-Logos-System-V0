"""
Redis Infrastructure for Multi-Agent Collaboration

Implements thought trains and shared memory substrate for agent insights
and wisdom synthesis (ASCP Phases 2-3: Vimarśa and Crystallization).

Story 02.24 - AC: 7 (Redis Infrastructure)
"""

import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class ThoughtTrainManager:
    """
    Manages Redis thought trains for agent insight accumulation.

    Thought trains enable agents to record observations about coordinate
    properties for later wisdom synthesis by orchestrator.

    Schema:
    - Key: thought_train:{subsystem}:{property}
    - Type: Redis list (ordered insights)
    - Item format: JSON with timestamp, agent_id, insight, justification
    """

    def __init__(self, redis_client):
        """
        Initialize thought train manager.

        Args:
            redis_client: Redis client instance
        """
        self.redis = redis_client
        logger.info("ThoughtTrainManager initialized")

    def _thought_train_key(self, subsystem: int, property_name: str) -> str:
        """Generate thought train key"""
        return f"thought_train:{subsystem}:{property_name}"

    def add_insight(
        self,
        subsystem: int,
        property_name: str,
        agent_id: str,
        insight: str,
        justification: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Add insight to thought train.

        Args:
            subsystem: Subsystem number (0-5)
            property_name: Property being observed
            agent_id: Agent instance identifier
            insight: The observation/insight
            justification: Reasoning for the insight
            metadata: Additional metadata

        Returns:
            True if added successfully
        """
        try:
            key = self._thought_train_key(subsystem, property_name)

            insight_record = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "agent_id": agent_id,
                "subsystem": subsystem,
                "property": property_name,
                "insight": insight,
                "justification": justification,
                "metadata": metadata or {}
            }

            # LPUSH adds to head of list (most recent first)
            self.redis.lpush(key, json.dumps(insight_record))
            logger.info(
                f"Added insight to thought train: {subsystem}.{property_name} "
                f"from {agent_id}"
            )
            return True

        except Exception as e:
            logger.error(f"Error adding insight to thought train: {e}")
            return False

    def get_insights(
        self,
        subsystem: int,
        property_name: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Retrieve insights from thought train.

        Args:
            subsystem: Subsystem number
            property_name: Property name
            limit: Maximum insights to retrieve

        Returns:
            List of insight records (most recent first)
        """
        try:
            key = self._thought_train_key(subsystem, property_name)

            # LRANGE retrieves range from list
            raw_insights = self.redis.lrange(key, 0, limit - 1)

            insights = [json.loads(item) for item in raw_insights]
            logger.debug(
                f"Retrieved {len(insights)} insights from {subsystem}.{property_name}"
            )
            return insights

        except Exception as e:
            logger.error(f"Error retrieving insights from thought train: {e}")
            return []

    def get_all_trains_for_subsystem(self, subsystem: int) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all thought trains for a subsystem.

        Args:
            subsystem: Subsystem number

        Returns:
            Dict mapping property names to insight lists
        """
        try:
            pattern = f"thought_train:{subsystem}:*"
            keys = self.redis.keys(pattern)

            trains = {}
            for key in keys:
                # Extract property name from key
                property_name = key.split(":")[-1]
                trains[property_name] = self.get_insights(subsystem, property_name)

            logger.debug(f"Retrieved {len(trains)} thought trains for subsystem {subsystem}")
            return trains

        except Exception as e:
            logger.error(f"Error retrieving thought trains for subsystem {subsystem}: {e}")
            return {}


class SharedMemoryManager:
    """
    Manages shared memory substrate for agent context.

    Enables agents to share context and insights across instances.

    Schema:
    - Key: agent_memory:{subsystem}
    - Type: Redis hash
    - Fields: Arbitrary context data for subsystem
    """

    def __init__(self, redis_client):
        """
        Initialize shared memory manager.

        Args:
            redis_client: Redis client instance
        """
        self.redis = redis_client
        logger.info("SharedMemoryManager initialized")

    def _memory_key(self, subsystem: int) -> str:
        """Generate shared memory key"""
        return f"agent_memory:{subsystem}"

    def set_context(
        self,
        subsystem: int,
        field: str,
        value: Any
    ) -> bool:
        """
        Set context field in shared memory.

        Args:
            subsystem: Subsystem number
            field: Field name
            value: Value to store (will be JSON serialized)

        Returns:
            True if set successfully
        """
        try:
            key = self._memory_key(subsystem)

            # Serialize value to JSON
            serialized = json.dumps(value)

            # HSET sets hash field
            self.redis.hset(key, field, serialized)
            logger.debug(f"Set shared memory: {subsystem}.{field}")
            return True

        except Exception as e:
            logger.error(f"Error setting shared memory: {e}")
            return False

    def get_context(
        self,
        subsystem: int,
        field: str
    ) -> Optional[Any]:
        """
        Get context field from shared memory.

        Args:
            subsystem: Subsystem number
            field: Field name

        Returns:
            Deserialized value or None if not found
        """
        try:
            key = self._memory_key(subsystem)

            # HGET retrieves hash field
            value = self.redis.hget(key, field)

            if value:
                return json.loads(value)
            else:
                return None

        except Exception as e:
            logger.error(f"Error getting shared memory: {e}")
            return None

    def get_all_context(self, subsystem: int) -> Dict[str, Any]:
        """
        Get all context fields for subsystem.

        Args:
            subsystem: Subsystem number

        Returns:
            Dict of all context fields
        """
        try:
            key = self._memory_key(subsystem)

            # HGETALL retrieves all hash fields
            raw_data = self.redis.hgetall(key)

            # Deserialize all values
            context = {k: json.loads(v) for k, v in raw_data.items()}
            logger.debug(f"Retrieved {len(context)} context fields for subsystem {subsystem}")
            return context

        except Exception as e:
            logger.error(f"Error retrieving all context for subsystem {subsystem}: {e}")
            return {}

    def delete_context(self, subsystem: int, field: str) -> bool:
        """
        Delete context field from shared memory.

        Args:
            subsystem: Subsystem number
            field: Field name

        Returns:
            True if deleted
        """
        try:
            key = self._memory_key(subsystem)
            self.redis.hdel(key, field)
            logger.debug(f"Deleted shared memory: {subsystem}.{field}")
            return True

        except Exception as e:
            logger.error(f"Error deleting shared memory: {e}")
            return False
