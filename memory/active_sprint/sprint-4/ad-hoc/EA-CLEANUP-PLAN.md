# Etymology Archaeology Tool Cleanup Plan
**Date**: 2025-10-28
**Sprint**: Sprint 4
**Goal**: ONE working EA implementation with NO fallbacks or competing tools

---

## Executive Summary

**Problem**: We have TWO community creation tools competing, wrong tools in ALLOWED list, and modularity violations.

**Solution**: Delete old tool, rename new tool, update allowed list, add missing endpoints, reorganize for clarity.

**Impact**: Single clean EA workflow path with proper node labeling (:EA:Word:Entity, :EA:Community:Entity).

---

## Current Issues (From Audit)

### Issue 1: Duplicate Community Creation Tools
- ❌ `form_memory_community` (line 1308) - OLD, BROKEN
  - Passes `words=[]` (empty)
  - Creates wrong node types (no :EA labels)
  - Marked "PREMATURE TOOL"
  - **IN ALLOWED_EA_TOOLS** (line 207)

- ✅ `create_etymology_community_tool` (line 1789) - NEW, CORRECT
  - Calls proper backend endpoint
  - Creates :EA:Word:Entity and :EA:Community:Entity
  - **NOT in ALLOWED_EA_TOOLS**

### Issue 2: Tool Naming Inconsistency
- EA tools use `_tool` suffix: `create_etymology_community_tool`
- Other tools don't: `remember_episode`, `search_memory_patterns`
- Makes allowed list confusing

### Issue 3: remember_episode Misuse
- Currently marked "PREMATURE TOOL"
- Being used for initial ruminations instead of post-community insights
- No validation that community exists first
- No linking to communities

### Issue 4: Missing Backend Endpoints
- ❌ `POST /api/graphiti/etymology/aphorism` - No direct aphorism creation
- ❌ `GET /api/graphiti/etymology/sessions/{id}/stats` - No EA stats

### Issue 5: Modularity Violations
- EA tools scattered: lines 1758-1850 (isolated block)
- Should be with other Episodic tools (lines 1180-1400)
- Hard to maintain and understand workflow

---

## Cleanup Plan (Sprint 4 - 3 hours)

### PHASE 1: Delete Competing Tool (15 min)

**File**: `agentic/agents/orchestrator/orchestrator_agent.py`

**Action 1.1**: Delete `form_memory_community` entirely
- **Lines to delete**: 1308-1358 (entire tool function)
- **Reason**: PREMATURE, passes wrong params, creates wrong nodes
- **No fallback**: This tool is fundamentally broken

**Action 1.2**: Remove from ALLOWED_EA_TOOLS
- **Line 207**: Delete `"form_memory_community",`

---

### PHASE 2: Rename and Reorganize EA Tools (30 min)

**File**: `agentic/agents/orchestrator/orchestrator_agent.py`

**Action 2.1**: Rename `create_etymology_community_tool` → `create_etymology_community`
- **Line 1789**: Change function name
- **Remove `_tool` suffix** for consistency with other tools

**Action 2.2**: Move EA tools to main Episodic tool block
- **Current location**: Lines 1758-1850 (isolated EA block)
- **New location**: After `access_agent_ruminations` (~line 1450)
- **Order** (workflow sequence):
  1. `etymology_search` - Initial exploration
  2. `trace_etymology_chain` - Pattern discovery
  3. `create_etymology_community` - Crystallize pattern
  4. `enrich_community_properties` - Add depth (PIE roots, etc.)
  5. `enrich_word_node` - Enrich individual words
  6. `link_aphorism_to_community` - Link insights
  7. `get_etymology_session_tool` - Check session state

**Action 2.3**: Keep `remember_episode` in general tools
- **Location**: Keep where it is (~line 1230)
- **Update**: Docstring only (see Phase 3)

---

### PHASE 3: Update remember_episode for EA Context (20 min)

**File**: `agentic/agents/orchestrator/orchestrator_agent.py`

**Action 3.1**: Update docstring
```python
async def remember_episode(
    ctx: RunContext[OrchestratorDeps],
    content: str,
    episode_type: str = "experience",
    coordinate: str = None,
    community_id: Optional[str] = None  # ← NEW PARAMETER
) -> Dict[str, Any]:
    """Create an episodic memory - a moment of experience or insight.

    **Etymology Archaeology (EA) Sessions**:
    Use this tool for insights and reflections that emerge AFTER exploring
    etymology communities. For initial word analysis, use:
      1. etymology_search - explore word origins
      2. trace_etymology_chain - find patterns
      3. create_etymology_community - crystallize discovery
      4. remember_episode - capture insights (THIS STEP)

    When in EA session, provide community_id to link insight to etymology community.

    Args:
        content: The experience, insight, or rumination content
        episode_type: Type of episode (experience, insight, reflection, etc.)
        coordinate: Optional Bimba coordinate for positioning
        community_id: Optional community UUID to link this episode to
    """
```

**Action 3.2**: Add EA session validation (optional - nice to have)
```python
# Inside remember_episode function, after parameter validation
if _is_ea_session(ctx) and episode_type == "experience" and not community_id:
    logger.warning("EA session: creating episode without community link")
    # Don't block, just warn - user knows best
```

---

### PHASE 4: Update ALLOWED_EA_TOOLS List (10 min)

**File**: `agentic/agents/orchestrator/orchestrator_agent.py`
**Lines**: 199-214

**Current**:
```python
ALLOWED_EA_TOOLS = {
    "resolve_coordinate",
    "get_wisdom_packet",
    "get_quintessential_properties",
    "semantic_coordinate_discovery",
    # Graphiti / episodic tools
    "remember_episode",
    "search_memory_patterns",
    "form_memory_community",  # ❌ DELETE THIS
    "retrieve_session_continuity",
    "access_agent_ruminations",
    # Etymology enrichment tools (depth accrual)
    "enrich_community_properties",
    "enrich_word_node",
    "link_aphorism_to_community",
}
```

**New**:
```python
ALLOWED_EA_TOOLS = {
    # Bimba coordinate tools
    "resolve_coordinate",
    "get_wisdom_packet",
    "get_quintessential_properties",
    "semantic_coordinate_discovery",

    # Episodic memory tools (general)
    "remember_episode",
    "search_memory_patterns",
    "retrieve_session_continuity",
    "access_agent_ruminations",

    # Etymology Archaeology workflow tools
    "etymology_search",              # ← ADD
    "trace_etymology_chain",         # ← ADD
    "create_etymology_community",    # ← ADD (renamed from create_etymology_community_tool)
    "get_etymology_session_tool",    # ← ADD

    # Etymology enrichment tools (depth accrual)
    "enrich_community_properties",
    "enrich_word_node",
    "link_aphorism_to_community",
}
```

---

### PHASE 5: Add Missing Backend Endpoints (1 hour)

**SKIP THIS FOR NOW** - We can use workaround:
- Aphorism creation: Use `remember_episode` + `link_aphorism_to_community`
- Stats: Use MCP server `episodic://stats` resource

**Defer to Sprint 5**:
- Add `POST /api/graphiti/etymology/aphorism` endpoint
- Add `GET /api/graphiti/etymology/sessions/{id}/stats` endpoint

---

### PHASE 6: Update EA Workflow Guidance in System Prompt (15 min)

**File**: `agentic/agents/orchestrator/orchestrator_agent.py`
**Line**: ~1900 (EA workflow prompt section)

**Current**: Generic EA workflow guidance from Prakāśa

**Add explicit workflow** (if not already in Prakāśa prompt):
```python
# In system_prompt function, EA context section
etymology_context = f"""
## Etymology Archaeology Session Active (#5-5)

**WORKFLOW** (follow in order):
1. **EXPLORE**: Use etymology_search and trace_etymology_chain to investigate word origins
2. **DIALOGUE**: Discuss patterns with user, validate etymological connections
3. **CRYSTALLIZE**: When pattern is clear, use create_etymology_community (NOT form_memory_community)
4. **DEEPEN**: Use remember_episode for insights AFTER community exists (link via community_id)
5. **ENRICH**: Add properties via enrich_community_properties and enrich_word_node

**Current Session**: {ctx.deps.session_id}
{onboarding_text}
{ea_workflow_guidance}
"""
```

---

### PHASE 7: Remove EA Tool Gating for Community Creation (5 min)

**File**: `agentic/agents/orchestrator/orchestrator_agent.py`

**Check**: Ensure `create_etymology_community` is NOT blocked by `_ea_gate`
- EA tools that ARE in `ALLOWED_EA_TOOLS` won't be gated
- Since we're adding it to the allowed list, it won't be blocked
- No code change needed (just verification)

---

## File Structure After Cleanup

```python
# orchestrator_agent.py STRUCTURE (relevant sections)

# Lines 199-220: ALLOWED_EA_TOOLS - Updated with correct tool names
ALLOWED_EA_TOOLS = {
    # Bimba, Episodic general, EA workflow, EA enrichment
}

# Lines 1180-1250: General Episodic Tools
@agent.tool
async def remember_episode(..., community_id=None):  # ← Updated docstring + param

@agent.tool
async def search_memory_patterns(...):

# Lines 1260-1450: Other Episodic Tools
@agent.tool
async def retrieve_session_continuity(...):

@agent.tool
async def access_agent_ruminations(...):

# Lines 1450-1600: Etymology Archaeology Tools (MOVED HERE)
if _is_ea_session(ctx):  # Conditional registration

    @agent.tool
    async def etymology_search(...):

    @agent.tool
    async def trace_etymology_chain(...):

    @agent.tool
    async def create_etymology_community(...):  # ← Renamed, moved

    @agent.tool
    async def get_etymology_session_tool(...):

    @agent.tool
    async def enrich_community_properties(...):

    @agent.tool
    async def enrich_word_node(...):

    @agent.tool
    async def link_aphorism_to_community(...):

# Lines 1600+: Other tools...
```

---

## Testing Checklist

After cleanup, verify:

### Tool Registration
- [ ] Only ONE community creation tool exists: `create_etymology_community`
- [ ] `form_memory_community` completely removed (grep confirms)
- [ ] All EA tools in `ALLOWED_EA_TOOLS` are actually registered

### EA Workflow
- [ ] Start EA session (#5-5)
- [ ] Use `etymology_search` for word exploration
- [ ] Use `trace_etymology_chain` for pattern discovery
- [ ] Use `create_etymology_community` to crystallize pattern
- [ ] Verify :EA:Word:Entity nodes created in Neo4j
- [ ] Verify :EA:Community:Entity node created in Neo4j
- [ ] Use `remember_episode` with `community_id` for insights
- [ ] Verify episode links to community

### Tool Behavior
- [ ] `etymology_search` returns guidance (not actual search)
- [ ] `trace_etymology_chain` returns guidance (not actual trace)
- [ ] `create_etymology_community` calls backend successfully
- [ ] `get_etymology_session_tool` retrieves session data
- [ ] Stats button enables after community creation (if endpoint exists)

### Logging
- [ ] No "PREMATURE TOOL" warnings
- [ ] Clear workflow logging shows tool sequence
- [ ] EA mode detection logs correctly

---

## Files to Modify

1. **`agentic/agents/orchestrator/orchestrator_agent.py`** - Main changes
   - Delete `form_memory_community` (lines 1308-1358)
   - Update `ALLOWED_EA_TOOLS` (lines 199-214)
   - Update `remember_episode` docstring (line ~1230)
   - Rename `create_etymology_community_tool` → `create_etymology_community` (line 1789)
   - Move EA tools to main Episodic block (~line 1450)
   - Update EA workflow guidance in system_prompt (~line 1900)

2. **No changes needed** (already correct):
   - `agentic/agents/epii/tools/etymology_dialogue.py` ✅
   - `agentic/agents/epii/tools/graphiti_community.py` ✅
   - `agentic/clients/graphiti_http_client.py` ✅
   - Backend Graphiti service ✅

---

## Success Criteria

### Code Quality
- ✅ ONE community creation tool path (no duplicates)
- ✅ Clear tool naming (no confusing suffixes)
- ✅ Proper workflow ordering (explore → crystallize → deepen)
- ✅ EA tools grouped with Episodic tools (not isolated)

### Functional Correctness
- ✅ :EA:Word:Entity nodes created with proper labels
- ✅ :EA:Community:Entity nodes created with proper labels
- ✅ remember_episode clarified as post-community tool
- ✅ All EA tools in allowed list are actually available

### Documentation
- ✅ Clear docstrings explain workflow
- ✅ System prompt guides user through steps
- ✅ No misleading "PREMATURE" warnings

---

## Estimated Time

| Phase | Task | Time |
|-------|------|------|
| 1 | Delete `form_memory_community` | 15 min |
| 2 | Rename and reorganize EA tools | 30 min |
| 3 | Update `remember_episode` | 20 min |
| 4 | Update `ALLOWED_EA_TOOLS` | 10 min |
| 5 | Backend endpoints (SKIP) | 0 min |
| 6 | Update workflow guidance | 15 min |
| 7 | Verify EA gate | 5 min |
| **Testing** | End-to-end EA workflow | 30 min |
| **TOTAL** | | **~2 hours** |

---

## Sprint 5 Follow-up

Defer these to Sprint 5 (major refactoring):

1. **Extract EA tools to separate module**
   - Move to `agentic/agents/epii/tools/ea_tools.py`
   - Import and register dynamically
   - Reduce orchestrator file size

2. **Add missing backend endpoints**
   - `POST /api/graphiti/etymology/aphorism`
   - `GET /api/graphiti/etymology/sessions/{id}/stats`

3. **Delete orchestrator_agent.py entirely**
   - Move all tools to `shared_tools.py`
   - Use ONLY AgentFactory + constellation.py
   - Remove inline Prakāśa instantiation

---

## Notes

### Why Not Move EA Tools to Separate File Now?

**Answer**: Sprint 4 is about fixing functionality, not refactoring architecture. Moving tools to a separate file is a 4-hour task (Sprint 5). For now, we just need:
- ONE working community creation tool
- Clear workflow ordering
- Proper node labeling

### Why Keep remember_episode General?

**Answer**: It's used in non-EA sessions too. We just clarify its EA usage in the docstring and add optional `community_id` parameter. This is backward compatible.

### Why Skip Backend Endpoints?

**Answer**: Workarounds exist (remember_episode + link_aphorism, MCP stats). Adding endpoints is 2 hours of backend work. We can defer to Sprint 5 when doing full cleanup.

---

## Conclusion

This plan delivers:
- ✅ Single EA workflow path (no competing tools)
- ✅ Proper node labeling (:EA:Word:Entity, :EA:Community:Entity)
- ✅ Clear tool ordering and documentation
- ✅ No "PREMATURE" warnings
- ⏰ ~2 hours of focused work (Sprint 4)
- 📋 Clean foundation for Sprint 5 major refactoring

**Ready to execute? Let's clean up this EA implementation.**
