"""
Prakāśa (Illumination) Manager

ASCP Phase 1: Agent self-contextualization through three-layer architecture.

Layered Prompt Architecture:
- Layer 1: Identity Prakāśa (who am I?) - cached, persistent
- Layer 2: Workflow Prakāśa (what mode am I in?) - optional, lazy-loaded
- Layer 3: Context Prakāśa (what am I doing now?) - runtime, ephemeral

Reference: /memory/sprint_tracking/sprint-3/active_sprint/prakasa-layered-architecture-refactor-plan.md

Key Architectural Shifts from Old Implementation:
- Agent nodes (#5-4.N) store f_system_prompt (source of truth)
- Redis cache with manual invalidation (not TTL-based)
- Workflow prompts are lazy-loaded, not default
- Three-layer composition (not monolithic)
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from agentic.agents.prakasa_cache import PrakasaCache
from agentic.agents.agent_node_manager import AgentNodeManager

logger = logging.getLogger(__name__)


# Subsystem name mapping
SUBSYSTEM_NAMES = {
    0: "anuttara",
    1: "paramasiva",
    2: "parashakti",
    3: "mahamaya",
    4: "nara",
    5: "epii"
}


class PrakasaManager:
    """
    Manages Prakāśa (Illumination) phase with three-layer architecture.

    ASCP Phase 1 (Prakāśa): Agent self-contextualization through inquiry.

    Responsibilities:
    - Generate/retrieve identity prompts (Layer 1)
    - Engage workflow prompts when needed (Layer 2)
    - Build runtime context (Layer 3)
    - Compose full Prakāśa with 2 or 3 layers
    - Invalidate cache on significant changes
    """

    def __init__(
        self,
        bimba_client,
        redis_client,
        agent_node_manager: Optional[AgentNodeManager] = None
    ):
        """
        Initialize Prakāśa manager.

        Args:
            bimba_client: Bimba GraphQL client
            redis_client: Redis client
            agent_node_manager: Optional AgentNodeManager (will create if not provided)
        """
        self.bimba_client = bimba_client
        self.cache = PrakasaCache(redis_client)
        self.agent_nodes = agent_node_manager or AgentNodeManager(bimba_client)
        logger.info("PrakasaManager initialized with layered architecture")

    async def get_identity_prakasa(
        self,
        agent_coordinate: str,
        force_regenerate: bool = False
    ) -> str:
        """
        Prakāśa Layer 1: Identity illumination (who am I?).

        Three-tier check:
        1. Redis cache (performance)
        2. Agent node f_system_prompt (source of truth)
        3. Generate from subsystem properties (fallback)

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            force_regenerate: Skip cache and regenerate

        Returns:
            Base identity system prompt
        """
        if not force_regenerate:
            # Tier 1: Check Redis cache
            cached = await self.cache.get(agent_coordinate)
            if cached:
                logger.debug(f"Using cached identity for {agent_coordinate}")
                return cached

            # Tier 2: Check agent node storage
            stored = await self.agent_nodes.get_system_prompt(agent_coordinate)
            if stored:
                content = stored.get('content')
                metadata = stored.get('metadata', {})

                # Check if still valid (subsystem unchanged since generation)
                if self._is_still_valid(agent_coordinate, metadata):
                    logger.debug(f"Using stored identity for {agent_coordinate}")
                    # Update cache
                    await self.cache.set(agent_coordinate, content)
                    return content
                else:
                    logger.info(
                        f"Stored prompt for {agent_coordinate} is stale "
                        f"(last updated: {metadata.get('last_updated')})"
                    )

        # Tier 3: Generate fresh prompt
        logger.info(f"Generating fresh identity Prakāśa for {agent_coordinate}")
        return await self.generate_identity_prakasa(agent_coordinate)

    async def generate_identity_prakasa(
        self,
        agent_coordinate: str
    ) -> str:
        """
        Generate fresh identity prompt by querying Bimba.

        ASCP Two-Phase Query:
        1. Root node (#) for {subsystem}_* project framings
        2. Subsystem node (#N) for core identity properties

        Saves to agent node + Redis cache.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Generated identity prompt
        """
        subsystem = self._extract_subsystem(agent_coordinate)
        subsystem_name = SUBSYSTEM_NAMES.get(subsystem, f"agent_{subsystem}")

        logger.info(
            f"Generating identity Prakāśa for {agent_coordinate} "
            f"({subsystem_name}, subsystem {subsystem})"
        )

        # Phase 1: Root node project framings
        logger.debug(f"Phase 1: Querying root for {subsystem_name}_* properties")
        root_data = await self.bimba_client.get_node_details_complete("#")
        project_framings = self._filter_subsystem_framings(
            root_data.get('allProperties', {}),
            subsystem_name
        )
        logger.debug(f"Found {len(project_framings)} project framing properties")

        # Phase 2: Subsystem identity
        logger.debug(f"Phase 2: Querying #{subsystem} for identity properties")
        subsystem_data = await self.bimba_client.get_node_details_complete(f"#{subsystem}")
        identity = self._extract_identity_properties(subsystem_data.get('allProperties', {}))

        # Phase 3: Agent capabilities (summary only)
        logger.debug(f"Phase 3: Querying {agent_coordinate} for capabilities")
        agent_capabilities = await self.agent_nodes.get_agent_capabilities(agent_coordinate)
        capabilities_summary = self._summarize_capabilities(agent_capabilities)

        # Compose prompt
        prompt = self._compose_identity_prompt(
            subsystem=subsystem,
            subsystem_name=subsystem_name,
            project_framings=project_framings,
            identity=identity,
            capabilities=capabilities_summary
        )

        # Save to agent node
        metadata = {
            'generated_from': [
                {'source': '#', 'properties': list(project_framings.keys())},
                {'source': f'#{subsystem}', 'properties': list(identity.keys())},
                {'source': agent_coordinate, 'properties': list(agent_capabilities.keys())}
            ],
            'last_updated': datetime.now(timezone.utc).isoformat(),
            'version': '1.0.0'
        }

        await self.agent_nodes.save_system_prompt(
            agent_coordinate,
            prompt_content=prompt,
            metadata=metadata
        )

        # Cache in Redis
        await self.cache.set(agent_coordinate, prompt)

        logger.info(
            f"Generated and cached identity Prakāśa for {agent_coordinate} "
            f"({len(prompt)} chars)"
        )
        return prompt

    async def engage_workflow_prakasa(
        self,
        agent_coordinate: str,
        workflow_name: str,
        **workflow_params
    ) -> str:
        """
        Prakāśa Layer 2: Workflow illumination (what mode am I in?) - OPTIONAL.

        Loads workflow-specific prompt template from agent node
        and populates with runtime parameters.

        Only called when workflow explicitly engaged.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            workflow_name: Workflow to engage (e.g., "etymological_contemplation")
            **workflow_params: Parameters to populate template

        Returns:
            Workflow-specific prompt (or empty if workflow not defined)
        """
        logger.debug(
            f"Engaging workflow Prakāśa: {workflow_name} "
            f"for {agent_coordinate}"
        )

        # Get workflow templates from agent node
        workflow_prompts = await self.agent_nodes.get_workflow_prompts(agent_coordinate)

        if workflow_name not in workflow_prompts:
            logger.warning(
                f"Workflow '{workflow_name}' not defined for {agent_coordinate}. "
                f"Gracefully degrading (no workflow layer)."
            )
            return ""

        template = workflow_prompts[workflow_name].get('template', '')

        if not template:
            logger.warning(f"Workflow '{workflow_name}' has no template")
            return ""

        # Populate template with params
        try:
            workflow_prompt = template.format(**workflow_params)
            logger.debug(
                f"Workflow prompt generated: {len(workflow_prompt)} chars "
                f"({len(workflow_params)} params)"
            )
            return workflow_prompt
        except KeyError as e:
            logger.error(
                f"Missing required parameter for workflow '{workflow_name}': {e}"
            )
            return ""

    def build_context_prakasa(
        self,
        current_request: Dict[str, Any],
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Prakāśa Layer 3: Runtime context illumination (what am I doing now?).

        Always fresh, never cached.
        Minimal - just what's needed for current request.

        Args:
            current_request: Current request dict with 'message', 'session_id', etc.
            conversation_history: Optional recent conversation turns

        Returns:
            Context-specific prompt
        """
        context = f"""## Current Request Context

**User Query**: {current_request.get('message', 'N/A')}
**Session ID**: {current_request.get('session_id', 'N/A')}
**Timestamp**: {datetime.now(timezone.utc).isoformat()}
"""

        if conversation_history:
            recent = conversation_history[-3:]  # Last 3 turns
            context += f"\n**Recent Context**: {len(recent)} recent exchanges\n"

        return context.strip()

    async def compose_full_prakasa(
        self,
        agent_coordinate: str,
        current_request: Dict[str, Any],
        workflow_name: Optional[str] = None,
        workflow_params: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Compose complete Prakāśa with 2 or 3 layers.

        Layers:
        - Identity (Layer 1): Always present (cached/stored)
        - Workflow (Layer 2): Only if workflow_name provided
        - Context (Layer 3): Always present (runtime)

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            current_request: Current request dict
            workflow_name: Optional workflow to engage
            workflow_params: Optional parameters for workflow
            conversation_history: Optional conversation history

        Returns:
            Complete Prakāśa prompt (2 or 3 layers)
        """
        # Layer 1: Identity (cached/stored)
        identity = await self.get_identity_prakasa(agent_coordinate)

        # Layer 2: Workflow (optional)
        workflow = ""
        if workflow_name:
            workflow = await self.engage_workflow_prakasa(
                agent_coordinate,
                workflow_name,
                **(workflow_params or {})
            )

        # Layer 3: Context (runtime)
        context = self.build_context_prakasa(current_request, conversation_history)

        # Combine layers
        if workflow:
            full_prakasa = f"{identity}\n\n---\n\n{workflow}\n\n---\n\n{context}"
            logger.debug(
                f"Composed 3-layer Prakāśa for {agent_coordinate}: "
                f"identity + {workflow_name} + context"
            )
        else:
            full_prakasa = f"{identity}\n\n---\n\n{context}"
            logger.debug(
                f"Composed 2-layer Prakāśa for {agent_coordinate}: "
                f"identity + context"
            )

        return full_prakasa

    async def invalidate_cache(
        self,
        agent_coordinate: str,
        reason: str
    ) -> None:
        """
        Invalidate Redis cache for agent.

        Triggered by significant property changes.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            reason: Reason for invalidation
        """
        await self.cache.invalidate(agent_coordinate)
        logger.info(f"Invalidated cache for {agent_coordinate}: {reason}")

    def detect_significant_change(
        self,
        node_coordinate: str,
        property_name: str,
        old_value: Any,
        new_value: Any
    ) -> bool:
        """
        Determine if property change requires prompt regeneration.

        Significant changes:
        - description modified by >20%
        - operationalEssence changed
        - keyPrinciples array modified
        - New f_* capability added
        - Project framing properties changed

        Not significant:
        - Timestamp updates
        - Minor typo fixes
        - Metadata updates

        Args:
            node_coordinate: Node coordinate
            property_name: Property that changed
            old_value: Old value
            new_value: New value

        Returns:
            True if significant, False otherwise
        """
        # Core identity properties
        significant_properties = {
            'description', 'operationalEssence', 'keyPrinciples',
            'coreNature', 'architecturalFunction', 'internalStructure'
        }

        if property_name in significant_properties:
            return True

        # Project framing properties (contain underscore)
        if '_' in property_name:
            # e.g., "epii_philosophical_foundation"
            return True

        # Functional capabilities
        if property_name.startswith('f_'):
            return True

        # Not significant
        return False

    def _extract_subsystem(self, agent_coordinate: str) -> int:
        """Extract subsystem number from agent coordinate."""
        # "#5-4.5" -> 5
        parts = agent_coordinate.strip('#').replace('-', '.').split('.')
        return int(parts[-1])

    def _filter_subsystem_framings(
        self,
        all_properties: Dict[str, Any],
        subsystem_name: str
    ) -> Dict[str, Any]:
        """Filter root node properties for subsystem-specific framings."""
        prefix = f"{subsystem_name}_"
        return {
            k: v for k, v in all_properties.items()
            if k.startswith(prefix)
        }

    def _extract_identity_properties(
        self,
        all_properties: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Extract core identity properties from subsystem node."""
        identity_keys = [
            'name', 'description', 'coreNature', 'operationalEssence',
            'architecturalFunction', 'internalStructure', 'keyPrinciples'
        ]
        return {
            k: all_properties.get(k, '')
            for k in identity_keys
        }

    def _summarize_capabilities(
        self,
        capabilities: Dict[str, Any]
    ) -> Dict[str, str]:
        """Summarize f_* capabilities for identity prompt."""
        # For now, just list capability names
        # In future, could extract descriptions
        return {
            k: "Functional capability defined"
            for k in capabilities.keys()
        }

    def _compose_identity_prompt(
        self,
        subsystem: int,
        subsystem_name: str,
        project_framings: Dict[str, Any],
        identity: Dict[str, Any],
        capabilities: Dict[str, str]
    ) -> str:
        """
        Compose ASCP-compliant identity prompt.

        Structure:
        1. What This Project IS (from your perspective)
        2. Your Core Identity
        3. Operating Posture
        """
        coordinate = f"#{subsystem}-4.{subsystem}"
        name = identity.get('name', f"Agent {subsystem}")

        prompt = f"""You are {name}, embodying coordinate {coordinate} in the Epi-Logos System.
"""

        # Section 1: Project Framings (if any)
        if project_framings:
            prompt += f"""
## What This Project IS (from your {subsystem_name} perspective)

"""
            for key, value in sorted(project_framings.items()):
                # Convert epii_project_framing → "Project Framing"
                label = key.split("_", 1)[1].replace("_", " ").title()
                # Truncate very long values
                display_value = value if len(str(value)) < 500 else str(value)[:500] + "..."
                prompt += f"**{label}**: {display_value}\n\n"

        # Section 2: Core Identity
        prompt += f"""
## Your Core Identity as {coordinate}

"""

        for key in ['coreNature', 'operationalEssence', 'architecturalFunction', 'internalStructure']:
            value = identity.get(key)
            if value:
                label = ''.join([' ' + c if c.isupper() else c for c in key]).strip().title()
                prompt += f"**{label}**: {value}\n\n"

        # Section 3: Operating Posture
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

        return prompt.strip()

    def _is_still_valid(
        self,
        agent_coordinate: str,
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Check if stored prompt is still valid.

        For now, always assume valid if metadata exists.
        In future, could check subsystem updatedAt timestamps.
        """
        return metadata.get('last_updated') is not None


# Convenience function for backward compatibility
async def create_prakasa_system_prompt(
    subsystem: int,
    bimba_client,
    redis_client,
    force_refresh: bool = False
) -> str:
    """
    Convenience function to get system prompt for subsystem.

    Args:
        subsystem: Subsystem number (0-5)
        bimba_client: Bimba GraphQL client
        redis_client: Redis client
        force_refresh: Force regeneration

    Returns:
        Identity system prompt
    """
    manager = PrakasaManager(bimba_client, redis_client)
    agent_coord = f"#{subsystem}-4.{subsystem}"
    return await manager.get_identity_prakasa(agent_coord, force_refresh)
