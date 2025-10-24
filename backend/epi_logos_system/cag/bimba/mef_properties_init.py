"""
MEF Functional Properties Initialization

Creates f_mef_* functional properties at Bimba coordinates #2-1-0 through #2-1-5.
These properties enable queryable MEF lens structure for Parashakti delegation.

Story 08.07 - AC: 4 (MEF Resonance Validation)

Philosophy: MEF lenses provide six perspectives for analyzing etymological patterns:
- #2-1-0: Archetypal-Numerical (psychoid number resonances, Adam-Eve charge)
- #2-1-1: Causal (primordial→quintessence relationships)
- #2-1-2: Logical (structural coherence, QL pattern compliance)
- #2-1-3: Processual (temporal evolution, semantic shifts)
- #2-1-4: Meta-Epistemic (knowing about knowing, reflexive patterns)
- #2-1-5: Divine-Scalar (vertical dimensionality, transcendence)
"""

import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


# MEF Functional Properties by Coordinate
MEF_FUNCTIONAL_PROPERTIES: Dict[str, Dict[str, str]] = {
    "#2-1-0": {
        # Archetypal-Numerical lens
        "f_mef_archetypal_lens_validation": "Check word against archetypal-numerical foundation patterns",
        "f_mef_archetypal_number_resonance": "Detect psychoid number resonances in etymology (2/3/4/6/12-fold)",
        "f_mef_archetypal_adam_eve_charge": "Analyze even/odd (structural/generative) charge patterns",
        "f_mef_archetypal_pattern_recognition": "Identify archetypal patterns in word clusters",
        "f_mef_archetypal_primordial_ground": "Check grounding in primordial archetypal structures"
    },
    "#2-1-1": {
        # Causal lens
        "f_mef_causal_relationship_detection": "Detect causative relationships in etymology chain",
        "f_mef_causal_primordial_quintessence": "Trace 0→5 (primordial→quintessence) causal flows",
        "f_mef_causal_semantic_causation": "Analyze causal patterns in semantic shifts",
        "f_mef_causal_derivative_analysis": "Identify derivative vs. source causal structures",
        "f_mef_causal_emergence_patterns": "Track emergence patterns from root to modern forms"
    },
    "#2-1-2": {
        # Logical lens
        "f_mef_logical_coherence_check": "Validate logical coherence of etymology structure",
        "f_mef_logical_ql_pattern_compliance": "Check compliance with QL structural principles",
        "f_mef_logical_contradiction_detection": "Identify logical contradictions in etymology claims",
        "f_mef_logical_inference_validation": "Validate inferential chains in etymological reasoning",
        "f_mef_logical_structural_integrity": "Assess structural integrity of word community"
    },
    "#2-1-3": {
        # Processual lens
        "f_mef_processual_temporal_evolution": "Trace temporal evolution from PIE to modern",
        "f_mef_processual_semantic_shift_analysis": "Analyze processual patterns in semantic shifts",
        "f_mef_processual_transformation_stages": "Identify transformation stages in word evolution",
        "f_mef_processual_emergence_tracking": "Track processual emergence of meaning layers",
        "f_mef_processual_continuous_vs_discrete": "Distinguish continuous vs. discrete change patterns"
    },
    "#2-1-4": {
        # Meta-Epistemic lens
        "f_mef_meta_epistemic_reflexivity": "Analyze reflexive patterns in knowing structures",
        "f_mef_meta_epistemic_knowing_about_knowing": "Examine meta-level epistemic patterns",
        "f_mef_meta_epistemic_self_reference": "Detect self-referential structures in etymology",
        "f_mef_meta_epistemic_closure_patterns": "Identify epistemic closure and completion",
        "f_mef_meta_epistemic_recognition_vs_construction": "Distinguish recognition from construction in etymology"
    },
    "#2-1-5": {
        # Divine-Scalar lens
        "f_mef_divine_scalar_vertical_dimensionality": "Assess vertical dimensionality in word structure",
        "f_mef_divine_scalar_transcendence_patterns": "Identify transcendence patterns (concrete→abstract)",
        "f_mef_divine_scalar_hierarchical_levels": "Map hierarchical levels in semantic structure",
        "f_mef_divine_scalar_emanation_analysis": "Analyze emanation patterns from source to derivatives",
        "f_mef_divine_scalar_completeness_assessment": "Assess divine scalar completeness (involution/evolution)"
    }
}


async def initialize_mef_properties(neo4j_client) -> Dict[str, Any]:
    """
    Initialize MEF functional properties at coordinates #2-1-0 through #2-1-5.

    This should be run once during system initialization or as a migration script.

    Args:
        neo4j_client: Shared Neo4j client instance

    Returns:
        Dict with initialization results
    """
    results = {
        "success": True,
        "coordinates_updated": [],
        "properties_added": 0,
        "errors": []
    }

    try:
        for coordinate, properties in MEF_FUNCTIONAL_PROPERTIES.items():
            try:
                # Build SET clause for all properties
                set_clauses = [f"n.{prop_name} = ${prop_name}" for prop_name in properties.keys()]

                query = f"""
                MATCH (n:BimbaNode {{bimbaCoordinate: $coordinate}})
                SET {', '.join(set_clauses)}
                RETURN n.bimbaCoordinate as coord, n.name as name
                """

                # Prepare parameters
                params = {"coordinate": coordinate}
                params.update(properties)

                # Execute query
                records, _, _ = await neo4j_client.execute_query(query, params)

                if records:
                    record = records[0]
                    results["coordinates_updated"].append({
                        "coordinate": record["coord"],
                        "name": record["name"],
                        "properties_added": len(properties)
                    })
                    results["properties_added"] += len(properties)
                    logger.info(
                        f"Added {len(properties)} MEF properties to {coordinate} ({record['name']})"
                    )
                else:
                    error_msg = f"Coordinate {coordinate} not found in Bimba graph"
                    results["errors"].append(error_msg)
                    logger.warning(error_msg)

            except Exception as e:
                error_msg = f"Error updating {coordinate}: {str(e)}"
                results["errors"].append(error_msg)
                logger.error(error_msg)

        if results["errors"]:
            results["success"] = False

        logger.info(
            f"MEF properties initialization complete: "
            f"{len(results['coordinates_updated'])}/6 coordinates updated, "
            f"{results['properties_added']} properties added"
        )

        return results

    except Exception as e:
        logger.error(f"Fatal error in MEF properties initialization: {e}")
        return {
            "success": False,
            "coordinates_updated": [],
            "properties_added": 0,
            "errors": [f"Fatal error: {str(e)}"]
        }


async def query_mef_properties(
    neo4j_client,
    coordinate: str
) -> Dict[str, Any]:
    """
    Query MEF functional properties for a specific coordinate.

    Used by Parashakti agent during MEF resonance analysis.

    Args:
        neo4j_client: Shared Neo4j client instance
        coordinate: Bimba coordinate (e.g., "#2-1-0")

    Returns:
        Dict with MEF properties for the coordinate
    """
    try:
        query = """
        MATCH (n:BimbaNode {bimbaCoordinate: $coordinate})
        RETURN n
        """

        records, _, _ = await neo4j_client.execute_query(query, {"coordinate": coordinate})

        if not records:
            return {
                "success": False,
                "coordinate": coordinate,
                "error": f"Coordinate {coordinate} not found"
            }

        node = dict(records[0]["n"])

        # Extract only f_mef_* properties
        mef_props = {
            key: value
            for key, value in node.items()
            if key.startswith("f_mef_")
        }

        return {
            "success": True,
            "coordinate": coordinate,
            "name": node.get("name"),
            "mef_properties": mef_props,
            "property_count": len(mef_props)
        }

    except Exception as e:
        logger.error(f"Error querying MEF properties for {coordinate}: {e}")
        return {
            "success": False,
            "coordinate": coordinate,
            "error": f"Query failed: {str(e)}"
        }


def get_mef_coordinate_description(coordinate: str) -> str:
    """
    Get human-readable description of MEF lens at coordinate.

    Args:
        coordinate: Bimba coordinate

    Returns:
        Description string
    """
    descriptions = {
        "#2-1-0": "Archetypal-Numerical: Psychoid number resonances and structural/generative charge patterns",
        "#2-1-1": "Causal: Primordial→Quintessence relationships and causative etymology flows",
        "#2-1-2": "Logical: Structural coherence and QL pattern compliance",
        "#2-1-3": "Processual: Temporal evolution and semantic shift dynamics",
        "#2-1-4": "Meta-Epistemic: Reflexive knowing patterns and epistemic closure",
        "#2-1-5": "Divine-Scalar: Vertical dimensionality and transcendence patterns"
    }

    return descriptions.get(coordinate, "Unknown MEF coordinate")
