"""
Bimba Resonance Detection for Etymology Archaeology

Detects resonances between etymology communities and Bimba coordinates
using existing CAG tools (semantic_coordinate_discovery, lexical_coordinate_search).

Story 08.07 - AC: 5 (Bimba Resonance Detection)

Philosophy: Etymology patterns resonate with archetypal structures in the Bimba map.
Use hybrid search (semantic + lexical) to find coordinate alignments.
"""

import logging
from typing import Dict, Any, List, Optional
import asyncio

logger = logging.getLogger(__name__)


async def detect_bimba_resonances(
    bimba_client,
    words: List[str],
    pie_root: Optional[str] = None,
    semantic_pattern: Optional[str] = None,
    alpha: float = 0.6,  # 0.6 = balanced semantic+lexical, 1.0 = pure semantic, 0.0 = pure lexical
    max_results: int = 7  # Default 7 for mod6 QL alignment
) -> Dict[str, Any]:
    """
    Detect Bimba coordinate resonances for an etymology community.

    Uses hybrid semantic + lexical search to find coordinates that resonate
    with the etymological pattern. Runs asynchronously in background.

    Args:
        bimba_client: Bimba GraphQL/HTTP client
        words: List of words in etymology community
        pie_root: Optional PIE root
        semantic_pattern: Optional semantic shift pattern
        alpha: Hybrid search weight (0=lexical, 1=semantic, 0.6=balanced)
        max_results: Maximum resonances to return

    Returns:
        Dict with resonance results and scores
    """
    try:
        # Build search query from words, PIE root, and pattern
        query_parts = words.copy()
        if pie_root:
            query_parts.append(pie_root)
        if semantic_pattern:
            query_parts.append(semantic_pattern)

        search_query = " ".join(query_parts)

        # Semantic coordinate discovery (hybrid semantic+lexical)
        semantic_results = await bimba_client.semantic_coordinate_discovery(
            query_text=search_query,
            alpha=alpha,
            max_results=max_results
        )

        resonances = []

        if semantic_results and semantic_results.get("success"):
            matches = semantic_results.get("matches", [])

            for match in matches:
                resonance = {
                    "coordinate": match.get("coordinate"),
                    "name": match.get("name"),
                    "similarity_score": match.get("similarity"),
                    "resonance_type": "semantic_hybrid",
                    "query_alpha": alpha
                }

                # Get coordinate details for richer context
                if match.get("coordinate"):
                    details = await bimba_client.resolve_coordinate(match["coordinate"])
                    if details and details.get("success"):
                        resonance["core_nature"] = details.get("coreNature")
                        resonance["primary_designation"] = details.get("primaryDesignation")

                resonances.append(resonance)

        # Lexical search for precise word matches (if needed)
        if words and len(resonances) < max_results:
            # Search for exact word matches in Bimba properties
            for word in words[:3]:  # Limit to first 3 words for performance
                lexical_results = await bimba_client.lexical_coordinate_search(
                    searchString=word,
                    limit=3
                )

                if lexical_results and lexical_results.get("success"):
                    lexical_matches = lexical_results.get("results", [])

                    for match in lexical_matches:
                        # Avoid duplicates
                        if not any(r["coordinate"] == match.get("coordinate") for r in resonances):
                            resonances.append({
                                "coordinate": match.get("coordinate"),
                                "name": match.get("name"),
                                "similarity_score": 1.0,  # Exact match
                                "resonance_type": "lexical_exact",
                                "matched_word": word
                            })

        # Limit to max_results
        resonances = resonances[:max_results]

        logger.info(f"Found {len(resonances)} Bimba resonances for query: '{search_query[:50]}...'")

        return {
            "success": True,
            "query": search_query,
            "resonances": resonances,
            "count": len(resonances),
            "search_params": {
                "alpha": alpha,
                "max_results": max_results,
                "words": words,
                "pie_root": pie_root
            }
        }

    except Exception as e:
        logger.error(f"Error detecting Bimba resonances: {e}")
        return {
            "success": False,
            "error": f"Resonance detection failed: {str(e)}",
            "resonances": [],
            "count": 0
        }


async def get_path_between_resonances(
    bimba_client,
    start_coordinate: str,
    end_coordinate: str,
    max_hops: int = 5
) -> Dict[str, Any]:
    """
    Find path between two resonant coordinates.

    Useful for understanding structural relationships between
    etymology patterns and Bimba architecture.

    Args:
        bimba_client: Bimba GraphQL/HTTP client
        start_coordinate: Starting coordinate
        end_coordinate: Ending coordinate
        max_hops: Maximum hops to traverse

    Returns:
        Dict with path information
    """
    try:
        path_result = await bimba_client.get_path_between_coordinates(
            startCoordinate=start_coordinate,
            endCoordinate=end_coordinate,
            maxHops=max_hops
        )

        if path_result and path_result.get("success"):
            path = path_result.get("path", {})
            return {
                "success": True,
                "start": start_coordinate,
                "end": end_coordinate,
                "path_length": path.get("length", 0),
                "path_components": path.get("components", []),
                "structural_pattern": _analyze_path_pattern(path)
            }
        else:
            return {
                "success": False,
                "error": "Path not found or coordinates unreachable",
                "start": start_coordinate,
                "end": end_coordinate
            }

    except Exception as e:
        logger.error(f"Error getting path between {start_coordinate} and {end_coordinate}: {e}")
        return {
            "success": False,
            "error": f"Path detection failed: {str(e)}"
        }


def _analyze_path_pattern(path: Dict[str, Any]) -> str:
    """
    Analyze path structure to identify QL patterns.

    Args:
        path: Path data from get_path_between_coordinates

    Returns:
        Pattern description
    """
    try:
        length = path.get("length", 0)

        # QL pattern detection
        if length == 2:
            return "2-fold dyad pattern"
        elif length == 3:
            return "3-fold triad pattern"
        elif length == 4:
            return "4-fold quaternal pattern"
        elif length == 6:
            return "6-fold mod6 complete cycle"
        elif length == 12:
            return "12-fold double coverage pattern"
        else:
            return f"{length}-hop path"

    except Exception as e:
        logger.error(f"Error analyzing path pattern: {e}")
        return "unknown pattern"


async def detect_resonances_async(
    session_id: str,
    community_data: Dict[str, Any],
    bimba_client
) -> Dict[str, Any]:
    """
    Asynchronous background resonance detection for a session.

    Called after etymology community creation to find Bimba resonances
    without blocking the user's dialogue flow.

    Args:
        session_id: Session identifier
        community_data: Etymology community data
        bimba_client: Bimba client

    Returns:
        Dict with resonance results (to be stored in session state)
    """
    try:
        logger.info(f"Starting async resonance detection for session {session_id}")

        words = community_data.get("words", [])
        pie_root = community_data.get("pie_root")
        semantic_pattern = community_data.get("semantic_pattern")

        # Run resonance detection
        resonances = await detect_bimba_resonances(
            bimba_client=bimba_client,
            words=words,
            pie_root=pie_root,
            semantic_pattern=semantic_pattern,
            alpha=0.6,  # Balanced semantic+lexical
            max_results=7  # Mod6 alignment
        )

        # If multiple resonances found, check paths between top matches
        if resonances.get("success") and len(resonances.get("resonances", [])) >= 2:
            top_resonances = resonances["resonances"][:3]
            paths = []

            for i in range(len(top_resonances) - 1):
                path = await get_path_between_resonances(
                    bimba_client=bimba_client,
                    start_coordinate=top_resonances[i]["coordinate"],
                    end_coordinate=top_resonances[i + 1]["coordinate"],
                    max_hops=5
                )
                if path.get("success"):
                    paths.append(path)

            resonances["structural_paths"] = paths

        logger.info(f"Async resonance detection complete for session {session_id}: {resonances.get('count', 0)} found")

        return {
            "success": True,
            "session_id": session_id,
            "resonances": resonances,
            "timestamp": "async_background"  # Would use actual timestamp
        }

    except Exception as e:
        logger.error(f"Error in async resonance detection for session {session_id}: {e}")
        return {
            "success": False,
            "session_id": session_id,
            "error": f"Async resonance detection failed: {str(e)}"
        }
