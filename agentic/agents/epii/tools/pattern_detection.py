"""
Pattern Detection via LLM Reasoning

Uses LLM's inherent pattern recognition to detect QL-aligned structures
in etymology discussions. Not a rigid algorithm - allows patterns to emerge
naturally through extended reasoning.

Story 08.07 Enhancement - Full Etymology Archaeology UX Flow

Philosophy: Patterns should be discovered, not imposed.
LLM reasoning evaluates whether a genuine community-worthy pattern exists.
We suggest, don't prescribe.
"""

import logging
from typing import Dict, Any, List, Optional
from enum import Enum

logger = logging.getLogger(__name__)


class PatternType(str, Enum):
    """QL-aligned pattern types."""
    THREE_FOLD = "3-fold"  # Trinity, dialectic
    FOUR_FOLD = "4-fold"  # Quaternal logic, archetypal wholeness
    SIX_FOLD = "6-fold"  # Mod6 harmony, complete cycle


class CommunityRecommendation(str, Enum):
    """Community creation recommendation levels."""
    STRONG = "strong"  # Clear pattern, immediate suggestion
    MODERATE = "moderate"  # Pattern emerging, gentle suggestion
    WEAK = "weak"  # Insufficient pattern, continue exploring
    NONE = "none"  # No pattern detected


async def check_for_community_opportunity(
    words_discussed: List[str],
    context: Dict[str, Any],
    reasoning_prompt: Optional[str] = None
) -> Dict[str, Any]:
    """
    Use LLM reasoning to detect community-worthy patterns.

    This is NOT a rigid algorithm. LLM evaluates:
    - Semantic coherence across words
    - Shared etymological roots
    - Emergent QL-aligned structures (3/4/6-fold)
    - User's exploration trajectory

    Recommendation strength:
    - STRONG: "Would you like me to create a community for this family?"
    - MODERATE: "I'm noticing a pattern emerging - interested in creating a community?"
    - WEAK/NONE: Continue exploring, don't suggest yet

    Args:
        words_discussed: List of words discussed in recent conversation
        context: Dict with:
            - pie_roots: List of PIE roots discovered
            - semantic_patterns: List of semantic shift descriptions
            - user_intent: Recent user messages (for trajectory sensing)
            - session_data: Current session data (words_explored, etc.)
        reasoning_prompt: Optional custom reasoning prompt (defaults to built-in)

    Returns:
        Dict with:
            - recommendation: CommunityRecommendation enum
            - pattern_type: PatternType enum (if pattern detected)
            - reasoning: LLM's reasoning about pattern (or lack thereof)
            - suggested_community_name: Suggested name if recommendation >= MODERATE
            - suggested_words: List of words to include (may be subset of words_discussed)
            - pie_root: PIE root if family pattern detected
            - semantic_pattern: Semantic shift description if applicable

    Story 08.07 Enhancement - LLM-Based Pattern Detection
    """
    try:
        logger.info(
            f"Checking community opportunity: {len(words_discussed)} words discussed"
        )

        # Extract context data
        pie_roots = context.get('pie_roots', [])
        semantic_patterns = context.get('semantic_patterns', [])
        user_intent = context.get('user_intent', '')
        session_data = context.get('session_data', {})

        # Build reasoning prompt
        prompt = reasoning_prompt or _build_pattern_detection_prompt(
            words_discussed,
            pie_roots,
            semantic_patterns,
            user_intent
        )

        # In production, this would invoke LLM via agent.run() with reasoning model
        # For now, return structured placeholder that production will replace

        # Heuristic guidance for LLM (embedded in prompt):
        # - 3+ words sharing PIE root → likely STRONG (family pattern)
        # - 4+ words showing semantic evolution → likely MODERATE (conceptual pattern)
        # - 6+ words with mod6 harmony → STRONG (complete cycle)
        # - Scattered words without coherence → WEAK/NONE

        # Simulate LLM reasoning (production replaces this)
        analysis = _analyze_pattern_heuristics(
            words_discussed,
            pie_roots,
            semantic_patterns
        )

        logger.info(
            f"Pattern detection result: {analysis['recommendation']} "
            f"({analysis.get('pattern_type', 'none')})"
        )

        return analysis

    except Exception as e:
        logger.error(f"Error in pattern detection: {e}")
        return {
            'recommendation': CommunityRecommendation.NONE,
            'reasoning': f"Error during pattern analysis: {str(e)}",
            'pattern_type': None
        }


def _build_pattern_detection_prompt(
    words_discussed: List[str],
    pie_roots: List[str],
    semantic_patterns: List[str],
    user_intent: str
) -> str:
    """
    Build reasoning prompt for LLM pattern detection.

    This prompt guides LLM to evaluate whether a genuine community-worthy
    pattern exists, using extended reasoning.

    Args:
        words_discussed: Words in discussion
        pie_roots: PIE roots discovered
        semantic_patterns: Semantic shift descriptions
        user_intent: Recent user messages

    Returns:
        Reasoning prompt for LLM
    """
    prompt = f"""**Etymology Pattern Analysis - Extended Reasoning**

Evaluate whether the words discussed form a community-worthy pattern.

**Words Discussed:** {', '.join(words_discussed)}

**PIE Roots Discovered:** {', '.join(pie_roots) if pie_roots else '(none yet)'}

**Semantic Patterns:** {', '.join(semantic_patterns) if semantic_patterns else '(none yet)'}

**User's Recent Intent:** {user_intent or '(exploring)'}

**Pattern Evaluation Criteria:**

**Strong Pattern Indicators:**
- 3+ words sharing PIE root (family coherence)
- 4+ words showing semantic evolution (conceptual pattern)
- 6+ words forming mod6 harmony (complete cycle)
- User explicitly exploring word family
- Clear QL-aligned structure (3-fold dialectic, 4-fold wholeness, 6-fold cycle)

**Weak Pattern Indicators:**
- Words semantically scattered
- No shared etymological roots
- User jumping between unrelated topics
- Insufficient exploration depth
- Forced pattern detection (don't impose structure)

**Recommendation Levels:**
- **STRONG**: Clear pattern exists - immediate suggestion appropriate
- **MODERATE**: Pattern emerging - gentle suggestion warranted
- **WEAK**: Insufficient pattern - continue exploring
- **NONE**: No pattern detected - don't suggest

**IMPORTANT**: Only suggest community if it enhances understanding.
Don't force QL structures where they don't naturally emerge.
Be honest about pattern strength.

**Provide:**
1. **Recommendation**: STRONG/MODERATE/WEAK/NONE
2. **Pattern Type**: 3-fold/4-fold/6-fold (if applicable)
3. **Reasoning**: Your extended reasoning about pattern (or lack thereof)
4. **Suggested Community Name**: If recommendation >= MODERATE
5. **Suggested Words**: Which words to include (may be subset)
6. **PIE Root**: If family pattern detected
7. **Semantic Pattern**: If semantic shift pattern exists
"""

    return prompt.strip()


def _analyze_pattern_heuristics(
    words_discussed: List[str],
    pie_roots: List[str],
    semantic_patterns: List[str]
) -> Dict[str, Any]:
    """
    Heuristic-based pattern analysis (placeholder for LLM reasoning).

    Production replaces this with actual LLM reasoning via agent.run().

    Args:
        words_discussed: Words in discussion
        pie_roots: PIE roots discovered
        semantic_patterns: Semantic shift descriptions

    Returns:
        Pattern analysis dict
    """
    word_count = len(words_discussed)
    pie_root_count = len(pie_roots)
    semantic_pattern_count = len(semantic_patterns)

    # Heuristic 1: 3+ words with shared PIE root → STRONG
    if word_count >= 3 and pie_root_count >= 1:
        return {
            'recommendation': CommunityRecommendation.STRONG,
            'pattern_type': PatternType.THREE_FOLD if word_count == 3 else PatternType.SIX_FOLD if word_count >= 6 else PatternType.FOUR_FOLD,
            'reasoning': f"Strong family pattern: {word_count} words share PIE root {pie_roots[0] if pie_roots else 'discovered'}",
            'suggested_community_name': f"{pie_roots[0].upper() if pie_roots else 'FAMILY'} Etymology",
            'suggested_words': words_discussed,
            'pie_root': pie_roots[0] if pie_roots else None,
            'semantic_pattern': semantic_patterns[0] if semantic_patterns else None
        }

    # Heuristic 2: 4+ words with semantic evolution → MODERATE
    elif word_count >= 4 and semantic_pattern_count >= 1:
        return {
            'recommendation': CommunityRecommendation.MODERATE,
            'pattern_type': PatternType.FOUR_FOLD if word_count == 4 else PatternType.SIX_FOLD if word_count >= 6 else PatternType.THREE_FOLD,
            'reasoning': f"Emerging semantic pattern: {word_count} words show {semantic_patterns[0] if semantic_patterns else 'evolution'}",
            'suggested_community_name': f"{semantic_patterns[0][:30] if semantic_patterns else 'SEMANTIC'} Pattern",
            'suggested_words': words_discussed,
            'pie_root': pie_roots[0] if pie_roots else None,
            'semantic_pattern': semantic_patterns[0] if semantic_patterns else None
        }

    # Heuristic 3: 2 words → WEAK (continue exploring)
    elif word_count == 2:
        return {
            'recommendation': CommunityRecommendation.WEAK,
            'reasoning': f"Insufficient data: Only {word_count} words discussed. Need 3+ for pattern detection.",
            'pattern_type': None
        }

    # Heuristic 4: 1 word or scattered → NONE
    else:
        return {
            'recommendation': CommunityRecommendation.NONE,
            'reasoning': f"No pattern detected: {word_count} words without clear coherence.",
            'pattern_type': None
        }


def get_suggestion_phrasing(recommendation: CommunityRecommendation) -> str:
    """
    Get conversational phrasing for community suggestion.

    Maps recommendation strength to appropriate conversational tone.

    Args:
        recommendation: CommunityRecommendation enum

    Returns:
        Conversational suggestion phrasing
    """
    phrasing_map = {
        CommunityRecommendation.STRONG: (
            "I'm seeing a clear pattern here - would you like me to create a community "
            "for this word family? I can structure it as a QL community and trigger "
            "deeper analysis."
        ),
        CommunityRecommendation.MODERATE: (
            "I'm noticing a pattern emerging. Interested in creating a community to "
            "capture this? It would enable background resonance detection and MEF analysis."
        ),
        CommunityRecommendation.WEAK: (
            "We could explore a bit more to see if a pattern emerges, or create a "
            "community now if you'd like to capture what we've found so far."
        ),
        CommunityRecommendation.NONE: ""
    }

    return phrasing_map.get(recommendation, "")


async def format_pattern_detection_response(
    analysis: Dict[str, Any]
) -> str:
    """
    Format pattern detection analysis for conversational presentation.

    Args:
        analysis: Pattern detection result dict

    Returns:
        Markdown-formatted response for user
    """
    recommendation = analysis.get('recommendation')
    pattern_type = analysis.get('pattern_type')
    reasoning = analysis.get('reasoning', '')
    suggested_name = analysis.get('suggested_community_name', '')
    suggested_words = analysis.get('suggested_words', [])

    # No pattern - return empty (continue exploration)
    if recommendation in [CommunityRecommendation.NONE, CommunityRecommendation.WEAK]:
        return ""

    # Pattern detected - format suggestion
    suggestion = get_suggestion_phrasing(recommendation)

    response = f"""
**Pattern Detected:** {pattern_type.value if pattern_type else 'Emerging'} harmony

{suggestion}

**Proposed Community:** "{suggested_name}"
**Words:** {', '.join(suggested_words)}
"""

    return response.strip()
