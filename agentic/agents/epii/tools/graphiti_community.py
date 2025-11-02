"""
Graphiti Community Tools for Etymology Archaeology

Wrappers around backend Graphiti service for creating etymology communities
and aphorisms with proper EA labeling.

Story 08.07 - AC: 2, 3 (Graphiti QL Community Creation, Aphorism Node Storage)
"""

import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


async def create_etymology_community(
    graphiti_client,
    group_id: str,
    name: str,
    description: str,
    words: List[str],
    quaternal_type: Optional[str] = None,
    pie_root: Optional[str] = None,
    semantic_pattern: Optional[str] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    bimba_coordinate: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create an etymology community with EA labeling.

    Creates :EA:Episodic labeled community in Graphiti episodic namespace.

    Args:
        graphiti_client: HTTP Graphiti client
        group_id: Multi-tenant group identifier
        name: Community name
        description: Community description
        words: List of words in this etymology cluster
        quaternal_type: QL structure type (TWO_PART, THREE_PART, FOUR_PART, etc.)
                       If None, backend auto-infers from word count
        pie_root: Optional PIE root
        semantic_pattern: Optional semantic shift pattern
        user_id: User who created this community
        session_id: Session context
        bimba_coordinate: Associated Bimba coordinate

    Returns:
        Dict with creation result
    """
    try:
        # Call backend Graphiti API
        result = await graphiti_client.create_etymology_community(
            group_id=group_id,
            name=name,
            description=description,
            quaternal_type=quaternal_type,
            words=words,
            pie_root=pie_root,
            semantic_pattern=semantic_pattern,
            user_id=user_id,
            session_id=session_id,
            bimba_coordinate=bimba_coordinate
        )

        if result.get("success", True):
            community_id = result.get("community", {}).get("id")
            logger.info(f"Created EA community: {name}")

            # CRITICAL FIX: Update session with words and PIE root
            if session_id and (words or pie_root):
                try:
                    await graphiti_client.update_session(
                        session_id=session_id,
                        group_id=group_id,
                        words_to_add=words if words else [],
                        pie_roots_to_add=[pie_root] if pie_root else [],
                        communities_to_add=[community_id] if community_id else []
                    )
                    logger.info(f"Updated session {session_id} with community data")
                except Exception as e:
                    logger.warning(f"Failed to update session: {e}")

            return {
                "success": True,
                "community_id": community_id,
                "name": name,
                "words": words,
                "ql_structure": quaternal_type,
                "message": "Etymology community created with EA labeling"
            }
        else:
            error_msg = result.get("message", "Unknown error")
            logger.warning(f"Failed to create EA community: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }

    except Exception as e:
        logger.error(f"Error creating etymology community: {e}")
        return {
            "success": False,
            "error": f"Community creation failed: {str(e)}"
        }


async def create_aphorism(
    graphiti_client,
    group_id: str,
    text: str,
    source_etymology: Optional[str] = None,
    bimba_coordinate: Optional[str] = None,
    domain: str = "EA",
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    community_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create an aphorism node for distilled wisdom.

    Creates :EA_Aphorism:Episodic or :Aphorism:Episodic labeled node in Graphiti.

    Args:
        graphiti_client: HTTP Graphiti client
        group_id: Multi-tenant group identifier
        text: The aphorism text
        source_etymology: Source word/etymology
        bimba_coordinate: Associated Bimba coordinate
        domain: Domain identifier (EA for etymology archaeology)
        user_id: User who created this aphorism
        session_id: Session context
        community_id: Related community ID

    Returns:
        Dict with creation result
    """
    try:
        # Call backend Graphiti API
        result = await graphiti_client.create_aphorism(
            group_id=group_id,
            text=text,
            source_etymology=source_etymology,
            bimba_coordinate=bimba_coordinate,
            domain=domain,
            user_id=user_id,
            session_id=session_id,
            community_id=community_id
        )

        if result.get("success", True):
            logger.info(f"Created aphorism: '{text[:50]}...'")
            return {
                "success": True,
                "aphorism_id": result.get("aphorism", {}).get("id"),
                "text": text,
                "domain": domain,
                "message": "Aphorism created with proper labeling"
            }
        else:
            error_msg = result.get("message", "Unknown error")
            logger.warning(f"Failed to create aphorism: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }

    except Exception as e:
        logger.error(f"Error creating aphorism: {e}")
        return {
            "success": False,
            "error": f"Aphorism creation failed: {str(e)}"
        }


# ==============================================================================
# Property Enrichment Tools - Depth Accrual Through Conversation
# ==============================================================================

async def update_community_properties(
    graphiti_client,
    community_id: str,
    group_id: str,
    properties: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update etymology community properties for depth accrual.

    As conversation deepens and meaning emerges, enrich communities with:
    - PIE roots discovered
    - Semantic patterns identified
    - Cross-references to other communities
    - Additional metadata

    Args:
        graphiti_client: HTTP Graphiti client
        community_id: Community UUID to update
        group_id: Multi-tenant group identifier
        properties: Dict of properties to update

    Returns:
        Dict with update result
    """
    try:
        result = await graphiti_client.update_community_properties(
            community_id=community_id,
            group_id=group_id,
            properties=properties
        )

        if result.get("success", True):
            logger.info(f"Updated community {community_id} with properties: {list(properties.keys())}")
            return {
                "success": True,
                "community_id": community_id,
                "updated_properties": result.get("updated_properties", list(properties.keys())),
                "message": "Community properties enriched successfully"
            }
        else:
            error_msg = result.get("error", "Unknown error")
            logger.warning(f"Failed to update community: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }

    except Exception as e:
        logger.error(f"Error updating community properties: {e}")
        return {
            "success": False,
            "error": f"Property update failed: {str(e)}"
        }


async def enrich_word_etymology(
    graphiti_client,
    word: str,
    community_id: str,
    group_id: str,
    etymology_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Enrich a word node with etymology data as discoveries emerge.

    Add depth to individual word nodes:
    - Cognates across languages
    - PIE lineage and root connections
    - Semantic shifts through history
    - Cross-linguistic patterns

    Args:
        graphiti_client: HTTP Graphiti client
        word: Word to enrich
        community_id: Parent community UUID
        group_id: Multi-tenant group identifier
        etymology_data: Etymology properties to add

    Returns:
        Dict with enrichment result
    """
    try:
        result = await graphiti_client.enrich_word_etymology(
            word=word,
            community_id=community_id,
            group_id=group_id,
            etymology_data=etymology_data
        )

        if result.get("success", True):
            logger.info(f"Enriched word '{word}' with etymology data")
            return {
                "success": True,
                "word": word,
                "community_id": community_id,
                "enriched_properties": result.get("enriched_properties", list(etymology_data.keys())),
                "message": "Word etymology enriched successfully"
            }
        else:
            error_msg = result.get("error", "Unknown error")
            logger.warning(f"Failed to enrich word: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }

    except Exception as e:
        logger.error(f"Error enriching word etymology: {e}")
        return {
            "success": False,
            "error": f"Word enrichment failed: {str(e)}"
        }


async def link_aphorism_to_community(
    graphiti_client,
    aphorism_id: str,
    community_id: str,
    group_id: str,
    relationship_type: str = "DISTILLS_FROM"
) -> Dict[str, Any]:
    """
    Link an aphorism to its source etymology community.

    Creates crystallization relationships showing wisdom derivation
    from etymological exploration. Enables tracing aphorisms back to
    their etymological roots.

    Args:
        graphiti_client: HTTP Graphiti client
        aphorism_id: Aphorism episode UUID
        community_id: Source community UUID
        group_id: Multi-tenant group identifier
        relationship_type: Relationship type (default: DISTILLS_FROM)

    Returns:
        Dict with linking result
    """
    try:
        result = await graphiti_client.link_aphorism_to_community(
            aphorism_id=aphorism_id,
            community_id=community_id,
            group_id=group_id,
            relationship_type=relationship_type
        )

        if result.get("success", True):
            logger.info(f"Linked aphorism {aphorism_id} to community {community_id}")
            return {
                "success": True,
                "aphorism_id": aphorism_id,
                "community_id": community_id,
                "relationship": result.get("relationship", relationship_type),
                "message": "Aphorism linked to community successfully"
            }
        else:
            error_msg = result.get("error", "Unknown error")
            logger.warning(f"Failed to link aphorism: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }

    except Exception as e:
        logger.error(f"Error linking aphorism to community: {e}")
        return {
            "success": False,
            "error": f"Aphorism linking failed: {str(e)}"
        }
