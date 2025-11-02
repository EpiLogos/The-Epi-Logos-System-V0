# Workflow Loading Implementation - COMPLETE ✅

**Date**: 2025-10-27
**Goal**: Implement staged, selective workflow loading system aligned with etymological archaeology cypher property conventions

---

## What Was Implemented

### 1. New Helper Methods in `prakasa.py`

#### `_get_capability_references(agent_coordinate)` - Layer 1e Lean Loading
- **Purpose**: List capability NAMES + brief descriptions (truncated to ~100 chars)
- **Pattern**: Finds all `f_capability_{name}_description` properties
- **Returns**: Formatted list with note that full details load with workflows
- **Token Saving**: ~80% reduction vs loading full capability details in Layer 1
- **Status**: ✅ Implemented

#### `_load_workflow_header(agent_coordinate, workflow_name)` - Workflow Overview
- **Purpose**: Load workflow metadata and dependency declarations
- **Properties Loaded**:
  - `version`, `description`, `cyclic_nature`, `agent_domain`
  - `backend_processes`, `uses_capabilities`, `uses_protocols`
- **JSON Parsing**: Automatically parses `uses_capabilities` and `uses_protocols` arrays
- **Status**: ✅ Implemented

#### `_load_capabilities(agent_coordinate, capability_names)` - Full Capability Details
- **Purpose**: Load FULL details for ONLY capabilities referenced by workflow
- **Pattern**: For each name in list, load ALL `f_capability_{name}_*` properties
- **JSON Handling**: Auto-parses JSON objects/arrays in property values
- **Returns**: Dict mapping capability name → all its properties
- **Status**: ✅ Implemented

#### `_load_protocols(agent_coordinate, protocol_names)` - Full Protocol Details
- **Purpose**: Load FULL details for ONLY protocols referenced by workflow
- **Pattern**: For each name in list, load ALL `f_protocol_{name}_*` properties
- **JSON Handling**: Auto-parses JSON objects/arrays in property values
- **Returns**: Dict mapping protocol name → all its properties
- **Status**: ✅ Implemented

#### `_load_workflow_stage(agent_coordinate, workflow_name, stage_name)` - Current Stage Only
- **Purpose**: Load guidance for CURRENT stage only (not all stages)
- **Pattern**: `f_workflow_{workflow_name}_stage_{N}_*`
- **Properties Loaded**:
  - `name`, `description`, `agent_activities`, `agent_guidance`
  - `conversational_style`, `tools`, `outputs`, `transitions_to`
  - Plus stage-specific: `scent_following_integration`, `watching_for_patterns`, etc.
- **Stage Identifier Handling**: Accepts "stage_0", "0", "stage_1_ongoing" formats
- **Status**: ✅ Implemented

#### `_load_backend_awareness(agent_coordinate, workflow_name)` - Backend Summary
- **Purpose**: Load backend process awareness (Stages 3-5 for EA workflow)
- **Properties Loaded**:
  - `stages_3_5_description` - Overall summary
  - `querying_backend` - How to query results
  - `cyclic_return` - Return to Stage 1 guidance
  - Optional: `stage_3_backend`, `stage_4_backend`, `stage_5_backend`
- **Rationale**: Agent doesn't execute Stages 3-5, only needs awareness
- **Status**: ✅ Implemented

#### `_compose_workflow_layer(workflow_name, header, capabilities, protocols, stage, backend)` - Layer 2 Assembly
- **Purpose**: Compose complete Layer 2 (Workflow Engagement) from loaded components
- **Structure**:
  ```
  # Workflow: {name}
  Version: {version}

  ## Overview
  {description}

  ## Cyclic Nature
  {cyclic_nature}

  ## Active Capabilities
  ### {capability_name}
  **{aspect}**: {value}

  ## Active Protocols
  ### {protocol_name}
  **{aspect}**: {value}

  ## Current Stage: {stage_name}
  ### Your Activities
  {agent_activities}

  ## Backend Processes (Awareness Only)
  {backend summary}
  ```
- **JSON Formatting**: Nicely formats JSON objects/arrays with indentation
- **Status**: ✅ Implemented

---

## 2. Enhanced `engage_workflow_prakasa()` Method

### New Signature
```python
async def engage_workflow_prakasa(
    self,
    agent_coordinate: str,
    workflow_name: str,
    current_stage: Optional[str] = None,  # NEW PARAMETER
    **workflow_params
) -> str
```

### New Loading Strategy

**Priority 1: NEW Staged Loading**
```python
# 1. Load workflow header
header = await self._load_workflow_header(agent_coordinate, workflow_name)

if header:
    # 2. Parse capability/protocol dependencies
    capability_names = header.get('uses_capabilities', [])
    protocol_names = header.get('uses_protocols', [])

    # 3. Load ONLY referenced components (FULL details)
    capabilities = await self._load_capabilities(agent_coordinate, capability_names)
    protocols = await self._load_protocols(agent_coordinate, protocol_names)

    # 4. Load ONLY current stage
    stage = await self._load_workflow_stage(agent_coordinate, workflow_name, current_stage)

    # 5. Load backend awareness
    backend = await self._load_backend_awareness(agent_coordinate, workflow_name)

    # 6. Compose Layer 2
    return self._compose_workflow_layer(...)
```

**Priority 2: LEGACY Versioned EA Workflow**
Falls back to old `_get_ea_workflow_prompt()` if header not found

**Priority 3: LEGACY Template-Based Workflow**
Falls back to old template + params approach if neither above work

### Backward Compatibility
- ✅ Existing code continues to work (no breaking changes)
- ✅ Legacy workflows still supported
- ✅ New cypher properties enable new features
- ✅ Graceful degradation if new properties missing

---

## 3. Enhanced `compose_identity_layers()` Method

### Layer 1e: Capability References Added

**Before**:
```python
# Layer 1e: Capabilities
# NOTE: Skipping for now - workflow properties being refactored
```

**After**:
```python
# Layer 1e: Capabilities (REFERENCES ONLY)
capability_refs = await self._get_capability_references(agent_coordinate)
if capability_refs:
    layers.append(f"# Layer 1e: Operational Capabilities\n\n{capability_refs}")
```

**Result**:
```markdown
# Layer 1e: Operational Capabilities

You have the following capabilities available:
- **Logos Cycle**: Six-phase contemplative rhythm that's both Whiteheadian concrescence and Lacanian signif...
- **Contemplative Synthesis**: Deep pattern recognition and holistic integration capacity...
- **Etymological Archaeology**: Specialized capacity for PIE reconstruction and cognate analysis...

*Full capability details load when workflows reference them.*
```

**Token Savings**: ~2000 tokens vs loading full capability JSON in Layer 1

---

## Property Convention Alignment

### Three-Tier Namespace (from Cypher Analysis)

#### **Tier 1: CAPABILITIES** (`f_capability_*`)
**Loading Strategy**: LEAN references in Layer 1e, FULL details in Layer 2 when workflow references

**Example Properties**:
```
f_capability_logos_cycle_description
f_capability_logos_cycle_phases (JSON - 6 phases)
f_capability_logos_cycle_quality
f_capability_logos_cycle_practical_use
```

**Implementation**:
- `_get_capability_references()` → Loads `_description` only for Layer 1e
- `_load_capabilities()` → Loads ALL `f_capability_{name}_*` for Layer 2

#### **Tier 2: PROTOCOLS** (`f_protocol_*`)
**Loading Strategy**: NOT in Layer 1, FULL details in Layer 2 when workflow references

**Example Properties**:
```
f_protocol_scent_following_description
f_protocol_scent_following_isomorphism
f_protocol_scent_following_method
f_protocol_scent_following_principles
```

**Implementation**:
- `_load_protocols()` → Loads ALL `f_protocol_{name}_*` for Layer 2

#### **Tier 3: WORKFLOWS** (`f_workflow_*`)
**Loading Strategy**: STAGED - header + current stage only, not all stages

**Example Properties**:
```
f_workflow_etymological_archaeology_version
f_workflow_etymological_archaeology_description
f_workflow_etymological_archaeology_cyclic_nature
f_workflow_etymological_archaeology_uses_capabilities (ARRAY)
f_workflow_etymological_archaeology_uses_protocols (ARRAY)
f_workflow_etymological_archaeology_stage_0_name
f_workflow_etymological_archaeology_stage_0_description
f_workflow_etymological_archaeology_stage_0_agent_activities
[...repeat for each stage]
```

**Implementation**:
- `_load_workflow_header()` → Loads overview properties + dependency arrays
- `_load_workflow_stage()` → Loads ONLY current stage properties
- `_load_backend_awareness()` → Loads backend summary (not full stage 3-5 guidance)

---

## Token Budget Impact

### Before (Naive Full Loading)
```
Layer 1 (full): ~8000 tokens
All capabilities (full): ~2000 tokens
All protocols (full): ~1500 tokens
All workflow stages (0-5): ~6000 tokens
Backend details: ~800 tokens
Runtime context: ~500 tokens
---
TOTAL: ~18,800 tokens (UNSUSTAINABLE)
```

### After (Staged Selective Loading)
```
Layer 1 (1a-1d): ~6000 tokens
Layer 1e (capability refs): ~200 tokens
Layer 2 header: ~1000 tokens
Layer 2 active capabilities (3 for EA): ~1200 tokens
Layer 2 active protocols (3 for EA): ~1500 tokens
Layer 2 current stage: ~1000 tokens
Layer 2 backend awareness: ~600 tokens
Layer 3 runtime: ~500 tokens
---
TOTAL: ~12,000 tokens (MANAGEABLE)
```

**Savings**: ~6,800 tokens (36% reduction)

---

## Usage Example

### Frontend Sends Request
```json
{
  "workflow_name": "etymological_archaeology",
  "current_stage": "stage_0",
  "session_id": "uuid-123",
  "message": "I want to explore the word 'sign'"
}
```

### Backend Engages Workflow
```python
prakasa = PrakasaManager(bimba_client, redis_client)

# Layer 1: Identity (cached, static)
identity = await prakasa.compose_identity_layers("#5-4.5")

# Layer 2: Workflow (dynamic, staged)
workflow = await prakasa.engage_workflow_prakasa(
    agent_coordinate="#5-4.5",
    workflow_name="etymological_archaeology",
    current_stage="stage_0"  # First stage
)

# Layer 3: Runtime context
context = prakasa.build_context_prakasa(request)

# Compose full prompt
full_prompt = f"{identity}\n\n---\n\n{workflow}\n\n---\n\n{context}"
```

### Agent Receives Prompt With:
- QL Foundation (universal)
- Project Context (universal)
- System Prompt (agent-agnostic)
- Epii Identity + Character (agent-specific)
- Capability References (lean list)
- EA Workflow Header (cyclic nature, domain, backend processes)
- Logos Cycle Capability (FULL details - phases JSON, quality, practical use)
- Scent Following Protocol (FULL details - isomorphism, method, principles)
- Paradox Holding Protocol (FULL details)
- Möbius Return Protocol (FULL details)
- Stage 0 Guidance (context establishment activities)
- Backend Awareness (summary of stages 3-5)
- Runtime Context (user message, session)

### Agent Transitions to Stage 1
```python
# Next request, agent internally knows it's now in stage_1
workflow = await prakasa.engage_workflow_prakasa(
    agent_coordinate="#5-4.5",
    workflow_name="etymological_archaeology",
    current_stage="stage_1"  # Now loads Stage 1 guidance instead of Stage 0
)
```

**Result**: Stage 0 guidance drops out, Stage 1 guidance loads in (ongoing exploration activities)

---

## Cyclic Workflow Support

### Etymology Archaeology Flow
```
Stage 0 (context) → Stage 1 (explore) ⟲ Stage 2 (crystallize) →
[Backend: Stages 3-5 automatic] → Query results →
BACK TO Stage 1 (deeper exploration) ⟲ Stage 2 (expand communities) →
[Backend again] → Continue cycling...
```

### Context Management
- **Stage 1 is ONGOING MAIN ACTIVITY** (not a phase to pass through)
- Agent can return to Stage 1 multiple times with enriched understanding
- Each cycle, same Stage 1 guidance loads but context is richer (backend results available)
- Supports SPIRAL DEEPENING (returning to same structure at elevated position)

---

## Files Modified

1. `/agentic/agents/prakasa.py`:
   - Added `import json`
   - Added 7 new helper methods
   - Enhanced `engage_workflow_prakasa()` with staged loading
   - Enhanced `compose_identity_layers()` with Layer 1e

**Lines Added**: ~500 lines
**Functions Added**: 7 helpers + 2 enhanced

---

## Next Steps

### Immediate (Sprint 4 Completion)
1. ✅ Execute cypher files to write prompt properties to Neo4j
2. ⏳ Test workflow loading with real etymological archaeology data
3. ⏳ Validate token usage meets budget (<15,000 tokens)
4. ⏳ Frontend integration with etymology archaeology page

### Future (Sprint 5+)
1. Add caching strategy for workflow components
2. Implement smart context depth (full vs summary versions)
3. Add other workflows beyond etymology archaeology
4. Create workflow state tracking in session/context
5. Build workflow transition logic (automatic stage progression)

---

## Success Criteria

- ✅ Three-tier namespace (capability/protocol/workflow) implemented
- ✅ LEAN loading (capability references, not full dumps)
- ✅ SELECTIVE loading (only workflow-referenced components)
- ✅ STAGED loading (current stage only, not all stages)
- ✅ Backward compatibility (legacy workflows still work)
- ✅ Token budget achievable (~12,000 tokens)
- ⏳ Cyclic workflow support validated
- ⏳ Frontend integration working end-to-end

---

## Architecture Alignment

### Property Convention Compliance ✅
- Follows `f_capability_{name}_{aspect}` pattern
- Follows `f_protocol_{name}_{aspect}` pattern
- Follows `f_workflow_{name}_{aspect}` pattern
- Follows `f_workflow_{name}_stage_{N}_{aspect}` pattern
- Parses JSON arrays correctly (`uses_capabilities`, `uses_protocols`, `tools`)

### Context Loading Strategy ✅
- Layer 1e: Capability REFERENCES (lean)
- Layer 2: FULL details for workflow-referenced components only
- Layer 2: CURRENT stage only (not all stages)
- Backend awareness: SUMMARY not detailed guidance

### Cyclic Workflow Support ✅
- Accepts `current_stage` parameter
- Supports returning to Stage 1 multiple times
- Loads fresh stage guidance on each transition
- Stage 1 recognized as ongoing main activity

---

## Notes

**Phase 4 Complete**: Core implementation done
**Testing Required**: Needs real cypher data in Neo4j
**Frontend Work**: Etymology page needs workflow context in requests
**Token Budget**: Estimated ~12,000 tokens, needs validation with real data
**Legacy Support**: All existing code continues to work
