"""
Agent Node Manager

Manages agent node lifecycle and properties in the Bimba graph.

Agent nodes (#5-4.N) contain:
- f_agent_prompt: Agent identity prompt (Layer 1c in Prakāśa)
- f_system_prompt: Stored identity prompt with metadata (deprecated)
- f_workflow_prompts: Workflow-specific prompt templates (lazy-loaded)
- f_* capabilities: Functional capabilities for the agent

All agents are Epii manifestations (#5-4.N pattern).
#5 Epii is the agentic subsystem.

Reference: /memory/sprint_tracking/sprint-3/active_sprint/prakasa-layered-architecture-refactor-plan.md
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class AgentNodeManager:
    """
    Manages agent node lifecycle and properties.

    Agent nodes follow coordinate pattern: #5-4.N (all agents are Epii manifestations)
    - #5-4.0: Anuttara agent
    - #5-4.1: Paramasiva agent
    - #5-4.2: Parashakti agent
    - #5-4.3: Mahamaya agent
    - #5-4.4: Nara agent
    - #5-4.5: Epii agent

    Responsibilities:
    - Create agent nodes in #5-4 branch
    - Store/retrieve f_agent_prompt (Layer 1c identity prompts)
    - Store/retrieve f_workflow_* (workflow-specific prompts)
    - Manage MANIFESTS_AS relationships between subsystems and agents
    """

    # Subsystem name mapping
    SUBSYSTEM_NAMES = {
        0: "Anuttara",
        1: "Paramasiva",
        2: "Parashakti",
        3: "Mahamaya",
        4: "Nara",
        5: "Epii"
    }

    def __init__(self, bimba_client):
        """
        Initialize agent node manager.

        Args:
            bimba_client: BimbaGraphQLClient for graph operations
        """
        self.bimba = bimba_client
        logger.info("AgentNodeManager initialized")

    def get_agent_coordinate(self, subsystem: int) -> str:
        """
        Get agent coordinate for subsystem.

        ALL agents are Epii manifestations (#5-4.N pattern).
        #5 Epii is the agentic subsystem - all agents exist within it.

        Args:
            subsystem: Subsystem number (0-5)

        Returns:
            Agent coordinate (e.g., "#5-4.0" for Anuttara, "#5-4.5" for Epii)
        """
        return f"#5-4.{subsystem}"

    async def ensure_agent_node_exists(self, subsystem: int) -> str:
        """
        Create agent node if missing.

        Creates:
        - Agent node #N-4.N
        - MANIFESTS_AS relationship from subsystem to agent

        Args:
            subsystem: Subsystem number (0-5)

        Returns:
            agent_coordinate: Created or existing agent coordinate
        """
        agent_coord = self.get_agent_coordinate(subsystem)
        subsystem_name = self.SUBSYSTEM_NAMES.get(subsystem, f"Agent {subsystem}")

        # Check if exists
        try:
            result = await self.bimba.get_node_details_complete(agent_coord)
            if result and result.get("success") is not False:
                logger.debug(f"Agent node {agent_coord} already exists")
                return agent_coord
        except Exception as e:
            logger.debug(f"Agent node {agent_coord} does not exist: {e}")

        # Create agent node
        logger.info(f"Creating agent node: {agent_coord}")
        await self.bimba.create_bimba_node({
            "coordinate": agent_coord,
            "name": f"{subsystem_name} Agent",
            "subsystem": subsystem,
            "description": f"Agent instance for {subsystem_name.lower()} subsystem"
        })

        # Create relationship: subsystem MANIFESTS_AS agent
        logger.info(f"Creating MANIFESTS_AS relationship: #{subsystem} -> {agent_coord}")
        await self.bimba.create_bimba_relationship({
            "fromCoordinate": f"#{subsystem}",
            "toCoordinate": agent_coord,
            "relationshipType": "MANIFESTS_AS"
        })

        logger.info(f"Agent node created successfully: {agent_coord}")
        return agent_coord

    async def get_system_prompt(
        self,
        agent_coordinate: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get f_system_prompt from agent node.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            f_system_prompt dict with 'content' and 'metadata', or None if not found
        """
        try:
            # Include functional properties to access f_system_prompt on the agent node
            result = await self.bimba.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )

            if not result or result.get("success") is False:
                logger.warning(f"Failed to get agent node: {agent_coordinate}")
                return None

            props = result.get("allProperties", {})

            if "f_system_prompt" not in props:
                logger.debug(f"No f_system_prompt found on {agent_coordinate}")
                return None

            return props["f_system_prompt"]

        except Exception as e:
            logger.error(f"Error getting system prompt for {agent_coordinate}: {e}")
            return None

    async def save_system_prompt(
        self,
        agent_coordinate: str,
        prompt_content: str,
        metadata: Dict[str, Any]
    ) -> bool:
        """
        Save f_system_prompt to agent node.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            prompt_content: Generated system prompt text
            metadata: Metadata dict with:
                - generated_from: List of sources
                - last_updated: Timestamp
                - version: Version string

        Returns:
            True if successful, False otherwise
        """
        try:
            # Construct f_system_prompt property as JSON string (Neo4j compatibility)
            f_system_prompt_obj = {
                "content": prompt_content,
                "metadata": {
                    **metadata,
                    "last_updated": datetime.now(timezone.utc).isoformat()
                }
            }

            # Neo4j requires JSON string, not nested dict
            import json
            f_system_prompt = json.dumps(f_system_prompt_obj)

            # Update agent node with f_system_prompt
            await self.bimba.update_bimba_node(
                coordinate=agent_coordinate,
                f_system_prompt=f_system_prompt
            )

            logger.info(
                f"Saved system prompt to {agent_coordinate} "
                f"({len(prompt_content)} chars, version {metadata.get('version', 'unknown')})"
            )
            return True

        except Exception as e:
            logger.error(f"Error saving system prompt for {agent_coordinate}: {e}")
            return False

    async def get_workflow_prompts(
        self,
        agent_coordinate: str
    ) -> Dict[str, Any]:
        """
        Get f_workflow_prompts from agent node.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Dict of workflow prompts, or empty dict if not found
        """
        try:
            # Include functional properties to access f_workflow_* templates
            result = await self.bimba.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )

            if not result or result.get("success") is False:
                logger.warning(f"Failed to get agent node: {agent_coordinate}")
                return {}

            props = result.get("allProperties", {})
            workflow_prompts = props.get("f_workflow_prompts", {})

            logger.debug(
                f"Retrieved {len(workflow_prompts)} workflow prompts "
                f"from {agent_coordinate}"
            )
            return workflow_prompts

        except Exception as e:
            logger.error(f"Error getting workflow prompts for {agent_coordinate}: {e}")
            return {}

    async def save_workflow_prompts(
        self,
        agent_coordinate: str,
        workflow_prompts: Dict[str, Any]
    ) -> bool:
        """
        Save f_workflow_prompts to agent node.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")
            workflow_prompts: Dict of workflow name -> template

        Returns:
            True if successful, False otherwise
        """
        try:
            await self.bimba.update_bimba_node(
                coordinate=agent_coordinate,
                f_workflow_prompts=workflow_prompts
            )

            logger.info(
                f"Saved {len(workflow_prompts)} workflow prompts "
                f"to {agent_coordinate}"
            )
            return True

        except Exception as e:
            logger.error(f"Error saving workflow prompts for {agent_coordinate}: {e}")
            return False

    async def get_agent_prompt(self, agent_coordinate: str) -> Optional[str]:
        """
        Get f_agent_prompt from agent node.

        This is the agent identity prompt (Layer 1c in Prakāśa composition).

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Agent prompt string, or None if not found
        """
        try:
            result = await self.bimba.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )

            if not result or result.get("success") is False:
                logger.warning(f"Failed to get agent node: {agent_coordinate}")
                return None

            props = result.get("allProperties", {})
            agent_prompt = props.get("f_agent_prompt")

            if not agent_prompt:
                logger.debug(f"No f_agent_prompt found on {agent_coordinate}")
                return None

            return agent_prompt

        except Exception as e:
            logger.error(f"Error getting agent prompt for {agent_coordinate}: {e}")
            return None

    async def get_agent_capabilities(
        self,
        agent_coordinate: str
    ) -> Dict[str, Any]:
        """
        Get f_* capability properties from agent node.

        Args:
            agent_coordinate: Agent coordinate (e.g., "#5-4.5")

        Returns:
            Dict of f_* properties (excluding f_system_prompt and f_workflow_prompts)
        """
        try:
            # Include functional properties to enumerate f_* capability fields
            result = await self.bimba.get_node_details_complete(
                agent_coordinate, include_functional_properties=True
            )

            if not result or result.get("success") is False:
                return {}

            props = result.get("allProperties", {})

            # Filter for f_* properties, excluding system/workflow prompts
            capabilities = {
                k: v for k, v in props.items()
                if k.startswith("f_")
                and k not in ("f_system_prompt", "f_workflow_prompts")
            }

            logger.debug(
                f"Retrieved {len(capabilities)} capabilities "
                f"from {agent_coordinate}"
            )
            return capabilities

        except Exception as e:
            logger.error(f"Error getting capabilities for {agent_coordinate}: {e}")
            return {}
