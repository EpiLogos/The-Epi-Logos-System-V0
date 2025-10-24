"""
Conversation Capture for LightRAG Sedimentation

Captures etymology dialogue and sediments into LightRAG for Möbius return (#5→#0).
Enables sedimented knowledge to become new ground for future explorations.

Story 08.07 - AC: 6, 10 (Conversation-to-Document Flow, Möbius Return Pattern)

Philosophy: Phase 5 sedimentation is user-initiated, not automatic.
Completed explorations become searchable gnostic knowledge.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


async def capture_etymology_dialogue(
    session_id: str,
    conversation_history: List[Dict[str, Any]],
    communities_created: List[Dict[str, Any]],
    aphorisms_created: List[Dict[str, Any]],
    bimba_resonances: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Capture etymology dialogue history for sedimentation.

    Compiles conversation into structured document format with
    metadata for LightRAG ingestion.

    Args:
        session_id: Session identifier
        conversation_history: List of dialogue turns
        communities_created: Etymology communities from this session
        aphorisms_created: Aphorisms distilled from this session
        bimba_resonances: Optional Bimba coordinate resonances

    Returns:
        Dict with captured conversation data
    """
    try:
        # Build markdown document from conversation
        document_parts = []

        # Header
        document_parts.append(f"# Etymology Archaeology Session: {session_id}")
        document_parts.append(f"\n**Session Date**: {datetime.now(timezone.utc).isoformat()}")
        document_parts.append(f"\n## Dialogue\n")

        # Conversation turns
        for turn in conversation_history:
            speaker = turn.get("speaker", "Unknown")
            message = turn.get("message", "")
            document_parts.append(f"\n**{speaker}**: {message}\n")

        # Communities created
        if communities_created:
            document_parts.append("\n## Etymology Communities\n")
            for community in communities_created:
                name = community.get("name", "Unnamed")
                words = community.get("words", [])
                pie_root = community.get("pie_root")
                semantic_pattern = community.get("semantic_pattern")

                document_parts.append(f"\n### {name}")
                document_parts.append(f"\n**Words**: {', '.join(words)}")
                if pie_root:
                    document_parts.append(f"\n**PIE Root**: {pie_root}")
                if semantic_pattern:
                    document_parts.append(f"\n**Semantic Pattern**: {semantic_pattern}")
                document_parts.append("\n")

        # Aphorisms distilled
        if aphorisms_created:
            document_parts.append("\n## Aphorisms Distilled\n")
            for aphorism in aphorisms_created:
                text = aphorism.get("text", "")
                source = aphorism.get("source_etymology", "")
                document_parts.append(f"\n- \"{text}\"")
                if source:
                    document_parts.append(f" (from: {source})")
                document_parts.append("\n")

        # Bimba resonances
        if bimba_resonances:
            document_parts.append("\n## Bimba Coordinate Resonances\n")
            for resonance in bimba_resonances[:5]:  # Top 5
                coord = resonance.get("coordinate", "")
                name = resonance.get("name", "")
                score = resonance.get("similarity_score", 0)
                document_parts.append(f"\n- **{coord}** ({name}) - Score: {score:.2f}")
            document_parts.append("\n")

        # Compile full document
        document_text = "\n".join(document_parts)

        return {
            "success": True,
            "session_id": session_id,
            "document_text": document_text,
            "word_count": len(document_text.split()),
            "communities_count": len(communities_created),
            "aphorisms_count": len(aphorisms_created),
            "resonances_count": len(bimba_resonances) if bimba_resonances else 0
        }

    except Exception as e:
        logger.error(f"Error capturing etymology dialogue: {e}")
        return {
            "success": False,
            "error": f"Conversation capture failed: {str(e)}"
        }


async def sediment_to_lightrag(
    lightrag_service,
    session_id: str,
    document_text: str,
    communities_created: List[Dict[str, Any]],
    aphorisms_created: List[Dict[str, Any]],
    user_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Sediment captured conversation to LightRAG gnostic namespace.

    Implements Möbius return: #5→#0 twist where sedimented knowledge
    becomes new ground for future etymological explorations.

    Args:
        lightrag_service: LightRAG service instance
        session_id: Session identifier
        document_text: Captured conversation markdown
        communities_created: Communities for metadata tagging
        aphorisms_created: Aphorisms for metadata tagging
        user_id: Optional user identifier

    Returns:
        Dict with sedimentation result
    """
    try:
        # Build metadata
        metadata = {
            "source_type": "etymology_archaeology",
            "session_id": session_id,
            "domain": "EA",
            "namespace": "gnostic",
            "communities": [c.get("id") for c in communities_created],
            "aphorisms": [a.get("id") for a in aphorisms_created],
            "word_families": [],
            "pie_roots": [],
            "bimba_coordinates": []
        }

        # Extract word families and PIE roots
        for community in communities_created:
            words = community.get("words", [])
            metadata["word_families"].extend(words)

            pie_root = community.get("pie_root")
            if pie_root and pie_root not in metadata["pie_roots"]:
                metadata["pie_roots"].append(pie_root)

            bimba_coord = community.get("bimba_coordinate")
            if bimba_coord and bimba_coord not in metadata["bimba_coordinates"]:
                metadata["bimba_coordinates"].append(bimba_coord)

        # Create BimbaDocument structure (from lightrag models)
        from backend.epi_logos_system.cag.lightrag.models import BimbaDocument

        doc = BimbaDocument(
            source_id=f"ea_session_{session_id}",
            content=document_text,
            metadata=metadata,
            coordinates=metadata["bimba_coordinates"] if metadata["bimba_coordinates"] else ["#5"],  # Default #5 for Epii
            document_type="etymology_archaeology"
        )

        # Ingest to LightRAG
        result = await lightrag_service.ingest_document_with_coordinates(doc)

        if result.get("success"):
            logger.info(f"Successfully sedimented session {session_id} to LightRAG")
            return {
                "success": True,
                "session_id": session_id,
                "document_id": result.get("document_id"),
                "lightrag_result": result.get("result"),
                "mobius_return": "Sedimented knowledge now available for future #0 grounding",
                "gnostic_namespace": True
            }
        else:
            error_msg = result.get("error", "Unknown LightRAG error")
            logger.warning(f"Failed to sediment session {session_id}: {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "session_id": session_id
            }

    except Exception as e:
        logger.error(f"Error sedimenting to LightRAG: {e}")
        return {
            "success": False,
            "error": f"LightRAG sedimentation failed: {str(e)}",
            "session_id": session_id
        }


async def check_sedimented_explorations(
    lightrag_service,
    query: str,
    limit: int = 5
) -> Dict[str, Any]:
    """
    Search sedimented etymology explorations in gnostic namespace.

    Enables Möbius return: past explorations inform new groundings.

    Args:
        lightrag_service: LightRAG service instance
        query: Search query
        limit: Maximum results

    Returns:
        Dict with search results
    """
    try:
        # Search gnostic namespace for etymology archaeology documents
        result = await lightrag_service.search(
            query=query,
            mode="hybrid",  # Hybrid semantic + keyword search
            only_need_context=False
        )

        if result.get("success"):
            return {
                "success": True,
                "query": query,
                "explorations_found": result.get("results", []),
                "count": len(result.get("results", [])),
                "mobius_context": "Past explorations available as new ground"
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Search failed"),
                "query": query
            }

    except Exception as e:
        logger.error(f"Error checking sedimented explorations: {e}")
        return {
            "success": False,
            "error": f"Sedimentation search failed: {str(e)}",
            "query": query
        }


def should_sediment_exploration(
    conversation_turns: int,
    communities_created: int,
    aphorisms_created: int,
    user_satisfaction: Optional[str] = None
) -> Dict[str, Any]:
    """
    Determine if exploration is substantial enough for sedimentation.

    Guidelines, not enforcement - user has final say.

    Args:
        conversation_turns: Number of dialogue turns
        communities_created: Communities formed
        aphorisms_created: Aphorisms distilled
        user_satisfaction: Optional user feedback

    Returns:
        Dict with sedimentation recommendation
    """
    # Sedimentation criteria
    substantial = (
        conversation_turns >= 5 and
        (communities_created >= 1 or aphorisms_created >= 1)
    )

    recommendation = {
        "should_sediment": substantial,
        "reasons": [],
        "conversation_turns": conversation_turns,
        "communities_created": communities_created,
        "aphorisms_created": aphorisms_created
    }

    if substantial:
        recommendation["reasons"].append("Conversation has substantial depth")
        if communities_created > 0:
            recommendation["reasons"].append(f"{communities_created} etymology communities created")
        if aphorisms_created > 0:
            recommendation["reasons"].append(f"{aphorisms_created} aphorisms distilled")
    else:
        recommendation["reasons"].append("Exploration may benefit from further development")

    recommendation["user_choice"] = "Final decision rests with user - sedimentation is optional"

    return recommendation
