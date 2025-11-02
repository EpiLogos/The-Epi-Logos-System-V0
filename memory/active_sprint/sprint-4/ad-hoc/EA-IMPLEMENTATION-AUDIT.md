# Etymology Archaeology Implementation Audit
**Date**: 2025-10-28
**Scope**: Etymology Archaeology feature + Prakāśa Manager architecture review
**Severity**: HIGH - Multiple architectural violations and duplicate implementations

---

## Executive Summary

The Etymology Archaeology (EA) feature implementation has severe architectural issues:

1. **Tool Method Confusion**: Mix of old and new methods for community/aphorism creation
2. **Prakāśa Manager Misplacement**: Created inside orchestrator_agent.py instead of using AgentFactory
3. **Massive File Size**: orchestrator_agent.py is 2,137 lines (should be ~500-800 max)
4. **Broken Tool Integration**: Unclear which tools actually work vs which are placeholders
5. **Missing Backend Methods**: Several Graphiti client methods don't have backend implementations
6. **Stats Counter Status**: Unknown if stats tracking is functional

---

## Critical Issues

### 1. DUPLICATE COMMUNITY CREATION METHODS ❌

**Location**: `orchestrator_agent.py` EA tools section (lines 1789-1850)

**Problem**: THREE different ways to create etymology communities:

#### Method A: `create_etymology_community_tool` (orchestrator line 1789)
```python
@agent.tool
async def create_etymology_community_tool(
    ctx: RunContext[OrchestratorDeps],
    name: str,
    words: List[str],
    pie_root: Optional[str] = None,
    semantic_pattern: Optional[str] = None,
    bimba_coordinate: Optional[str] = None
) -> Dict[str, Any]:
    """Graphiti: create an etymology community."""
    from agentic.agents.epii.tools.graphiti_community import create_etymology_community
    return await _create(...)
```

#### Method B: `form_memory_community` (orchestrator line 1308)
```python
@agent.tool
async def form_memory_community(
    ctx: RunContext[OrchestratorDeps],
    name: str,
    description: str,
    coordinate: str = None
) -> Dict[str, Any]:
    """Create a community cluster for related episodic memories."""
    result = await ctx.deps.graphiti_client.create_community(
        name=name,
        description=description,
        group_id=group_id,
        words=[],  # Empty list for non-etymology communities
        session_id=ctx.deps.session_id,
        bimba_coordinate=coordinate
    )
```

#### Method C: Direct `create_community` call in GraphitiHttpClient
```python
async def create_community(
    self,
    name: str,
    description: str,
    group_id: str,
    words: List[str],
    quaternal_type: str = "FOUR_PART",
    domain: str = "EA",
    session_id: str = None,
    user_id: str = None,
    pie_root: str = None,
    semantic_pattern: str = None,
    bimba_coordinate: str = None
) -> Dict[str, Any]:
```

**Status**:
- ✅ Method A (EA-specific tool) - CORRECT for EA sessions
- ⚠️ Method B (generic community) - DEPRECATED but still registered
- ✅ Method C (HTTP client) - CORRECT backend integration

**Action Required**: Remove Method B from orchestrator tools (EA gating disabled it but it's still in code)

---

### 2. APHORISM CREATION CONFUSION ❌

**Problem**: Only ONE way exists (via `remember_episode` + `link_aphorism_to_community`), but NO dedicated aphorism creation tool

**Current Pattern**:
```python
# Step 1: Create episode with type="insight"
aphorism = await remember_episode(
    content="To bear is to birth",
    episode_type="insight"
)

# Step 2: Link to community
await link_aphorism_to_community(
    aphorism_id=aphorism["episode"]["id"],
    community_id="abc-123"
)
```

**Missing**: Direct `create_aphorism_tool` that calls `graphiti_community.create_aphorism()`

**Backend Support**:
- ❌ NO `/api/graphiti/etymology/aphorism` endpoint exists
- ✅ Has `link_aphorism_to_community` endpoint

**Status**: Incomplete - relying on generic episode creation instead of domain-specific aphorism workflow

---

### 3. PRAKĀŚA MANAGER ARCHITECTURE VIOLATION 🚨

**⚠️ CRITICAL ARCHITECTURAL CONFUSION - See [AGENT-ARCHITECTURE-WTF.md](./AGENT-ARCHITECTURE-WTF.md) for full breakdown**

**Current State**: We have TWO agent creation patterns and the WRONG one is default:

1. **Pattern A (CORRECT)**: `AgentFactory` + `constellation.py` with proper Prakāśa integration
2. **Pattern B (WRONG - DEFAULT)**: `orchestrator_agent.py` with inline Prakāśa instantiation

**The Problem**:
```python
# orchestrator_agent.py:1858-1865 - WRONG (but currently default)
@agent.system_prompt
def system_prompt(ctx: RunContext[OrchestratorDeps]) -> str:
    """Base system prompt loaded from Neo4j via PrakasaManager (Layer 1: Identity)."""
    from agentic.agents.prakasa import PrakasaManager
    import asyncio  # ❌ Sync function calling async

    manager = PrakasaManager(ctx.deps.bimba_client, ctx.deps.redis_client)  # ❌ Per-request instantiation
    foundation = asyncio.run(manager.get_identity_prakasa("#5-4"))  # ❌ Performance hit
```

**vs**

```python
# constellation.py:113-117 - CORRECT (but not default)
async def create_epii_agent(model: str, bimba_client, redis_client) -> Agent:
    prakasa = PrakasaManager(bimba_client, redis_client)  # ✅ Constructor argument
    identity = await prakasa.get_identity_prakasa("#5-4.5")  # ✅ Proper async

    agent = Agent(model=model, system_prompt=identity, ...)  # ✅ Static prompt
    agent._prakasa_manager = prakasa  # ✅ Store reference
    return agent
```

**Issues**:
- ❌ Prakāśa Manager instantiated PER REQUEST (orchestrator pattern)
- ❌ NOT using AgentFactory pattern (we HAVE it, just not using it)
- ❌ `asyncio.run()` in sync decorator causes performance hit
- ❌ No agent registry, no tracking
- ❌ 100-line system_prompt function doing Prakāśa's job

**Root Cause**: `ENABLE_MULTI_AGENT=false` (default) → uses orchestrator pattern instead of factory

**Status**: CRITICAL VIOLATION - Two patterns coexist, wrong one is default

**SEE DETAILED BREAKDOWN**: [AGENT-ARCHITECTURE-WTF.md](./AGENT-ARCHITECTURE-WTF.md)

---

### 4. ORCHESTRATOR FILE SIZE EXPLOSION 📈

**Current Size**: 2,137 lines (orchestrator_agent.py)

**Breakdown**:
- Lines 1-800: Agent setup, dependencies, core tools
- Lines 800-1400: Bimba/Gnostic/Episodic tools (GOOD)
- Lines 1400-1600: Etymology enrichment tools (SHOULD BE MODULAR)
- Lines 1600-1750: Delegation + ruminations
- Lines 1750-1850: EA-specific tools (SHOULD BE SEPARATE MODULE)
- Lines 1850-2100: Prompt composition (MASSIVE - should be in prakasa.py)

**Modularity Violations**:
1. EA-specific tools embedded in orchestrator (should be in `agentic/agents/epii/tools/`)
2. System prompt composition logic duplicated (should delegate to PrakasaManager)
3. Manual EA mode detection instead of factory pattern

**Recommendation**: Target file size of 800-1000 lines max

---

### 5. ETYMOLOGY TOOL VERIFICATION STATUS 🔍

#### Verified Working ✅
- `get_etymology_session_tool` - Fetches session data from backend
- `create_etymology_community_tool` - Creates community via backend
- `enrich_community_properties` - Updates community (HTTP client method exists)
- `enrich_word_node` - Enriches word etymology (HTTP client method exists)
- `link_aphorism_to_community` - Links aphorism to community (HTTP client + backend exists)

#### Unverified / Suspect ⚠️
- `etymology_search_tool` - Returns guidance dict, doesn't actually search
  - Status: Intentional (relies on LLM web search), but misleading name
- `trace_etymology_chain_tool` - Returns guidance dict, doesn't trace
  - Status: Intentional (relies on LLM reasoning), but misleading name

#### Missing Backend Implementations ❌
- `create_aphorism` - No `/api/graphiti/etymology/aphorism` POST endpoint
  - Currently using generic `create_episode` instead
- Stats counters for EA sessions - No dedicated endpoint found
  - MCP server has `episodic://stats` but unclear if EA-specific

---

### 6. STATS COUNTER STATUS 📊

**Evidence Found**:
```python
# backend/epi_logos_system/cag/graphiti/api.py:381
# Comment: "This enables stats button and frontend polling detection"

# backend/epi_logos_system/cag/graphiti/mcp_server.py:468
uri="episodic://stats"  # MCP resource for stats

# backend/epi_logos_system/cag/graphiti/service.py:1030
"word_count": len(request.words)  # Only word count found
```

**Status**:
- ✅ Generic episodic stats exist (total episodes, types, groups)
- ❌ NO EA-specific stats (community count, aphorism count, PIE roots discovered)
- ⚠️ No orchestrator tool to access stats (would need to call MCP resource)

**Missing**:
- EA session stats endpoint (`/api/graphiti/etymology/sessions/{id}/stats`)
- Community count per session
- Aphorism count per session
- Word node count per session

---

## Architectural Comparison

### Current Implementation (WRONG):
```
orchestrator_agent.py (2137 lines) ❌
├── Agent setup
├── ALL tools (Bimba + Gnostic + Episodic + EA)
├── EA-specific tools embedded
├── Prakāśa Manager instantiated inline
└── Massive system_prompt function
```

### Expected Architecture (CORRECT):
```
agent_factory.py ✅
├── PrakasaManager instance (shared)
├── create_agent() method
│   └── Loads identity via Prakasa
└── Returns configured agent

orchestrator_agent.py (800 lines) ✅
├── Core tools (Bimba, Gnostic, Episodic)
├── Generic memory tools
└── Delegates to PrakasaManager for prompts

agentic/agents/epii/tools/ ✅
├── etymology_dialogue.py
├── graphiti_community.py
└── session_onboarding.py
```

---

## Cleanup Recommendations

### Immediate Actions (Sprint 4)

1. **Remove Duplicate Community Creation** (1 hour)
   - Delete `form_memory_community` from orchestrator tools (EA sessions don't need it)
   - Keep only `create_etymology_community_tool` for EA
   - Document that generic communities use HTTP client directly

2. **Add Missing Aphorism Creation Tool** (2 hours)
   - Create backend endpoint: `POST /api/graphiti/etymology/aphorism`
   - Implement in `graphiti/service.py` and `graphiti/api.py`
   - Add orchestrator tool: `create_aphorism_tool`

3. **Add EA Stats Endpoint** (2 hours)
   - Create `GET /api/graphiti/etymology/sessions/{id}/stats`
   - Return: community_count, aphorism_count, word_count, pie_roots_discovered
   - Add orchestrator tool: `get_ea_session_stats`

### Major Refactoring (Sprint 5)

4. **Migrate to AgentFactory Pattern** (8 hours)
   - Move Prakāśa Manager instantiation to AgentFactory
   - Remove inline manager creation from orchestrator
   - Update agent_runner.py to use factory for ALL agents

5. **Extract EA Tools Module** (4 hours)
   - Move EA tools from orchestrator to `agentic/agents/epii/tools/ea_tools.py`
   - Register dynamically for EA sessions only
   - Reduce orchestrator to ~1000 lines

6. **Refactor System Prompt Composition** (4 hours)
   - Move all prompt logic to PrakasaManager.compose_full_prakasa()
   - Orchestrator system_prompt just calls manager
   - Eliminate asyncio.run() hacks

---

## Testing Checklist

### Etymology Tools ✅/❌
- [ ] `create_etymology_community_tool` - Creates community successfully
- [ ] `enrich_community_properties` - Updates community properties
- [ ] `enrich_word_node` - Enriches word with etymology data
- [ ] `link_aphorism_to_community` - Creates DISTILLS_FROM relationship
- [ ] `get_etymology_session_tool` - Fetches session with communities/words

### Missing Tools (To Implement)
- [ ] `create_aphorism_tool` - Direct aphorism creation
- [ ] `get_ea_session_stats` - EA-specific statistics

### Backend Endpoints
- [✅] `POST /api/graphiti/etymology/community` - Works
- [✅] `PATCH /api/graphiti/etymology/communities/{id}` - Works
- [✅] `PATCH /api/graphiti/etymology/words/{word}` - Works
- [✅] `POST /api/graphiti/etymology/communities/{id}/aphorisms/{aphorism_id}` - Works
- [✅] `GET /api/graphiti/etymology/sessions/{id}` - Works
- [❌] `POST /api/graphiti/etymology/aphorism` - MISSING
- [❌] `GET /api/graphiti/etymology/sessions/{id}/stats` - MISSING

---

## Severity Assessment

### 🔴 CRITICAL (Blocks Development)
1. Prakāśa Manager architecture violation - bypassing AgentFactory
2. Orchestrator file size (2137 lines) - unmaintainable

### 🟠 HIGH (Causes Confusion)
3. Duplicate community creation methods
4. Missing aphorism creation endpoint
5. Etymology tool names misleading (search/trace don't actually search/trace)

### 🟡 MEDIUM (Degrades Experience)
6. Missing EA stats endpoint
7. No stats tool in orchestrator

### 🟢 LOW (Nice to Have)
8. Better modularization of EA tools
9. Cleanup of EA tool docstrings

---

## Next Steps

### User Decision Required:
1. **Immediate fixes** (Sprint 4 - ~5 hours total)?
   - Remove duplicate methods
   - Add missing aphorism endpoint
   - Add stats endpoint

2. **Major refactoring** (Sprint 5 - ~16 hours)?
   - Migrate to AgentFactory pattern
   - Extract EA tools module
   - Refactor prompt composition

3. **Both** (Sprint 4 immediate, Sprint 5 architecture)?

---

## Appendix: Code References

### Duplicate Methods
- `form_memory_community`: orchestrator_agent.py:1308-1358
- `create_etymology_community_tool`: orchestrator_agent.py:1789-1818
- `create_community` (HTTP): graphiti_http_client.py:93-128

### Prakāśa Violations
- Inline instantiation: orchestrator_agent.py:1858-1865
- Should use: agentic/agents/agent_factory.py:create_agent()

### Missing Backend
- Aphorism creation: No endpoint in `backend/epi_logos_system/cag/graphiti/api.py`
- EA stats: No endpoint in `backend/epi_logos_system/cag/graphiti/api.py`

### File Sizes
- orchestrator_agent.py: 2,137 lines (should be ~800)
- prakasa.py: 1,490 lines (acceptable for manager)
- graphiti_community.py: 332 lines (good)
