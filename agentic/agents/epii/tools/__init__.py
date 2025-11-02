"""
Epii Agent Tools

Etymology archaeology tools for conversational etymological exploration,
Graphiti community building, resonance detection, and MEF analysis delegation.

NOTE: Agent tools are registered directly in constellation.py using @agent.tool decorators.
This module contains backend utility functions, not agent-facing tools.
"""

from .graphiti_community import create_etymology_community, create_aphorism
from .phase_guidance import get_phase_guidance, suggest_next_phase
from .bimba_resonance import detect_bimba_resonances, detect_resonances_async
from .conversation_capture import (
    capture_etymology_dialogue,
    sediment_to_lightrag,
    check_sedimented_explorations,
    should_sediment_exploration
)
from .mef_delegation import delegate_mef_analysis, get_lens_description, recommend_lenses_for_etymology

__all__ = [
    # Graphiti community
    "create_etymology_community",
    "create_aphorism",
    # Phase guidance
    "get_phase_guidance",
    "suggest_next_phase",
    # Bimba resonance
    "detect_bimba_resonances",
    "detect_resonances_async",
    # Conversation capture
    "capture_etymology_dialogue",
    "sediment_to_lightrag",
    "check_sedimented_explorations",
    "should_sediment_exploration",
    # MEF delegation
    "delegate_mef_analysis",
    "get_lens_description",
    "recommend_lenses_for_etymology",
]
