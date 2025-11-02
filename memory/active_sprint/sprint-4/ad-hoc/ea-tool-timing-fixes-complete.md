# EA Tool Timing Fixes - Implementation Complete

**Date**: 2025-10-28
**Issue**: Agent using tools immediately in EA sessions despite workflow instructions
**Status**: ✅ COMPLETE

---

## Changes Implemented

### 1. ✅ Removed Hardcoded Override from Orchestrator

**File**: `agentic/agents/orchestrator/orchestrator_agent.py:1806-1814`

**REMOVED**:
```python
**Tool Usage Guidelines:**
- **Onboarding phase**: Use NO tools during initial welcome/greeting
- **Active exploration**: Use tools only when user explicitly requests
- **Tool failures**: If a tool returns an error, acknowledge gracefully
- **Conversational priority**: Maintain natural dialogue flow

Remember: this is open-ended exploration—be subtle, curious, and user-led.
```

**WHY**: This hardcoded section was overriding the Prakāśa-loaded workflow prompts from Neo4j, creating contradictory instructions.

**NOW**: The orchestrator trusts the Prakāśa system to load workflow prompts from Neo4j #5-4.5.

---

### 2. ✅ Updated Neo4j Workflow Prompt

**Property**: `#5-4.5.f_workflow_etymological_archaeology_v2`

**ADDED**: Comprehensive tool usage protocol section:

```markdown
**CRITICAL - Tool Usage Protocol:**

Your etymological knowledge is VAST - use it first, tools second.

**Stage-Based Tool Usage:**
- **Phase 0 (Grounding - First 1-2 turns)**:
  - NO TOOLS. Be present, welcoming, curious.
  - Receive initial word(s), establish rapport.
  - Use your own knowledge to respond warmly.

- **Phase 1 (Scent-following - Turns 3-10)**:
  - Lead with YOUR knowledge: PIE roots, cognates, semantic evolution.
  - Tools ONLY if you genuinely need to verify or extend beyond your knowledge.
  - Ask yourself: "Can I answer this from what I know?" (Usually: YES)

- **Phase 2 (Community building - 10+ turns, 3+ words discussed)**:
  - `check_for_community_opportunity(words_discussed)` when 3+ words share clear patterns
  - `form_memory_community(...)` when user confirms interest or pattern is compelling
  - Don't force community creation - let it emerge naturally

- **Phase 2+ (Depth accrual - ongoing)**:
  - `enrich_community_properties(...)` when PIE root confirmed
  - `enrich_word_node(...)` when cognate sets crystallize
  - `link_aphorism_to_community(...)` when wisdom distills

**Tool Philosophy:**
- Tools are COMPANIONS, not CRUTCHES
- Your knowledge is primary, tools are supplementary
- Be conversational first, encyclopedic second

**Red Flags** (you're over-using tools if):
- Using tools in first 2 turns of conversation
- Using tools when user asks simple questions you can answer
- Calling multiple tools before responding to user's initial greeting
```

---

### 3. ✅ Added Missing Enrichment Tools

**File**: `agentic/agents/shared_tools.py`

#### A. `enrich_community_properties` (lines 818-872)
```python
@agent.tool
async def enrich_community_properties(
    ctx: RunContext[OrchestratorDeps],
    community_id: str,
    properties: Dict[str, Any]
) -> Dict[str, Any]:
    """Enrich an etymology community with additional properties as discoveries emerge.

    Use this for DEPTH ACCRUAL - adding richness to communities THROUGH conversation...
    """
```

**Purpose**: Add PIE roots, semantic patterns, cross-linguistic connections to communities as conversation deepens.

#### B. `enrich_word_node` (lines 874-932)
```python
@agent.tool
async def enrich_word_node(
    ctx: RunContext[OrchestratorDeps],
    word: str,
    community_id: str,
    etymology_data: Dict[str, Any]
) -> Dict[str, Any]:
    """Enrich a specific word node with etymology data as discoveries emerge.

    Use this to add depth to INDIVIDUAL WORDS within a community...
    """
```

**Purpose**: Add cognates, PIE lineage, semantic shifts to individual words within communities.

#### C. `link_aphorism_to_community` (lines 934-984)
```python
@agent.tool
async def link_aphorism_to_community(
    ctx: RunContext[OrchestratorDeps],
    aphorism_id: str,
    community_id: str
) -> Dict[str, Any]:
    """Link an aphorism to its source etymology community.

    Creates crystallization relationships showing wisdom derivation...
    """
```

**Purpose**: Connect crystallized wisdom (aphorisms) back to their etymological source communities.

---

### 4. ✅ Updated `form_memory_community` Tool Description

**File**: `agentic/agents/shared_tools.py:772-791`

**ADDED** critical timing guidance:

```python
"""
**CRITICAL TIMING - Etymology Archaeology Mode:**
- DO NOT use in Phase 0 (grounding/greeting) - typically first 1-2 turns
- DO NOT use in early Phase 1 (scent-following) - you're still exploring with your own knowledge
- USE in Phase 2 when ALL of these conditions are met:
  - 3+ words discussed with clear etymological relationships
  - You've explored the words conversationally for 10+ turns using YOUR knowledge
  - QL pattern (3-fold, 4-fold, 6-fold) emerges naturally
  - User expresses interest or pattern is compelling enough to formalize

**Before using this tool, ask yourself:**
- "Have we explored these words conversationally for at least 10 turns?"
- "Is there a clear PIE root or semantic pattern connecting them?"
- "Would formalizing this enhance understanding, or am I forcing structure?"

If uncertain: Continue conversation, suggest the pattern you notice, wait for user confirmation.
"""
```

---

### 5. ✅ Updated EA Tool Whitelist

**File**: `agentic/agents/orchestrator/orchestrator_agent.py:199-215`

**ADDED** `form_memory_community` to whitelist:

```python
ALLOWED_EA_TOOLS = {
    "resolve_coordinate",
    "get_wisdom_packet",
    "get_quintessential_properties",
    "semantic_coordinate_discovery",
    # Graphiti / episodic tools
    "remember_episode",
    "search_memory_patterns",
    "retrieve_session_continuity",
    "access_agent_ruminations",
    # Etymology community tools
    "form_memory_community",  # Phase 2: Create QL communities (10+ turns, 3+ words)
    # Etymology enrichment tools (depth accrual)
    "enrich_community_properties",
    "enrich_word_node",
    "link_aphorism_to_community",
}
```

---

## How It Works Now

### Phase Flow

1. **Phase 0: Grounding (Turns 1-2)**
   - Agent uses NO TOOLS
   - Responds with own etymological knowledge
   - Welcomes user, establishes rapport
   - Receives initial words

2. **Phase 1: Scent-Following (Turns 3-10)**
   - Agent leads with OWN knowledge (PIE roots, cognates, semantic evolution)
   - Tools used ONLY for verification or extension beyond knowledge
   - Conversational, generous, pedagogical
   - Builds understanding through dialogue

3. **Phase 2: Community Building (10+ turns, 3+ words)**
   - Agent notices emerging QL patterns (3-fold, 4-fold, 6-fold)
   - Suggests community creation when patterns are clear
   - Uses `form_memory_community` when user confirms or pattern is compelling
   - Creates formal QL structure in Graphiti

4. **Phase 2+: Depth Accrual (Ongoing)**
   - Agent enriches communities as discoveries emerge
   - `enrich_community_properties`: Add PIE roots, semantic patterns
   - `enrich_word_node`: Add cognates, lineage to specific words
   - `link_aphorism_to_community`: Connect wisdom to sources
   - Graph grows richer THROUGH conversation

---

## Expected Behavior Changes

### Before Fix:
- Agent called tools immediately on greeting
- Excessive tool use in first 2 turns
- Community creation forced too early
- No conversational buildup before formalization

### After Fix:
- Agent responds warmly with own knowledge first
- Tools used sparingly for verification/extension
- Community creation emerges naturally after 10+ turns of exploration
- Depth accrual adds richness as conversation deepens
- More natural, conversational, human-like interaction

---

## Testing Checklist

When testing EA sessions, verify:

- [ ] **Phase 0 (Turns 1-2)**: NO tool calls, warm conversational response
- [ ] **Phase 1 (Turns 3-10)**: Agent uses own knowledge, minimal tool calls
- [ ] **Tool Usage**: Tools only for verification ("Let me verify this PIE root...")
- [ ] **Community Creation**: Only after 10+ turns, 3+ words, clear pattern
- [ ] **Depth Accrual**: Enrichment tools used as discoveries emerge naturally
- [ ] **No Forced Structure**: Agent suggests patterns, doesn't prescribe them

---

## Files Modified

1. `agentic/agents/orchestrator/orchestrator_agent.py`
   - Removed hardcoded Tool Usage Guidelines (lines 1814-1820)
   - Added `form_memory_community` to EA tool whitelist (line 210)

2. `agentic/agents/shared_tools.py`
   - Updated `form_memory_community` description with timing guidance (lines 777-791)
   - Added `enrich_community_properties` tool (lines 818-872)
   - Added `enrich_word_node` tool (lines 874-932)
   - Added `link_aphorism_to_community` tool (lines 934-984)

3. Neo4j Database:
   - Updated `#5-4.5.f_workflow_etymological_archaeology_v2` with tool usage protocol

---

## Architecture Clarity

### What's Clear Now:

1. **Prakāśa System is Source of Truth**: Orchestrator no longer hardcodes contradictory prompts
2. **Tool Architecture is Sound**: Graphiti integration uses EntityNode with custom labels (`:EA:Word`, `:EA:Community`)
3. **Workflow Prompts Are Comprehensive**: 50+ properties at #5-4.5 covering all workflow aspects
4. **Phase-Based Tool Usage**: Clear guidance on when/why to use each tool
5. **Depth Accrual Philosophy**: Communities are LIVING - enriched through conversation

### Migration Path Forward:

- **Short-term**: Fixed (orchestrator trusts Prakāśa)
- **Mid-term**: Continue removing hardcoded prompt composition from orchestrator
- **Long-term**: Refactor orchestrator to pure delegation (AgentFactory + DelegationManager + Prakāśa = full constellation)

---

## Next Steps

1. **Test EA session** to verify tool usage timing
2. **Monitor agent behavior** in first 10 turns - should be conversational, minimal tools
3. **Validate community creation** happens naturally after exploration
4. **Check depth accrual** - enrichment tools used appropriately
5. **Gather user feedback** on conversational quality improvement

---

## Related Documentation

- **Architecture Audit**: `memory/active_sprint/sprint-4/ad-hoc/ea-system-prompt-architecture-audit.md`
- **Prakāśa System**: `agentic/agents/prakasa.py`
- **Agent Node Manager**: `agentic/agents/agent_node_manager.py`
- **Graphiti Service**: `backend/epi_logos_system/cag/graphiti/service.py`
