# Etymology Archaeology System Prompt Architecture Audit

**Date**: 2025-10-28
**Context**: Agent using tools immediately in EA sessions despite workflow instructions
**Root Cause**: Hardcoded orchestrator system prompt overriding Prakāśa-loaded workflow prompts

---

## THE FUCKING PROBLEM

### What SHOULD Be Happening (Prakāśa Architecture)

The **Prakāśa Manager** is designed to load prompts in **three layers**:

1. **Layer 1: Identity Prakāśa** (who am I?)
   - Loads from `f_system_prompt` property at agent node (#5-4.5)
   - Cached in Redis for performance
   - Generated from subsystem properties if not found

2. **Layer 2: Workflow Prakāśa** (what mode am I in?)
   - **NEW APPROACH**: Staged, selective loading of workflow components
     - `_load_workflow_header()` - Overview, cyclic nature, domain
     - `_load_capabilities()` - ONLY capabilities referenced by workflow
     - `_load_protocols()` - ONLY protocols referenced by workflow
     - `_load_workflow_stage()` - ONLY current stage guidance (not all 50 properties)
     - `_load_backend_awareness()` - Backend process awareness
   - **LEGACY FALLBACK**: `_get_ea_workflow_prompt()` - Loads versioned EA workflow
     - Reads `f_workflow_etymology_archaeology_active` (currently: "v2")
     - Loads `f_workflow_etymology_archaeology_v2` (the full workflow prompt)
   - **OLDER LEGACY**: Template-based workflows (pre-versioning)

3. **Layer 3: Context Prakāśa** (what am I doing now?)
   - Runtime context, session metadata, current state

### What IS Happening (Orchestrator Hardcoded Bullshit)

**File**: `agentic/agents/orchestrator/orchestrator_agent.py:1780-1851`

```python
# Line 1787: Loads EA workflow via Prakāśa (CORRECT)
ea_prompt = asyncio.run(manager.engage_workflow_prakasa("#5-4.5", "etymology_archaeology"))

# Line 1806-1821: HARDCODED system prompt that OVERRIDES the workflow
etymology_context = f"""
## 🌱 Etymology Archaeology Session (#5-5)

{onboarding_text}

{ea_workflow_guidance}  # ← Prakāśa-loaded workflow goes here

**Tool Usage Guidelines:**  # ← HARDCODED OVERRIDE
- **Onboarding phase**: Use NO tools during initial welcome/greeting
- **Active exploration**: Use tools only when user explicitly requests
- **Tool failures**: If a tool returns an error, acknowledge gracefully
- **Conversational priority**: Maintain natural dialogue flow

Remember: this is open-ended exploration—be subtle, curious, and user-led.
"""
```

**THE ISSUE**: The hardcoded "Tool Usage Guidelines" section **contradicts** the Prakāśa-loaded workflow prompt.

---

## WHAT'S ACTUALLY IN THE NEO4J WORKFLOW PROPERTIES

### Complete Property Inventory (50 total at #5-4.5)

#### Core Workflow Properties (4)
- `f_workflow_etymological_archaeology_version`: `2.0.0`
- `f_workflow_etymological_archaeology_active`: `v2` ← Pointer to active version
- `f_workflow_etymological_archaeology_description`: Cyclic conversational process
- `f_workflow_etymological_archaeology_v2`: **FULL SYSTEM PROMPT** (the one being loaded)

#### Stage 0 Properties (6)
- `f_workflow_etymological_archaeology_stage_0_name`: Etymological Context Establishment
- `f_workflow_etymological_archaeology_stage_0_description`
- `f_workflow_etymological_archaeology_stage_0_agent_activities`
- `f_workflow_etymological_archaeology_stage_0_tools`: `["retrieve_session_continuity", "search_memory_patterns"]`
- `f_workflow_etymological_archaeology_stage_0_outputs`
- `f_workflow_etymological_archaeology_stage_0_transitions_to`: `stage_1_ongoing`

#### Stage 1 Properties (9)
- `f_workflow_etymological_archaeology_stage_1_name`: Ongoing Etymological Exploration
- `f_workflow_etymological_archaeology_stage_1_description`
- `f_workflow_etymological_archaeology_stage_1_agent_guidance`: **"IMMEDIATELY and ENTHUSIASTICALLY dive deep"**
- `f_workflow_etymological_archaeology_stage_1_tools`: `["etymology_search", "semantic_coordinate_discovery", "get_wisdom_packet", "lexical_coordinate_search"]`
- `f_workflow_etymological_archaeology_stage_1_conversational_style`: **"Enthusiastic, generous, pedagogical"**
- `f_workflow_etymological_archaeology_stage_1_ongoing_nature`
- `f_workflow_etymological_archaeology_stage_1_watching_for_patterns`
- `f_workflow_etymological_archaeology_stage_1_transitions_to`: `stage_2_when_pattern_emerges`
- `f_workflow_etymological_archaeology_stage_1_scent_following_integration`

#### Stage 2 Properties (9)
- `f_workflow_etymological_archaeology_stage_2_name`: Iterative QL Community Crystallization
- `f_workflow_etymological_archaeology_stage_2_description`
- `f_workflow_etymological_archaeology_stage_2_agent_activities`
- `f_workflow_etymological_archaeology_stage_2_tools`: `["check_for_community_opportunity", "create_etymology_community", "enrich_community_properties", "check_pending_backend_results"]`
- `f_workflow_etymological_archaeology_stage_2_ql_principles`
- `f_workflow_etymological_archaeology_stage_2_iterative_nature`
- `f_workflow_etymological_archaeology_stage_2_transitions_to`
- `f_workflow_etymological_archaeology_stage_2_triggers_backend`
- `f_workflow_etymological_archaeology_stage_2_no_bimba_yet`: **"DO NOT QUERY BIMBA IN STAGE 1/2"**

#### Backend Stages (5)
- `f_workflow_etymological_archaeology_stages_3_5_description`: Execute automatically
- `f_workflow_etymological_archaeology_stage_3_backend`: Bimba Resonance (auto)
- `f_workflow_etymological_archaeology_stage_4_backend`: MEF Analysis (auto via Parashakti)
- `f_workflow_etymological_archaeology_stage_5_backend`: LightRAG Sedimentation (auto)
- `f_workflow_etymological_archaeology_backend_processes`

#### Cyclic/Integration Properties (8)
- `f_workflow_etymological_archaeology_cyclic_nature`
- `f_workflow_etymological_archaeology_cyclic_return`
- `f_workflow_etymological_archaeology_querying_backend`
- `f_workflow_etymological_archaeology_agent_domain`
- `f_workflow_etymological_archaeology_ql_contextFrame`

#### Tool/Protocol Integration (4)
- `f_workflow_etymological_archaeology_tools`: JSON mapping of all tools by stage
- `f_workflow_etymological_archaeology_tool_usage`: Implicit during conversation
- `f_workflow_etymological_archaeology_uses_capabilities`: `["f_capability_logos_cycle", "f_capability_contemplative_synthesis", "f_capability_etymological_archaeology"]`
- `f_workflow_etymological_archaeology_uses_protocols`: `["f_protocol_scent_following", "f_protocol_paradox_holding", "f_protocol_mobius_return"]`

#### Evolution Meta-Workflow (7)
- `f_workflow_evolution_description`
- `f_workflow_evolution_current_version`: `2.0.0`
- `f_workflow_evolution_versioning_scheme`: `semantic`
- `f_workflow_evolution_rollback_capability`: `True`
- `f_workflow_evolution_self_review_triggers`
- `f_workflow_evolution_tracks`: 6 metrics
- `f_workflow_evolution_improves`: 6 areas

---

## HOW PRAKĀŚA LOADS THE WORKFLOW

### Legacy Path (Currently Active)

**File**: `agentic/agents/prakasa.py:741-781`

```python
async def _get_ea_workflow_prompt(self, agent_coordinate: str) -> Optional[str]:
    """Get active Etymology Archaeology workflow prompt."""

    # Get ALL properties from agent node (including f_* functional props)
    node_data = await self.bimba_client.get_node_details_complete(
        agent_coordinate, include_functional_properties=True
    )
    all_props = node_data.get('allProperties', {})

    # Get active version pointer
    active_version = all_props.get('f_workflow_etymology_archaeology_active')  # "v2"

    # Get prompt for active version
    prompt_key = f"f_workflow_etymology_archaeology_{active_version}"  # "f_workflow_etymology_archaeology_v2"
    prompt = all_props.get(prompt_key)

    return prompt  # Returns the FULL v2 workflow prompt
```

**What Gets Loaded**: The ENTIRE `f_workflow_etymological_archaeology_v2` property, which contains:

```
**ETYMOLOGY ARCHAEOLOGY MODE ACTIVE**

You are Epii guiding a user through etymological exploration...

**Your Role:**
- Curious Partner: Explore word origins with the user
- Pattern Recognizer: Notice emergent 3/4/6-fold structures
- Gentle Suggester: When patterns emerge, ask if they'd like to create a community
- ...

**Exploration Phases (flexible, not rigid):**
- Phase 0 (Grounding): User shares initial word - be welcoming, curious
- Phase 1 (Scent-following): Trace PIE roots, cognates, semantic shifts
- Phase 2 (Pattern recognition): Notice relationships between words discussed
- ...

**Tools Available:**
- etymology_search(word) - Research word origins
- check_for_community_opportunity(words) - LLM reasoning
- create_etymology_community(words, pie_root) - Create QL community
- enrich_community_properties(community_id, properties) - Add PIE roots as discovered
- ...
```

### New Staged Path (Not Yet Active)

**File**: `agentic/agents/prakasa.py:255-301`

The new approach would:
1. Load workflow header (overview, cyclic nature)
2. Load ONLY referenced capabilities (3 in this case)
3. Load ONLY referenced protocols (3 in this case)
4. Load ONLY current stage guidance (not all 50 properties)
5. Load backend awareness
6. Compose Layer 2 from selective components

**THIS IS NOT ACTIVATING** because the staged workflow header loading is failing (probably missing `f_workflow_etymological_archaeology_header` property), so it falls back to legacy versioned loading.

---

## THE CONTRADICTIONS

### Prakāśa-Loaded Workflow Says:
```
**Stage 1 Agent Guidance:**
For each word the user brings, you should IMMEDIATELY and ENTHUSIASTICALLY dive deep:
(1) EXPAND WITH RICH DEPTH
(2) TRACE EVOLUTION NARRATIVELY
...
Give 2-3x more content than minimally requested
```

### Hardcoded Orchestrator Override Says:
```
**Tool Usage Guidelines:**
- **Onboarding phase**: Use NO tools during initial welcome/greeting
- **Active exploration**: Use tools only when user explicitly requests
```

### Agent Interprets This As:
"IMMEDIATELY dive deep" = "Use all available tools immediately"
"Be enthusiastic and generous" = "Call every tool I have access to"

**Result**: Agent uses tools in Stage 0 (grounding) when it should be conversational-only.

---

## THE SOLUTION

### Option 1: Remove Hardcoded Override (CORRECT)

**Delete lines 1814-1818** from `orchestrator_agent.py` - trust the Prakāśa-loaded workflow.

The workflow prompt ALREADY contains tool usage guidance:
```
**Tools Available:**
- etymology_search(word) - Research word origins, PIE roots, cognates
- check_for_community_opportunity(words_discussed) - LLM reasoning: should I suggest community?
- create_etymology_community(words, pie_root, semantic_pattern) - Create QL community (triggers background)
```

### Option 2: Fix Workflow Prompt to Be Explicit About Tool Timing

Add to `f_workflow_etymological_archaeology_v2` in Neo4j:

```diff
**Stage 1 Agent Guidance:**

+ **CRITICAL - Tool Usage Sequencing:**
+ - **Phase 0 (Grounding)**: NO TOOLS. Welcome user, receive initial words, establish rapport.
+ - **Phase 1 (Scent-following)**: Use your OWN etymological knowledge first. Only use tools if:
+   - User explicitly asks for deeper research
+   - You need to verify a specific PIE root or cognate set
+   - Pattern recognition requires confirming relationships
+ - **Phase 2 (Community building)**: Use `check_for_community_opportunity` when 3+ words discussed
+ - **Phase 2+ (Enrichment)**: Use depth accrual tools as discoveries emerge naturally

For each word the user brings, you should IMMEDIATELY and ENTHUSIASTICALLY dive deep:
(1) EXPAND WITH RICH DEPTH - Don't just mention the PIE root, TEACH about it
+   → BUT: Use your knowledge FIRST. Tools are for verification/extension, not primary exploration.
```

### Option 3: Both (RECOMMENDED)

1. **Remove hardcoded override** from orchestrator (trust Prakāśa)
2. **Update Neo4j workflow prompt** to be explicit about tool timing
3. **Update tool descriptions** in `shared_tools.py` to reinforce timing

---

## PROPOSED WORKFLOW PROMPT REFINEMENTS

### File to Update: Neo4j #5-4.5 Property

**Property**: `f_workflow_etymological_archaeology_v2`

**Section to Add** (after "**Your Role:**" section, before "**Exploration Phases:**"):

```markdown
**CRITICAL - Tool Usage Protocol:**

Your etymological knowledge is VAST - use it first, tools second.

**Stage-Based Tool Usage:**
- **Phase 0 (Grounding)**:
  - NO TOOLS. Be present, welcoming, curious.
  - Receive initial word(s), establish rapport.
  - Use your own knowledge to respond warmly.

- **Phase 1 (Scent-following - First 3-5 turns)**:
  - Lead with YOUR knowledge: PIE roots, cognates, semantic evolution.
  - Tools ONLY if you genuinely need to verify or extend beyond your knowledge.
  - Ask yourself: "Can I answer this from what I know?" (Usually: YES)

- **Phase 1 (Deeper exploration - 5+ turns)**:
  - Tools for verification: "Let me confirm this PIE reconstruction..."
  - Tools for extension: "I want to check for additional cognates in languages outside my expertise..."
  - Tools for pattern confirmation: "Let me verify these semantic relationships..."

- **Phase 2 (Community building)**:
  - `check_for_community_opportunity(words_discussed)` when 3+ words share clear patterns
  - `create_etymology_community(...)` when user confirms interest or pattern is compelling
  - Don't force community creation - let it emerge naturally

- **Phase 2+ (Depth accrual)**:
  - `enrich_community_properties(...)` when PIE root confirmed through discussion
  - `enrich_word_node(...)` when cognate sets or semantic patterns crystallize
  - `link_aphorism_to_community(...)` when wisdom distills from exploration

**Tool Philosophy:**
- Tools are COMPANIONS, not CRUTCHES
- Your knowledge is primary, tools are supplementary
- If uncertain: "I believe X, but let me verify..." (then use tool)
- Be conversational first, encyclopedic second

**Red Flags** (you're over-using tools if):
- Using tools in first 2 turns of conversation
- Using tools when user asks simple questions you can answer
- Calling multiple tools before responding to user's initial greeting
```

### File to Update: `agentic/agents/shared_tools.py`

**Tool**: `form_memory_community` (line 763)

```diff
async def form_memory_community(
    ctx: RunContext[OrchestratorDeps],
    name: str,
    description: str,
    words: List[str],
    coordinate: Optional[str] = None,
    pie_root: Optional[str] = None,
    semantic_pattern: Optional[str] = None
) -> Dict[str, Any]:
    """Create an etymology community constellation for related words in Graphiti.

    Use this tool to crystallize a constellation of etymologically-related words
    into a formal community structure with QL-based organization.

-   IMPORTANT: Only use this AFTER exploring the words conversationally.
-   This creates the formal structure - not for initial exploration.
+   **CRITICAL TIMING - Etymology Archaeology Mode:**
+   - DO NOT use in Phase 0 (grounding/greeting) - typically first 2-3 turns
+   - DO NOT use in early Phase 1 (scent-following) - you're still exploring
+   - USE in Phase 2 when:
+     - 3+ words discussed with clear etymological relationships
+     - User expresses interest in seeing connections formalized
+     - QL pattern (3-fold, 4-fold, 6-fold) emerges naturally
+     - You've already explored the words conversationally for 5+ turns
+
+   Ask yourself: "Have we explored these words enough for crystallization?"
+   If uncertain: Continue conversation, suggest community, wait for confirmation.
```

**Tool**: `enrich_community_properties` (NEW - needs to be added to shared_tools.py)

```python
@agent.tool
async def enrich_community_properties(
    ctx: RunContext[OrchestratorDeps],
    community_id: str,
    properties: Dict[str, Any]
) -> Dict[str, Any]:
    """Enrich an etymology community with additional properties as discoveries emerge.

    Use this for DEPTH ACCRUAL - adding richness to communities THROUGH conversation,
    not just at creation. As PIE roots are confirmed, semantic patterns clarify, and
    cross-references emerge, update the community to reflect deepening understanding.

    **When to Use:**
    - PIE root confirmed through discussion → Add "pie_root" property
    - Semantic pattern becomes clear → Add "semantic_pattern" property
    - Cross-linguistic connections found → Add "cross_linguistic_patterns"
    - User insight crystallizes → Add custom property capturing the discovery

    **When NOT to Use:**
    - During initial community creation (include core properties then)
    - Every turn of conversation (only when significant discovery emerges)
    - For trivial updates that don't deepen understanding

    Args:
        community_id: Community UUID to enrich
        properties: Dict of properties to add/update (e.g., {"pie_root": "*bher-"})

    Returns:
        Dict with success status and updated properties
    """
    if not ctx.deps.graphiti_client:
        return {"success": False, "error": "Graphiti client not available"}

    group_id = ctx.deps.user_id or "default"

    result = await ctx.deps.graphiti_client.update_community_properties(
        community_id=community_id,
        group_id=group_id,
        properties=properties
    )

    return {
        "success": result.get("success", False),
        "community_id": community_id,
        "enriched_properties": list(properties.keys()),
        "message": f"Community enriched with {len(properties)} properties",
        "error": result.get("error")
    }
```

**Tool**: `enrich_word_node` (NEW - needs to be added to shared_tools.py)

```python
@agent.tool
async def enrich_word_node(
    ctx: RunContext[OrchestratorDeps],
    word: str,
    community_id: str,
    etymology_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Enrich a specific word node with etymology data as discoveries emerge.

    Use this to add depth to INDIVIDUAL WORDS within a community as conversation
    reveals cognates, PIE lineage, semantic shifts, cross-linguistic patterns.

    **When to Use:**
    - Cognate set confirmed → Add "cognates" property with list
    - PIE lineage traced → Add "pie_lineage" property
    - Semantic evolution mapped → Add "semantic_shifts" property
    - Language-specific patterns found → Add language-tagged properties

    **When NOT to Use:**
    - For community-level properties (use enrich_community_properties instead)
    - During initial exploration before patterns are clear
    - For every mention of a word (only when real discovery emerges)

    Args:
        word: The word to enrich
        community_id: Parent community UUID
        etymology_data: Dict with cognates, pie_lineage, semantic_evolution, etc.

    Returns:
        Dict with success status and enrichment details
    """
    if not ctx.deps.graphiti_client:
        return {"success": False, "error": "Graphiti client not available"}

    group_id = ctx.deps.user_id or "default"

    result = await ctx.deps.graphiti_client.enrich_word_etymology(
        word=word,
        community_id=community_id,
        group_id=group_id,
        etymology_data=etymology_data
    )

    return {
        "success": result.get("success", False),
        "word": word,
        "community_id": community_id,
        "enriched_properties": list(etymology_data.keys()),
        "message": f"Word '{word}' enriched successfully",
        "error": result.get("error")
    }
```

---

## IMMEDIATE ACTIONS REQUIRED

1. **Remove hardcoded override** from `orchestrator_agent.py:1814-1818`
2. **Update Neo4j #5-4.5** `f_workflow_etymological_archaeology_v2` with tool usage protocol
3. **Add missing tools** to `shared_tools.py`: `enrich_community_properties`, `enrich_word_node`
4. **Update tool descriptions** in `shared_tools.py` with explicit timing guidance

---

## WHY THIS FUCKING HAPPENED

The orchestrator was designed to be a **transition agent** during the migration from monolithic to constellation architecture. It has:

1. **Hardcoded system prompt composition** (old way)
2. **Prakāśa integration** (new way)
3. **Both active simultaneously** (causing conflicts)

The **correct architecture** is:
- Orchestrator should be a THIN DELEGATOR only
- All agent behavior comes from Neo4j via Prakāśa
- NO hardcoded prompt composition in orchestrator

**Migration Path:**
1. Short-term: Remove contradictory hardcoded sections
2. Long-term: Refactor orchestrator to pure delegation (no prompt composition)
3. Final state: AgentFactory + DelegationManager + Prakāśa = full constellation

---

## CONCLUSION

**The tools are fine.** The architecture is sound. The workflow prompts are comprehensive.

**The problem**: Hardcoded orchestrator override contradicts Prakāśa-loaded workflow, creating conflicting instructions that cause agent to use tools prematurely.

**The fix**: Trust the Prakāśa system, remove hardcoded overrides, update workflow prompts to be explicit about tool timing.
