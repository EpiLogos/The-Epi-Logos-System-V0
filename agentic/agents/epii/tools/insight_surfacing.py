"""
Insight Surfacing for Epii

Retrieves and formats MEF/resonance insights for conversational presentation.
Epii uses this to surface background analysis results when appropriate.

Story 08.07 Enhancement - Full Etymology Archaeology UX Flow

Philosophy: Insights emerge naturally in conversation, not as interruptions.
Epii decides when to surface based on context and user engagement.
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


async def check_pending_insights(
    session_id: str,
    neo4j_client,
    since_timestamp: Optional[str] = None
) -> Dict[str, Any]:
    """
    Check for newly completed MEF/resonance insights in session.

    Epii calls this periodically (every 3-5 turns) to see if background
    analyses have completed.

    Args:
        session_id: Etymology session ID
        neo4j_client: Neo4j client instance
        since_timestamp: Optional ISO timestamp to filter new insights

    Returns:
        Dict with pending insights summary

    Story 08.07 Enhancement - Periodic Insight Checking
    """
    try:
        from backend.epi_logos_system.cag.bimba.insight_persistence import (
            check_pending_mef_insights
        )

        logger.info(f"Checking pending insights for session {session_id}")

        # Check MEF completion status
        mef_status = await check_pending_mef_insights(neo4j_client, session_id)

        if not mef_status.get("success"):
            return {
                "success": False,
                "error": mef_status.get("error"),
                "has_new_insights": False
            }

        # Get newly completed communities
        completed_communities = mef_status.get("completed_communities", [])
        pending_communities = mef_status.get("pending_communities", [])

        # Check for resonances in completed communities
        resonance_counts = {}
        for community in completed_communities:
            community_id = community["id"]
            resonances = await _get_community_resonances(neo4j_client, community_id)
            resonance_counts[community_id] = len(resonances)

        has_new_insights = len(completed_communities) > 0

        return {
            "success": True,
            "session_id": session_id,
            "has_new_insights": has_new_insights,
            "completed_count": len(completed_communities),
            "pending_count": len(pending_communities),
            "completed_communities": [
                {
                    **community,
                    "resonance_count": resonance_counts.get(community["id"], 0)
                }
                for community in completed_communities
            ],
            "pending_communities": pending_communities
        }

    except Exception as e:
        logger.error(f"Error checking pending insights for session {session_id}: {e}")
        return {
            "success": False,
            "error": str(e),
            "has_new_insights": False
        }


async def surface_community_insights(
    community_id: str,
    community_name: str,
    neo4j_client,
    detail_level: str = "summary"
) -> str:
    """
    Format community insights for conversational presentation.

    Retrieves MEF analyses and Bimba resonances, formats as markdown.

    Args:
        community_id: EA community ID
        community_name: Community name for display
        neo4j_client: Neo4j client instance
        detail_level: "summary" | "detailed" | "full"

    Returns:
        Markdown-formatted insights for user

    Story 08.07 Enhancement - Conversational Insight Surfacing
    """
    try:
        from backend.epi_logos_system.cag.bimba.insight_persistence import (
            get_mef_insights,
            get_bimba_resonances
        )

        logger.info(
            f"Surfacing insights for community {community_id} "
            f"(detail={detail_level})"
        )

        # Get MEF insights
        mef_result = await get_mef_insights(neo4j_client, community_id)
        mef_insights = mef_result.get("insights", {}) if mef_result.get("success") else {}

        # Get Bimba resonances
        resonance_result = await get_bimba_resonances(
            neo4j_client,
            community_id,
            min_strength=0.5  # Only strong resonances
        )
        resonances = resonance_result.get("resonances", []) if resonance_result.get("success") else []

        # Format based on detail level
        if detail_level == "summary":
            return _format_summary_insights(
                community_name,
                mef_insights,
                resonances
            )
        elif detail_level == "detailed":
            return _format_detailed_insights(
                community_name,
                mef_insights,
                resonances
            )
        else:  # full
            return _format_full_insights(
                community_name,
                mef_insights,
                resonances
            )

    except Exception as e:
        logger.error(f"Error surfacing insights for {community_id}: {e}")
        return f"**Insights Unavailable**: Error retrieving analysis for {community_name}"


def _format_summary_insights(
    community_name: str,
    mef_insights: Dict[str, Any],
    resonances: List[Dict[str, Any]]
) -> str:
    """
    Format summary-level insights (brief, conversational).

    Args:
        community_name: Community name
        mef_insights: MEF insight dict
        resonances: Resonance list

    Returns:
        Markdown summary
    """
    message = f"""**Insights for "{community_name}"** 💡

"""

    # MEF summary
    mef_count = len(mef_insights)
    if mef_count > 0:
        message += f"**MEF Analysis Complete**: Parashakti analyzed through {mef_count} lenses\n"

        # Highlight one interesting lens (archetypal or processual)
        archetypal = mef_insights.get("f_mef_archetypal_numerical")
        processual = mef_insights.get("f_mef_processual")

        if archetypal:
            lens_preview = archetypal.get("insights", "")[:100]
            message += f"- *Archetypal-Numerical*: {lens_preview}...\n"
        elif processual:
            lens_preview = processual.get("insights", "")[:100]
            message += f"- *Processual*: {lens_preview}...\n"

        message += "\n"

    # Resonance summary
    if resonances:
        top_resonances = resonances[:3]  # Top 3
        message += f"**Bimba Resonances Found**: {len(resonances)} coordinates\n"
        for res in top_resonances:
            coord = res.get("coordinate", "unknown")
            strength = res.get("resonance_strength", 0.0)
            name = res.get("name", "")
            message += f"- **{coord}** ({name}): {strength:.0%} resonance\n"

        if len(resonances) > 3:
            message += f"- *(+{len(resonances) - 3} more)*\n"

    if not mef_insights and not resonances:
        message += "*(Analysis in progress or no insights available yet)*\n"

    message += "\n*Want deeper exploration of any lens or resonance?*"

    return message.strip()


def _format_detailed_insights(
    community_name: str,
    mef_insights: Dict[str, Any],
    resonances: List[Dict[str, Any]]
) -> str:
    """
    Format detailed-level insights (more depth, patterns highlighted).

    Args:
        community_name: Community name
        mef_insights: MEF insight dict
        resonances: Resonance list

    Returns:
        Markdown detailed report
    """
    message = f"""**Detailed Insights: "{community_name}"** 🔍

"""

    # MEF lenses (with patterns)
    if mef_insights:
        message += "## MEF Analysis\n\n"

        lens_order = [
            "archetypal_numerical",
            "causal",
            "logical",
            "processual",
            "meta_epistemic",
            "divine_scalar"
        ]

        for lens_name in lens_order:
            prop_key = f"f_mef_{lens_name}"
            lens_data = mef_insights.get(prop_key)

            if lens_data:
                lens_label = lens_data.get("lens", lens_name).replace("_", " ").title()
                insights = lens_data.get("insights", "")
                patterns = lens_data.get("patterns_discovered", [])

                message += f"### {lens_label}\n"
                message += f"{insights}\n\n"

                if patterns:
                    message += "**Patterns Discovered:**\n"
                    for pattern in patterns[:3]:  # Top 3 patterns
                        message += f"- {pattern}\n"
                    message += "\n"

    # Resonances (with descriptions)
    if resonances:
        message += "## Bimba Coordinate Resonances\n\n"

        for res in resonances[:5]:  # Top 5
            coord = res.get("coordinate", "unknown")
            name = res.get("name", "Unknown")
            strength = res.get("resonance_strength", 0.0)
            res_type = res.get("resonance_type", "semantic")
            description = res.get("description", "")

            message += f"### {coord} - {name}\n"
            message += f"**Resonance Strength**: {strength:.0%} ({res_type})\n"

            if description:
                message += f"{description}\n"

            message += "\n"

    if not mef_insights and not resonances:
        message += "*(No insights available yet - analysis may still be running)*\n"

    return message.strip()


def _format_full_insights(
    community_name: str,
    mef_insights: Dict[str, Any],
    resonances: List[Dict[str, Any]]
) -> str:
    """
    Format full-level insights (comprehensive, all details).

    Args:
        community_name: Community name
        mef_insights: MEF insight dict
        resonances: Resonance list

    Returns:
        Markdown full report
    """
    # For full insights, use detailed format but include all patterns and resonances
    message = _format_detailed_insights(community_name, mef_insights, resonances)

    # Add metadata footer
    message += "\n\n---\n\n"
    message += f"**Metadata**: {len(mef_insights)} MEF lenses, {len(resonances)} resonances\n"

    return message.strip()


async def _get_community_resonances(
    neo4j_client,
    community_id: str
) -> List[Dict[str, Any]]:
    """
    Get resonances for community (helper).

    Args:
        neo4j_client: Neo4j client instance
        community_id: Community ID

    Returns:
        List of resonance dicts
    """
    try:
        from backend.epi_logos_system.cag.bimba.insight_persistence import (
            get_bimba_resonances
        )

        result = await get_bimba_resonances(neo4j_client, community_id)

        if result.get("success"):
            return result.get("resonances", [])
        else:
            return []

    except Exception as e:
        logger.error(f"Error getting resonances for {community_id}: {e}")
        return []


async def generate_insight_notification(
    completed_communities: List[Dict[str, Any]]
) -> str:
    """
    Generate brief notification when insights complete.

    Epii uses this to naturally mention insights during conversation.

    Args:
        completed_communities: List of completed community dicts

    Returns:
        Natural language notification

    Story 08.07 Enhancement - Natural Insight Surfacing
    """
    if not completed_communities:
        return ""

    count = len(completed_communities)

    if count == 1:
        community = completed_communities[0]
        name = community.get("name", "Unknown")
        return (
            f"**By the way**, insights just completed for your **{name}** community! "
            f"Parashakti analyzed it through 6 MEF lenses and detected Bimba resonances. "
            f"Want me to share what emerged?"
        )
    else:
        return (
            f"**By the way**, insights completed for **{count} communities**! "
            f"MEF analyses and resonance detection finished. "
            f"Should I surface what we discovered?"
        )
