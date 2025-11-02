"""
Setup MEF capability and workflow properties on #5-4.2 Parashakti node.

Story 08.13: MEF Resonance Analysis via Parashakti Agent
Phase 1: Bimba Node Setup

This script adds:
1. f_capability_mef_analysis_* properties (MEF 6-lens framework)
2. f_workflow_mefAnalysis_* properties (Etymology Atelier execution pipeline)

Run from project root:
    python -m backend.scripts.setup_mef_parashakti_node
"""

import asyncio
import logging
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from agentic.clients.bimba_graphql_client import BimbaGraphQLClient
from shared.database import Neo4jClient

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# MEF Capability Properties
MEF_CAPABILITY_PROPS = {
    "f_capability_mef_analysis_description": (
        "Apply the 6-lens Meta-Epistemic Framework to any domain, revealing archetypal patterns, "
        "causal structures, logical relations, processual becomings, epistemic stages, and divine-scalar densities"
    ),

    "f_capability_mef_analysis_lenses": '["archetypal", "causal", "logical", "processual", "meta_epistemic", "divine_scalar"]',

    "f_capability_mef_analysis_lens_0_archetypal": """Lens #0: Archetypal-Numerical Foundation

Investigate the number-archetypes structuring the domain:
- #0-0 Zero: Pregnant void as question space
- #0-1 One: Primordial unity asking 'what?'
- #0-2 Two: Sacred dyad asking 'how?'
- #0-3 Three: Synthetic triad asking 'who/whereby?'
- #0-4 Four: Grounding tetrad asking 'when/where?'
- #0-5 Five: Transcendent pentad asking 'why?'

Identify which archetypal numbers are active in the patterns, structures, and semantic constellations.""",

    "f_capability_mef_analysis_lens_1_causal": """Lens #1: Causal Lens - Four Causes as Living Dynamics

Map Jung's psychological functions onto Aristotle's causes:
- Material Cause ← Sensation: The immediate givenness, substrate
- Efficient Cause ← Feeling: The energetic valuation moving transformation
- Formal Cause ← Thinking: The logical architecture organizing patterns
- Final Cause ← Intuition: The purpose/telos drawing toward completion
- Will as Quintessence: The meta-causal power transcending yet enabling all causation

Analyze how these causes operate in the domain's evolution.""",

    "f_capability_mef_analysis_lens_2_logical": """Lens #2: Logical Lens - Tetralemma as Complete Navigation

Apply Nagarjuna's catuskoti to the domain's semantic space:
- Position #1 - Affirmation (IS): What definitively IS
- Position #2 - Negation (IS NOT): What definitively is NOT
- Position #3 - Paradox (BOTH): Where contradictions coexist
- Position #4 - Apophatic (NEITHER): What transcends the is/is-not framework
- Position #5 - Silence: The unspeakable truth beyond linguistic capture

Identify which logical positions the domain occupies.""",

    "f_capability_mef_analysis_lens_3_processual": """Lens #3: Processual Lens - Concrescence as Universal Rhythm

Map the domain through Whitehead's 6-stage organic growth:
- #3-0 Soil: Initial data reception (inherited meanings from past)
- #3-1 Seeding: Conceptual prehension (organizing pattern)
- #3-2 Sprouting: Physical prehension (energetic breakthrough)
- #3-3 Blooming: Integration (many meanings unified toward subjective aim)
- #3-4 Flowering: Satisfaction (achieves distinctive form)
- #3-5 Maturity: Objective immortality (becomes datum for future)

Trace the domain's processual becoming.""",

    "f_capability_mef_analysis_lens_4_meta_epistemic": """Lens #4: Meta-Epistemic Lens - Consciousness Examining Itself

Analyze the domain through 6 epistemic stages:
- #4-0 Ajnana (Unknowing): Pre-reflective state before knowing
- #4-1 Ontology: First-order knowing (what IS)
- #4-2 Epistemology: Second-order knowing (HOW we know)
- #4-3 Psychology: Third-order knowing (the KNOWER's relationship)
- #4-4 Context: Fourth-order knowing (situated/embodied knowing)
- #4-5 Jnana (Wisdom): Fifth-order knowing (integral wisdom transcending stages)

Determine which epistemic stage the domain reveals.""",

    "f_capability_mef_analysis_lens_5_divine_scalar": """Lens #5: Divine-Scalar Lens - Reality as Living Speech

Map the domain through Kashmir Shaivism's 6 levels of Vak (divine speech):
- #5-0 Anuttara/Mystery: Unspeakable source before Para Vak
- #5-1 Para Vak: Pure I-consciousness (undifferentiated essence)
- #5-2 Pasyanti: Visionary speech (unified vision before differentiation)
- #5-3 Madhyama: Mediating speech (internal dialogue structuring meaning)
- #5-4 Vaikhari: Articulated speech (full manifestation in expression)
- #5-5 Shiva-Shakti: Recognition (pragmatic unity beyond categories)

Identify which scalar density the domain operates at.""",

    "f_capability_mef_analysis_cognitive_approach": """When applying MEF lenses:
1. Each lens is a COMPLETE mode of analysis, not a checklist
2. Lenses are holographic - each contains all others in nested fashion
3. Position #5 in each lens twists back to #0 (Möbius topology)
4. Look for resonances ACROSS lenses (e.g., archetypal #3 + logical paradox)
5. The framework enables creative advance through systematic exploration
6. Trust the lenses to reveal what's hidden in plain sight"""
}


# MEF Workflow Properties
MEF_WORKFLOW_PROPS = {
    "f_workflow_mefAnalysis_version": "1.0.0",

    "f_workflow_mefAnalysis_description": (
        "Apply MEF capability to etymology communities, discovering Bimba coordinate resonances "
        "through 6-lens analysis and semantic/structural graph queries"
    ),

    "f_workflow_mefAnalysis_cyclic_nature": "single_pass",

    "f_workflow_mefAnalysis_agent_domain": "etymology_atelier",

    "f_workflow_mefAnalysis_backend_processes": (
        '["neo4j_community_query", "bimba_semantic_search", "bimba_structural_traversal", "resonance_storage"]'
    ),

    "f_workflow_mefAnalysis_uses_capabilities": '["mef_analysis"]',

    "f_workflow_mefAnalysis_uses_protocols": '[]',

    "f_workflow_mefAnalysis_tools": (
        '["semantic_coordinate_discovery", "get_direct_children", "get_node_relationships"]'
    ),

    # Stage 0
    "f_workflow_mefAnalysis_stage_0_name": "Context Loading",

    "f_workflow_mefAnalysis_stage_0_description": (
        "Receive etymology community context (words, PIE root, semantic pattern, quaternal type) "
        "and prepare for MEF analysis"
    ),

    "f_workflow_mefAnalysis_stage_0_agent_activities": (
        "Parse community metadata, identify key semantic features, prepare lens application strategy"
    ),

    # Stage 1
    "f_workflow_mefAnalysis_stage_1_name": "6-Lens MEF Analysis",

    "f_workflow_mefAnalysis_stage_1_description": (
        "Apply all 6 MEF lenses systematically to the community, generating comprehensive analysis"
    ),

    "f_workflow_mefAnalysis_stage_1_agent_activities": """For each lens (Archetypal, Causal, Logical, Processual, Meta-Epistemic, Divine-Scalar):
- Apply lens framework to community patterns
- Identify resonant structures
- Note cross-lens harmonics
- Generate lens-specific insights""",

    # Stage 2
    "f_workflow_mefAnalysis_stage_2_name": "Bimba Resonance Discovery",

    "f_workflow_mefAnalysis_stage_2_description": (
        "Use Bimba tools to discover coordinates that resonate with MEF analysis findings"
    ),

    "f_workflow_mefAnalysis_stage_2_agent_activities": """Execute three resonance discovery modes:
1. SEMANTIC: Use semantic_coordinate_discovery with community description + MEF insights (alpha=0.6 for hybrid)
2. STRUCTURAL: Use get_direct_children on suggested coordinate to find architectural resonances
3. CANONICAL: Use get_node_relationships to traverse semantic relations across coordinate space""",

    "f_workflow_mefAnalysis_stage_2_tools": (
        '["semantic_coordinate_discovery", "get_direct_children", "get_node_relationships"]'
    ),

    # Stage 3
    "f_workflow_mefAnalysis_stage_3_name": "Resonance Synthesis",

    "f_workflow_mefAnalysis_stage_3_description": (
        "Synthesize discovered coordinates into BimbaResonance objects with strength, type, and MEF context"
    ),

    "f_workflow_mefAnalysis_stage_3_agent_activities": """For each discovered coordinate:
- Calculate resonance_strength (0.0-1.0) based on MEF alignment + semantic similarity
- Classify resonance_type: semantic | structural | hybrid
- Write description explaining WHY this resonates (reference specific lens insights)
- Tag detected_via_lens (which lens revealed this resonance)
- Include reasoning_summary for transparency""",

    "f_workflow_mefAnalysis_output_format": """{
  "mef_analysis": {
    "archetypal": { "active_numbers": [...], "pattern": "..." },
    "causal": { "material": "...", "efficient": "...", "formal": "...", "final": "...", "will": "..." },
    "logical": { "affirmation": "...", "negation": "...", "paradox": "...", "apophatic": "...", "silence": "..." },
    "processual": { "soil": "...", "seeding": "...", "sprouting": "...", "blooming": "...", "flowering": "...", "maturity": "..." },
    "meta_epistemic": { "unknowing": "...", "ontology": "...", "epistemology": "...", "psychology": "...", "context": "...", "wisdom": "..." },
    "divine_scalar": { "mystery": "...", "para_vak": "...", "pasyanti": "...", "madhyama": "...", "vaikhari": "...", "recognition": "..." }
  },
  "reasoning_summary": "Natural language summary of MEF analysis and resonance discovery process",
  "bimba_resonances": [
    {
      "coordinate": "#X-Y",
      "coordinate_name": "Name from Bimba",
      "resonance_type": "semantic|structural|hybrid",
      "resonance_strength": 0.0-1.0,
      "description": "Why this resonates (lens-specific)",
      "detected_via_lens": "archetypal|causal|logical|processual|meta_epistemic|divine_scalar",
      "detected_via_tool": "semantic_coordinate_discovery|get_direct_children|get_node_relationships"
    }
  ]
}"""
}


def setup_mef_properties():
    """Setup MEF capability and workflow properties on #5-4.2 Parashakti node."""
    agent_coordinate = "#5-4.2"

    logger.info(f"Setting up MEF properties on {agent_coordinate}")

    # Initialize Neo4j client directly for Cypher execution
    neo4j_client = Neo4jClient()

    # Combine all properties
    all_properties = {**MEF_CAPABILITY_PROPS, **MEF_WORKFLOW_PROPS}

    logger.info(f"Total properties to set: {len(all_properties)}")
    logger.info(f"- Capability properties: {len(MEF_CAPABILITY_PROPS)}")
    logger.info(f"- Workflow properties: {len(MEF_WORKFLOW_PROPS)}")

    # Update node with all properties using Cypher
    try:
        logger.info(f"Updating {agent_coordinate} with MEF properties via Cypher...")

        # Build SET clause for all properties
        set_statements = []
        params = {"coordinate": agent_coordinate}

        for i, (key, value) in enumerate(all_properties.items()):
            param_name = f"prop_{i}"
            set_statements.append(f"n.{key} = ${param_name}")
            params[param_name] = value

        set_clause = ", ".join(set_statements)

        # Cypher query to update all properties
        query = f"""
        MATCH (n:BimbaNode {{bimbaCoordinate: $coordinate}})
        SET {set_clause}
        RETURN n.bimbaCoordinate as coordinate, n.name as name
        """

        logger.debug(f"Executing Cypher with {len(all_properties)} property updates")

        records, summary, keys = neo4j_client.execute_query(query, params)

        if records:
            logger.info(f"✅ Successfully updated {agent_coordinate} with MEF properties")
            logger.info(f"   Node: {records[0]['name']} ({records[0]['coordinate']})")
            logger.info(f"   Updated {len(all_properties)} properties")
            return True
        else:
            logger.error(f"❌ No node found with coordinate {agent_coordinate}")
            return False

    except Exception as e:
        logger.error(f"❌ Exception updating {agent_coordinate}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


async def verify_properties():
    """Verify that properties were set correctly."""
    agent_coordinate = "#5-4.2"

    logger.info(f"Verifying MEF properties on {agent_coordinate}")

    bimba_client = BimbaGraphQLClient()

    try:
        # Get node with functional properties
        result = await bimba_client.get_node_details_complete(
            agent_coordinate,
            include_functional_properties=True
        )

        if not result or result.get("success") is False:
            logger.error(f"❌ Failed to retrieve {agent_coordinate}")
            return False

        props = result.get("allProperties", {})

        # Check capability properties
        capability_props = {k: v for k, v in props.items() if k.startswith("f_capability_mef_analysis")}
        logger.info(f"Found {len(capability_props)} capability properties")

        # Check workflow properties
        workflow_props = {k: v for k, v in props.items() if k.startswith("f_workflow_mefAnalysis")}
        logger.info(f"Found {len(workflow_props)} workflow properties")

        # Verify key properties exist
        required_props = [
            "f_capability_mef_analysis_description",
            "f_capability_mef_analysis_lens_0_archetypal",
            "f_capability_mef_analysis_lens_1_causal",
            "f_capability_mef_analysis_lens_2_logical",
            "f_capability_mef_analysis_lens_3_processual",
            "f_capability_mef_analysis_lens_4_meta_epistemic",
            "f_capability_mef_analysis_lens_5_divine_scalar",
            "f_workflow_mefAnalysis_version",
            "f_workflow_mefAnalysis_description",
            "f_workflow_mefAnalysis_stage_0_name",
            "f_workflow_mefAnalysis_stage_1_name",
            "f_workflow_mefAnalysis_stage_2_name",
            "f_workflow_mefAnalysis_stage_3_name"
        ]

        missing_props = [p for p in required_props if p not in props]

        if missing_props:
            logger.error(f"❌ Missing required properties: {missing_props}")
            return False

        logger.info(f"✅ All required properties present")

        # Show sample property
        sample_lens = props.get("f_capability_mef_analysis_lens_0_archetypal", "")
        logger.info(f"Sample lens (archetypal): {sample_lens[:100]}...")

        return True

    except Exception as e:
        logger.error(f"❌ Exception verifying properties: {e}")
        return False


async def main():
    """Main execution."""
    logger.info("=" * 80)
    logger.info("MEF Parashakti Node Setup - Phase 1")
    logger.info("=" * 80)

    # Setup properties (synchronous Neo4j)
    setup_success = setup_mef_properties()

    if not setup_success:
        logger.error("Setup failed. Exiting.")
        return False

    logger.info("")
    logger.info("=" * 80)
    logger.info("Verification")
    logger.info("=" * 80)

    # Verify properties (async Bimba client)
    verify_success = await verify_properties()

    if not verify_success:
        logger.error("Verification failed.")
        return False

    logger.info("")
    logger.info("=" * 80)
    logger.info("✅ Phase 1 Complete: MEF properties successfully configured on #5-4.2")
    logger.info("=" * 80)
    logger.info("")
    logger.info("Next steps:")
    logger.info("1. Test Prakasa capability loading: _load_capabilities('#5-4.2', ['mef_analysis'])")
    logger.info("2. Test workflow loading: get_workflow_prakasa('#5-4.2', 'mefAnalysis')")
    logger.info("3. Proceed to Phase 2: Parashakti Agent Tool Registration")

    return True


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
