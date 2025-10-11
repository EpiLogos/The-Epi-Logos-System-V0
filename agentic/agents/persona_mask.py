"""
Persona Mask System

Enables orchestrator to handle lightweight requests internally
by activating persona-specific behavior without external delegation.

Implements Pattern 2 (Programmatic Hand-off) for internal routing.

Story 02.24 - AC: 3 (Hybrid Router - Persona Mask)
"""

import logging
from typing import Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class PersonaMask(Enum):
    """Available persona masks for orchestrator"""
    SYSTEM = "system"
    NARA = "nara"
    EPII = "epii"
    ANUTTARA = "anuttara"
    PARAMASIVA = "paramasiva"
    PARASHAKTI = "parashakti"
    MAHAMAYA = "mahamaya"


class PersonaMaskManager:
    """
    Manages persona mask activation for lightweight request handling.

    Allows orchestrator to adopt persona-specific behavior without
    delegating to external agent.
    """

    # Persona-specific behavior hints (used in system prompts)
    PERSONA_BEHAVIORS = {
        PersonaMask.SYSTEM: {
            "tone": "neutral",
            "focus": "general assistance",
            "tool_preference": "balanced"
        },
        PersonaMask.NARA: {
            "tone": "warm and empathetic",
            "focus": "dialogical interaction",
            "tool_preference": "coordinate resolution, episodic memory"
        },
        PersonaMask.EPII: {
            "tone": "synthesizing and orchestrating",
            "focus": "pattern recognition and integration",
            "tool_preference": "gnostic search, coordinate analysis"
        },
        PersonaMask.ANUTTARA: {
            "tone": "foundational and grounding",
            "focus": "proto-logical processing",
            "tool_preference": "core coordinate resolution"
        },
        PersonaMask.PARAMASIVA: {
            "tone": "logical and structural",
            "focus": "quaternal logic processing",
            "tool_preference": "relationship analysis"
        },
        PersonaMask.PARASHAKTI: {
            "tone": "vibrational and dynamic",
            "focus": "vibrational-epistemic processing",
            "tool_preference": "semantic discovery"
        },
        PersonaMask.MAHAMAYA: {
            "tone": "symbolic and transcriptive",
            "focus": "symbolic-alchemical processing",
            "tool_preference": "coordinate transformation"
        }
    }

    def __init__(self, current_persona: str = "system"):
        """
        Initialize persona mask manager.

        Args:
            current_persona: Initial persona (default: system)
        """
        self.current_mask = PersonaMask(current_persona.lower())
        logger.info(f"PersonaMaskManager initialized with mask: {self.current_mask.value}")

    def activate_mask(self, persona: str) -> PersonaMask:
        """
        Activate specific persona mask.

        Args:
            persona: Persona identifier

        Returns:
            Activated PersonaMask
        """
        try:
            self.current_mask = PersonaMask(persona.lower())
            logger.info(f"Activated persona mask: {self.current_mask.value}")
            return self.current_mask
        except ValueError:
            logger.warning(f"Invalid persona: {persona}, defaulting to SYSTEM")
            self.current_mask = PersonaMask.SYSTEM
            return self.current_mask

    def get_current_mask(self) -> PersonaMask:
        """Get currently active persona mask"""
        return self.current_mask

    def get_behavior_hints(self, persona: Optional[PersonaMask] = None) -> Dict[str, str]:
        """
        Get behavior hints for persona.

        Args:
            persona: Optional persona (uses current if not specified)

        Returns:
            Behavior hints dict
        """
        target = persona or self.current_mask
        return self.PERSONA_BEHAVIORS.get(target, self.PERSONA_BEHAVIORS[PersonaMask.SYSTEM])

    def should_use_mask(self, complexity: str, request_type: str) -> bool:
        """
        Determine if persona mask should be used (vs. delegation).

        Args:
            complexity: Request complexity (lightweight/heavyweight)
            request_type: Request type

        Returns:
            True if should use persona mask, False for delegation
        """
        # Use mask for lightweight requests
        if complexity == "lightweight":
            return True

        # Delegate heavyweight requests
        return False

    def get_mask_instructions(self, persona: Optional[PersonaMask] = None) -> str:
        """
        Get persona-specific instructions for system prompt.

        Args:
            persona: Optional persona (uses current if not specified)

        Returns:
            Persona-specific instruction string
        """
        target = persona or self.current_mask
        hints = self.get_behavior_hints(target)

        instructions = f"""
        Persona Mask Active: {target.value.upper()}

        Behavioral Guidance:
        - Tone: {hints['tone']}
        - Focus: {hints['focus']}
        - Tool Preference: {hints['tool_preference']}

        Handle this request using {target.value} characteristics while
        maintaining access to all orchestrator capabilities.
        """

        return instructions.strip()

    def select_persona_for_request(self, request_type: str) -> PersonaMask:
        """
        Select appropriate persona mask for request type.

        Args:
            request_type: Type of request

        Returns:
            Recommended PersonaMask
        """
        persona_map = {
            "greeting": PersonaMask.NARA,
            "simple_query": PersonaMask.SYSTEM,
            "coordinate_lookup": PersonaMask.SYSTEM,
            "analysis": PersonaMask.EPII,
            "synthesis": PersonaMask.EPII,
        }

        recommended = persona_map.get(request_type, PersonaMask.SYSTEM)
        logger.debug(f"Recommended persona mask for {request_type}: {recommended.value}")

        return recommended
