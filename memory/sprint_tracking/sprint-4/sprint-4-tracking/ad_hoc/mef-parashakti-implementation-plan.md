# MEF Resonance Analysis via Parashakti Agent - Implementation Plan

**Date**: 2025-01-29  
**Story**: 08.07 - Etymology Atelier Bimba Resonance Integration  
**Agent**: Parashakti (#5-4.2) - Vibrational Processing Subsystem  
**Model**: `deepseek:deepseek-chat` (64K context, reasoning-capable)  
**Architecture**: Prakasa Protocol + f_capability + f_workflow pattern

---

## Executive Summary

Implement proper MEF (Meta-Epistemic Framework) resonance analysis by:
1. Creating **f_capability_mef_analysis** on #5-4.2 Parashakti node (cognitive framework)
2. Creating **f_workflow_mefAnalysis** on #5-4.2 (execution pipeline for Etymology Atelier)
3. Configuring **tool whitelist** for Parashakti (semantic_coordinate_discovery, get_direct_children, get_node_relationships)
4. Building **async MEF service** that invokes Parashakti agent with workflow context
5. Storing **BimbaResonance nodes** in Neo4j with full MEF metadata
6. Updating **frontend** to display resonances with reasoning summaries

---

## Current State Analysis

### What We Have ✅
- Communities store `suggestion_resonance` (single coordinate string like `#2-3`)
- Stats endpoint counts these strings as "resonances" 
- ResonancePanel expects full `BimbaResonance[]` objects with strength/type/description
- MEF comprehensive synthesis document with 6-lens framework

### What's Missing ❌
- No async MEF background process
- No Parashakti agent invocation for resonance analysis
- No semantic search against Bimba graph to find related coordinates
- No reasoning about WHY coordinates resonate
- No resonance strength calculation or type classification
- No storage of full resonance objects with MEF context

---

## Architecture Design

### 1. Bimba Node Configuration (#5-4.2 Parashakti)

#### A. MEF Capability (f_capability_mef_analysis_*)

**Purpose**: General-purpose cognitive framework for applying 6-lens MEF analysis

**Properties to Add**:

```yaml
f_capability_mef_analysis_description:
  "Apply the 6-lens Meta-Epistemic Framework to any domain, revealing archetypal patterns, causal structures, logical relations, processual becomings, epistemic stages, and divine-scalar densities"

f_capability_mef_analysis_lenses:
  '["archetypal", "causal", "logical", "processual", "meta_epistemic", "divine_scalar"]'

f_capability_mef_analysis_lens_0_archetypal:
  "Lens #0: Archetypal-Numerical Foundation
  
  Investigate the number-archetypes structuring the domain:
  - #0-0 Zero: Pregnant void as question space
  - #0-1 One: Primordial unity asking 'what?'
  - #0-2 Two: Sacred dyad asking 'how?'
  - #0-3 Three: Synthetic triad asking 'who/whereby?'
  - #0-4 Four: Grounding tetrad asking 'when/where?'
  - #0-5 Five: Transcendent pentad asking 'why?'
  
  Identify which archetypal numbers are active in the patterns, structures, and semantic constellations."

f_capability_mef_analysis_lens_1_causal:
  "Lens #1: Causal Lens - Four Causes as Living Dynamics
  
  Map Jung's psychological functions onto Aristotle's causes:
  - Material Cause ← Sensation: The immediate givenness, substrate
  - Efficient Cause ← Feeling: The energetic valuation moving transformation
  - Formal Cause ← Thinking: The logical architecture organizing patterns
  - Final Cause ← Intuition: The purpose/telos drawing toward completion
  - Will as Quintessence: The meta-causal power transcending yet enabling all causation
  
  Analyze how these causes operate in the domain's evolution."

f_capability_mef_analysis_lens_2_logical:
  "Lens #2: Logical Lens - Tetralemma as Complete Navigation
  
  Apply Nagarjuna's catuskoti to the domain's semantic space:
  - Position #1 - Affirmation (IS): What definitively IS
  - Position #2 - Negation (IS NOT): What definitively is NOT
  - Position #3 - Paradox (BOTH): Where contradictions coexist
  - Position #4 - Apophatic (NEITHER): What transcends the is/is-not framework
  - Position #5 - Silence: The unspeakable truth beyond linguistic capture
  
  Identify which logical positions the domain occupies."

f_capability_mef_analysis_lens_3_processual:
  "Lens #3: Processual Lens - Concrescence as Universal Rhythm
  
  Map the domain through Whitehead's 6-stage organic growth:
  - #3-0 Soil: Initial data reception (inherited meanings from past)
  - #3-1 Seeding: Conceptual prehension (organizing pattern)
  - #3-2 Sprouting: Physical prehension (energetic breakthrough)
  - #3-3 Blooming: Integration (many meanings unified toward subjective aim)
  - #3-4 Flowering: Satisfaction (achieves distinctive form)
  - #3-5 Maturity: Objective immortality (becomes datum for future)
  
  Trace the domain's processual becoming."

f_capability_mef_analysis_lens_4_meta_epistemic:
  "Lens #4: Meta-Epistemic Lens - Consciousness Examining Itself
  
  Analyze the domain through 6 epistemic stages:
  - #4-0 Ajnana (Unknowing): Pre-reflective state before knowing
  - #4-1 Ontology: First-order knowing (what IS)
  - #4-2 Epistemology: Second-order knowing (HOW we know)
  - #4-3 Psychology: Third-order knowing (the KNOWER's relationship)
  - #4-4 Context: Fourth-order knowing (situated/embodied knowing)
  - #4-5 Jnana (Wisdom): Fifth-order knowing (integral wisdom transcending stages)
  
  Determine which epistemic stage the domain reveals."

f_capability_mef_analysis_lens_5_divine_scalar:
  "Lens #5: Divine-Scalar Lens - Reality as Living Speech
  
  Map the domain through Kashmir Shaivism's 6 levels of Vak (divine speech):
  - #5-0 Anuttara/Mystery: Unspeakable source before Para Vak
  - #5-1 Para Vak: Pure I-consciousness (undifferentiated essence)
  - #5-2 Pasyanti: Visionary speech (unified vision before differentiation)
  - #5-3 Madhyama: Mediating speech (internal dialogue structuring meaning)
  - #5-4 Vaikhari: Articulated speech (full manifestation in expression)
  - #5-5 Shiva-Shakti: Recognition (pragmatic unity beyond categories)
  
  Identify which scalar density the domain operates at."

f_capability_mef_analysis_cognitive_approach:
  "When applying MEF lenses:
  1. Each lens is a COMPLETE mode of analysis, not a checklist
  2. Lenses are holographic - each contains all others in nested fashion
  3. Position #5 in each lens twists back to #0 (Möbius topology)
  4. Look for resonances ACROSS lenses (e.g., archetypal #3 + logical paradox)
  5. The framework enables creative advance through systematic exploration
  6. Trust the lenses to reveal what's hidden in plain sight"
```

#### B. MEF Workflow (f_workflow_mefAnalysis_*)

**Purpose**: Specific execution pipeline for Etymology Atelier resonance analysis

**Properties to Add**:

```yaml
f_workflow_mefAnalysis_version: "1.0.0"

f_workflow_mefAnalysis_description:
  "Apply MEF capability to etymology communities, discovering Bimba coordinate resonances through 6-lens analysis and semantic/structural graph queries"

f_workflow_mefAnalysis_cyclic_nature: "single_pass"

f_workflow_mefAnalysis_agent_domain: "etymology_atelier"

f_workflow_mefAnalysis_backend_processes:
  '["neo4j_community_query", "bimba_semantic_search", "bimba_structural_traversal", "resonance_storage"]'

f_workflow_mefAnalysis_uses_capabilities:
  '["mef_analysis"]'

f_workflow_mefAnalysis_uses_protocols: '[]'

f_workflow_mefAnalysis_tools:
  '["semantic_coordinate_discovery", "get_direct_children", "get_node_relationships"]'

f_workflow_mefAnalysis_stage_0_name: "Context Loading"

f_workflow_mefAnalysis_stage_0_description:
  "Receive etymology community context (words, PIE root, semantic pattern, quaternal type) and prepare for MEF analysis"

f_workflow_mefAnalysis_stage_0_agent_activities:
  "Parse community metadata, identify key semantic features, prepare lens application strategy"

f_workflow_mefAnalysis_stage_1_name: "6-Lens MEF Analysis"

f_workflow_mefAnalysis_stage_1_description:
  "Apply all 6 MEF lenses systematically to the community, generating comprehensive analysis"

f_workflow_mefAnalysis_stage_1_agent_activities:
  "For each lens (Archetypal, Causal, Logical, Processual, Meta-Epistemic, Divine-Scalar):
  - Apply lens framework to community patterns
  - Identify resonant structures
  - Note cross-lens harmonics
  - Generate lens-specific insights"

f_workflow_mefAnalysis_stage_2_name: "Bimba Resonance Discovery"

f_workflow_mefAnalysis_stage_2_description:
  "Use Bimba tools to discover coordinates that resonate with MEF analysis findings"

f_workflow_mefAnalysis_stage_2_agent_activities:
  "Execute three resonance discovery modes:
  1. SEMANTIC: Use semantic_coordinate_discovery with community description + MEF insights (alpha=0.6 for hybrid)
  2. STRUCTURAL: Use get_direct_children on suggested coordinate to find architectural resonances
  3. CANONICAL: Use get_node_relationships to traverse semantic relations across coordinate space"

f_workflow_mefAnalysis_stage_2_tools:
  '["semantic_coordinate_discovery", "get_direct_children", "get_node_relationships"]'

f_workflow_mefAnalysis_stage_3_name: "Resonance Synthesis"

f_workflow_mefAnalysis_stage_3_description:
  "Synthesize discovered coordinates into BimbaResonance objects with strength, type, and MEF context"

f_workflow_mefAnalysis_stage_3_agent_activities:
  "For each discovered coordinate:
  - Calculate resonance_strength (0.0-1.0) based on MEF alignment + semantic similarity
  - Classify resonance_type: semantic | structural | hybrid
  - Write description explaining WHY this resonates (reference specific lens insights)
  - Tag detected_via_lens (which lens revealed this resonance)
  - Include reasoning_summary for transparency"

f_workflow_mefAnalysis_output_format:
  '{
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
  }'
```

#### C. Tool Whitelist (Hardcoded in constellation.py)

**IMPORTANT**: Tool whitelists are NOT stored in Neo4j. Following the Epii EA pattern, Parashakti MEF tools should be registered directly in `constellation.py` after `setup_selective_tools()`.

**Pattern** (from Epii agent in constellation.py):
```python
await setup_selective_tools(agent, bimba_client, agent_coordinate)

# Register Parashakti-specific MEF tools (hardcoded whitelist)
from agentic.agents.shared_tools import (
    semantic_coordinate_discovery,
    get_direct_children,
    get_node_relationships
)

# Register only these 3 tools for MEF analysis
agent.tool(semantic_coordinate_discovery)
agent.tool(get_direct_children)
agent.tool(get_node_relationships)
```

**Tool Purposes**:
- `semantic_coordinate_discovery`: Find semantically similar coordinates (alpha=0.6 for hybrid vector+BM25)
- `get_direct_children`: Discover architectural/hierarchical resonances
- `get_node_relationships`: Traverse canonical semantic relations across coordinate space

**Note**: The `f_tools` property in Neo4j is NOT used for actual tool filtering yet (see `shared_tools.py` line 1303 - it falls back to `setup_all_cag_tools`). We follow the proven Epii pattern of hardcoded tool registration in constellation.py.

---

## Implementation Phases

### Phase 1: Bimba Node Setup (30 min)

**Task 1.1**: Add MEF capability properties to #5-4.2
- All `f_capability_mef_analysis_*` properties listed above
- Use Cypher `SET` statements or backend mutation

**Task 1.2**: Add MEF workflow properties to #5-4.2
- All `f_workflow_mefAnalysis_*` properties listed above

**Task 1.3**: ~~Add tool whitelist to #5-4.2~~ **SKIP** - Tools are hardcoded in constellation.py (see Phase 2)

**Verification**:
```python
# Test Prakasa can load capability
prakasa = PrakasaManager(bimba_client, redis_client)
caps = await prakasa._load_capabilities("#5-4.2", ["mef_analysis"])
assert "mef_analysis" in caps
assert "lens_0_archetypal" in caps["mef_analysis"]

# Test workflow loading
workflow = await prakasa.get_workflow_prakasa("#5-4.2", "mefAnalysis")
assert "6-Lens MEF Analysis" in workflow
assert "Bimba Resonance Discovery" in workflow
```

---

### Phase 2: Parashakti Agent Tool Registration (30 min)

**File**: `agentic/agents/constellation.py`

**Update `create_parashakti_agent()` function** (around line 260):

```python
async def create_parashakti_agent(
    bimba_client: BimbaGraphQLClient,
    redis_client: RedisClient,
    model: str = "deepseek:deepseek-chat",  # Changed default to deepseek
    name: str = None
) -> Agent[OrchestratorDeps]:
    """
    Create Parashakti agent (#5-4.2) - Vibrational Processing subsystem.

    Specialized for MEF (Meta-Epistemic Framework) resonance analysis.
    """
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#5-4.2"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,
        retries=2
    )

    agent._metadata = {
        "subsystem": 2,
        "coordinate": "#2",
        "agent_coordinate": agent_coordinate,
        "name": name or "Parashakti"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    await setup_selective_tools(agent, bimba_client, agent_coordinate)

    # Register MEF-specific Bimba tools (hardcoded whitelist)
    # Following Epii EA pattern - tools registered in constellation.py, not Neo4j
    from agentic.agents.shared_tools import (
        semantic_coordinate_discovery,
        get_direct_children,
        get_node_relationships
    )

    # These 3 tools enable MEF resonance discovery:
    # 1. semantic_coordinate_discovery - semantic/lexical resonance (alpha=0.6)
    # 2. get_direct_children - architectural/hierarchical resonance
    # 3. get_node_relationships - canonical semantic relation traversal

    @agent.tool
    async def semantic_coordinate_discovery_tool(
        ctx: RunContext[OrchestratorDeps],
        query_text: str,
        max_results: int = 7,
        alpha: float = 0.6
    ):
        """Find coordinates semantically similar to query (hybrid vector+BM25)."""
        return await semantic_coordinate_discovery(ctx, query_text, max_results, alpha)

    @agent.tool
    async def get_direct_children_tool(
        ctx: RunContext[OrchestratorDeps],
        bimba_coordinate: str
    ):
        """Get direct child coordinates for architectural resonance."""
        return await get_direct_children(ctx, bimba_coordinate)

    @agent.tool
    async def get_node_relationships_tool(
        ctx: RunContext[OrchestratorDeps],
        bimba_coordinate: str
    ):
        """Get canonical semantic relationships for relation traversal."""
        return await get_node_relationships(ctx, bimba_coordinate)

    logger.info(
        f"Created Parashakti agent ({agent_coordinate}) with model {model} "
        f"and 3 MEF tools (semantic, structural, canonical)"
    )
    return agent
```

---

### Phase 3: Backend MEF Service (60 min)

**File**: `backend/epi_logos_system/cag/graphiti/mef_service.py` (NEW)

**Key Functions**:

```python
async def run_mef_analysis(
    community_id: str,
    service: GraphitiService
) -> Dict[str, Any]:
    """
    Run MEF analysis via Parashakti agent.

    Steps:
    1. Load community context from Neo4j
    2. Create Parashakti agent instance (#5-4.2) with deepseek-chat
    3. Invoke agent with mefAnalysis workflow
    4. Parse MEF analysis results
    5. Store BimbaResonance nodes in Neo4j
    6. Update community with MEF metadata
    """
```

**Agent Invocation Pattern**:
```python
from agentic.agents.constellation import create_parashakti_agent

parashakti = await create_parashakti_agent(
    bimba_client=bimba_client,
    redis_client=redis_client,
    model="deepseek:deepseek-chat"  # 64K context, reasoning-capable
)

# Parashakti will load mefAnalysis workflow via Prakasa
result = await parashakti.run(
    mef_prompt,  # Community context + MEF task
    deps=OrchestratorDeps(...)
)
```

**Storage Function**:
```python
async def store_bimba_resonance(
    community_id: str,
    resonance: dict,
    mef_context: dict,
    service: GraphitiService
):
    """
    Store BimbaResonance as separate node with relationships.

    Creates:
    - (community:EA:Community)-[:RESONATES_WITH]->(resonance:BimbaResonance:EA:Episodic)
    - (resonance)-[:TARGETS]->(coordinate:BimbaNode)

    Labels: BimbaResonance nodes MUST have BOTH EA and Episodic labels
    Session Linking: Tie to etymology_session_id property on community nodes

    Properties:
    - resonance_type, resonance_strength, description
    - detected_via_lens, detected_via_tool
    - reasoning_summary (from MEF analysis)
    - deepseek_reasoning_chain (internal reasoning from DeepSeek model)
    - mef_archetypal, mef_causal, etc. (lens-specific insights)
    - etymology_session_id (copied from community for session queries)
    """
```

---

### Phase 4: API Endpoint (30 min)

**File**: `backend/epi_logos_system/cag/graphiti/api.py`

**New Endpoint** (Manual trigger via UI button):
```python
@router.post("/etymology/communities/{community_id}/analyze-mef")
async def trigger_mef_analysis(
    community_id: str,
    background_tasks: BackgroundTasks,
    service: GraphitiService = Depends(get_graphiti_service),
    current_user: User = Depends(get_current_user)
):
    """
    Trigger async MEF analysis via Parashakti agent (MANUAL TRIGGER).

    Called by UI button in Bimba Resonances section.
    Allows re-analysis if community evolves.

    Queues background task that:
    1. Invokes #5-4.2 Parashakti agent with mefAnalysis workflow
    2. Agent applies 6-lens framework + Bimba tool discovery
    3. Returns BimbaResonance[] with full MEF context
    4. Stores resonances in Neo4j with EA+Episodic labels

    Returns immediately with task queued confirmation.
    """
    # Verify community exists and user has access
    community = await service.get_community_by_id(community_id)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")

    if community.get("user_id") != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if already analyzed (allow re-analysis)
    existing_count = await service.count_community_resonances(community_id)
    if existing_count > 0:
        logger.info(f"Re-analyzing community {community_id} (had {existing_count} resonances)")

    # Queue async MEF analysis
    background_tasks.add_task(
        run_mef_analysis,
        community_id=community_id,
        service=service
    )

    return {
        "success": True,
        "message": "MEF analysis queued",
        "community_id": community_id,
        "status": "processing",
        "is_reanalysis": existing_count > 0
    }
```

**Get Resonances Endpoint** (with DeepSeek reasoning):
```python
@router.get("/etymology/communities/{community_id}/resonances")
async def get_community_resonances(
    community_id: str,
    service: GraphitiService = Depends(get_graphiti_service),
    current_user: User = Depends(get_current_user)
):
    """
    Get BimbaResonance nodes for a community.

    Returns:
    - Array of resonances with coordinate details
    - MEF reasoning summary
    - DeepSeek internal reasoning chain (for transparency)
    - Lens-specific insights
    """
    query = """
    MATCH (c:Entity:EA:Community {uuid: $community_id})-[:RESONATES_WITH]->(r:BimbaResonance:EA:Episodic)-[:TARGETS]->(coord:BimbaNode)
    RETURN r.uuid as id,
           coord.bimbaCoordinate as coordinate,
           coord.name as coordinate_name,
           r.resonance_type as resonance_type,
           r.resonance_strength as resonance_strength,
           r.description as description,
           r.detected_via_lens as detected_via_lens,
           r.detected_via_tool as detected_via_tool,
           r.reasoning_summary as reasoning_summary,
           r.deepseek_reasoning_chain as deepseek_reasoning,
           r.detected_at as detected_at,
           r.mef_archetypal as mef_archetypal,
           r.mef_causal as mef_causal,
           r.mef_logical as mef_logical,
           r.mef_processual as mef_processual,
           r.mef_meta_epistemic as mef_meta_epistemic,
           r.mef_divine_scalar as mef_divine_scalar
    ORDER BY r.resonance_strength DESC
    """

    records, _, _ = service.neo4j_client.execute_query(
        query,
        {"community_id": community_id}
    )

    resonances = []
    for record in records:
        res = dict(record)
        # Parse JSON lens insights
        for lens in ['archetypal', 'causal', 'logical', 'processual', 'meta_epistemic', 'divine_scalar']:
            key = f"mef_{lens}"
            if res.get(key):
                try:
                    res[key] = json.loads(res[key])
                except json.JSONDecodeError:
                    pass
        resonances.append(res)

    return {
        "success": True,
        "community_id": community_id,
        "resonances": resonances,
        "count": len(resonances)
    }
```

---

### Phase 5: Agent Tool Integration (30 min)

**File**: `agentic/agents/shared_tools.py`

**Update `form_memory_community` tool**:

```python
async def form_memory_community(
    ctx: RunContext[AgentDeps],
    name: str,
    description: str,
    words: list[str],
    coordinate: str | None = None,
    trigger_mef: bool = True,  # NEW: Auto-trigger MEF analysis
    pie_root: str | None = None,
    semantic_pattern: str | None = None,
    quaternal_type: str = "four_part"
) -> dict:
    """
    Create etymology community with optional MEF analysis.

    If trigger_mef=True and coordinate is provided, queues async
    Parashakti MEF analysis after community creation.
    """
    # Create community (existing logic)
    result = await ctx.deps.graphiti_client.create_community(
        name=name,
        description=description,
        group_id=ctx.deps.user_id,
        words=words,
        session_id=ctx.deps.session_id,
        bimba_coordinate=coordinate,
        pie_root=pie_root,
        semantic_pattern=semantic_pattern,
        quaternal_type=quaternal_type
    )

    community_id = result["id"]

    # Trigger async MEF analysis via Parashakti
    if trigger_mef and coordinate:
        try:
            # Call backend endpoint to queue MEF analysis
            await ctx.deps.graphiti_client.trigger_mef_analysis(community_id)
            logger.info(f"✅ Triggered MEF analysis for community {community_id}")
        except Exception as e:
            logger.warning(f"⚠️ Failed to trigger MEF analysis: {e}")
            # Don't fail community creation if MEF trigger fails

    return result
```

**Add to GraphitiHttpClient**:

```python
# In agentic/agents/orchestrator/tools/episodic/http_graphiti_client.py

async def trigger_mef_analysis(self, community_id: str) -> dict:
    """Trigger async MEF analysis for a community."""
    url = f"{self.base_url}/api/graphiti/etymology/communities/{community_id}/analyze-mef"

    async with httpx.AsyncClient() as client:
        response = await client.post(url, timeout=10.0)
        response.raise_for_status()
        return response.json()
```

---

### Phase 6: Neo4j Schema & Storage (45 min)

**BimbaResonance Node Schema**:

```cypher
CREATE CONSTRAINT bimba_resonance_uuid IF NOT EXISTS
FOR (r:BimbaResonance) REQUIRE r.uuid IS UNIQUE;

CREATE INDEX bimba_resonance_strength IF NOT EXISTS
FOR (r:BimbaResonance) ON (r.resonance_strength);

CREATE INDEX bimba_resonance_type IF NOT EXISTS
FOR (r:BimbaResonance) ON (r.resonance_type);

CREATE INDEX bimba_resonance_session IF NOT EXISTS
FOR (r:BimbaResonance) ON (r.etymology_session_id);
```

**CRITICAL Labels**: BimbaResonance nodes MUST have BOTH `EA` and `Episodic` labels for proper querying

**Storage Implementation** (in `mef_service.py`):

```python
async def store_bimba_resonance(
    community_id: str,
    resonance: dict,
    mef_analysis: dict,
    deepseek_reasoning: str,  # NEW: Internal reasoning chain from DeepSeek
    service: GraphitiService
):
    """
    Store BimbaResonance as separate node with relationships.

    Schema:
    (community:EA:Community)-[:RESONATES_WITH]->(resonance:BimbaResonance:EA:Episodic)-[:TARGETS]->(coord:BimbaNode)

    CRITICAL:
    - Labels: BOTH EA and Episodic (for session queries)
    - etymology_session_id: Copied from community for session-level queries
    - deepseek_reasoning_chain: Internal reasoning from DeepSeek model (transparency)
    """
    resonance_id = str(uuid.uuid4())

    # Get community's etymology_session_id
    community_query = """
    MATCH (c:Entity:EA:Community {uuid: $community_id})
    RETURN c.etymology_session_id as session_id
    """
    result, _, _ = service.neo4j_client.execute_query(community_query, {"community_id": community_id})
    etymology_session_id = result[0]["session_id"] if result else None

    # Extract lens-specific insights from MEF analysis
    lens_insights = {
        "mef_archetypal": json.dumps(mef_analysis.get("archetypal", {})),
        "mef_causal": json.dumps(mef_analysis.get("causal", {})),
        "mef_logical": json.dumps(mef_analysis.get("logical", {})),
        "mef_processual": json.dumps(mef_analysis.get("processual", {})),
        "mef_meta_epistemic": json.dumps(mef_analysis.get("meta_epistemic", {})),
        "mef_divine_scalar": json.dumps(mef_analysis.get("divine_scalar", {}))
    }

    query = """
    MATCH (c:Entity:EA:Community {uuid: $community_id})
    MATCH (coord:BimbaNode {bimbaCoordinate: $coordinate})
    CREATE (r:BimbaResonance:EA:Episodic {
        uuid: $resonance_id,
        resonance_type: $type,
        resonance_strength: $strength,
        description: $description,
        detected_via_lens: $lens,
        detected_via_tool: $tool,
        reasoning_summary: $reasoning,
        deepseek_reasoning_chain: $deepseek_reasoning,
        etymology_session_id: $session_id,
        detected_at: $timestamp,
        mef_archetypal: $mef_archetypal,
        mef_causal: $mef_causal,
        mef_logical: $mef_logical,
        mef_processual: $mef_processual,
        mef_meta_epistemic: $mef_meta_epistemic,
        mef_divine_scalar: $mef_divine_scalar
    })
    CREATE (c)-[:RESONATES_WITH]->(r)-[:TARGETS]->(coord)
    RETURN r
    """

    service.neo4j_client.execute_query(query, {
        "community_id": community_id,
        "coordinate": resonance["coordinate"],
        "resonance_id": resonance_id,
        "type": resonance["resonance_type"],
        "strength": resonance["resonance_strength"],
        "description": resonance["description"],
        "lens": resonance["detected_via_lens"],
        "tool": resonance.get("detected_via_tool", "unknown"),
        "reasoning": mef_analysis.get("reasoning_summary", ""),
        "deepseek_reasoning": deepseek_reasoning,
        "session_id": etymology_session_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **lens_insights
    })

    logger.info(f"✅ Stored resonance {resonance_id}: {resonance['coordinate']} ({resonance['resonance_strength']:.2f})")
```

**Re-analysis Support**:
```python
async def clear_existing_resonances(community_id: str, service: GraphitiService):
    """
    Clear existing resonances before re-analysis.
    Allows users to manually re-trigger MEF analysis if community evolves.
    """
    query = """
    MATCH (c:Entity:EA:Community {uuid: $community_id})-[:RESONATES_WITH]->(r:BimbaResonance)
    DETACH DELETE r
    """
    service.neo4j_client.execute_query(query, {"community_id": community_id})
    logger.info(f"Cleared existing resonances for community {community_id}")
```

---

### Phase 7: Frontend Integration (60 min)

**Update TypeScript Types** (`frontend/src/types/etymology.types.ts`):

```typescript
export interface BimbaResonance {
  id: string;
  coordinate: string;
  coordinate_name: string;
  resonance_type: "semantic" | "structural" | "hybrid";
  resonance_strength: number; // 0.0-1.0
  description: string;
  detected_via_lens: "archetypal" | "causal" | "logical" | "processual" | "meta_epistemic" | "divine_scalar";
  detected_via_tool: "semantic_coordinate_discovery" | "get_direct_children" | "get_node_relationships";
  reasoning_summary?: string;
  deepseek_reasoning?: string; // NEW: Internal reasoning chain from DeepSeek
  detected_at: string; // ISO timestamp
  // MEF lens insights (parsed JSON)
  mef_archetypal?: any;
  mef_causal?: any;
  mef_logical?: any;
  mef_processual?: any;
  mef_meta_epistemic?: any;
  mef_divine_scalar?: any;
}

export interface EtymologyCommunity {
  // ... existing fields
  bimba_resonances?: BimbaResonance[];
  mef_analyzed_at?: string;
  mef_reasoning_summary?: string;
  mef_resonance_count?: number;
}
```

**Update Community Fetching** (`frontend/src/app/epii/atelier/hooks/useCommunitiesForSession.ts`):

```typescript
const fetchCommunityResonances = async (communityId: string): Promise<BimbaResonance[]> => {
  const response = await fetch(
    `/api/graphiti/etymology/communities/${communityId}/resonances`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    console.error('Failed to fetch resonances:', response.statusText);
    return [];
  }

  const data = await response.json();
  return data.resonances || [];
};

// In main fetch logic
const communitiesWithResonances = await Promise.all(
  communities.map(async (community) => ({
    ...community,
    bimba_resonances: await fetchCommunityResonances(community.id)
  }))
);
```

**Add Manual Trigger Button** (in `ResonancePanel.tsx`):

```typescript
const [isAnalyzing, setIsAnalyzing] = useState(false);

const triggerMEFAnalysis = async (communityId: string) => {
  setIsAnalyzing(true);
  try {
    const response = await fetch(
      `/api/graphiti/etymology/communities/${communityId}/analyze-mef`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to trigger MEF analysis');
    }

    const data = await response.json();

    // Show success message
    toast.success(
      data.is_reanalysis
        ? 'Re-analyzing community with MEF...'
        : 'MEF analysis started...'
    );

    // Poll for results (or use websocket in future)
    setTimeout(() => {
      refetchCommunities();
    }, 30000); // Check after 30 seconds

  } catch (error) {
    console.error('MEF analysis error:', error);
    toast.error('Failed to trigger MEF analysis');
  } finally {
    setIsAnalyzing(false);
  }
};

// In render:
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold text-blue-200">
    Bimba Resonances
  </h3>
  {selectedCommunity && (
    <button
      onClick={() => triggerMEFAnalysis(selectedCommunity.id)}
      disabled={isAnalyzing}
      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed rounded transition-colors"
    >
      {isAnalyzing ? 'Analyzing...' : 'Analyze MEF'}
    </button>
  )}
</div>
```

**Add MEF Reasoning Display** (in `ResonancePanel.tsx`):

```typescript
{selectedCommunity.mef_reasoning_summary && (
  <div className="mb-4 p-3 bg-blue-950/20 border border-blue-800/30 rounded">
    <h4 className="text-sm font-semibold text-blue-300 mb-2">
      MEF Analysis Summary
    </h4>
    <p className="text-sm text-blue-200/80">
      {selectedCommunity.mef_reasoning_summary}
    </p>
  </div>
)}

{/* DeepSeek Reasoning Chain (expandable) */}
{selectedResonance?.deepseek_reasoning && (
  <details className="mt-4 p-3 bg-slate-950/40 border border-slate-700/30 rounded">
    <summary className="text-sm font-semibold text-slate-300 cursor-pointer hover:text-slate-200">
      DeepSeek Reasoning Chain
    </summary>
    <pre className="mt-2 text-xs text-slate-400 whitespace-pre-wrap font-mono">
      {selectedResonance.deepseek_reasoning}
    </pre>
  </details>
)}

{/* MEF Lens Insights (expandable) */}
{selectedResonance && (
  <div className="mt-4 space-y-2">
    {['archetypal', 'causal', 'logical', 'processual', 'meta_epistemic', 'divine_scalar'].map(lens => {
      const lensData = selectedResonance[`mef_${lens}`];
      if (!lensData) return null;

      return (
        <details key={lens} className="p-2 bg-blue-950/10 border border-blue-800/20 rounded">
          <summary className="text-xs font-semibold text-blue-300 cursor-pointer capitalize">
            {lens.replace('_', ' ')} Lens
          </summary>
          <pre className="mt-2 text-xs text-blue-200/70 whitespace-pre-wrap">
            {JSON.stringify(lensData, null, 2)}
          </pre>
        </details>
      );
    })}
  </div>
)}
```

---

### Phase 8: Testing & Validation (60 min)

**Test 1: Bimba Node Configuration**
```python
# Verify #5-4.2 has all properties
result = await bimba_client.get_node_details_complete("#5-4.2", include_functional_properties=True)
props = result["allProperties"]

assert "f_capability_mef_analysis_description" in props
assert "f_workflow_mefAnalysis_version" in props

# Note: f_tools NOT in Neo4j - tools hardcoded in constellation.py
```

**Test 2: Prakasa Loading**
```python
# Verify Prakasa can load MEF capability and workflow
prakasa = PrakasaManager(bimba_client, redis_client)

# Test capability loading
caps = await prakasa._load_capabilities("#5-4.2", ["mef_analysis"])
assert "mef_analysis" in caps
assert "lens_0_archetypal" in caps["mef_analysis"]

# Test workflow loading
workflow = await prakasa.get_workflow_prakasa("#5-4.2", "mefAnalysis")
assert "6-Lens MEF Analysis" in workflow
assert "Bimba Resonance Discovery" in workflow
```

**Test 3: End-to-End MEF Analysis**
```python
# Create test community
community = await graphiti_client.create_community(
    name="Test MEF Community",
    description="Words related to 'loop' pattern",
    words=["loop", "hoop", "goop"],
    bimba_coordinate="#2-3",
    pie_root="*lewp-",
    semantic_pattern="circular_motion"
)

# Trigger MEF analysis
await graphiti_client.trigger_mef_analysis(community["id"])

# Wait for background task (or poll status endpoint)
await asyncio.sleep(30)

# Verify resonances created
resonances = await graphiti_client.get_community_resonances(community["id"])
assert len(resonances) > 0

# Verify resonance structure
resonance = resonances[0]
assert "coordinate" in resonance
assert "resonance_strength" in resonance
assert 0.0 <= resonance["resonance_strength"] <= 1.0
assert resonance["resonance_type"] in ["semantic", "structural", "hybrid"]
assert "detected_via_lens" in resonance
assert "reasoning_summary" in resonance
```

---

## Success Criteria

### Functional Requirements ✅
- [ ] #5-4.2 Parashakti node has complete MEF capability properties
- [ ] #5-4.2 has mefAnalysis workflow with 4 stages
- [ ] ~~#5-4.2 has tool whitelist (3 Bimba tools)~~ **SKIP** - tools hardcoded in constellation.py
- [ ] Prakasa can load MEF capability and workflow
- [ ] Parashakti agent creates with `deepseek:deepseek-chat` model
- [ ] Parashakti agent has 3 MEF tools registered (hardcoded in constellation.py)
- [ ] MEF analysis endpoint queues background task (manual trigger via UI button)
- [ ] Background task invokes Parashakti with workflow context
- [ ] Agent applies 6-lens MEF framework
- [ ] Agent uses 3 Bimba tools for resonance discovery
- [ ] BimbaResonance nodes stored in Neo4j with EA+Episodic labels
- [ ] BimbaResonance nodes have etymology_session_id property
- [ ] DeepSeek reasoning chain stored and exposed in API
- [ ] Frontend has "Analyze MEF" button in Bimba Resonances section
- [ ] Frontend fetches and displays resonances
- [ ] Reasoning summary visible in UI
- [ ] DeepSeek reasoning chain visible in UI (expandable)
- [ ] MEF lens insights visible in UI (expandable)
- [ ] Re-analysis supported (clears old resonances)

### Quality Requirements ✅
- [ ] MEF analysis completes in <60 seconds for typical community
- [ ] Resonance strength calculations are meaningful (not random)
- [ ] Resonance descriptions reference specific lens insights
- [ ] Tool usage is balanced (semantic + structural + canonical)
- [ ] Reasoning summary is accessible to non-technical users
- [ ] No duplicate resonances for same coordinate
- [ ] Error handling for failed MEF analysis (doesn't break community creation)

### Architectural Requirements ✅
- [ ] Follows Prakasa protocol (capability + workflow pattern)
- [ ] Uses f_tools whitelist for agent configuration
- [ ] Maintains trilaminar boundaries (Frontend ↔ Backend ↔ Agentic)
- [ ] Async execution doesn't block orchestrator
- [ ] Neo4j schema supports future MEF evolution
- [ ] Frontend types match backend response structure

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| 1. Bimba Node Setup | 30 min | None |
| 2. Parashakti Agent Tool Registration | 30 min | Phase 1 |
| 3. Backend MEF Service | 60 min | Phase 2 |
| 4. API Endpoint | 30 min | Phase 3 |
| 5. Agent Tool Integration | 30 min | Phase 3 |
| 6. Neo4j Schema & Storage | 45 min | Phase 3 |
| 7. Frontend Integration | 60 min | Phase 4, 6 |
| 8. Testing & Validation | 60 min | All phases |
| **Total** | **5.75 hours** | Sequential |

---

## User Requirements (Validated)

1. **MEF Analysis Trigger**: ✅ **Manual UI button** in Bimba Resonances section
2. **Resonance Limit**: ✅ **Unlimited** (for testing phase)
3. **Re-analysis**: ✅ **Yes** - users can manually re-trigger MEF analysis
   - **Implication**: MEF analysis must be stored with proper relation to community node
   - **Labels**: BimbaResonance nodes must have BOTH `EA` and `Episodic` labels
   - **Session Linking**: Tie to `etymology_session_id` property on community nodes
4. **Resonance Evolution**: ⏸️ **Save for later** (but yes in principle)
5. **MongoDB Session Update**: ✅ **Just query Neo4j** - keep it simple, no MongoDB updates
6. **DeepSeek Reasoning**: ✅ **Yes** - expose internal reasoning chain in UI on Bimba Resonances tab/page

---

## Next Steps

**Immediate**:
1. User validates this plan
2. Begin Phase 1 (Bimba Node Setup)
3. Test Prakasa loading after each property addition

**Follow-up**:
1. Monitor MEF analysis performance in production
2. Gather user feedback on resonance quality
3. Iterate on lens prompts based on actual results
4. Consider adding MEF analysis to other domains (not just etymology)

---

**Plan Status**: ✅ **VALIDATED** - Ready for implementation
**Architecture Alignment**: ✅ Prakasa + f_capability + f_workflow + hardcoded tool registration (Epii EA pattern)
**Model**: ✅ `deepseek:deepseek-chat` (64K context, reasoning-capable)
**Tools**: ✅ 3 Bimba tools hardcoded in constellation.py (semantic, structural, canonical)
**Output**: ✅ Reasoning summary + DeepSeek reasoning chain + BimbaResonance[] for frontend
**Trigger**: ✅ Manual UI button in Bimba Resonances section
**Re-analysis**: ✅ Supported (clears old resonances)
**Labels**: ✅ BimbaResonance nodes have EA+Episodic labels
**Session Linking**: ✅ etymology_session_id property for session queries

---

## Key Architectural Corrections Applied

1. **Tool Whitelist Pattern**: Following Epii EA pattern - tools are **hardcoded in constellation.py**, NOT stored in Neo4j's f_tools property (which currently falls back to setup_all_cag_tools)

2. **Manual Trigger**: MEF analysis triggered via UI button, not auto-triggered on community creation

3. **Re-analysis Support**: Users can manually re-trigger MEF analysis if community evolves (clears old resonances first)

4. **Dual Labels**: BimbaResonance nodes MUST have BOTH `EA` and `Episodic` labels for proper querying

5. **Session Linking**: BimbaResonance nodes copy `etymology_session_id` from community for session-level queries

6. **DeepSeek Reasoning**: Internal reasoning chain from DeepSeek model exposed in UI for transparency

7. **No MongoDB Updates**: Keep it simple - only query Neo4j, no MongoDB session array updates

---

## Implementation Readiness Checklist

- [x] User requirements validated and incorporated
- [x] Tool whitelist pattern corrected (hardcoded in constellation.py)
- [x] Manual trigger UI flow designed
- [x] Re-analysis workflow specified
- [x] Neo4j schema with EA+Episodic labels
- [x] DeepSeek reasoning chain storage and display
- [x] Timeline updated (5.75 hours)
- [x] Success criteria comprehensive
- [x] All 8 phases detailed with code examples

**Ready to proceed with Phase 1: Bimba Node Setup** 🚀


