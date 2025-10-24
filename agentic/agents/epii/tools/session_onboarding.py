"""
Etymology Session Onboarding

Generates welcoming onboarding messages for etymology archaeology sessions.
Uses session data to create contextually appropriate greetings.

Story 08.07 Enhancement - Full Etymology Archaeology UX Flow

Philosophy: Onboarding sets the tone for open-ended exploration.
Messages are warm, curious, and invite collaborative discovery.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


async def generate_session_onboarding(
    session_data: Dict[str, Any],
    is_new_session: bool = True
) -> str:
    """
    Generate onboarding message for etymology archaeology session.

    Creates contextually appropriate greeting based on session state:
    - New session: Warm welcome, explain flow
    - Returning session: Recall previous explorations, invite continuation
    - Session with discoveries: Celebrate progress, suggest next steps

    Args:
        session_data: Etymology session data (from EtymologySession model)
        is_new_session: True if this is first thread in session

    Returns:
        Markdown-formatted onboarding message

    Story 08.07 Enhancement - Session-Based Etymology Archaeology
    """
    try:
        session_id = session_data.get('session_id', 'unknown')
        title = session_data.get('title', 'Etymology Exploration')
        words_explored = session_data.get('words_explored', [])
        communities_created = session_data.get('communities_created', [])
        pie_roots_discovered = session_data.get('pie_roots_discovered', [])

        logger.info(
            f"Generating onboarding for session {session_id} "
            f"(new={is_new_session}, words={len(words_explored)})"
        )

        # New session onboarding
        if is_new_session and not words_explored:
            message = f"""**Welcome to Etymology Archaeology!** 🌱

You've just created a new word exploration: **"{title}"**

**How This Works:**
- **Open-Ended Exploration**: Share a word, and we'll trace its roots together
- **Follow Your Curiosity**: No rigid structure - we'll see where the words lead us
- **Pattern Recognition**: When 3/4/6-fold patterns emerge, I'll suggest creating communities
- **Background Discoveries**: Bimba resonances and MEF analyses run automatically
- **Accumulating Insights**: Everything we discover persists across our conversations

**What Interests You?**
Share a word, phrase, or concept you'd like to explore, and let's begin the journey together.
"""
            return message.strip()

        # Returning to session with previous explorations
        elif words_explored:
            word_summary = _format_word_list(words_explored, max_display=5)

            message = f"""**Welcome back to "{title}"!** 🌿

**Previous Explorations:**
{word_summary}

"""

            # Add community summary if any created
            if communities_created:
                message += f"**Communities Created:** {len(communities_created)}\n"

            # Add PIE roots if discovered
            if pie_roots_discovered:
                roots_summary = _format_pie_roots(pie_roots_discovered, max_display=3)
                message += f"\n**PIE Roots Discovered:**\n{roots_summary}\n"

            message += f"""
**Where Shall We Continue?**
You can:
- Explore a new word
- Deepen an existing thread (e.g., more *{words_explored[-1] if words_explored else 'your word'}* derivatives)
- Ask about resonances or insights from previous explorations
- Create communities from patterns we've discovered

What calls to you?
"""
            return message.strip()

        # Fallback for edge cases
        else:
            message = f"""**Welcome to "{title}"!** 🌱

Ready to explore word origins together? Share a word, and let's trace its roots.
"""
            return message.strip()

    except Exception as e:
        logger.error(f"Error generating session onboarding: {e}")
        # Graceful degradation
        return """**Welcome to Etymology Archaeology!** 🌱

Share a word you'd like to explore, and we'll trace its roots together.
"""


def _format_word_list(words: list, max_display: int = 5) -> str:
    """
    Format word list for display.

    Args:
        words: List of words explored
        max_display: Maximum words to display

    Returns:
        Markdown-formatted list
    """
    if not words:
        return "- (none yet)"

    display_words = words[:max_display]
    formatted = '\n'.join([f"- **{word}**" for word in display_words])

    if len(words) > max_display:
        remaining = len(words) - max_display
        formatted += f"\n- *(+{remaining} more)*"

    return formatted


def _format_pie_roots(pie_roots: list, max_display: int = 3) -> str:
    """
    Format PIE root list for display.

    Args:
        pie_roots: List of PIE roots discovered
        max_display: Maximum roots to display

    Returns:
        Markdown-formatted list
    """
    if not pie_roots:
        return "- (none yet)"

    display_roots = pie_roots[:max_display]
    formatted = '\n'.join([f"- `{root}`" for root in display_roots])

    if len(pie_roots) > max_display:
        remaining = len(pie_roots) - max_display
        formatted += f"\n- *(+{remaining} more)*"

    return formatted


async def generate_community_creation_celebration(
    community_name: str,
    word_count: int,
    pattern_type: str = "QL pattern"
) -> str:
    """
    Generate celebratory message after community creation.

    Args:
        community_name: Name of created community
        word_count: Number of words in community
        pattern_type: Type of pattern detected (e.g., "3-fold harmony", "PIE family")

    Returns:
        Markdown-formatted celebration message
    """
    message = f"""**Community Created!** ✨

**{community_name}** ({word_count} words, {pattern_type})

Background systems are now:
- 🔍 **Detecting Bimba resonances** (which coordinates resonate with this pattern)
- 🌀 **Analyzing through 6 MEF lenses** via Parashakti (archetypal, causal, logical, processual, meta-epistemic, divine-scalar)

These run asynchronously - we can continue exploring while insights accumulate. I'll surface them when they're ready.

**What's Next?**
We could:
- Explore more words in this family
- Start a new etymological thread
- Deepen understanding of the pattern we just discovered
"""

    return message.strip()


async def generate_insights_available_notice(
    pending_insights: Dict[str, Any]
) -> str:
    """
    Generate notice when background insights have completed.

    Args:
        pending_insights: Dict with completed MEF/resonance analyses

    Returns:
        Markdown-formatted notice
    """
    mef_count = len(pending_insights.get('mef_analyses', []))
    resonance_count = len(pending_insights.get('resonances', []))

    message = f"""**Insights Available!** 💡

"""

    if mef_count > 0:
        message += f"- **MEF Analysis Complete**: Parashakti analyzed {mef_count} lenses\n"

    if resonance_count > 0:
        message += f"- **Bimba Resonances Found**: {resonance_count} coordinate resonances detected\n"

    message += """
Would you like me to share what emerged?
"""

    return message.strip()
