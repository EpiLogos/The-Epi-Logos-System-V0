"""
Phase 0-5 Conversational Guidance

Provides the 6-phase structure as conversational guidance for users,
NOT as rigid backend automation.

Story 08.07 - AC: 7 (User Protocol Guidelines)

Philosophy: The phases are contemplative waypoints, not enforced steps.
User sovereignty - they can flow between phases naturally.
"""

import logging
from typing import Dict, Any, Optional, List
from enum import Enum

logger = logging.getLogger(__name__)


class EtymologyPhase(str, Enum):
    """Etymology archaeology phases (0-5 in QL mod6 framework)."""
    PHASE_0_GROUNDING = "phase_0_grounding"
    PHASE_1_SCENT_FOLLOWING = "phase_1_scent_following"
    PHASE_2_COMMUNITY_FORMATION = "phase_2_community_formation"
    PHASE_3_CRYSTALLIZATION = "phase_3_crystallization"
    PHASE_4_MEF_RESONANCE = "phase_4_mef_resonance"
    PHASE_5_SEDIMENTATION = "phase_5_sedimentation"


# Phase Descriptions and Guidance
PHASE_GUIDANCE: Dict[str, Dict[str, Any]] = {
    "phase_0_grounding": {
        "name": "Phase 0: Grounding",
        "coordinate": "#0",
        "essence": "Proto-logical preparation - choosing your first word",
        "description": "The foundational moment where you select the word or concept that calls to you. Trust your intuition.",
        "guidance": [
            "What word or phrase has been capturing your attention?",
            "Is there a concept you want to understand more deeply?",
            "Trust the 'scent' - the initial attraction to a word's mystery"
        ],
        "con_scire_hints": {
            "human_role": "Provide the initial word or phrase based on genuine curiosity",
            "ai_role": "Receive and honor the user's choice without judgment"
        },
        "output": "Initial word(s) chosen for exploration"
    },
    "phase_1_scent_following": {
        "name": "Phase 1: Scent-Following",
        "coordinate": "#1",
        "essence": "Quaternal Logic - tracing etymological threads",
        "description": "Explore the word's history, PIE roots, cognates, and semantic shifts. Follow the scent where it leads.",
        "guidance": [
            "Search for the word's PIE (Proto-Indo-European) root",
            "Identify cognates in other languages",
            "Notice semantic shifts - how meaning changed over time",
            "Look for QL patterns (2/3/4/6/12-fold structures)"
        ],
        "con_scire_hints": {
            "human_role": "Direct the exploration based on what resonates",
            "ai_role": "Search etymology resources, suggest connections, present findings"
        },
        "tools": ["etymology_search", "trace_etymology_chain"],
        "output": "Etymology chain with PIE roots, cognates, and semantic patterns"
    },
    "phase_2_community_formation": {
        "name": "Phase 2: Community Formation",
        "coordinate": "#2",
        "essence": "Vibrational clustering - recognizing word families",
        "description": "Group related words into QL-structured communities based on shared roots or semantic patterns.",
        "guidance": [
            "Identify words that share PIE roots",
            "Notice semantic families (causative, derivative relationships)",
            "Look for QL patterns in the community structure",
            "Create etymology communities in Graphiti with :EA:Episodic labeling"
        ],
        "con_scire_hints": {
            "human_role": "Decide which words belong together based on resonance",
            "ai_role": "Suggest groupings, create Graphiti communities, validate QL patterns"
        },
        "tools": ["create_etymology_community"],
        "output": "Etymology communities (2/3/4/6/12-fold QL structures)"
    },
    "phase_3_crystallization": {
        "name": "Phase 3: Crystallization",
        "coordinate": "#3",
        "essence": "Symbolic distillation - capturing aphoristic wisdom",
        "description": "Distill the etymology exploration into crystallized insights or aphorisms.",
        "guidance": [
            "What essential insight emerged from this exploration?",
            "Can you capture the etymology's wisdom in a single phrase?",
            "Create aphorisms (1-fold wisdom nodes) for fully distilled insights",
            "Link aphorisms to their source communities"
        ],
        "con_scire_hints": {
            "human_role": "Recognize and articulate the essential insight",
            "ai_role": "Help refine the aphorism, create :EA_Aphorism:Episodic nodes"
        },
        "tools": ["create_aphorism"],
        "output": "Aphorisms linked to etymology communities"
    },
    "phase_4_mef_resonance": {
        "name": "Phase 4: MEF Resonance",
        "coordinate": "#4",
        "essence": "Personal integration - checking MEF and Bimba resonances",
        "description": "Validate the etymology against MEF lenses (archetypal, causal, logical, processual, meta-epistemic, divine-scalar) and find Bimba coordinate resonances.",
        "guidance": [
            "Delegate to Parashakti for MEF lens analysis",
            "Check archetypal-numerical patterns (#2-1-0)",
            "Validate causal relationships (#2-1-1)",
            "Assess logical coherence (#2-1-2)",
            "Examine processual evolution (#2-1-3)",
            "Explore meta-epistemic patterns (#2-1-4)",
            "Investigate divine-scalar dimensionality (#2-1-5)",
            "Find resonances with existing Bimba coordinates"
        ],
        "con_scire_hints": {
            "human_role": "Reflect on which MEF lenses feel most relevant",
            "ai_role": "Query MEF properties, delegate to Parashakti, find Bimba resonances"
        },
        "tools": ["query_mef_lens", "check_bimba_resonance"],
        "delegation_required": "Parashakti (MEF analysis)",
        "output": "MEF resonance scores and Bimba coordinate connections"
    },
    "phase_5_sedimentation": {
        "name": "Phase 5: Sedimentation (Optional)",
        "coordinate": "#5",
        "essence": "Orchestration - transforming conversation into document",
        "description": "Optionally transform this etymology exploration into a LightRAG document for future reference (Möbius return #5→#0).",
        "guidance": [
            "Is this exploration complete enough to sediment?",
            "Transform conversation into document via Docling service",
            "Ingest into LightRAG for gnostic namespace",
            "Enable #5→#0 twist: sedimented knowledge becomes new ground"
        ],
        "con_scire_hints": {
            "human_role": "Decide if/when to sediment the exploration",
            "ai_role": "Facilitate conversation-to-document transformation"
        },
        "tools": ["sediment_to_lightrag"],
        "dependency": "Story 08.03 (Docling service)",
        "output": "LightRAG document with etymology metadata"
    }
}


def get_phase_guidance(phase: Optional[EtymologyPhase] = None) -> Dict[str, Any]:
    """
    Get conversational guidance for etymology archaeology phase.

    Args:
        phase: Specific phase to get guidance for (None returns all phases)

    Returns:
        Dict with phase guidance
    """
    if phase:
        phase_key = phase.value if isinstance(phase, EtymologyPhase) else phase
        if phase_key in PHASE_GUIDANCE:
            return {
                "success": True,
                "phase": phase_key,
                **PHASE_GUIDANCE[phase_key]
            }
        else:
            return {
                "success": False,
                "error": f"Unknown phase: {phase}"
            }
    else:
        # Return overview of all phases
        return {
            "success": True,
            "all_phases": True,
            "phases": {
                key: {
                    "name": value["name"],
                    "coordinate": value["coordinate"],
                    "essence": value["essence"]
                }
                for key, value in PHASE_GUIDANCE.items()
            },
            "philosophy": "Phases are contemplative waypoints, not rigid steps. Flow naturally based on intuition and resonance."
        }


def suggest_next_phase(
    current_phase: EtymologyPhase,
    has_word: bool = False,
    has_community: bool = False,
    has_aphorism: bool = False,
    has_mef_analysis: bool = False
) -> Dict[str, Any]:
    """
    Suggest next phase based on current state.

    This is guidance, not enforcement - user can choose to skip or revisit phases.

    Args:
        current_phase: Current phase
        has_word: Whether word has been chosen
        has_community: Whether community has been created
        has_aphorism: Whether aphorism has been created
        has_mef_analysis: Whether MEF analysis has been done

    Returns:
        Dict with next phase suggestion
    """
    try:
        phase_sequence = [
            EtymologyPhase.PHASE_0_GROUNDING,
            EtymologyPhase.PHASE_1_SCENT_FOLLOWING,
            EtymologyPhase.PHASE_2_COMMUNITY_FORMATION,
            EtymologyPhase.PHASE_3_CRYSTALLIZATION,
            EtymologyPhase.PHASE_4_MEF_RESONANCE,
            EtymologyPhase.PHASE_5_SEDIMENTATION
        ]

        current_index = phase_sequence.index(current_phase)

        # Suggest next phase if ready
        if current_phase == EtymologyPhase.PHASE_0_GROUNDING and has_word:
            next_phase = EtymologyPhase.PHASE_1_SCENT_FOLLOWING
        elif current_phase == EtymologyPhase.PHASE_1_SCENT_FOLLOWING:
            next_phase = EtymologyPhase.PHASE_2_COMMUNITY_FORMATION
        elif current_phase == EtymologyPhase.PHASE_2_COMMUNITY_FORMATION and has_community:
            next_phase = EtymologyPhase.PHASE_3_CRYSTALLIZATION
        elif current_phase == EtymologyPhase.PHASE_3_CRYSTALLIZATION:
            next_phase = EtymologyPhase.PHASE_4_MEF_RESONANCE
        elif current_phase == EtymologyPhase.PHASE_4_MEF_RESONANCE:
            next_phase = EtymologyPhase.PHASE_5_SEDIMENTATION
        elif current_phase == EtymologyPhase.PHASE_5_SEDIMENTATION:
            next_phase = None  # Exploration complete
        else:
            # Default to next in sequence
            if current_index < len(phase_sequence) - 1:
                next_phase = phase_sequence[current_index + 1]
            else:
                next_phase = None

        if next_phase:
            return {
                "success": True,
                "current_phase": current_phase.value,
                "suggested_next_phase": next_phase.value,
                "guidance": PHASE_GUIDANCE[next_phase.value],
                "note": "This is a suggestion - you can choose to explore differently"
            }
        else:
            return {
                "success": True,
                "current_phase": current_phase.value,
                "suggested_next_phase": None,
                "message": "Exploration cycle complete. Ready for #5→#0 Möbius return (new grounding)."
            }

    except Exception as e:
        logger.error(f"Error suggesting next phase: {e}")
        return {
            "success": False,
            "error": f"Phase suggestion failed: {str(e)}"
        }


def get_phase_from_coordinate(bimba_coordinate: str) -> Optional[EtymologyPhase]:
    """
    Map Bimba coordinate to etymology phase.

    Args:
        bimba_coordinate: Bimba coordinate (e.g., "#0", "#1")

    Returns:
        Corresponding EtymologyPhase or None
    """
    coordinate_to_phase = {
        "#0": EtymologyPhase.PHASE_0_GROUNDING,
        "#1": EtymologyPhase.PHASE_1_SCENT_FOLLOWING,
        "#2": EtymologyPhase.PHASE_2_COMMUNITY_FORMATION,
        "#3": EtymologyPhase.PHASE_3_CRYSTALLIZATION,
        "#4": EtymologyPhase.PHASE_4_MEF_RESONANCE,
        "#5": EtymologyPhase.PHASE_5_SEDIMENTATION
    }

    return coordinate_to_phase.get(bimba_coordinate)
