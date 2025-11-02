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
import json
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
        logger.info(f"🔍 [PRAKASA] get_identity_prakasa({agent_coordinate}, force_regenerate={force_regenerate})")

        if not force_regenerate:
            # Tier 1: Check Redis cache
            logger.debug(f"🔍 [PRAKASA] Tier 1: Checking Redis cache for {agent_coordinate}...")
            cached = await self.cache.get(agent_coordinate)
            if cached:
                logger.info(f"✅ [PRAKASA] SOURCE: Redis cache hit for {agent_coordinate} ({len(cached)} chars)")
                return cached
            else:
                logger.debug(f"⚠️ [PRAKASA] Tier 1: Cache miss")

            # Tier 2: Check agent node storage
            logger.debug(f"🔍 [PRAKASA] Tier 2: Checking Neo4j f_system_prompt for {agent_coordinate}...")
            stored = await self.agent_nodes.get_system_prompt(agent_coordinate)
            if stored:
                content = stored.get('content')
                metadata = stored.get('metadata', {})

                # Check if still valid (subsystem unchanged since generation)
                if self._is_still_valid(agent_coordinate, metadata):
                    logger.info(
                        f"✅ [PRAKASA] SOURCE: Neo4j f_system_prompt for {agent_coordinate} "
                        f"({len(content)} chars, last_updated: {metadata.get('last_updated')})"
                    )
                    # Update cache
                    await self.cache.set(agent_coordinate, content)
                    logger.debug(f"📝 [PRAKASA] Cached prompt to Redis for future use")
                    return content
                else:
                    logger.warning(
                        f"⚠️ [PRAKASA] Tier 2: Stored prompt for {agent_coordinate} is stale "
                        f"(last updated: {metadata.get('last_updated')}), regenerating..."
                    )
            else:
                logger.debug(f"⚠️ [PRAKASA] Tier 2: No f_system_prompt found in Neo4j")

        else:
            logger.info(f"⚠️ [PRAKASA] Force regenerate requested, skipping cache and storage tiers")

        # Tier 3: Generate fresh prompt
        logger.info(f"🔧 [PRAKASA] Tier 3: Generating fresh identity Prakāśa for {agent_coordinate}...")
        generated = await self.generate_identity_prakasa(agent_coordinate)
        logger.info(f"✅ [PRAKASA] SOURCE: Generated fresh from subsystem properties ({len(generated)} chars)")
        return generated

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
        current_stage: Optional[str] = None,
        **workflow_params
    ) -> str:
        """
        Prakāśa Layer 2: Workflow illumination (what mode am I in?) - OPTIONAL.

        NEW (Phase 4): Staged, selective loading of workflow components.
        - Loads workflow header (overview, cyclic nature, domain)
        - Loads ONLY capabilities/protocols referenced by workflow (FULL details)
        - Loads ONLY current stage guidance (not all stages)
        - Loads backend awareness if applicable

        Legacy support: Falls back to old versioned EA workflow if new properties not found.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            workflow_name: Workflow to engage (e.g., "etymological_archaeology")
            current_stage: Current stage identifier (e.g., "stage_0", "stage_1")
            **workflow_params: Parameters for template-based workflows (legacy)

        Returns:
            Workflow-specific prompt (Layer 2) or empty if workflow not defined
        """
        logger.info(
            f"🔍 [PRAKASA_WORKFLOW] Engaging workflow '{workflow_name}' "
            f"for {agent_coordinate}"
            + (f" at {current_stage}" if current_stage else "")
        )

        # Try new staged loading approach first
        logger.debug("🔍 [PRAKASA_WORKFLOW] Attempting staged workflow header load...")
        header = await self._load_workflow_header(agent_coordinate, workflow_name)

        if header:
            # NEW APPROACH: Staged, selective loading
            logger.info(f"✅ [PRAKASA_WORKFLOW] SOURCE: Staged workflow properties from Neo4j")

            # Load capabilities referenced by workflow
            capability_names = header.get('uses_capabilities', [])
            capabilities = await self._load_capabilities(
                agent_coordinate, capability_names
            ) if capability_names else {}
            if capabilities:
                logger.info(f"✅ [PRAKASA_WORKFLOW] Loaded {len(capabilities)} capabilities")

            # Load protocols referenced by workflow
            protocol_names = header.get('uses_protocols', [])
            protocols = await self._load_protocols(
                agent_coordinate, protocol_names
            ) if protocol_names else {}
            if protocols:
                logger.info(f"✅ [PRAKASA_WORKFLOW] Loaded {len(protocols)} protocols")

            # Load current stage if specified
            stage = await self._load_workflow_stage(
                agent_coordinate, workflow_name, current_stage
            ) if current_stage else {}
            if stage:
                logger.info(f"✅ [PRAKASA_WORKFLOW] Loaded stage: {stage.get('name', current_stage)}")

            # Load backend awareness
            backend = await self._load_backend_awareness(
                agent_coordinate, workflow_name
            )
            if backend:
                logger.info(f"✅ [PRAKASA_WORKFLOW] Loaded backend awareness ({len(backend)} properties)")

            # Compose Layer 2
            layer_2 = self._compose_workflow_layer(
                workflow_name=workflow_name,
                header=header,
                capabilities=capabilities,
                protocols=protocols,
                stage=stage,
                backend=backend
            )

            logger.info(
                f"✅ [PRAKASA_WORKFLOW] Workflow Layer 2 composed: {len(layer_2)} chars"
            )
            return layer_2

        # LEGACY FALLBACK: Try old versioned EA workflow
        logger.debug("⚠️ [PRAKASA_WORKFLOW] Staged header not found, trying legacy versioned EA workflow...")

        if workflow_name == "etymological_archaeology":
            ea_prompt = await self._get_ea_workflow_prompt(agent_coordinate)
            if ea_prompt:
                logger.info(
                    f"✅ [PRAKASA_WORKFLOW] SOURCE: Legacy versioned EA workflow from Neo4j "
                    f"({len(ea_prompt)} chars)"
                )
                return ea_prompt
            else:
                logger.debug("⚠️ [PRAKASA_WORKFLOW] No legacy versioned EA workflow found")

        # LEGACY FALLBACK: Try old template-based workflow
        logger.debug("⚠️ [PRAKASA_WORKFLOW] Trying legacy template-based workflow...")
        workflow_prompts = await self.agent_nodes.get_workflow_prompts(agent_coordinate)

        if workflow_name in workflow_prompts:
            template = workflow_prompts[workflow_name].get('template', '')
            if template:
                try:
                    workflow_prompt = template.format(**workflow_params)
                    logger.info(
                        f"✅ [PRAKASA_WORKFLOW] SOURCE: Legacy template workflow "
                        f"({len(workflow_prompt)} chars)"
                    )
                    return workflow_prompt
                except KeyError as e:
                    logger.error(
                        f"❌ [PRAKASA_WORKFLOW] Missing required parameter for workflow '{workflow_name}': {e}"
                    )

        # No workflow found
        logger.warning(
            f"❌ [PRAKASA_WORKFLOW] Workflow '{workflow_name}' not found for {agent_coordinate}. "
            f"Returning empty (no workflow layer)."
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

    def _format_project_context(self, root_props: Dict[str, Any]) -> str:
        """
        Format # root properties as project context (Layer 1b).

        Include key properties like name, description, core concepts.
        Exclude subsystem-specific properties (those go in Layer 3a).

        Args:
            root_props: All properties from # root node

        Returns:
            Formatted project context string
        """
        lines = []

        # Include general project properties only
        general_keys = [
            "name", "description", "primaryDesignation", "coreNature",
            "architecturalFunction", "operationalEssence"
        ]

        for key in general_keys:
            if key in root_props and root_props[key]:
                value = root_props[key]
                # Truncate long values
                if isinstance(value, str) and len(value) > 500:
                    value = value[:497] + "..."
                lines.append(f"**{key}**: {value}\n")

        return "\n".join(lines)

    def _format_subsystem_framing(self, framing_props: Dict[str, str]) -> str:
        """
        Format subsystem-specific framing properties (Layer 3a).

        Args:
            framing_props: Filtered {subsystem}_* properties from # root

        Returns:
            Formatted subsystem perspective string
        """
        lines = []

        for key, value in framing_props.items():
            # Remove subsystem prefix for cleaner display
            # e.g., "epii_philosophical_foundation" → "Philosophical Foundation"
            display_key = key.split("_", 1)[1].replace("_", " ").title()

            # Truncate long values
            if isinstance(value, str) and len(value) > 500:
                value = value[:497] + "..."

            lines.append(f"**{display_key}**: {value}\n")

        return "\n".join(lines)

    async def load_workflow_prompt(
        self,
        agent_coordinate: str,
        workflow_name: str
    ) -> Optional[str]:
        """
        Load a specific workflow prompt from agent node.

        Simplified method for loading raw workflow prompts without
        template parameter substitution. Use for workflows that
        are complete prompts (not templates).

        Query pattern: f_workflow_{workflow_name} property from agent node.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4", "#5-4.5")
            workflow_name: Workflow name (e.g., "wisdom_packet_synthesis")

        Returns:
            Raw workflow prompt string or None if not found

        Example:
            >>> manager = PrakasaManager(bimba_client, redis_client)
            >>> prompt = await manager.load_workflow_prompt("#5-4", "wisdom_packet_synthesis")
        """
        logger.debug(
            f"Loading workflow prompt '{workflow_name}' for {agent_coordinate}"
        )

        property_name = f"f_workflow_{workflow_name}"

        try:
            # Get all properties from agent node (include functional properties)
            node_data = await self.bimba_client.get_node_details_complete(
                agent_coordinate,
                includeFunctionalProperties=True
            )
            all_props = node_data.get('allProperties', {})

            workflow_prompt = all_props.get(property_name)

            if not workflow_prompt:
                logger.warning(
                    f"Workflow '{workflow_name}' not found for {agent_coordinate}. "
                    f"Property '{property_name}' does not exist."
                )
                return None

            logger.info(
                f"Loaded workflow '{workflow_name}' for {agent_coordinate} "
                f"({len(workflow_prompt)} chars)"
            )
            return workflow_prompt

        except Exception as e:
            logger.error(
                f"Error loading workflow '{workflow_name}' for {agent_coordinate}: {e}"
            )
            return None

    async def _get_ea_workflow_prompt(
        self,
        agent_coordinate: str
    ) -> Optional[str]:
        """
        Get active Etymology Archaeology workflow prompt.

        Queries f_workflow_etymology_archaeology_{active_version} from agent node.

        Story 08.07 Enhancement - EA Workflow Versioning System

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Active EA workflow prompt or None if not found
        """
        try:
            # Get all properties from agent node
            # Include functional properties to access f_workflow_etymology_archaeology_* fields
            node_data = await self.bimba_client.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )
            all_props = node_data.get('allProperties', {})

            # Get active version pointer
            active_version = all_props.get('f_workflow_etymology_archaeology_active')

            if not active_version:
                logger.debug(
                    f"No active EA workflow version set for {agent_coordinate}"
                )
                return None

            # Get prompt for active version
            prompt_key = f"f_workflow_etymology_archaeology_{active_version}"
            prompt = all_props.get(prompt_key)

            if not prompt:
                logger.warning(
                    f"Active EA version '{active_version}' pointer found but "
                    f"property '{prompt_key}' missing at {agent_coordinate}"
                )
                return None

            logger.debug(
                f"Retrieved EA workflow prompt (version {active_version}) "
                f"for {agent_coordinate}: {len(prompt)} chars"
            )
            return prompt

        except Exception as e:
            logger.error(
                f"Error retrieving EA workflow prompt for {agent_coordinate}: {e}"
            )
            return None

    # ========== PHASE 4: NEW LAYERED PROMPT COMPOSITION METHODS ==========

    async def get_ql_foundation(self) -> str:
        """
        Load QL Foundation (Layer 1a) from #1-4.f_agent_prompt.

        This is universal for all agents and provides the core Quaternal Logic
        cognitive architecture (6-position chain of circulation).

        Returns:
            QL cognitive architecture prompt string
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                "#1-4",
                include_functional_properties=True
            )

            if not result or result.get("success") is False:
                logger.warning("Failed to load QL foundation from #1-4")
                return ""

            props = result.get("allProperties", {})
            ql_prompt = props.get("f_agent_prompt", "")

            if ql_prompt:
                logger.debug(f"Loaded QL foundation ({len(ql_prompt)} chars)")
                return ql_prompt
            else:
                logger.warning("No f_agent_prompt found on #1-4 node")
                return ""

        except Exception as e:
            logger.error(f"Error loading QL foundation: {e}")
            return ""

    async def get_system_prompt(self) -> str:
        """
        Load Orchestrator System Prompt (Layer 1c) from #5-4.f_system_prompt.

        This is agent-agnostic operational grounding for ALL agents,
        providing CAG paradigm, three-namespace architecture, and operational principles.

        Returns:
            System prompt string
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                "#5-4",
                include_functional_properties=True
            )

            if not result or result.get("success") is False:
                logger.warning("Failed to load system prompt from #5-4")
                return ""

            props = result.get("allProperties", {})
            system_prompt = props.get("f_system_prompt", "")

            if system_prompt:
                logger.debug(f"Loaded system prompt ({len(system_prompt)} chars)")
                return system_prompt
            else:
                logger.warning("No f_system_prompt found on #5-4 node")
                return ""

        except Exception as e:
            logger.error(f"Error loading system prompt: {e}")
            return ""

    async def get_agent_character(self, agent_coordinate: str) -> str:
        """
        Load agent character property dynamically based on subsystem.

        Queries f_{subsystem}_character property from agent node.
        Example: For Epii (#5-4.5), loads f_epii_character.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Agent character prompt string or empty if not found
        """
        subsystem = self._extract_subsystem(agent_coordinate)
        subsystem_name = SUBSYSTEM_NAMES.get(subsystem)

        if not subsystem_name:
            logger.warning(f"Unknown subsystem {subsystem} for {agent_coordinate}")
            return ""

        character_property = f"f_{subsystem_name}_character"

        try:
            result = await self.bimba_client.get_node_details_complete(
                agent_coordinate,
                include_functional_properties=True
            )

            if not result or result.get("success") is False:
                logger.debug(f"Failed to load character for {agent_coordinate}")
                return ""

            props = result.get("allProperties", {})
            character_prompt = props.get(character_property, "")

            if character_prompt:
                logger.debug(
                    f"Loaded {character_property} for {agent_coordinate} "
                    f"({len(character_prompt)} chars)"
                )
                return character_prompt
            else:
                logger.debug(
                    f"No {character_property} found on {agent_coordinate} (optional)"
                )
                return ""

        except Exception as e:
            logger.error(f"Error loading character for {agent_coordinate}: {e}")
            return ""

    async def compose_identity_layers(self, agent_coordinate: str) -> str:
        """
        Compose Layer 1 only (1a-1e) for static system_prompt.

        This is cached and doesn't change per message.
        Layers 2-3 load dynamically via runtime context.

        Layer 1 Structure:
        - 1a: QL Foundation (#1-4.f_agent_prompt) - universal
        - 1b: Project Context (# root general properties) - universal
        - 1c: System Prompt (#5-4.f_system_prompt) - agent-agnostic
        - 1d: Agent Identity (agent-specific f_agent_prompt + optional f_{subsystem}_character)
        - 1e: Agent Capabilities (f_*_capability_* - runtime fetch, currently skipped)

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Composed Layer 1 (1a + 1b + 1c + 1d + optionally 1e)
        """
        layers = []

        # Layer 1a: QL Foundation
        ql = await self.get_ql_foundation()
        if ql:
            layers.append(f"# Layer 1a: QL Foundation\n\n{ql}")

        # Layer 1b: Project Context (full # root node - general properties only)
        root_data = await self.bimba_client.get_node_by_coordinate_extended("#")
        if root_data and root_data.get("success") is not False:
            project_ctx = self._format_project_context(root_data.get("allProperties", {}))
            if project_ctx:
                layers.append(f"# Layer 1b: Project Context\n\n{project_ctx}")

        # Layer 1c: System Prompt
        system = await self.get_system_prompt()
        if system:
            layers.append(f"# Layer 1c: System Prompt\n\n{system}")

        # Layer 1d: Agent Identity (f_agent_prompt + optional character)
        agent_id = await self.agent_nodes.get_agent_prompt(agent_coordinate)
        agent_char = await self.get_agent_character(agent_coordinate)

        if agent_id or agent_char:
            identity_parts = []
            if agent_id:
                identity_parts.append(agent_id)
            if agent_char:
                identity_parts.append(agent_char)
            combined_identity = "\n\n---\n\n".join(identity_parts)
            layers.append(f"# Layer 1d: Agent Identity\n\n{combined_identity}")

        # Layer 1e: Capabilities (REFERENCES ONLY - full details load with workflow)
        capability_refs = await self._get_capability_references(agent_coordinate)
        if capability_refs:
            layers.append(f"# Layer 1e: Operational Capabilities\n\n{capability_refs}")

        composed = "\n\n---\n\n".join(layers)

        logger.info(
            f"Composed Layer 1 identity for {agent_coordinate}: "
            f"{len(layers)} sublayers, {len(composed)} chars"
        )

        return composed

    async def get_subsystem_perspective(self, agent_coordinate: str) -> str:
        """
        Get subsystem perspective (Layer 3a) - filtered {subsystem}_* properties.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Formatted subsystem perspective string
        """
        subsystem = self._extract_subsystem(agent_coordinate)
        subsystem_name = SUBSYSTEM_NAMES.get(subsystem)

        root_data = await self.bimba_client.get_node_by_coordinate_extended("#")
        if not root_data or root_data.get("success") is False:
            return ""

        root_props = root_data.get("allProperties", {})
        framing = self._filter_subsystem_framings(root_props, subsystem_name)

        if framing:
            return self._format_subsystem_framing(framing)

        return ""

    # ========== WORKFLOW LOADING METHODS (STAGED, SELECTIVE) ==========

    async def _get_capability_references(self, agent_coordinate: str) -> str:
        """
        Get capability REFERENCES only (names + brief descriptions).

        Lists available capabilities WITHOUT full details (those load with workflow).
        Keeps Layer 1e lean - full capability details appear in Layer 2 when needed.

        Args:
            agent_coordinate: Agent coordinate

        Returns:
            Formatted capability references string
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )
            props = result.get('allProperties', {})

            # Find all capability descriptions (lean property)
            capabilities = {}
            for key, value in props.items():
                if key.startswith('f_capability_') and key.endswith('_description'):
                    # Extract capability name
                    cap_name = key.replace('f_capability_', '').replace('_description', '')
                    capabilities[cap_name] = value

            if not capabilities:
                return ""

            # Format as lean list
            lines = ["You have the following capabilities available:"]
            for cap_name, description in capabilities.items():
                display_name = cap_name.replace('_', ' ').title()
                # Truncate description to ~100 chars for lean reference
                brief_desc = description[:100] + "..." if len(description) > 100 else description
                lines.append(f"- **{display_name}**: {brief_desc}")

            lines.append("\n*Full capability details load when workflows reference them.*")

            return "\n".join(lines)

        except Exception as e:
            logger.error(f"Error getting capability references: {e}")
            return ""

    async def _load_workflow_header(
        self,
        agent_coordinate: str,
        workflow_name: str
    ) -> Dict[str, Any]:
        """
        Load workflow header properties (overview, cyclic nature, domain, etc).

        Pattern: f_workflow_{name}_{aspect}
        Aspects: version, description, cyclic_nature, agent_domain,
                 backend_processes, uses_capabilities, uses_protocols

        Args:
            agent_coordinate: Agent coordinate
            workflow_name: Workflow name (e.g., "etymological_archaeology")

        Returns:
            Dict of header properties
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )
            props = result.get('allProperties', {})

            prefix = f"f_workflow_{workflow_name}_"
            header_aspects = [
                'version', 'description', 'cyclic_nature', 'agent_domain',
                'ql_contextFrame', 'backend_processes', 'uses_capabilities', 'uses_protocols'
            ]

            header = {}
            for aspect in header_aspects:
                key = f"{prefix}{aspect}"
                if key in props:
                    value = props[key]
                    # Parse JSON arrays if present
                    if aspect in ['uses_capabilities', 'uses_protocols']:
                        if isinstance(value, str):
                            try:
                                value = json.loads(value)
                            except json.JSONDecodeError:
                                logger.warning(f"Failed to parse JSON for {key}")
                                value = []
                    header[aspect] = value

            logger.debug(
                f"Loaded workflow header for {workflow_name}: "
                f"{len(header)} properties"
            )
            return header

        except Exception as e:
            logger.error(f"Error loading workflow header for {workflow_name}: {e}")
            return {}

    async def _load_capabilities(
        self,
        agent_coordinate: str,
        capability_names: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Load FULL details for referenced capabilities.

        For each capability in list, load ALL f_capability_{name}_* properties.

        Args:
            agent_coordinate: Agent coordinate
            capability_names: List of capability names (with or without f_capability_ prefix)

        Returns:
            Dict mapping capability name to all its properties
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )
            props = result.get('allProperties', {})

            capabilities = {}
            for cap_name in capability_names:
                # Remove f_capability_ prefix if present
                clean_name = cap_name.replace('f_capability_', '')
                prefix = f"f_capability_{clean_name}_"

                # Gather all properties for this capability
                cap_props = {}
                for key, value in props.items():
                    if key.startswith(prefix):
                        aspect = key.replace(prefix, '')
                        # Parse JSON if present
                        if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                            try:
                                value = json.loads(value)
                            except json.JSONDecodeError:
                                pass  # Keep as string
                        cap_props[aspect] = value

                if cap_props:
                    capabilities[clean_name] = cap_props
                    logger.debug(
                        f"Loaded capability {clean_name}: {len(cap_props)} properties"
                    )

            return capabilities

        except Exception as e:
            logger.error(f"Error loading capabilities: {e}")
            return {}

    async def _load_protocols(
        self,
        agent_coordinate: str,
        protocol_names: List[str]
    ) -> Dict[str, Dict[str, Any]]:
        """
        Load FULL details for referenced protocols.

        For each protocol in list, load ALL f_protocol_{name}_* properties.

        Args:
            agent_coordinate: Agent coordinate
            protocol_names: List of protocol names (with or without f_protocol_ prefix)

        Returns:
            Dict mapping protocol name to all its properties
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )
            props = result.get('allProperties', {})

            protocols = {}
            for prot_name in protocol_names:
                # Remove f_protocol_ prefix if present
                clean_name = prot_name.replace('f_protocol_', '')
                prefix = f"f_protocol_{clean_name}_"

                # Gather all properties for this protocol
                prot_props = {}
                for key, value in props.items():
                    if key.startswith(prefix):
                        aspect = key.replace(prefix, '')
                        # Parse JSON if present
                        if isinstance(value, str) and (value.startswith('{') or value.startswith('[')):
                            try:
                                value = json.loads(value)
                            except json.JSONDecodeError:
                                pass  # Keep as string
                        prot_props[aspect] = value

                if prot_props:
                    protocols[clean_name] = prot_props
                    logger.debug(
                        f"Loaded protocol {clean_name}: {len(prot_props)} properties"
                    )

            return protocols

        except Exception as e:
            logger.error(f"Error loading protocols: {e}")
            return {}

    async def _load_workflow_stage(
        self,
        agent_coordinate: str,
        workflow_name: str,
        stage_name: str
    ) -> Dict[str, Any]:
        """
        Load specific stage properties.

        Pattern: f_workflow_{workflow_name}_stage_{N}_{aspect}
        Aspects: name, description, agent_activities, agent_guidance,
                 conversational_style, tools, outputs, transitions_to, etc.

        Args:
            agent_coordinate: Agent coordinate
            workflow_name: Workflow name
            stage_name: Stage identifier (e.g., "stage_0", "stage_1", "0", "1")

        Returns:
            Dict of stage properties
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )
            props = result.get('allProperties', {})

            # Extract stage number (handle "stage_1" or "1" formats)
            if stage_name.startswith('stage_'):
                stage_num = stage_name.replace('stage_', '').split('_')[0]
            else:
                stage_num = stage_name

            prefix = f"f_workflow_{workflow_name}_stage_{stage_num}_"

            # All possible stage aspects from etymological archaeology example
            stage_aspects = [
                'name', 'description', 'agent_activities', 'agent_guidance',
                'conversational_style', 'tools', 'outputs', 'transitions_to',
                'ongoing_nature', 'scent_following_integration',
                'watching_for_patterns', 'iterative_nature', 'ql_principles',
                'no_bimba_yet', 'triggers_backend'
            ]

            stage = {}
            for aspect in stage_aspects:
                key = f"{prefix}{aspect}"
                if key in props:
                    value = props[key]
                    # Parse JSON arrays
                    if aspect == 'tools' and isinstance(value, str):
                        try:
                            value = json.loads(value)
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to parse JSON for {key}")
                    stage[aspect] = value

            if stage:
                logger.debug(
                    f"Loaded stage {stage_num} for {workflow_name}: "
                    f"{len(stage)} properties"
                )

            return stage

        except Exception as e:
            logger.error(
                f"Error loading stage {stage_name} for {workflow_name}: {e}"
            )
            return {}

    async def _load_backend_awareness(
        self,
        agent_coordinate: str,
        workflow_name: str
    ) -> Dict[str, str]:
        """
        Load backend process awareness properties.

        For workflows with backend stages (3-5), load awareness properties:
        - stages_3_5_description
        - querying_backend
        - cyclic_return
        - stage_3_backend, stage_4_backend, stage_5_backend (optional)

        Args:
            agent_coordinate: Agent coordinate
            workflow_name: Workflow name

        Returns:
            Dict of backend awareness properties
        """
        try:
            result = await self.bimba_client.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )
            props = result.get('allProperties', {})

            prefix = f"f_workflow_{workflow_name}_"
            backend_keys = [
                'stages_3_5_description',
                'querying_backend',
                'cyclic_return',
                'stage_3_backend',
                'stage_4_backend',
                'stage_5_backend'
            ]

            backend = {}
            for key in backend_keys:
                full_key = f"{prefix}{key}"
                if full_key in props:
                    backend[key] = props[full_key]

            if backend:
                logger.debug(
                    f"Loaded backend awareness for {workflow_name}: "
                    f"{len(backend)} properties"
                )

            return backend

        except Exception as e:
            logger.error(f"Error loading backend awareness for {workflow_name}: {e}")
            return {}

    def _compose_workflow_layer(
        self,
        workflow_name: str,
        header: Dict[str, Any],
        capabilities: Dict[str, Dict[str, Any]],
        protocols: Dict[str, Dict[str, Any]],
        stage: Dict[str, Any],
        backend: Dict[str, str]
    ) -> str:
        """
        Compose complete Layer 2 (Workflow Engagement) from loaded components.

        Args:
            workflow_name: Workflow name for header
            header: Workflow header properties
            capabilities: Full capability details
            protocols: Full protocol details
            stage: Current stage properties
            backend: Backend awareness properties

        Returns:
            Formatted Layer 2 prompt
        """
        sections = []

        # Workflow Header
        sections.append(f"# Workflow: {workflow_name.replace('_', ' ').title()}")

        if 'version' in header:
            sections.append(f"**Version**: {header['version']}")

        if 'description' in header:
            sections.append(f"\n## Overview\n{header['description']}")

        if 'cyclic_nature' in header:
            sections.append(f"\n## Cyclic Nature\n{header['cyclic_nature']}")

        if 'agent_domain' in header:
            sections.append(f"\n## Your Domain\n{header['agent_domain']}")

        if 'ql_contextFrame' in header:
            sections.append(f"\n## QL Context Frame\n{header['ql_contextFrame']}")

        if 'backend_processes' in header:
            sections.append(f"\n## Backend Processes\n{header['backend_processes']}")

        # Active Capabilities (FULL DETAILS)
        if capabilities:
            sections.append("\n## Active Capabilities")
            for cap_name, cap_props in capabilities.items():
                sections.append(f"\n### {cap_name.replace('_', ' ').title()}")
                for aspect, value in cap_props.items():
                    label = aspect.replace('_', ' ').title()
                    # Format JSON nicely
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value, indent=2)
                    sections.append(f"\n**{label}**: {value}")

        # Active Protocols (FULL DETAILS)
        if protocols:
            sections.append("\n## Active Protocols")
            for prot_name, prot_props in protocols.items():
                sections.append(f"\n### {prot_name.replace('_', ' ').title()}")
                for aspect, value in prot_props.items():
                    label = aspect.replace('_', ' ').title()
                    if isinstance(value, (dict, list)):
                        value = json.dumps(value, indent=2)
                    sections.append(f"\n**{label}**: {value}")

        # Current Stage Guidance
        if stage:
            stage_name = stage.get('name', 'Current Stage')
            sections.append(f"\n## Current Stage: {stage_name}")

            if 'description' in stage:
                sections.append(f"\n{stage['description']}")

            if 'agent_activities' in stage:
                sections.append(f"\n### Your Activities\n{stage['agent_activities']}")

            if 'agent_guidance' in stage:
                sections.append(f"\n### Guidance\n{stage['agent_guidance']}")

            if 'conversational_style' in stage:
                sections.append(
                    f"\n### Conversational Style\n{stage['conversational_style']}"
                )

            # Additional stage-specific aspects
            for key in ['scent_following_integration', 'watching_for_patterns',
                       'iterative_nature', 'ql_principles', 'no_bimba_yet']:
                if key in stage:
                    label = key.replace('_', ' ').title()
                    sections.append(f"\n### {label}\n{stage[key]}")

            if 'tools' in stage:
                tools = stage['tools']
                if isinstance(tools, list):
                    tools = ', '.join(tools)
                sections.append(f"\n### Available Tools\n{tools}")

            if 'transitions_to' in stage:
                sections.append(f"\n### Transitions To\n{stage['transitions_to']}")

        # Backend Awareness
        if backend:
            sections.append("\n## Backend Processes (Awareness Only)")
            for key, value in backend.items():
                label = key.replace('_', ' ').title()
                sections.append(f"\n### {label}\n{value}")

        composed = "\n\n".join(sections)
        logger.debug(
            f"Composed Layer 2 for {workflow_name}: "
            f"{len(sections)} sections, {len(composed)} chars"
        )

        return composed


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
