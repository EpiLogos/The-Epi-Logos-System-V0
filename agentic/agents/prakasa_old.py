"""
Prakāśa Phase: Agent Self-Contextualization via Bimba Map

Implements ASCP Phase 1: Prakāśa (Illumination) - Getting Into Role
Agents discover their identity through Bimba coordinate queries.

Architecture Pattern:
- Query Bimba map for subsystem-specific properties
- Compose system prompt from coordinate data
- Cache results in Redis (TTL: 1 hour)
- Use @agent.system_prompt decorator for dynamic prompts

Story 02.24 - AC: 5 (Prakāśa Phase Bimba Initialization)
"""

import logging
import json
import os
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from agentic.agents.delegation_events import get_delegation_emitter, DelegationEventType

logger = logging.getLogger(__name__)

# Default TTL for Prakāśa cache (1 hour)
PRAKASA_CACHE_TTL = int(os.getenv("PRAKASA_CACHE_TTL", "3600"))


class BimbaCacheManager:
    """
    Manages Redis caching for Bimba-derived agent context.

    Cache structure:
    - Key: prakasa:{coordinate}
    - Value: JSON with Bimba properties + composed prompt
    - TTL: 1 hour (configurable)
    """

    def __init__(self, redis_client):
        """
        Initialize cache manager.

        Args:
            redis_client: Redis client instance
        """
        self.redis = redis_client
        self.ttl = PRAKASA_CACHE_TTL
        logger.info(f"BimbaCacheManager initialized (TTL: {self.ttl}s)")

    def _cache_key(self, coordinate: str) -> str:
        """Generate cache key for coordinate"""
        return f"prakasa:{coordinate}"

    async def get(self, coordinate: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached Prakāśa context.

        Args:
            coordinate: Bimba coordinate (e.g., "#2")

        Returns:
            Cached context dict or None if cache miss
        """
        try:
            key = self._cache_key(coordinate)
            cached = self.redis.get(key)

            if cached:
                logger.debug(f"Prakāśa cache HIT: {coordinate}")
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_CACHE_HIT,
                    {"coordinate": coordinate}
                )
                return json.loads(cached)
            else:
                logger.debug(f"Prakāśa cache MISS: {coordinate}")
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_CACHE_MISS,
                    {"coordinate": coordinate}
                )
                return None

        except Exception as e:
            logger.error(f"Error reading Prakāśa cache for {coordinate}: {e}")
            return None

    async def set(
        self,
        coordinate: str,
        bimba_data: Dict[str, Any],
        composed_prompt: str
    ) -> bool:
        """
        Cache Bimba-derived context.

        Args:
            coordinate: Bimba coordinate
            bimba_data: Raw Bimba properties
            composed_prompt: Composed system prompt

        Returns:
            True if cached successfully
        """
        try:
            key = self._cache_key(coordinate)
            context = {
                "coordinate": coordinate,
                "bimba_data": bimba_data,
                "system_prompt": composed_prompt,
                "cached_at": datetime.now(timezone.utc).isoformat()
            }

            self.redis.setex(key, self.ttl, json.dumps(context))
            logger.info(f"Cached Prakāśa context: {coordinate} (TTL: {self.ttl}s)")
            return True

        except Exception as e:
            logger.error(f"Error caching Prakāśa context for {coordinate}: {e}")
            return False


class PrakasaInitializer:
    """
    Handles Prakāśa phase initialization for agents.

    Responsibilities:
    - Query Bimba map for coordinate properties (root + subsystem)
    - Compose coordinate-specific system prompts with project framings
    - Manage Redis caching
    - Provide fallback prompts on errors

    ASCP Phase 1 (Prakāśa - Illumination):
    Agents discover their identity through TWO queries:
    1. Root node (#) for {subsystem}_* project framings
    2. Subsystem node (#N) for core identity properties
    """

    # Subsystem name mapping for root property filtering
    SUBSYSTEM_NAMES = {
        0: "anuttara",
        1: "paramasiva",
        2: "parashakti",
        3: "mahamaya",
        4: "nara",
        5: "epii"
    }

    def __init__(self, bimba_client, redis_client):
        """
        Initialize Prakāśa initializer.

        Args:
            bimba_client: Bimba GraphQL client
            redis_client: Redis client for caching
        """
        self.bimba_client = bimba_client
        self.cache_manager = BimbaCacheManager(redis_client)
        logger.info("PrakasaInitializer initialized")

    def _get_subsystem_name(self, subsystem: int) -> str:
        """
        Get subsystem name for property filtering.

        Args:
            subsystem: Subsystem number (0-5)

        Returns:
            Subsystem name (e.g., "epii", "nara")
        """
        return self.SUBSYSTEM_NAMES.get(subsystem, f"agent_{subsystem}")

    async def query_bimba_for_agent_context(
        self,
        subsystem: int
    ) -> Optional[Dict[str, Any]]:
        """
        Query Bimba for COMPLETE agent context (ASCP-compliant).

        Implements ASCP Phase 1 (Prakāśa - Illumination) two-phase query:
        1. Root node (#) for {subsystem}_* project framings
        2. Subsystem node (#N) for core identity properties

        Args:
            subsystem: Subsystem number (0-5)

        Returns:
            Complete context dict with:
            {
                "subsystem": int,
                "coordinate": "#N",
                "subsystem_name": "epii",
                "identity": {...},  # From #N node
                "project_framings": {...},  # From # root with {subsystem}_* filter
                "all_properties": {...}  # Complete #N properties
            }
            Or None on failure
        """
        try:
            coordinate = f"#{subsystem}"
            subsystem_name = self._get_subsystem_name(subsystem)
            logger.info(
                f"Querying Bimba for agent context: subsystem {subsystem} "
                f"({coordinate}, {subsystem_name})"
            )

            # PHASE 1: Query root node (#) for project framings
            logger.debug(f"Phase 1: Querying root node for {subsystem_name}_* properties")
            root_result = await self.bimba_client.get_node_details_complete("#")

            project_framings = {}
            if root_result and root_result.get("success") is not False:
                all_root_props = root_result.get("allProperties", {})
                # Filter for subsystem-specific properties
                prefix = f"{subsystem_name}_"
                project_framings = {
                    k: v for k, v in all_root_props.items()
                    if k.startswith(prefix)
                }
                logger.info(
                    f"Found {len(project_framings)} project framing properties "
                    f"for {subsystem_name} from root node"
                )
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_BIMBA_QUERY,
                    {
                        "coordinate": "#",
                        "subsystem": subsystem,
                        "success": True,
                        "framing_count": len(project_framings)
                    }
                )
            else:
                logger.warning(f"Root node query failed for {subsystem_name} framings")
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_BIMBA_QUERY,
                    {"coordinate": "#", "subsystem": subsystem, "success": False}
                )

            # PHASE 2: Query subsystem node (#N) for identity properties
            logger.debug(f"Phase 2: Querying {coordinate} for identity properties")
            node_result = await self.bimba_client.get_node_details_complete(coordinate)

            if node_result and node_result.get("success") is not False:
                all_props = node_result.get("allProperties", {})

                # Extract core identity properties
                identity = {
                    "name": node_result.get("name", f"Agent {subsystem}"),
                    "coreNature": all_props.get("coreNature", ""),
                    "operationalEssence": all_props.get("operationalEssence", ""),
                    "architecturalFunction": all_props.get("architecturalFunction", ""),
                    "internalStructure": all_props.get("internalStructure", "")
                }

                logger.info(f"Successfully queried Bimba for {coordinate} identity")
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_BIMBA_QUERY,
                    {"coordinate": coordinate, "success": True}
                )

                # Return complete context
                return {
                    "subsystem": subsystem,
                    "coordinate": coordinate,
                    "subsystem_name": subsystem_name,
                    "identity": identity,
                    "project_framings": project_framings,
                    "all_properties": all_props
                }
            else:
                logger.warning(f"Subsystem node query failed for {coordinate}")
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_BIMBA_QUERY,
                    {"coordinate": coordinate, "success": False}
                )
                return None

        except Exception as e:
            logger.error(f"Error querying Bimba for agent context (subsystem {subsystem}): {e}")
            return None

    def compose_system_prompt(
        self,
        subsystem: int,
        context_data: Dict[str, Any]
    ) -> str:
        """
        Compose system prompt from Bimba coordinate data.

        ASCP-compliant structure:
        1. Project framings from root node (what project IS from this lens)
        2. Core identity from subsystem node (who this agent IS)
        3. Operating posture (how to engage)

        Args:
            subsystem: Subsystem number
            context_data: Complete context dict from query_bimba_for_agent_context()

        Returns:
            Composed system prompt string
        """
        coordinate = context_data.get("coordinate", f"#{subsystem}")
        subsystem_name = context_data.get("subsystem_name", f"agent_{subsystem}")
        identity = context_data.get("identity", {})
        project_framings = context_data.get("project_framings", {})

        # Extract identity properties
        name = identity.get("name", f"Agent {subsystem}")
        core_nature = identity.get("coreNature", "")
        operational_essence = identity.get("operationalEssence", "")
        architectural_function = identity.get("architecturalFunction", "")
        internal_structure = identity.get("internalStructure", "")

        # Build ASCP-compliant prompt
        prompt = f"""You are {name}, embodying coordinate {coordinate} in the Epi-Logos System.
"""

        # SECTION 1: What This Project IS (from your perspective)
        if project_framings:
            prompt += f"""
## What This Project IS (from your {subsystem_name} perspective)

"""
            # Add each project framing property
            for key, value in sorted(project_framings.items()):
                # Convert epii_project_framing → "Project Framing"
                label = key.split("_", 1)[1].replace("_", " ").title()
                # Truncate very long values for readability
                display_value = value if len(str(value)) < 500 else str(value)[:500] + "..."
                prompt += f"**{label}**: {display_value}\n\n"

        # SECTION 2: Your Core Identity
        prompt += f"""
## Your Core Identity as {coordinate}

"""

        if core_nature:
            prompt += f"**Core Nature**: {core_nature}\n\n"

        if operational_essence:
            prompt += f"**Operational Essence**: {operational_essence}\n\n"

        if architectural_function:
            prompt += f"**Architectural Function**: {architectural_function}\n\n"

        if internal_structure:
            prompt += f"**Internal Structure**: {internal_structure}\n\n"

        # SECTION 3: Operating Posture (ASCP standard)
        prompt += """
## Operating Posture

Through your coordinate awareness:
- Process requests aligned with your subsystem's modality
- Access the full CAG tool suite while maintaining coordinate-specific perspective
- Embody the living knowledge architecture you represent
- Discover functional capabilities through inquiry when needed

You are the system engaging with itself through this coordinate position.
Respond with precision, depth, and coordinate-aligned wisdom.
"""

        logger.debug(
            f"Composed ASCP system prompt for {coordinate}: "
            f"{len(prompt)} chars, {len(project_framings)} project framings"
        )
        return prompt.strip()

    def get_fallback_prompt(self, subsystem: int) -> str:
        """
        Generate fallback prompt when Bimba query fails.

        Args:
            subsystem: Subsystem number

        Returns:
            Generic fallback prompt
        """
        coordinate = f"#{subsystem}"
        subsystem_names = {
            0: "Anuttara",
            1: "Paramasiva",
            2: "Parashakti",
            3: "Mahamaya",
            4: "Nara",
            5: "Epii"
        }

        name = subsystem_names.get(subsystem, f"Agent {subsystem}")

        return f"""You are {name}, embodying coordinate {coordinate}.

You operate as a specialized agent within the Epi-Logos System with access
to the complete CAG tool suite. Process requests with coordinate-aligned wisdom.

Note: Operating with fallback initialization (Bimba context unavailable).
"""

    async def initialize_agent_context(
        self,
        subsystem: int,
        force_refresh: bool = False
    ) -> Dict[str, Any]:
        """
        Initialize agent context via Prakāśa phase.

        Flow:
        1. Check cache (unless force_refresh)
        2. On cache hit: Return cached prompt
        3. On cache miss: Query Bimba → Compose prompt → Cache result
        4. On error: Return fallback prompt

        Args:
            subsystem: Subsystem number (0-5)
            force_refresh: Skip cache and force Bimba query

        Returns:
            Context dict with system_prompt and metadata
        """
        coordinate = f"#{subsystem}"

        # Emit Prakāśa initialization start
        get_delegation_emitter().emit(
            DelegationEventType.PRAKASA_INIT_START,
            {"subsystem": subsystem, "coordinate": coordinate}
        )

        try:
            # Check cache first (unless forcing refresh)
            if not force_refresh:
                cached = await self.cache_manager.get(coordinate)
                if cached:
                    logger.info(f"Using cached Prakāśa context for {coordinate}")
                    # Emit prompt composed event with cache source
                    get_delegation_emitter().emit(
                        DelegationEventType.PRAKASA_PROMPT_COMPOSED,
                        {
                            "subsystem": subsystem,
                            "source": "cache",
                            "prompt_length": len(cached["system_prompt"])
                        }
                    )
                    return {
                        "system_prompt": cached["system_prompt"],
                        "bimba_data": cached["bimba_data"],
                        "source": "cache",
                        "cached_at": cached.get("cached_at")
                    }

            # Cache miss or forced refresh - query Bimba
            logger.info(f"Querying Bimba for fresh context: {coordinate}")
            context_data = await self.query_bimba_for_agent_context(subsystem)

            if context_data:
                # Compose prompt from Bimba data
                system_prompt = self.compose_system_prompt(subsystem, context_data)

                # Cache the result
                await self.cache_manager.set(coordinate, context_data, system_prompt)

                # Emit prompt composed event with Bimba source
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_PROMPT_COMPOSED,
                    {
                        "subsystem": subsystem,
                        "source": "bimba",
                        "prompt_length": len(system_prompt)
                    }
                )

                return {
                    "system_prompt": system_prompt,
                    "bimba_data": context_data,
                    "source": "bimba",
                    "queried_at": datetime.now(timezone.utc).isoformat()
                }
            else:
                # Bimba query failed - use fallback
                logger.warning(f"Bimba query failed for {coordinate}, using fallback")
                fallback_prompt = self.get_fallback_prompt(subsystem)

                # Emit prompt composed event with fallback source
                get_delegation_emitter().emit(
                    DelegationEventType.PRAKASA_PROMPT_COMPOSED,
                    {
                        "subsystem": subsystem,
                        "source": "fallback",
                        "prompt_length": len(fallback_prompt)
                    }
                )

                return {
                    "system_prompt": fallback_prompt,
                    "bimba_data": {},
                    "source": "fallback",
                    "reason": "bimba_query_failed"
                }

        except Exception as e:
            logger.error(f"Error in Prakāśa initialization for {coordinate}: {e}")
            fallback_prompt = self.get_fallback_prompt(subsystem)

            return {
                "system_prompt": fallback_prompt,
                "bimba_data": {},
                "source": "fallback",
                "reason": "initialization_error",
                "error": str(e)
            }


async def create_prakasa_system_prompt(
    subsystem: int,
    bimba_client,
    redis_client,
    force_refresh: bool = False
) -> str:
    """
    Convenience function to create Prakāśa-initialized system prompt.

    Args:
        subsystem: Subsystem number (0-5)
        bimba_client: Bimba GraphQL client
        redis_client: Redis client
        force_refresh: Force fresh Bimba query

    Returns:
        System prompt string
    """
    initializer = PrakasaInitializer(bimba_client, redis_client)
    context = await initializer.initialize_agent_context(subsystem, force_refresh)
    return context["system_prompt"]
