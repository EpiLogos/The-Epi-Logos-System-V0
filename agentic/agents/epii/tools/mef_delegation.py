"""
MEF Lens Analysis Delegation to Parashakti

Delegates MEF (Meta-Epistemic Framework) analysis to Parashakti agent.
Uses 6-lens system for multi-perspectival etymology investigation.

Story 08.07 - AC: 4, 9 (MEF Resonance Validation, Epii-Parashakti Coordination)

**IMPLEMENTATION STATUS**: REAL DELEGATION with DeepSeek reasoning model
Uses DelegationManager for async A2A handoff with proper context propagation.
Parashakti processes MEF analysis in background while Epii continues dialogue.

Philosophy: MEF lenses provide 6 analytical perspectives aligned with
Parashakti's #2-1 Meta-Logikon system (36×2=72 vibrational template).
"""

import logging
from typing import Dict, Any, List, Optional, TYPE_CHECKING
from enum import Enum

if TYPE_CHECKING:
    from agentic.agents.delegation_manager import DelegationManager
    from agentic.agents.context import A2AContext
    from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps

logger = logging.getLogger(__name__)


class MEFLens(str, Enum):
    """MEF analytical lenses from #2-1-0 through #2-1-5."""
    ARCHETYPAL_NUMERICAL = "archetypal_numerical"  # #2-1-0
    CAUSAL = "causal"  # #2-1-1
    LOGICAL = "logical"  # #2-1-2
    PROCESSUAL = "processual"  # #2-1-3
    META_EPISTEMIC = "meta_epistemic"  # #2-1-4
    DIVINE_SCALAR = "divine_scalar"  # #2-1-5


# MEF Lens Descriptions (from Bimba #2-1 coordinates)
MEF_LENS_DESCRIPTIONS = {
    MEFLens.ARCHETYPAL_NUMERICAL: {
        "coordinate": "#2-1-0",
        "name": "Archetypal-Numerical Foundation",
        "investigatory_mode": "Full question space - archetypal number patterns",
        "core_focus": "Jung-Pauli psychoid mathematics, Adam-Eve resonances, Von Franz 0-6 architecture",
        "questions": ["What archetypal numbers govern this etymology?", "What Adam/Eve charges appear?"]
    },
    MEFLens.CAUSAL: {
        "coordinate": "#2-1-1",
        "name": "Causal Lens",
        "investigatory_mode": "HOW (method) - causation as psychological dynamics",
        "core_focus": "Aristotle's four causes through Jung's functions: Material-Sensation, Efficient-Feeling, Formal-Thinking, Final-Intuition",
        "questions": ["How did this meaning emerge?", "What causal patterns drive semantic shifts?"]
    },
    MEFLens.LOGICAL: {
        "coordinate": "#2-1-2",
        "name": "Logical Lens (Tetralemma)",
        "investigatory_mode": "WHY (purpose) - navigating paradox via zero logic",
        "core_focus": "Nagarjuna's Tetralemma, Identity (-0) vs Essence (+0), breakthrough from impasse",
        "questions": ["What logical contradictions appear?", "How does tetralemma resolve paradox?"]
    },
    MEFLens.PROCESSUAL: {
        "coordinate": "#2-1-3",
        "name": "Processual Lens",
        "investigatory_mode": "WHO (subject) - temporal evolution and concrescence",
        "core_focus": "Whitehead's Process Philosophy: Soil→Seed→Sprout→Bloom→Flower→Fruit",
        "questions": ["How did this word evolve through time?", "What stages of becoming appear?"]
    },
    MEFLens.META_EPISTEMIC: {
        "coordinate": "#2-1-4",
        "name": "Meta-Epistemic Lens",
        "investigatory_mode": "WHERE-WHEN (context) - knowing about knowing",
        "core_focus": "Epistemology as spiritual journey: Ajnana→Jnana-Kanda→Jnana",
        "questions": ["How do we know this etymology?", "What epistemic structures underlie understanding?"]
    },
    MEFLens.DIVINE_SCALAR: {
        "coordinate": "#2-1-5",
        "name": "Divine-Scalar Lens",
        "investigatory_mode": "Synthesis - vertical dimensionality and transcendence",
        "core_focus": "Kashmir Shaivism consciousness gradients: Para→Pasyanti→Madhyama→Vaikhari",
        "questions": ["What divine patterns manifest?", "How does meaning ascend/descend scales?"]
    }
}


async def delegate_mef_analysis(
    delegation_manager: 'DelegationManager',
    etymology_community: Dict[str, Any],
    a2a_context: 'A2AContext',
    deps: 'OrchestratorDeps',
    lenses: List[MEFLens] = None,
    model_name: str = "deepseek/deepseek-r1-distill-llama-70b"
) -> Dict[str, Any]:
    """
    Delegate REAL MEF analysis to Parashakti agent with reasoning model.

    **IMPLEMENTATION**: Uses DelegationManager for async A2A delegation.
    Parashakti processes MEF analysis in background with DeepSeek reasoning model.
    Epii (or calling agent) continues dialogue while analysis runs asynchronously.

    Args:
        delegation_manager: DelegationManager instance for A2A handoff
        etymology_community: Etymology community data to analyze
        a2a_context: A2A context for lineage tracking
        deps: OrchestratorDeps to pass to Parashakti
        lenses: List of MEF lenses to apply (default: all 6)
        model_name: Model for Parashakti (default: DeepSeek reasoning)

    Returns:
        Dict with task_id and status endpoints for async result retrieval

    Story 08.07 Enhancement - Epii-Parashakti MEF Delegation with Real Analysis
    """
    try:
        # Default to all 6 lenses if not specified
        if lenses is None:
            lenses = list(MEFLens)

        # Convert MEFLens enums to string values
        lens_names = [lens.value for lens in lenses]

        logger.info(
            f"Delegating MEF analysis to Parashakti with {len(lens_names)} lenses "
            f"using {model_name}"
        )

        # Delegate async to Parashakti (#2) via DelegationManager
        task_id = await delegation_manager.delegate_mef_analysis_async(
            from_agent_subsystem=5,  # Epii
            etymology_community=etymology_community,
            lenses=lens_names,
            a2a_context=a2a_context,
            deps=deps,
            model_name=model_name
        )

        # Return immediate response with task tracking info
        return {
            "success": True,
            "status": "delegated_to_parashakti",
            "task_id": task_id,
            "message": (
                f"Parashakti analyzing {len(lens_names)} lenses in background "
                f"with {model_name} reasoning model"
            ),
            "lenses_requested": lens_names,
            "check_status_at": f"/api/v1/mef/status/{task_id}",
            "get_results_at": f"/api/v1/mef/results/{task_id}",
            "delegation_metadata": {
                "from_agent": "#5",  # Epii
                "to_agent": "#2",  # Parashakti
                "context_id": a2a_context.context_id,
                "session_id": a2a_context.session_id,
                "user_id": a2a_context.user_id,
                "model_name": model_name
            }
        }

    except Exception as e:
        logger.error(f"Error in MEF delegation: {e}")
        return {
            "success": False,
            "error": f"MEF delegation failed: {str(e)}",
            "status": "error"
        }


def get_lens_description(lens: MEFLens) -> Dict[str, Any]:
    """
    Get detailed description of a specific MEF lens.

    Args:
        lens: MEF lens enum

    Returns:
        Dict with lens description and operational details
    """
    return MEF_LENS_DESCRIPTIONS.get(lens, {})


def recommend_lenses_for_etymology(
    words: List[str],
    pie_root: Optional[str] = None,
    semantic_pattern: Optional[str] = None
) -> Dict[str, Any]:
    """
    Recommend MEF lenses based on etymology characteristics.

    Heuristic guidance for which lenses might be most relevant.
    User can override - this is suggestion, not enforcement.

    Args:
        words: Words in etymology community
        pie_root: Optional PIE root
        semantic_pattern: Optional semantic shift pattern

    Returns:
        Dict with lens recommendations
    """
    recommended = []

    # Always start with Archetypal-Numerical (ground)
    recommended.append({
        "lens": MEFLens.ARCHETYPAL_NUMERICAL,
        "priority": "high",
        "reason": "Archetypal number patterns ground all etymological structures"
    })

    # If PIE root present, suggest Processual (temporal evolution)
    if pie_root:
        recommended.append({
            "lens": MEFLens.PROCESSUAL,
            "priority": "high",
            "reason": "PIE root enables tracing processual evolution from ancient to modern"
        })

    # If semantic pattern present, suggest Causal
    if semantic_pattern:
        recommended.append({
            "lens": MEFLens.CAUSAL,
            "priority": "high",
            "reason": "Semantic shift patterns reveal causal dynamics of meaning evolution"
        })

    # If multiple words, suggest Logical (for paradox navigation)
    if len(words) > 3:
        recommended.append({
            "lens": MEFLens.LOGICAL,
            "priority": "medium",
            "reason": "Multiple word relationships may reveal logical tensions or syntheses"
        })

    # Always offer Divine-Scalar for integration
    recommended.append({
        "lens": MEFLens.DIVINE_SCALAR,
        "priority": "medium",
        "reason": "Synthesizes all perspectives into unified understanding"
    })

    return {
        "recommended_lenses": recommended,
        "total_recommended": len(recommended),
        "all_available_lenses": list(MEFLens),
        "user_choice": "These are suggestions - user can select any lens combination"
    }
