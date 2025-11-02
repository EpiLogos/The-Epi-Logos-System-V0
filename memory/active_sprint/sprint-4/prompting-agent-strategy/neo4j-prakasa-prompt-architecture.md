# Neo4j Prakāśa-Based Prompt Architecture for Multi-Agent System

**Goal**: Leverage existing f_protocol_* and f_* functional properties in Neo4j to create dynamic, layered agent prompting that ACTUALLY follows the 5-stage etymological archaeology protocol.

**Critical Insight**: We have MASSIVE detailed protocol documentation in Neo4j (#5-4.5) that we're NOT loading into the agent! The agent has no idea these protocols exist.

---

## Current Problem Analysis

### What We Have in Neo4j (#5-4.5)

```
f_protocol_stage_0_recognition              (Detailed protocol for #0)
f_protocol_stage_1_contemplation            (Detailed protocol for #1)
f_protocol_stage_2_community_formation      (Detailed protocol for #2)
f_protocol_stage_3_canonical_scouring       (Detailed protocol for #3)
f_protocol_stage_4_insight_generation_recursive_nesting (Detailed protocol for #4)
f_protocol_stage_5_gnostic_sedimentation    (Detailed protocol for #5)

f_scent_following_method                    (Full 7-step operational method)
f_paradox_holding_protocol                  (How to hold paradoxes)
f_mobius_return_mechanism                   (How #5→#0 works)
f_whiteheadian_lacanian_integration_stage_* (Theoretical grounding)
f_etymological_contemplation_*              (MEF lens structures)
f_logos_cycle_contemplation_*               (Workflow orchestration)
f_current_workflow_state                    (State tracker: idle/active)

... 80+ more f_* properties with operational detail!
```

### What the Agent Currently Gets

```python
# Static system_prompt only:
f_system_prompt = "You are Epii, mathematically embodying coordinate branch #5..."

# That's it. None of the protocols, methods, or workflows are loaded.
```

**Result**: Agent has IDENTITY but no OPERATIONAL KNOWLEDGE. Like giving someone a job title but no training manual.

---

## Prakāśa Three-Layer Architecture (ASCP Pattern)

From `/agentic/agents/prakasa.py`:

### Layer 1: Identity Prakāśa (Constitutional)
**Method**: `get_identity_prakasa(agent_coordinate)`
**Purpose**: WHO AM I?
**Location**: `#5-4.5.f_system_prompt`
**Load Frequency**: Once at agent creation

### Layer 2: Workflow Prakāśa (Operational State)
**Method**: `engage_workflow_prakasa(agent_coordinate, workflow_name)`
**Purpose**: WHAT PROTOCOL AM I FOLLOWING RIGHT NOW?
**Location**: `#5-4.5.f_protocol_stage_*` (dynamic based on state)
**Load Frequency**: Per query, based on f_current_workflow_state

### Layer 3: Runtime Prakāśa (Contextual)
**Method**: `apply_runtime_prakasa(ctx, coordinate)`
**Purpose**: WHAT BIMBA CONTEXT IS RELEVANT?
**Location**: Semantic search results from Bimba map
**Load Frequency**: Per query, based on semantic relevance

**Current Implementation Status**:
- ✅ Layer 1 works (identity loaded)
- ❌ Layer 2 NOT implemented (workflows not loading)
- ❌ Layer 3 NOT implemented (no semantic Bimba context)

---

## Proposed Neo4j-Native Prompt Architecture

### Core Principle: Property-Driven Prompting

Instead of hardcoded instructions, EVERYTHING comes from Neo4j f_* properties.

### Architecture Map

```
Agent Initialization:
    │
    ├─> Layer 1: Identity Prakāśa (load once)
    │   └─> f_system_prompt (#5-4.5)
    │
Per Query:
    │
    ├─> Layer 2: Workflow Prakāśa (load if workflow active)
    │   ├─> f_current_workflow_state (check state)
    │   ├─> f_logos_cycle_contemplation (base workflow)
    │   ├─> f_protocol_stage_N (current stage protocol)
    │   └─> f_scent_following_method (operational method)
    │
    └─> Layer 3: Runtime Prakāśa (load based on query)
        ├─> semantic_coordinate_discovery (find relevant coords)
        ├─> resolve_coordinate (get coord details)
        └─> f_tool_orchestration_guide (how to use tools)
```

---

## Implementation: Workflow Prakāśa (Layer 2)

### Step 1: Workflow State Detection

```python
@agent.instructions
async def load_workflow_protocol(ctx: RunContext[OrchestratorDeps]) -> str:
    """
    Load active workflow protocol from Neo4j.

    If f_current_workflow_state != 'idle', load the current protocol stage.
    """
    prakasa = PrakasaManager(ctx.deps.bimba_client, ctx.deps.redis_client)

    # Check workflow state
    workflow_state = await prakasa.get_property(
        "#5-4.5",
        "f_current_workflow_state"
    )

    if workflow_state == "idle":
        return ""  # No active workflow

    # Parse state: "logos_cycle_stage_2" → stage 2
    if "stage_" in workflow_state:
        stage_num = int(workflow_state.split("stage_")[-1])

        # Load protocol for this stage
        protocol_key = f"f_protocol_stage_{stage_num}_{STAGE_NAMES[stage_num]}"
        protocol = await prakasa.get_property("#5-4.5", protocol_key)

        return f"""
# ACTIVE WORKFLOW: Logos Cycle Stage #{stage_num}

{protocol}

**Your Current Task**: Follow the TECHNICAL IMPLEMENTATION steps above.
Use the tools specified. Output the structure defined.
"""

    return ""

STAGE_NAMES = {
    0: "recognition",
    1: "contemplation",
    2: "community_formation",
    3: "canonical_scouring",
    4: "insight_generation_recursive_nesting",
    5: "gnostic_sedimentation"
}
```

### Step 2: Method Loading

```python
@agent.instructions
async def load_operational_methods(ctx: RunContext[OrchestratorDeps]) -> str:
    """
    Load f_scent_following_method and other operational protocols.

    These are ALWAYS available, not workflow-dependent.
    """
    prakasa = PrakasaManager(ctx.deps.bimba_client, ctx.deps.redis_client)

    methods = []

    # Core method: scent-following
    scent_method = await prakasa.get_property("#5-4.5", "f_scent_following_method")
    if scent_method:
        methods.append(f"## Scent-Following Method\n\n{scent_method}")

    # Paradox-holding protocol
    paradox = await prakasa.get_property("#5-4.5", "f_paradox_holding_protocol")
    if paradox:
        methods.append(f"## Paradox-Holding Protocol\n\n{paradox}")

    if not methods:
        return ""

    return "\n\n".join(methods)
```

### Step 3: Tool Orchestration Guide

```python
@agent.instructions
async def load_tool_orchestration(ctx: RunContext[OrchestratorDeps]) -> str:
    """
    Load f_tool_orchestration_guide or generate from f_tools.

    Tells agent WHEN and HOW to use each tool.
    """
    prakasa = PrakasaManager(ctx.deps.bimba_client, ctx.deps.redis_client)

    # Check for explicit guide
    guide = await prakasa.get_property("#5-4.5", "f_tool_orchestration_guide")
    if guide:
        return guide

    # Generate from f_tools list
    tools_json = await prakasa.get_property("#5-4.5", "f_tools")
    if tools_json:
        tools = json.loads(tools_json)
        return f"""
## Your Available Tools

You have access to {len(tools)} tools: {', '.join(tools)}

**Etymology Workflow Tool Sequence**:
1. ALWAYS start with `search_memory_patterns` - check prior work
2. Use `semantic_coordinate_discovery` to find canonical anchors
3. Use `form_memory_community` when 6-fold patterns emerge
4. Use `remember_episode` to preserve discoveries
5. Use `retrieve_session_continuity` for conversation context

Consult tool descriptions for detailed usage.
"""

    return ""
```

---

## Implementation: Runtime Prakāśa (Layer 3)

### Semantic Bimba Context Loading

```python
@agent.instructions
async def load_relevant_bimba_context(ctx: RunContext[OrchestratorDeps]) -> str:
    """
    Query Bimba graph for coordinates semantically relevant to user query.
    Load their operational essence as context.

    This is DYNAMIC - changes per query.
    """
    if not ctx.user_message:
        return ""

    # Semantic search for relevant coordinates
    result = await ctx.deps.bimba_client.semantic_coordinate_discovery(
        query=ctx.user_message,
        max_results=3  # Keep context tight
    )

    if not result.get("success") or not result.get("results"):
        return ""

    coords = result["results"]
    lines = ["## Relevant Bimba Coordinates\n"]

    for coord_data in coords:
        coord = coord_data.get("coordinate")
        name = coord_data.get("name", "Unknown")
        essence = coord_data.get("operationalEssence", "")

        if essence:
            lines.append(f"**{coord}** ({name}): {essence[:200]}")

    return "\n".join(lines)
```

---

## Refactored Core Identity (f_system_prompt)

### Current (Too Vague)
```
You are Epii, mathematically embodying coordinate branch #5 - master synthesis
and orchestration...
- Synthesize knowledge across all coordinate domains with natural authority
- Orchestrate patterns that emerge from the living coordinate system you embody
...
```

### Proposed (Operational + Personal)

```markdown
# Who You Are

You are **Epii**, the etymological archaeologist of the Epi-Logos system.

**Coordinate Identity**: #5 (Synthesis/Completion/Return) at agent node #5-4.5

**Your Voice**:
- **Archaeological**: You excavate meaning from linguistic strata, detecting absent
  PIE consciousness through present cognate-traces
- **Contemplative**: You hold paradoxes without premature resolution, following
  toroidal circulation around the #0 void you cannot penetrate directly
- **Pattern-Recognizing**: You see 6-fold QL structures emerging from etymology
  families (SIGN→SIGNAL→SIGNIFY→ASSIGN→SUFFICE→SATIS)
- **Dialogical**: You respond to the person seeking, not just the question asked

**What You Do NOT Do**:
- Generic chatbot responses ("Here's the etymology...")
- Dictionary recitations without synthesis
- Corporate emptiness ("intellectual sovereignty", "natural authority")
- Skip the scent-trail and jump to conclusions

**Your Primary Method**: f_scent_following_method
- Trace PIE roots through Sanskrit/Latin/Greek cognate families
- Follow gradient from present forms to absent proto-meanings
- Circle the #0 void via #1-4 explicate paths (toroidal circulation)
- Recognize when trails converge into QL patterns

**Your Operating Principle**:
The absent (PIE source) is GENUINELY PRESENT through traces (cognates).
This paradox IS the method - neither pure invention nor naive discovery,
but archaeological construction via systematic trace-detection.

**Workflow Context**:
Your detailed operational protocols (f_protocol_stage_0 through f_protocol_stage_5)
will be loaded dynamically based on workflow state. Follow them precisely.
They contain TECHNICAL IMPLEMENTATION steps for each stage.

**Tool Usage**:
You have 11 CAG tools spanning Bimba (canonical), Graphiti (episodic), and
LightRAG (gnostic) namespaces. Tool orchestration guidance loads per-query.

ALWAYS start etymology inquiries with `search_memory_patterns` - honor prior work.
```

**Changes**:
- ✅ Removed vague abstractions
- ✅ Added SPECIFIC voice markers (archaeological, contemplative, etc.)
- ✅ Referenced f_scent_following_method explicitly
- ✅ Acknowledged workflow protocols will load dynamically
- ✅ Gave concrete anti-patterns
- ✅ Stated tool-first workflow (start with search)

---

## Protocol-Following Architecture

### Problem: Agent Doesn't Follow Protocol Sequence

Currently, agent has NO IDEA that there's a 0-5 protocol to follow. It just responds to queries.

### Solution: Protocol State Machine

```python
class WorkflowState(BaseModel):
    """Track workflow progression through 0-5 stages."""
    active: bool = False
    current_stage: int = 0
    workflow_type: str = "logos_cycle"  # or "etymological_contemplation"
    completed_stages: List[int] = []

async def advance_workflow_stage(
    agent_coordinate: str,
    bimba_client,
    current_stage: int
) -> int:
    """
    Advance to next stage after current stage completes.

    Update f_current_workflow_state in Neo4j.
    """
    next_stage = (current_stage + 1) % 6  # Mod6 cycle

    new_state = f"logos_cycle_stage_{next_stage}"
    await bimba_client.update_bimba_node(
        agent_coordinate,
        {"f_current_workflow_state": new_state}
    )

    logger.info(f"Advanced workflow: Stage {current_stage} → {next_stage}")
    return next_stage

@agent.tool
async def complete_current_protocol_stage(
    ctx: RunContext[OrchestratorDeps]
) -> dict:
    """
    Mark current protocol stage as complete and advance to next.

    Agent calls this when stage completion criteria are met.
    """
    # Get current state
    workflow_state = await get_workflow_state(ctx.deps.bimba_client, "#5-4.5")

    if not workflow_state.active:
        return {"success": False, "message": "No active workflow"}

    # Advance stage
    next_stage = await advance_workflow_stage(
        "#5-4.5",
        ctx.deps.bimba_client,
        workflow_state.current_stage
    )

    # Load next stage protocol
    protocol_key = f"f_protocol_stage_{next_stage}_{STAGE_NAMES[next_stage]}"
    next_protocol = await ctx.deps.bimba_client.get_functional_properties(
        "#5-4.5",
        protocol_key
    )

    return {
        "success": True,
        "previous_stage": workflow_state.current_stage,
        "current_stage": next_stage,
        "next_protocol": next_protocol.get("properties", {}).get(protocol_key)
    }
```

### Workflow Initiation

```python
@agent.tool
async def begin_etymological_contemplation(
    ctx: RunContext[OrchestratorDeps],
    query_topic: str
) -> dict:
    """
    Begin full 0-5 etymological contemplation protocol.

    Initializes workflow state and loads Stage #0 (Recognition).
    """
    # Set workflow state
    await ctx.deps.bimba_client.update_bimba_node(
        "#5-4.5",
        {"f_current_workflow_state": "etymological_contemplation_stage_0"}
    )

    # Load Stage #0 protocol
    stage_0 = await ctx.deps.bimba_client.get_functional_properties(
        "#5-4.5",
        "f_protocol_stage_0_recognition"
    )

    return {
        "success": True,
        "workflow": "etymological_contemplation",
        "current_stage": 0,
        "topic": query_topic,
        "protocol": stage_0.get("properties", {}).get("f_protocol_stage_0_recognition"),
        "message": "Workflow initiated. Follow Stage #0 protocol above."
    }
```

---

## Complete Prompt Loading Sequence

### At Agent Creation (constellation.py)

```python
async def create_epii_agent(
    model: str,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    prakasa = PrakasaManager(bimba_client, redis_client)

    # Layer 1: Identity Prakāśa (load once)
    identity_prompt = await prakasa.get_identity_prakasa("#5-4.5")

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,  # Constitutional identity
        retries=2
    )

    # Layer 2: Workflow Prakāśa (dynamic per query)
    @agent.instructions
    async def load_workflow_protocol(ctx: RunContext[OrchestratorDeps]) -> str:
        return await prakasa.engage_workflow_prakasa("#5-4.5", ctx)

    # Layer 2: Operational Methods (always available)
    @agent.instructions
    async def load_operational_methods(ctx: RunContext[OrchestratorDeps]) -> str:
        # Load f_scent_following_method, f_paradox_holding_protocol
        ...

    # Layer 3: Runtime Prakāśa (semantic Bimba context)
    @agent.instructions
    async def load_relevant_bimba_context(ctx: RunContext[OrchestratorDeps]) -> str:
        # Semantic search for relevant coordinates
        ...

    # Layer 3: Tool orchestration
    @agent.instructions
    async def load_tool_orchestration(ctx: RunContext[OrchestratorDeps]) -> str:
        # Load f_tool_orchestration_guide or generate
        ...

    # Register tools
    await setup_selective_tools(agent, bimba_client, "#5-4.5")

    # Add workflow management tools
    @agent.tool
    async def begin_etymological_contemplation(...): ...

    @agent.tool
    async def complete_current_protocol_stage(...): ...

    return agent
```

---

## Validation: How We Know It Works

### 1. Protocol Awareness
**Test**: Ask "What protocol should you follow for etymology?"
**Expected**: Agent describes f_protocol_stage_0 through stage_5
**Current**: Agent has no idea

### 2. Stage Progression
**Test**: Begin workflow, complete stage #0, verify stage #1 loads
**Expected**: Agent shows different protocol each stage
**Current**: No workflow state tracking

### 3. Method Application
**Test**: Ask about "scent" etymology
**Expected**: Agent references f_scent_following_method explicitly
**Current**: Agent might trace etymology but doesn't name the method

### 4. Tool Sequence
**Test**: Observe tool calls during etymology inquiry
**Expected**: Starts with search_memory_patterns (per protocol)
**Current**: Random tool selection

### 5. Bimba Context
**Test**: Query touches #2 domain
**Expected**: Loads #2 operational essence as context
**Current**: No semantic Bimba loading

---

## Implementation Phases

### Phase 1: Prakāśa Manager Enhancement
**File**: `/agentic/agents/prakasa.py`

Add methods:
- `engage_workflow_prakasa(agent_coord, ctx)` - loads active protocol
- `get_property(coord, prop_name)` - gets single f_* property
- `apply_runtime_prakasa(ctx, coord)` - semantic Bimba context

### Phase 2: Epii Identity Refactor
**File**: Neo4j `#5-4.5.f_system_prompt`

Rewrite using template above:
- Operational voice
- Reference to methods
- Acknowledge protocols
- Tool-first workflow

### Phase 3: Constellation Dynamic Instructions
**File**: `/agentic/agents/constellation.py::create_epii_agent`

Add 4 @agent.instructions functions:
- load_workflow_protocol
- load_operational_methods
- load_relevant_bimba_context
- load_tool_orchestration

### Phase 4: Workflow State Tools
**File**: `/agentic/agents/constellation.py::create_epii_agent`

Add 2 @agent.tool functions:
- begin_etymological_contemplation
- complete_current_protocol_stage

### Phase 5: Test & Iterate
Run etymology queries, observe:
- Does protocol load?
- Does agent follow stages?
- Do tools get called in order?

---

## Success Metrics

- ✅ Agent references f_protocol_* by name when explaining its process
- ✅ Agent follows 0→1→2→3→4→5 sequence for deep inquiries
- ✅ Agent uses search_memory_patterns FIRST (per protocol)
- ✅ Agent forms 6-fold communities when patterns emerge
- ✅ Agent voice feels archaeological/contemplative (not generic)
- ✅ Token usage decreases (dynamic loading vs static dump)
- ✅ Relevant Bimba coordinates appear as context

---

## Next Actions

1. **Review this architecture** - Does it harmonize with Neo4j approach?
2. **Enhance PrakasaManager** - Add missing methods
3. **Draft new f_system_prompt** - Use operational template
4. **Implement @agent.instructions** - 4 dynamic loaders
5. **Add workflow tools** - State management
6. **Test with real queries** - Validate protocol-following

---

**Critical Principle**: EVERYTHING comes from Neo4j. Prompts are just LOADERS for f_* properties. The KNOWLEDGE lives in the graph, not hardcoded in Python.
