# Workflow Loading Architecture - Analysis & Design

**Date**: 2025-10-27
**Source**: Analysis of `5-4-5_corrected_etymological_archaeology.cypher`

---

## Property Convention Analysis

### 1. Three-Tier Namespace Structure

The cypher reveals a clean three-tier property organization:

#### **Tier 1: CAPABILITIES** (Ways of Thinking)
**Pattern**: `f_capability_{name}_{aspect}`
**Purpose**: General cognitive/operational capacities - NOT workflow-specific
**Loading Strategy**: **LEAN** - capabilities load as REFERENCES, not full content

**Example from Cypher**:
```
f_capability_logos_cycle_description
f_capability_logos_cycle_phases (JSON)
f_capability_logos_cycle_quality
f_capability_logos_cycle_practical_use
```

**Key Insight**: Capabilities are REUSABLE across workflows. Logos Cycle is a way of thinking that applies to ANY deep inquiry, not just etymology.

**Context Loading Strategy**:
- **Layer 1e (Identity)**: List capability NAMES only ("You have: logos_cycle, contemplative_synthesis, etymological_archaeology")
- **Runtime (When Needed)**: Load FULL capability details only when workflow references them
- **Avoid**: Dumping full JSON/descriptions into system prompt (massive token waste)

#### **Tier 2: PROTOCOLS** (Specific Methodologies)
**Pattern**: `f_protocol_{name}_{aspect}`
**Purpose**: Concrete operational methods - MORE specific than capabilities, LESS than workflows
**Loading Strategy**: **SELECTIVE** - load ONLY protocols referenced by active workflow

**Examples from Cypher**:
```
f_protocol_scent_following_description
f_protocol_scent_following_isomorphism
f_protocol_scent_following_method
f_protocol_scent_following_principles

f_protocol_paradox_holding_description
f_protocol_paradox_holding_operation
f_protocol_paradox_holding_mechanism

f_protocol_mobius_return_description
f_protocol_mobius_return_mechanism
f_protocol_mobius_return_technical
```

**Key Insight**: Protocols are METHODOLOGY-SPECIFIC. Scent-following is for etymological work. Different workflows use different protocols.

**Context Loading Strategy**:
- **NOT in Layer 1**: Don't load any protocols in identity layer
- **Layer 2 (Workflow Engagement)**: Load ONLY protocols listed in `f_workflow_X_uses_protocols` array
- **Granular Loading**: Each protocol has multiple aspects - load ALL aspects for referenced protocols

#### **Tier 3: WORKFLOWS** (Complete Process Architectures)
**Pattern**: `f_workflow_{name}_{stage/aspect}`
**Purpose**: End-to-end process guidance with stages, tools, transitions
**Loading Strategy**: **STAGED** - load workflow description + active stage only

**Examples from Cypher**:
```
f_workflow_etymological_archaeology_version
f_workflow_etymological_archaeology_description
f_workflow_etymological_archaeology_cyclic_nature
f_workflow_etymological_archaeology_agent_domain
f_workflow_etymological_archaeology_backend_processes
f_workflow_etymological_archaeology_uses_capabilities (ARRAY)
f_workflow_etymological_archaeology_uses_protocols (ARRAY)

# Stage-specific properties
f_workflow_etymological_archaeology_stage_0_name
f_workflow_etymological_archaeology_stage_0_description
f_workflow_etymological_archaeology_stage_0_agent_activities
f_workflow_etymological_archaeology_stage_0_tools
f_workflow_etymological_archaeology_stage_0_outputs
f_workflow_etymological_archaeology_stage_0_transitions_to

# Repeat for stages 1, 2, 3-5...
```

**Key Insight**: Workflows are HEAVY. Stage guidance is EXTREMELY detailed (see stage_1_agent_guidance - 800+ chars). Loading ALL stages at once = massive context bloat.

**Context Loading Strategy**:
- **Layer 2 (Workflow Header)**: Load ONLY overview properties (description, cyclic_nature, agent_domain, backend_processes, uses_capabilities, uses_protocols)
- **Layer 2 (Active Stage)**: Load ONLY the current stage properties (stage_N_name, stage_N_description, stage_N_agent_activities, stage_N_tools, stage_N_outputs)
- **Dynamic Stage Transition**: When workflow transitions to new stage, update context with NEW stage details, drop OLD stage
- **Avoid**: Loading all 6 stages simultaneously

---

## Critical Architectural Insights

### 1. Cyclic vs Linear Workflows

**Etymology Archaeology is CYCLIC, not linear**:
```
Stage 0 (context) → Stage 1 (explore) ⟲ Stage 2 (crystallize) →
[Backend 3-5] → Query results → BACK TO Stage 1 (deeper) ⟲ Stage 2 (expand)...
```

**Implication for Context Loading**:
- Can't assume "move through stages sequentially and complete"
- Stage 1 is the MAIN ONGOING ACTIVITY (not a phase to pass through)
- Context must support SPIRAL DEEPENING (returning to Stage 1 with enriched understanding)

**Solution**:
- Track `current_stage` in runtime context (Layer 3)
- Support stage transitions that LOOP BACK (Stage 2 → Stage 1)
- Allow Stage 1 to reload with additional context from backend results

### 2. Agent Domain vs Backend Processes

**Critical Separation**:
```
Agent Domain: Stages 0-2 (context, exploration, community formation)
Backend Domain: Stages 3-5 (automatic processes - resonance, MEF, sedimentation)
```

**Implication**:
- Agent should NEVER load Stage 3-5 full guidance (it doesn't execute them)
- Agent ONLY needs awareness: "Stages 3-5 happen automatically, query results via check_pending_insights"
- Loading Stage 3-5 detailed guidance = wasted tokens for operations agent can't perform

**Solution**:
- Load Stages 0-2 normally (agent executes these)
- Load `stages_3_5_description` as SINGLE summary property
- Load `querying_backend` and `cyclic_return` for integration guidance

### 3. Capability/Protocol References

**Workflow declares dependencies**:
```cypher
f_workflow_etymological_archaeology_uses_capabilities =
  ["f_capability_logos_cycle", "f_capability_contemplative_synthesis", "f_capability_etymological_archaeology"]

f_workflow_etymological_archaeology_uses_protocols =
  ["f_protocol_scent_following", "f_protocol_paradox_holding", "f_protocol_mobius_return"]
```

**Loading Strategy**:
- When workflow engages, parse `uses_capabilities` and `uses_protocols` arrays
- Load FULL details for referenced capabilities/protocols ONLY
- This is CONTEXTUAL loading - only what's needed for THIS workflow

### 4. Tool Integration Lists

**Each stage declares tool usage**:
```cypher
f_workflow_etymological_archaeology_stage_0_tools =
  ["retrieve_session_continuity", "search_memory_patterns"]

f_workflow_etymological_archaeology_stage_1_tools =
  ["etymology_search", "semantic_coordinate_discovery", "get_wisdom_packet", "check_for_community_opportunity"]
```

**Implication**:
- Tools are already registered via Pydantic AI tool decorators
- Stage tool lists are for AGENT AWARENESS ("these are the tools available/appropriate for this stage")
- NOT for programmatic tool filtering (all tools technically available)

**Solution**:
- Include stage tool lists in loaded context as GUIDANCE
- Don't attempt to restrict tool access programmatically
- Let agent self-regulate based on stage appropriateness

---

## Proposed Loading Architecture

### Layer 1e: Capabilities (REFERENCES ONLY)
```markdown
# Layer 1e: Operational Capabilities

You have the following capabilities available:
- **logos_cycle**: Six-phase contemplative rhythm (ἄλογος→πρόλογος→διάλογος→λόγος→ἐπίλογος→ἀνάλογος)
- **contemplative_synthesis**: Deep pattern recognition and holistic integration
- **etymological_archaeology**: Specialized capacity for PIE reconstruction and cognate analysis

*Full capability details load when workflows reference them.*
```

**Rationale**: Agent knows what capacities exist WITHOUT token-heavy JSON dumps. Details load contextually.

### Layer 2: Workflow Engagement (STAGED LOADING)

#### **2a: Workflow Header (Overview)**
```markdown
# Layer 2: Workflow - Etymological Archaeology v2.0.0

## Overview
{f_workflow_etymological_archaeology_description}

## Cyclic Nature
{f_workflow_etymological_archaeology_cyclic_nature}

## Your Domain
{f_workflow_etymological_archaeology_agent_domain}

## Backend Processes
{f_workflow_etymological_archaeology_backend_processes}

## Active Capabilities
{LOAD FULL DETAILS for capabilities in uses_capabilities array}

## Active Protocols
{LOAD FULL DETAILS for protocols in uses_protocols array}
```

**Token Estimate**: ~3000-4000 tokens (manageable)

#### **2b: Active Stage Guidance**
```markdown
## Current Stage: {stage_N_name}

**Description**: {stage_N_description}

**Your Activities**: {stage_N_agent_activities}

**Available Tools**: {stage_N_tools}

**Expected Outputs**: {stage_N_outputs}

**Transitions To**: {stage_N_transitions_to}
```

**Token Estimate**: ~800-1200 tokens per stage (varies)

#### **2c: Backend Awareness (For Stages 3-5)**
```markdown
## Backend Processes (Awareness Only)

{f_workflow_etymological_archaeology_stages_3_5_description}

### Querying Backend Results
{f_workflow_etymological_archaeology_querying_backend}

### Cyclic Return
{f_workflow_etymological_archaeology_cyclic_return}
```

**Token Estimate**: ~600-800 tokens

**Total Layer 2**: ~4500-6000 tokens (acceptable for engaged workflow)

### Layer 3: Runtime Context (Dynamic Per Message)
```markdown
# Layer 3a: Epii Perspective
{subsystem_framing from # root - epii_* properties}

# Layer 3b: Workflow State
**Active Workflow**: etymological_archaeology v2.0.0
**Current Stage**: stage_1_ongoing
**Session ID**: {session_id}
**Communities Created This Session**: {count}

# Layer 3c: Current Request
**User Query**: {message}
**Timestamp**: {timestamp}
```

**Token Estimate**: ~300-500 tokens

---

## Implementation Design

### Method 1: `engage_workflow_prakasa()` Enhancement

**Current Signature**:
```python
async def engage_workflow_prakasa(
    self,
    agent_coordinate: str,
    workflow_name: str,
    **workflow_params
) -> str
```

**NEW Signature**:
```python
async def engage_workflow_prakasa(
    self,
    agent_coordinate: str,
    workflow_name: str,
    current_stage: Optional[str] = None,  # NEW
    **workflow_params
) -> str
```

**NEW Logic**:
```python
# 1. Load workflow header properties
header_props = await self._load_workflow_header(agent_coordinate, workflow_name)

# 2. Parse uses_capabilities and uses_protocols arrays
capabilities = header_props.get('uses_capabilities', [])
protocols = header_props.get('uses_protocols', [])

# 3. Load full details for referenced capabilities/protocols
capability_details = await self._load_capabilities(agent_coordinate, capabilities)
protocol_details = await self._load_protocols(agent_coordinate, protocols)

# 4. Load current stage guidance (if provided)
stage_guidance = ""
if current_stage:
    stage_guidance = await self._load_workflow_stage(
        agent_coordinate, workflow_name, current_stage
    )

# 5. Load backend awareness if applicable
backend_awareness = await self._load_backend_awareness(
    agent_coordinate, workflow_name
)

# 6. Compose Layer 2
return self._compose_workflow_layer(
    header=header_props,
    capabilities=capability_details,
    protocols=protocol_details,
    stage=stage_guidance,
    backend=backend_awareness
)
```

### Method 2: `_load_workflow_header()`
```python
async def _load_workflow_header(
    self,
    agent_coordinate: str,
    workflow_name: str
) -> Dict[str, Any]:
    """
    Load workflow header properties (overview, cyclic nature, domain, etc).

    Pattern: f_workflow_{name}_{aspect}
    Aspects: version, description, cyclic_nature, agent_domain,
             backend_processes, uses_capabilities, uses_protocols
    """
    result = await self.bimba_client.get_node_details_complete(
        agent_coordinate, include_functional_properties=True
    )
    props = result.get('allProperties', {})

    prefix = f"f_workflow_{workflow_name}_"
    header_aspects = [
        'version', 'description', 'cyclic_nature', 'agent_domain',
        'backend_processes', 'uses_capabilities', 'uses_protocols'
    ]

    header = {}
    for aspect in header_aspects:
        key = f"{prefix}{aspect}"
        if key in props:
            value = props[key]
            # Parse JSON arrays if present
            if aspect in ['uses_capabilities', 'uses_protocols']:
                value = json.loads(value) if isinstance(value, str) else value
            header[aspect] = value

    return header
```

### Method 3: `_load_capabilities()`
```python
async def _load_capabilities(
    self,
    agent_coordinate: str,
    capability_names: List[str]
) -> Dict[str, Dict[str, Any]]:
    """
    Load FULL details for referenced capabilities.

    For each capability in list, load ALL f_capability_{name}_* properties.
    """
    result = await self.bimba_client.get_node_details_complete(
        agent_coordinate, include_functional_properties=True
    )
    props = result.get('allProperties', {})

    capabilities = {}
    for cap_name in capability_names:
        # Remove f_capability_ prefix if present
        clean_name = cap_name.replace('f_capability_', '')
        prefix = f"f_capability_{clean_name}_"

        # Gather all properties for this capability
        cap_props = {
            k.replace(prefix, ''): v
            for k, v in props.items()
            if k.startswith(prefix)
        }

        if cap_props:
            capabilities[clean_name] = cap_props

    return capabilities
```

### Method 4: `_load_protocols()`
```python
async def _load_protocols(
    self,
    agent_coordinate: str,
    protocol_names: List[str]
) -> Dict[str, Dict[str, Any]]:
    """
    Load FULL details for referenced protocols.

    Pattern same as capabilities but f_protocol_{name}_* instead.
    """
    # Same logic as _load_capabilities but with f_protocol_ prefix
    # [Implementation similar to above]
```

### Method 5: `_load_workflow_stage()`
```python
async def _load_workflow_stage(
    self,
    agent_coordinate: str,
    workflow_name: str,
    stage_name: str
) -> Dict[str, Any]:
    """
    Load specific stage properties.

    Pattern: f_workflow_{workflow_name}_stage_{N}_{aspect}
    Aspects: name, description, agent_activities, tools, outputs, transitions_to
    """
    result = await self.bimba_client.get_node_details_complete(
        agent_coordinate, include_functional_properties=True
    )
    props = result.get('allProperties', {})

    # Extract stage number (e.g., "stage_1" from "stage_1_ongoing")
    stage_num = stage_name.split('_')[1] if '_' in stage_name else stage_name

    prefix = f"f_workflow_{workflow_name}_stage_{stage_num}_"
    stage_aspects = [
        'name', 'description', 'agent_activities', 'agent_guidance',
        'conversational_style', 'tools', 'outputs', 'transitions_to',
        'ongoing_nature', 'scent_following_integration', 'watching_for_patterns'
    ]

    stage = {}
    for aspect in stage_aspects:
        key = f"{prefix}{aspect}"
        if key in props:
            value = props[key]
            # Parse JSON arrays if present
            if aspect == 'tools':
                value = json.loads(value) if isinstance(value, str) else value
            stage[aspect] = value

    return stage
```

### Method 6: `_compose_workflow_layer()`
```python
def _compose_workflow_layer(
    self,
    header: Dict[str, Any],
    capabilities: Dict[str, Dict[str, Any]],
    protocols: Dict[str, Dict[str, Any]],
    stage: Dict[str, Any],
    backend: Dict[str, Any]
) -> str:
    """
    Compose complete Layer 2 from loaded components.
    """
    sections = []

    # Workflow Header
    sections.append(f"# Workflow: {header.get('description', 'N/A')}")
    sections.append(f"\n**Version**: {header.get('version', 'N/A')}")

    if 'cyclic_nature' in header:
        sections.append(f"\n## Cyclic Nature\n{header['cyclic_nature']}")

    if 'agent_domain' in header:
        sections.append(f"\n## Your Domain\n{header['agent_domain']}")

    if 'backend_processes' in header:
        sections.append(f"\n## Backend Processes\n{header['backend_processes']}")

    # Active Capabilities (FULL DETAILS)
    if capabilities:
        sections.append("\n## Active Capabilities")
        for cap_name, cap_props in capabilities.items():
            sections.append(f"\n### {cap_name.replace('_', ' ').title()}")
            for aspect, value in cap_props.items():
                sections.append(f"**{aspect}**: {value}")

    # Active Protocols (FULL DETAILS)
    if protocols:
        sections.append("\n## Active Protocols")
        for prot_name, prot_props in protocols.items():
            sections.append(f"\n### {prot_name.replace('_', ' ').title()}")
            for aspect, value in prot_props.items():
                sections.append(f"**{aspect}**: {value}")

    # Current Stage Guidance
    if stage:
        sections.append(f"\n## Current Stage: {stage.get('name', 'N/A')}")
        sections.append(f"\n{stage.get('description', '')}")

        if 'agent_activities' in stage:
            sections.append(f"\n### Your Activities\n{stage['agent_activities']}")

        if 'agent_guidance' in stage:
            sections.append(f"\n### Guidance\n{stage['agent_guidance']}")

        if 'conversational_style' in stage:
            sections.append(f"\n### Conversational Style\n{stage['conversational_style']}")

        if 'tools' in stage:
            tools = stage['tools']
            sections.append(f"\n### Available Tools\n{', '.join(tools)}")

        if 'transitions_to' in stage:
            sections.append(f"\n### Transitions To\n{stage['transitions_to']}")

    # Backend Awareness
    if backend:
        sections.append("\n## Backend Processes (Awareness Only)")
        for key, value in backend.items():
            sections.append(f"\n### {key.replace('_', ' ').title()}\n{value}")

    return "\n\n".join(sections)
```

---

## Context Budget Analysis

### Without Strategic Loading (Naive Approach)
```
Layer 1 (full): ~8000 tokens
All capabilities (full JSON): ~2000 tokens
All protocols (full): ~1500 tokens
All workflow stages (0-5): ~6000 tokens
Backend details: ~800 tokens
Runtime context: ~500 tokens
---
TOTAL: ~18800 tokens (UNSUSTAINABLE)
```

### With Strategic Loading (Proposed)
```
Layer 1 (1a-1d): ~6000 tokens
Layer 1e (capability refs): ~200 tokens
Layer 2 header: ~1000 tokens
Layer 2 active capabilities (3): ~1200 tokens
Layer 2 active protocols (3): ~1500 tokens
Layer 2 current stage: ~1000 tokens
Layer 2 backend awareness: ~600 tokens
Layer 3 runtime: ~500 tokens
---
TOTAL: ~12000 tokens (MANAGEABLE)
```

**Savings**: ~6800 tokens (36% reduction)

---

## Frontend Integration Strategy

### Etymology Archaeology Frontend Flow

1. **User enters word** → Frontend sends to backend
2. **Backend routes to Epii agent** with context:
   ```json
   {
     "workflow_name": "etymological_archaeology",
     "current_stage": "stage_0",  // First request
     "session_id": "uuid",
     "message": "I want to explore the word 'sign'"
   }
   ```

3. **Agent loads workflow** via `engage_workflow_prakasa()`:
   - Header properties
   - Capabilities (logos_cycle, etc.) FULL
   - Protocols (scent_following, etc.) FULL
   - Stage 0 guidance ONLY

4. **Agent establishes context** (Stage 0 activities)

5. **Agent transitions to Stage 1** automatically:
   - Frontend doesn't need to manage stage transitions
   - Agent internally tracks "now in stage_1"
   - Next message, agent reloads with stage_1 guidance

6. **Pattern emerges** → Agent suggests community (Stage 2)

7. **Community created** → Backend triggers Stages 3-5

8. **Agent queries results** → Returns to Stage 1 with enriched context

### Frontend Responsibilities
- Send `workflow_name` in initial request
- Send `session_id` for continuity
- Display agent responses naturally
- NO need to manage stage transitions (agent handles internally)

### Backend Responsibilities
- Parse workflow/stage from context
- Call `engage_workflow_prakasa()` with appropriate stage
- Track workflow state in session
- Trigger backend processes (Stages 3-5) when communities created

---

## Next Implementation Steps

1. **Add helper methods** to `prakasa.py`:
   - `_load_workflow_header()`
   - `_load_capabilities()`
   - `_load_protocols()`
   - `_load_workflow_stage()`
   - `_load_backend_awareness()`
   - `_compose_workflow_layer()`

2. **Enhance `engage_workflow_prakasa()`**:
   - Accept `current_stage` parameter
   - Use new helper methods
   - Return composed Layer 2

3. **Update `compose_identity_layers()`**:
   - Implement Layer 1e with capability REFERENCES
   - List capability names, not full details

4. **Test with actual cypher data**:
   - Execute `5-4-5_corrected_etymological_archaeology.cypher`
   - Create test agent
   - Engage workflow and verify token usage

5. **Frontend integration**:
   - Update etymology archaeology page
   - Send workflow context in requests
   - Display agent responses

---

## Success Criteria

- ✅ Capability/Protocol/Workflow three-tier separation
- ✅ LEAN loading (references not dumps)
- ✅ SELECTIVE loading (only active workflow components)
- ✅ STAGED loading (current stage only, not all stages)
- ✅ Context budget <15000 tokens total
- ✅ Agent can transition between stages smoothly
- ✅ Backend processes integrate correctly
- ✅ Frontend etymology page works end-to-end
