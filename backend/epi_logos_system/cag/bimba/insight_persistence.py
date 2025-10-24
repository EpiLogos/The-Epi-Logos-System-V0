"""
MEF and Resonance Insight Persistence to Neo4j

Persists background analysis results to Neo4j as functional properties.
MEF analyses and Bimba resonances are stored on EA community nodes.

Story 08.07 Enhancement - Full Etymology Archaeology UX Flow

Philosophy: Insights accumulate over time, enriching communities.
Each MEF lens and resonance becomes discoverable metadata.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# ===== BIMBA RESONANCE PERSISTENCE =====

async def persist_bimba_resonance(
    neo4j_client,
    community_id: str,
    resonance_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Persist Bimba coordinate resonance to EA community node.

    Creates f_resonance_{coordinate_slug} property and optional relationship.

    Args:
        neo4j_client: Neo4j client instance
        community_id: EA community ID
        resonance_data: Resonance data dict with:
            - coordinate: Bimba coordinate (e.g., "#1-2-3")
            - name: Coordinate name
            - resonance_strength: Float 0-1 (semantic similarity)
            - resonance_type: String (e.g., "semantic", "archetypal", "etymological")
            - detected_at: ISO timestamp

    Returns:
        Dict with success status and metadata

    Story 08.07 Enhancement - Bimba Resonance Persistence
    """
    try:
        coordinate = resonance_data.get("coordinate", "unknown")
        resonance_strength = resonance_data.get("resonance_strength", 0.0)
        resonance_type = resonance_data.get("resonance_type", "semantic")

        logger.info(
            f"Persisting Bimba resonance ({coordinate}, strength={resonance_strength:.2f}) "
            f"to community {community_id}"
        )

        # Build functional property name (replace special chars with underscores)
        coordinate_slug = coordinate.replace("#", "").replace("-", "_").replace(".", "_")
        property_name = f"f_resonance_{coordinate_slug}"

        # Build resonance metadata
        resonance_metadata = {
            "coordinate": coordinate,
            "name": resonance_data.get("name", ""),
            "resonance_strength": resonance_strength,
            "resonance_type": resonance_type,
            "detected_at": resonance_data.get("detected_at") or datetime.now(timezone.utc).isoformat(),
            "description": resonance_data.get("description", "")
        }

        # Update EA community node with resonance property
        query = """
        MATCH (c:EA:Episodic {id: $community_id})
        SET c[$property_name] = $resonance_metadata
        SET c.last_activity = $last_activity
        RETURN c.id as id, c.name as name
        """

        params = {
            "community_id": community_id,
            "property_name": property_name,
            "resonance_metadata": resonance_metadata,
            "last_activity": datetime.now(timezone.utc).isoformat()
        }

        records, _, _ = await neo4j_client.execute_query(query, params)

        if not records:
            logger.warning(f"Community {community_id} not found for resonance persistence")
            return {
                "success": False,
                "error": f"Community {community_id} not found"
            }

        record = records[0]

        # Optionally create relationship to Bimba coordinate node
        if resonance_strength >= 0.5:  # Only create relationship for strong resonances
            await _create_resonance_relationship(
                neo4j_client,
                community_id,
                coordinate,
                resonance_strength,
                resonance_type
            )

        logger.info(
            f"Persisted Bimba resonance {property_name} to community {community_id} "
            f"({record['name']})"
        )

        return {
            "success": True,
            "community_id": record["id"],
            "community_name": record["name"],
            "property_name": property_name,
            "coordinate": coordinate,
            "resonance_strength": resonance_strength
        }

    except Exception as e:
        logger.error(f"Error persisting Bimba resonance for {community_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def _create_resonance_relationship(
    neo4j_client,
    community_id: str,
    coordinate: str,
    resonance_strength: float,
    resonance_type: str
) -> None:
    """
    Create RESONATES_WITH relationship between EA community and Bimba coordinate.

    Args:
        neo4j_client: Neo4j client instance
        community_id: EA community ID
        coordinate: Bimba coordinate
        resonance_strength: Resonance strength (0-1)
        resonance_type: Type of resonance
    """
    try:
        query = """
        MATCH (c:EA:Episodic {id: $community_id})
        MATCH (b:BimbaNode {bimbaCoordinate: $coordinate})
        MERGE (c)-[r:RESONATES_WITH]->(b)
        SET r.strength = $strength
        SET r.type = $type
        SET r.detected_at = $detected_at
        """

        params = {
            "community_id": community_id,
            "coordinate": coordinate,
            "strength": resonance_strength,
            "type": resonance_type,
            "detected_at": datetime.now(timezone.utc).isoformat()
        }

        await neo4j_client.execute_query(query, params)
        logger.debug(
            f"Created RESONATES_WITH relationship: {community_id} -> {coordinate}"
        )

    except Exception as e:
        logger.error(
            f"Error creating resonance relationship {community_id} -> {coordinate}: {e}"
        )


async def persist_all_resonances(
    neo4j_client,
    community_id: str,
    resonances: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Persist all Bimba resonances for community.

    Args:
        neo4j_client: Neo4j client instance
        community_id: EA community ID
        resonances: List of resonance dicts

    Returns:
        Dict with summary of persisted resonances

    Story 08.07 Enhancement - Batch Resonance Persistence
    """
    try:
        logger.info(
            f"Persisting {len(resonances)} Bimba resonances to community {community_id}"
        )

        persisted_count = 0
        errors = []

        for resonance in resonances:
            result = await persist_bimba_resonance(
                neo4j_client,
                community_id,
                resonance
            )

            if result.get("success"):
                persisted_count += 1
            else:
                errors.append({
                    "coordinate": resonance.get("coordinate"),
                    "error": result.get("error")
                })

        logger.info(
            f"Persisted {persisted_count}/{len(resonances)} resonances "
            f"to community {community_id}"
        )

        return {
            "success": len(errors) == 0,
            "community_id": community_id,
            "total_resonances": len(resonances),
            "persisted_count": persisted_count,
            "errors": errors
        }

    except Exception as e:
        logger.error(f"Error in batch resonance persistence for {community_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def get_bimba_resonances(
    neo4j_client,
    community_id: str,
    min_strength: float = 0.0
) -> Dict[str, Any]:
    """
    Retrieve Bimba resonances from community node.

    Args:
        neo4j_client: Neo4j client instance
        community_id: EA community ID
        min_strength: Minimum resonance strength to include (default 0.0 = all)

    Returns:
        Dict with resonances

    Story 08.07 Enhancement - Resonance Retrieval
    """
    try:
        query = """
        MATCH (c:EA:Episodic {id: $community_id})
        RETURN properties(c) as props
        """
        params = {"community_id": community_id}

        records, _, _ = await neo4j_client.execute_query(query, params)

        if not records:
            return {
                "success": False,
                "error": f"Community {community_id} not found"
            }

        props = records[0]["props"]

        # Filter for f_resonance_* properties
        resonance_props = {
            k: v for k, v in props.items()
            if k.startswith("f_resonance_")
        }

        # Filter by strength if specified
        if min_strength > 0.0:
            resonance_props = {
                k: v for k, v in resonance_props.items()
                if v.get("resonance_strength", 0.0) >= min_strength
            }

        # Sort by strength (descending)
        sorted_resonances = sorted(
            resonance_props.items(),
            key=lambda x: x[1].get("resonance_strength", 0.0),
            reverse=True
        )

        return {
            "success": True,
            "community_id": community_id,
            "total_resonances": len(sorted_resonances),
            "resonances": [
                {
                    "property_name": k,
                    **v
                }
                for k, v in sorted_resonances
            ]
        }

    except Exception as e:
        logger.error(f"Error retrieving resonances for {community_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }


# ===== MEF INSIGHT PERSISTENCE =====


async def persist_mef_insight(
    neo4j_client,
    community_id: str,
    lens_name: str,
    lens_coordinate: str,
    analysis_result: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Persist MEF lens analysis result to community node as functional property.

    Creates f_mef_{lens_name} property on EA community node in Neo4j.

    Args:
        neo4j_client: Neo4j client instance
        community_id: EA community ID
        lens_name: MEF lens name (e.g., "archetypal_numerical")
        lens_coordinate: Bimba coordinate for lens (e.g., "#2-1-0")
        analysis_result: MEF analysis result dict with insights, patterns, etc.

    Returns:
        Dict with success status and metadata

    Story 08.07 Enhancement - MEF Insight Persistence
    """
    try:
        logger.info(
            f"Persisting MEF insight ({lens_name}) to community {community_id}"
        )

        # Build functional property name
        property_name = f"f_mef_{lens_name}"

        # Extract key insights from analysis
        insight_data = {
            "lens": lens_name,
            "coordinate": lens_coordinate,
            "analyzed_at": datetime.now(timezone.utc).isoformat(),
            "insights": analysis_result.get("insights", ""),
            "patterns_discovered": analysis_result.get("patterns_discovered", []),
            "resonances": analysis_result.get("resonances", []),
            "analysis_depth": analysis_result.get("analysis_depth", "standard")
        }

        # Update EA community node with MEF insight property
        query = """
        MATCH (c:EA:Episodic {id: $community_id})
        SET c[$property_name] = $insight_data
        SET c.last_activity = $last_activity
        RETURN c.id as id, c.name as name
        """

        params = {
            "community_id": community_id,
            "property_name": property_name,
            "insight_data": insight_data,
            "last_activity": datetime.now(timezone.utc).isoformat()
        }

        records, _, _ = await neo4j_client.execute_query(query, params)

        if records:
            record = records[0]
            logger.info(
                f"Persisted MEF insight {property_name} to community {community_id} "
                f"({record['name']})"
            )
            return {
                "success": True,
                "community_id": record["id"],
                "community_name": record["name"],
                "property_name": property_name,
                "lens": lens_name,
                "coordinate": lens_coordinate
            }
        else:
            logger.warning(f"Community {community_id} not found for MEF persistence")
            return {
                "success": False,
                "error": f"Community {community_id} not found"
            }

    except Exception as e:
        logger.error(f"Error persisting MEF insight for {community_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def persist_all_mef_insights(
    neo4j_client,
    community_id: str,
    mef_results: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Persist all MEF lens analyses to community node.

    Iterates through MEF analysis results and persists each lens.

    Args:
        neo4j_client: Neo4j client instance
        community_id: EA community ID
        mef_results: Dict with lens results, format:
            {
                "lenses": [
                    {
                        "lens": "archetypal_numerical",
                        "coordinate": "#2-1-0",
                        "analysis": {...}
                    },
                    ...
                ]
            }

    Returns:
        Dict with summary of persisted insights

    Story 08.07 Enhancement - Batch MEF Persistence
    """
    try:
        logger.info(
            f"Persisting all MEF insights to community {community_id}"
        )

        lenses = mef_results.get("lenses", [])
        persisted_count = 0
        errors = []

        for lens_result in lenses:
            lens_name = lens_result.get("lens")
            lens_coordinate = lens_result.get("coordinate")
            analysis = lens_result.get("analysis", {})

            result = await persist_mef_insight(
                neo4j_client,
                community_id,
                lens_name,
                lens_coordinate,
                analysis
            )

            if result.get("success"):
                persisted_count += 1
            else:
                errors.append({
                    "lens": lens_name,
                    "error": result.get("error")
                })

        logger.info(
            f"Persisted {persisted_count}/{len(lenses)} MEF insights "
            f"to community {community_id}"
        )

        return {
            "success": len(errors) == 0,
            "community_id": community_id,
            "total_lenses": len(lenses),
            "persisted_count": persisted_count,
            "errors": errors
        }

    except Exception as e:
        logger.error(f"Error in batch MEF persistence for {community_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def get_mef_insights(
    neo4j_client,
    community_id: str,
    lens_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Retrieve MEF insights from community node.

    Args:
        neo4j_client: Neo4j client instance
        community_id: EA community ID
        lens_name: Optional specific lens name (returns all if None)

    Returns:
        Dict with MEF insights

    Story 08.07 Enhancement - MEF Insight Retrieval
    """
    try:
        if lens_name:
            # Get specific lens
            property_name = f"f_mef_{lens_name}"
            query = """
            MATCH (c:EA:Episodic {id: $community_id})
            RETURN c[$property_name] as insight
            """
            params = {"community_id": community_id, "property_name": property_name}

            records, _, _ = await neo4j_client.execute_query(query, params)

            if records and records[0]["insight"]:
                return {
                    "success": True,
                    "lens": lens_name,
                    "insight": records[0]["insight"]
                }
            else:
                return {
                    "success": False,
                    "error": f"MEF insight for {lens_name} not found"
                }
        else:
            # Get all MEF insights
            query = """
            MATCH (c:EA:Episodic {id: $community_id})
            RETURN properties(c) as props
            """
            params = {"community_id": community_id}

            records, _, _ = await neo4j_client.execute_query(query, params)

            if not records:
                return {
                    "success": False,
                    "error": f"Community {community_id} not found"
                }

            props = records[0]["props"]

            # Filter for f_mef_* properties
            mef_insights = {
                k: v for k, v in props.items()
                if k.startswith("f_mef_")
            }

            return {
                "success": True,
                "community_id": community_id,
                "total_insights": len(mef_insights),
                "insights": mef_insights
            }

    except Exception as e:
        logger.error(f"Error retrieving MEF insights for {community_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }


async def check_pending_mef_insights(
    neo4j_client,
    session_id: str
) -> Dict[str, Any]:
    """
    Check which communities in session have pending (incomplete) MEF analyses.

    Useful for surfacing insights when background tasks complete.

    Args:
        neo4j_client: Neo4j client instance
        session_id: Etymology session ID

    Returns:
        Dict with pending and completed insights summary

    Story 08.07 Enhancement - Insight Status Checking
    """
    try:
        # Get all EA communities for session
        query = """
        MATCH (c:EA:Episodic {session_id: $session_id})
        RETURN c.id as id, c.name as name, properties(c) as props
        """
        params = {"session_id": session_id}

        records, _, _ = await neo4j_client.execute_query(query, params)

        communities = []
        for record in records:
            community_id = record["id"]
            community_name = record["name"]
            props = record["props"]

            # Count MEF insights present
            mef_count = len([k for k in props.keys() if k.startswith("f_mef_")])

            # Expected: 6 MEF lenses (full analysis)
            is_complete = mef_count >= 6

            communities.append({
                "id": community_id,
                "name": community_name,
                "mef_insights_count": mef_count,
                "is_complete": is_complete
            })

        pending = [c for c in communities if not c["is_complete"]]
        completed = [c for c in communities if c["is_complete"]]

        return {
            "success": True,
            "session_id": session_id,
            "total_communities": len(communities),
            "pending_count": len(pending),
            "completed_count": len(completed),
            "pending_communities": pending,
            "completed_communities": completed
        }

    except Exception as e:
        logger.error(f"Error checking pending MEF insights for session {session_id}: {e}")
        return {
            "success": False,
            "error": str(e)
        }
