"""
Etymology Dialogue Tools

Conversational etymology exploration using LLM knowledge and web search.
Implements AC: 1 - Conversational Etymology Exploration.

Philosophy: Con-scire partnership - human intuition guides, AI supports.
No external etymology databases - LLM knowledge + web search only.
"""

import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger(__name__)


# Etymology web resources (used for web search guidance)
ETYMOLOGY_RESOURCES = [
    "etymonline.com",  # Online Etymology Dictionary
    "wiktionary.org",  # Collaborative multilingual dictionary
    "etymologie.info",  # German etymology resource
]


async def etymology_search(
    word: str,
    context: Optional[str] = None,
    search_pies: bool = True
) -> Dict[str, Any]:
    """
    Search for etymology of a word using LLM knowledge and web guidance.

    This is NOT a database query - it's a conversational support tool.
    The LLM will use its trained knowledge of etymologies plus web search
    to help explore word origins, PIE roots, cognates, and semantic shifts.

    Args:
        word: The word to explore
        context: Optional context for disambiguation
        search_pies: Whether to include PIE (Proto-Indo-European) roots

    Returns:
        Dict with etymology information and search guidance
    """
    try:
        # Prepare search query for web resources
        search_query = f"etymology {word}"
        if context:
            search_query += f" {context}"
        if search_pies:
            search_query += " PIE root"

        # Return guidance for LLM to use with web search
        # (The actual web search will be performed by the LLM's native capabilities)
        return {
            "success": True,
            "word": word,
            "search_query": search_query,
            "suggested_resources": ETYMOLOGY_RESOURCES,
            "guidance": {
                "explore_PIE": search_pies,
                "check_cognates": True,
                "trace_semantic_shifts": True,
                "find_cross_linguistic_patterns": True
            },
            "conversation_hints": [
                f"Search for '{word}' etymology on etymonline.com",
                f"Check Wiktionary for '{word}' cognates and PIE roots",
                f"Look for semantic evolution of '{word}' across languages"
            ]
        }

    except Exception as e:
        logger.error(f"Error in etymology_search for '{word}': {e}")
        return {
            "success": False,
            "word": word,
            "error": f"Etymology search failed: {str(e)}"
        }


async def trace_etymology_chain(
    words: List[str],
    find_common_root: bool = True
) -> Dict[str, Any]:
    """
    Trace etymological relationships between multiple words.

    Helps identify shared PIE roots, cognate relationships, and
    semantic patterns across a word cluster.

    Args:
        words: List of words to trace relationships between
        find_common_root: Whether to search for common PIE ancestor

    Returns:
        Dict with chain analysis and relationship patterns
    """
    try:
        if not words or len(words) < 2:
            return {
                "success": False,
                "error": "Need at least 2 words to trace etymology chain"
            }

        # Prepare guidance for conversational exploration
        search_queries = [
            f"PIE root connecting {', '.join(words[:3])}",
            f"cognates {words[0]} {words[1]}" if len(words) >= 2 else None,
            f"semantic relationship {words[0]} etymology"
        ]

        return {
            "success": True,
            "words": words,
            "chain_length": len(words),
            "search_queries": [q for q in search_queries if q],
            "exploration_steps": [
                "1. Find individual etymologies for each word",
                "2. Identify shared PIE roots or language families",
                "3. Map semantic relationships (causative, derivative, etc.)",
                "4. Check for QL patterns (2/3/4/6/12-fold structures)"
            ],
            "pattern_detection": {
                "check_causal_relationships": True,
                "identify_primordial_quintessence": True,
                "find_QL_structure": True
            }
        }

    except Exception as e:
        logger.error(f"Error in trace_etymology_chain: {e}")
        return {
            "success": False,
            "error": f"Chain tracing failed: {str(e)}"
        }


def extract_pie_root(etymology_text: str) -> Optional[str]:
    """
    Extract PIE root from etymology text (helper for LLM parsing).

    Args:
        etymology_text: Raw etymology text from web search

    Returns:
        Extracted PIE root if found, None otherwise
    """
    try:
        # Common PIE root patterns
        # Example: "from PIE *seh₂g-"
        # This is a simple helper - actual extraction done by LLM

        pie_indicators = ["PIE *", "Proto-Indo-European *", "from *"]

        for indicator in pie_indicators:
            if indicator in etymology_text:
                # Return hint for LLM to extract
                return f"PIE root detected near '{indicator}' - extract full root"

        return None

    except Exception as e:
        logger.error(f"Error extracting PIE root: {e}")
        return None


def identify_semantic_shift(word: str, historical_meaning: str, current_meaning: str) -> Dict[str, Any]:
    """
    Identify semantic shift patterns between historical and current meanings.

    Args:
        word: The word being analyzed
        historical_meaning: Original/historical meaning
        current_meaning: Current/modern meaning

    Returns:
        Dict with shift analysis and pattern classification
    """
    try:
        # Classify semantic shift types
        shift_types = {
            "metaphorical": "Concrete → Abstract",
            "metonymic": "Part → Whole or Whole → Part",
            "broadening": "Specific → General",
            "narrowing": "General → Specific",
            "amelioration": "Negative → Positive",
            "pejoration": "Positive → Negative"
        }

        return {
            "word": word,
            "historical_meaning": historical_meaning,
            "current_meaning": current_meaning,
            "shift_analysis": {
                "type": "Determine shift type using guidance below",
                "shift_types_available": shift_types,
                "ql_resonance": "Check if shift follows QL patterns (e.g., 0→5 primordial→quintessence)"
            },
            "guidance": "Analyze the meaning evolution and classify using shift_types"
        }

    except Exception as e:
        logger.error(f"Error identifying semantic shift for '{word}': {e}")
        return {
            "error": f"Semantic shift analysis failed: {str(e)}"
        }
