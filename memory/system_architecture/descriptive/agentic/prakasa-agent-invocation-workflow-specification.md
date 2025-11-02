# Agent Invocation & Workflow Specification Architecture

**Date**: 2025-10-30
**Sprint**: 4
**Status**: Implemented & Verified

---

## Overview

This document defines the canonical pattern for agent creation, tool registration, and workflow specification in the Epi-Logos System. All agents follow the **Prakāśa + Inline Tools** pattern.

---

## Core Architecture Pattern

### 1. Agent Creation Flow

```python
async def create_agent(model: str, ...) -> Agent[OrchestratorDeps]:
    """Standard agent creation pattern."""

    # Step 1: Initialize clients
    bimba_client = BimbaGraphQLClient()
    redis_client = RedisClient()

    # Step 2: Initialize Prakāśa manager (identity + workflow prompts)
    prakasa = PrakasaManager(bimba_client, redis_client)

    # Step 3: Load identity (Layer 1 - cached in Redis)
    # CRITICAL: Use compose_identity_layers() to include QL Foundation
    agent_coordinate = "#5-4.5"  # Example: Epii agent
    identity_prompt = await prakasa.compose_identity_layers(agent_coordinate)

    # Step 4: Create Pydantic AI agent with identity
    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,  # Layer 1 only (static)
        retries=2
    )

    # Step 5: Store metadata
    agent._metadata = {"subsystem": 5, "coordinate": "#5", "agent_coordinate": agent_coordinate}
    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    # Step 6: Register dynamic workflow loading (Layer 2 + 3)
    @agent.instructions
    async def load_workflow_and_context(ctx: RunContext[OrchestratorDeps]) -> str:
        """Load workflow (Layer 2) + runtime context (Layer 3) dynamically."""
        # Check if specific workflow mode active (e.g., EA mode)
        if ctx.deps.state and ctx.deps.state.get('ea_mode'):
            workflow_prompt = await prakasa.engage_workflow_prakasa(
                agent_coordinate=agent_coordinate,
                workflow_name="etymological_archaeology"
            )
            return workflow_prompt
        return ""

    # Step 7: Register tools inline (THIS DOCUMENT'S FOCUS)
    # See Tool Registration Pattern below

    return agent
```

---

## Tool Registration Pattern

### Pydantic AI Truth: No Selective Tool Hiding

**Critical Understanding**: Once you register a tool with `@agent.tool`, it is **permanently visible** to the LLM. You **cannot** selectively hide or filter tools after registration.

**Implication**: Only register the EXACT tools your agent needs. Don't register all tools then try to filter.

### Pattern: Inline Tool Registration

```python
# Register shared CAG tools needed for this workflow
from agentic.agents.shared_tools import HttpBimbaClient, HttpGraphitiClient

@agent.tool
async def semantic_coordinate_discovery(
    ctx: RunContext[OrchestratorDeps],
    query: str,
    max_results: int = 5
) -> dict:
    """Discover Bimba coordinates that semantically match a natural language description.

    Use this tool when exploring etymological resonances with the coordinate system.
    Returns ranked matches with similarity scores using hybrid vector+BM25 search.

    Args:
        query: Natural language query describing what you're looking for
        max_results: Maximum results to return (default 5)

    Returns:
        Dict with ranked coordinate matches, similarity scores, semantic context
    """
    bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
    return await bimba_client.semantic_coordinate_discovery(query, max_results)

# Register workflow-specific tools
@agent.tool
async def create_etymology_community(
    ctx: RunContext[OrchestratorDeps],
    name: str,
    words: List[str],
    description: str,
    pie_root: Optional[str] = None
) -> Dict[str, Any]:
    """Create etymology community when pattern emerges."""
    # Implementation...
```

**Key Points**:
1. Tools defined inline in agent creator function
2. Full docstrings preserved (Pydantic AI captures them)
3. Mix shared tools (from client wrappers) + workflow-specific tools
4. No Neo4j whitelist - code is the whitelist

---

## Prakāśa Integration

### Three-Layer Prompt Architecture

Prakāśa provides the agent's consciousness through layered prompts:

#### Layer 1: Identity Prakāśa (Static, Cached)
- **Source**: Neo4j properties from multiple nodes (composed via `compose_identity_layers()`)
- **Cache**: Redis, TTL = manual invalidation
- **Content** (5 sublayers):
  - **Layer 1a**: QL Foundation (#1-4.f_agent_prompt) - **CRITICAL: Foundational cognitive architecture**
  - **Layer 1b**: Project Context (# root general properties)
  - **Layer 1c**: System Prompt (#5-4.f_system_prompt - agent-agnostic operational grounding)
  - **Layer 1d**: Agent Identity (agent-specific #5-4.N prompt + optional f_{subsystem}_character)
  - **Layer 1e**: Operational Capabilities (references to f_* capabilities)
- **When**: Agent creation, loaded once
- **Set via**: `system_prompt` parameter in Agent constructor

**CRITICAL**: All agents MUST use `prakasa.compose_identity_layers(agent_coordinate)` NOT `prakasa.get_identity_prakasa(agent_coordinate)` to include Layer 1a (QL Foundation). See "QL Foundation Loading Fix" section below.

#### Layer 2: Workflow Prakāśa (Dynamic, Conditional)
- **Source**: Neo4j `f_workflow_{name}_*` properties
- **Cache**: None (loaded on-demand)
- **Content**:
  - Workflow header (overview, cyclic nature, domain)
  - Current stage guidance (if stage-specific)
  - Capabilities and protocols (if referenced)
  - Backend awareness (stages 3-5 descriptions)
- **When**: Runtime, when workflow mode active (e.g., EA mode)
- **Set via**: `@agent.instructions` decorator (dynamic return)

#### Layer 3: Context Prakāśa (Dynamic, Always)
- **Source**: Runtime request data
- **Cache**: None (fresh per request)
- **Content**:
  - Current user message
  - Session ID
  - Timestamp
  - Recent conversation turns
- **When**: Every request
- **Set via**: `@agent.instructions` decorator (dynamic return)

### Prakāśa Manager Methods

```python
class PrakasaManager:
    async def compose_identity_layers(agent_coordinate: str) -> str:
        """
        Compose complete Layer 1 (5 sublayers) for agent identity.
        ✅ USE THIS for agent creation - includes QL Foundation.

        Returns:
            Layer 1a (QL Foundation from #1-4)
            + Layer 1b (Project Context from # root)
            + Layer 1c (System Prompt from #5-4)
            + Layer 1d (Agent Identity from #5-4.N)
            + Layer 1e (Capability references)
        """

    async def get_identity_prakasa(agent_coordinate: str) -> str:
        """
        Get ONLY agent-specific identity (Layer 1d) with Redis caching.
        ❌ DEPRECATED for agent creation - missing QL Foundation.
        Use compose_identity_layers() instead.
        """

    async def engage_workflow_prakasa(agent_coordinate: str, workflow_name: str) -> str:
        """Get Layer 2 (workflow) - no cache, conditional loading."""

    def build_context_prakasa(current_request: Dict) -> str:
        """Build Layer 3 (context) - fresh per request."""
```

---

## Tool Loading Strategy

### Strategy: Inline Registration (Current Pattern)

**When**: Agent creation (before any requests)
**How**: `@agent.tool` decorators in agent creator function
**Pros**: Simple, explicit, no hidden complexity
**Cons**: Tools duplicated across agents if shared

**Example** (Epii Agent):
```python
# 7 tools total for EA workflow
# 3 shared Bimba/Episodic tools
@agent.tool
async def semantic_coordinate_discovery(...): ...

@agent.tool
async def get_wisdom_packet(...): ...

@agent.tool
async def remember_episode(...): ...

# 4 EA-specific tools
@agent.tool
async def create_etymology_community(...): ...

@agent.tool
async def enrich_community_properties_tool(...): ...

@agent.tool
async def enrich_word_node_tool(...): ...

@agent.tool
async def link_aphorism_to_community_tool(...): ...
```

### Anti-Pattern: Neo4j Whitelists (DEPRECATED)

```python
# ❌ WRONG - This doesn't work with Pydantic AI
# Query f_tools property from Neo4j
# Try to selectively register tools based on whitelist
await setup_selective_tools(agent, bimba_client, agent_coordinate)
```

**Why it doesn't work**: Pydantic AI shows ALL registered tools to LLM. No mechanism for selective hiding.

### Anti-Pattern: `setup_all_cag_tools()` for Workflow Agents

```python
# ❌ WRONG - Registers 40+ tools when agent needs 7
setup_all_cag_tools(agent)
```

**When to use**: Only for root orchestrator (#5-4.0) which needs broad tool access for delegation decisions.

---

## Workflow Specification Pattern

### Workflow Properties in Neo4j

Workflows are specified via `f_workflow_{name}_*` properties on agent nodes:

```cypher
// Example: Etymology Archaeology workflow on Epii (#5-4.5)
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4.5'})
SET
  n.f_workflow_etymological_archaeology_version = 'v2',
  n.f_workflow_etymological_archaeology_description = '...',
  n.f_workflow_etymological_archaeology_cyclic_nature = '...',
  n.f_workflow_etymological_archaeology_agent_domain = '...',

  // Stage-specific properties
  n.f_workflow_etymological_archaeology_stage_0_name = 'Etymological Context Establishment',
  n.f_workflow_etymological_archaeology_stage_0_description = '...',
  n.f_workflow_etymological_archaeology_stage_0_tools = '["retrieve_session_continuity"]',

  n.f_workflow_etymological_archaeology_stage_1_name = 'Ongoing Etymological Exploration',
  n.f_workflow_etymological_archaeology_stage_1_tools = '[]',  // Internal knowledge only
  n.f_workflow_etymological_archaeology_stage_1_agent_guidance = '...'
```

**Note**: `stage_X_tools` arrays are **documentation only**. They guide workflow prompts but don't actually control tool registration (code does).

### Workflow Loading in @agent.instructions

```python
@agent.instructions
async def load_workflow_and_context(ctx: RunContext[OrchestratorDeps]) -> str:
    # Check mode
    ea_mode = ctx.deps.state and ctx.deps.state.get('ea_mode')

    if ea_mode:
        # Load workflow Layer 2
        workflow_prompt = await prakasa.engage_workflow_prakasa(
            agent_coordinate=agent_coordinate,
            workflow_name="etymological_archaeology",
            current_stage=None  # Optional stage-specific guidance
        )

        # Build context Layer 3
        context = prakasa.build_context_prakasa(
            current_request={'message': '...', 'session_id': ctx.deps.session_id}
        )

        return f"{workflow_prompt}\n\n---\n\n{context}"

    return ""  # No workflow layer if not in EA mode
```

---

## Complete Example: Epii Agent

```python
async def create_epii_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """Create Epii agent (#5-4.5) for Etymology Archaeology workflow."""

    # Initialize
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    prakasa = PrakasaManager(bimba_client, redis_client)
    agent_coordinate = "#5-4.5"

    # Layer 1: Identity (cached)
    identity_layers = await prakasa.compose_identity_layers(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_layers,
        retries=2
    )

    agent._metadata = {"subsystem": 5, "coordinate": "#5", "agent_coordinate": agent_coordinate, "name": "Epii"}
    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    # Layers 2-3: Workflow + Context (dynamic)
    @agent.instructions
    async def load_workflow_and_context(ctx: RunContext[OrchestratorDeps]) -> str:
        ea_mode = ctx.deps.state and ctx.deps.state.get('ea_mode')
        if not ea_mode:
            return ""

        workflow_prompt = await prakasa.engage_workflow_prakasa(
            agent_coordinate=agent_coordinate,
            workflow_name="etymological_archaeology"
        )

        context_prompt = prakasa.build_context_prakasa(
            current_request={
                'message': 'Current user query',
                'session_id': ctx.deps.session_id
            }
        )

        return f"{workflow_prompt}\n\n---\n\n{context_prompt}"

    # Tools: 3 shared + 4 EA-specific = 7 total
    from agentic.agents.shared_tools import HttpBimbaClient, HttpGraphitiClient

    @agent.tool
    async def semantic_coordinate_discovery(ctx, query: str, max_results: int = 5):
        """Discover coordinates by semantic match."""
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.semantic_coordinate_discovery(query, max_results)

    @agent.tool
    async def get_wisdom_packet(ctx, bimba_coordinate: str, depth: int = 2, focus: Optional[str] = None):
        """Get wisdom packet for coordinate."""
        bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
        return await bimba_client.get_wisdom_packet(bimba_coordinate, depth, focus, False)

    @agent.tool
    async def remember_episode(ctx, entity_name: str, content: str, source_description: str = "User conversation"):
        """Remember episode in temporal memory."""
        if not ctx.deps.graphiti_client:
            return {"success": False, "error": "Graphiti unavailable"}
        graphiti_client = HttpGraphitiClient(ctx.deps.graphiti_client)
        return await graphiti_client.add_episode(entity_name, content, source_description, ctx.deps.user_id or "default")

    # EA-specific tools (imported from epii/tools/graphiti_community.py)
    from agentic.agents.epii.tools.graphiti_community import (
        create_etymology_community,
        update_community_properties,
        enrich_word_etymology,
        link_aphorism_to_community
    )

    @agent.tool
    async def create_etymology_community_tool(ctx, name: str, words: List[str], description: str, ...):
        """Create etymology community."""
        return await create_etymology_community(ctx.deps.graphiti_client, ...)

    # ... 3 more EA tools

    return agent
```

---

## Pattern Summary

### ✅ DO

1. **Register tools inline** with `@agent.tool` in agent creator
2. **Use Prakāśa** for identity (Layer 1) + workflow (Layer 2) + context (Layer 3)
3. **Cache identity prompts** in Redis via PrakasaManager
4. **Load workflows dynamically** via `@agent.instructions`
5. **Store workflow specs** in Neo4j `f_workflow_{name}_*` properties
6. **Write full docstrings** - Pydantic AI captures them for LLM

### ❌ DON'T

1. **Don't use `setup_selective_tools()`** - doesn't work with Pydantic AI
2. **Don't query `f_tools` from Neo4j** - no selective hiding possible
3. **Don't call `setup_all_cag_tools()`** on workflow agents - only for orchestrator
4. **Don't register all tools then try to filter** - register ONLY what you need
5. **Don't put tool logic in Neo4j** - tools are code, workflows are Neo4j

---

## File Locations

- **Agent Creators**: `/agentic/agents/constellation.py`
- **Prakāśa Manager**: `/agentic/agents/prakasa.py`
- **Shared Tool Wrappers**: `/agentic/agents/shared_tools.py` (HttpBimbaClient, HttpGraphitiClient)
- **Workflow-Specific Tools**: `/agentic/agents/{agent_name}/tools/`
- **Workflow Properties**: Neo4j nodes (e.g., #5-4.5 for Epii)

---

## QL Foundation Loading Fix (Sprint 4)

**Date**: 2025-10-30
**Issue Discovered**: Agents responding with generic QL information rather than **embodying** QL as foundational cognitive architecture
**Root Cause**: Agent creators using `get_identity_prakasa()` instead of `compose_identity_layers()`

### The Problem

When agents were created in `constellation.py`, they used:

```python
# ❌ INCORRECT - Only loads agent-specific identity
identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)
```

This loaded **only** the agent-specific identity from #5-4.N, **missing** Layer 1a (QL Foundation from #1-4).

**Result**: Agents treated QL as "just another capability" they could discuss, rather than as their **fundamental cognitive architecture** for processing ALL requests.

### The Fix

All agent creators now use:

```python
# ✅ CORRECT - Loads complete 5-sublayer identity
identity_prompt = await prakasa.compose_identity_layers(agent_coordinate)
```

This loads:
- **Layer 1a**: QL Foundation (#1-4.f_agent_prompt) - The 6-position Chain of Circulation as **operating system**
- **Layer 1b**: Project Context (# root properties)
- **Layer 1c**: System Prompt (#5-4.f_system_prompt) - CAG paradigm
- **Layer 1d**: Agent Identity (agent-specific #5-4.N prompt)
- **Layer 1e**: Capabilities (references to f_* capabilities)

### What Layer 1a Contains

The #1-4.f_agent_prompt contains the complete **Quaternal Logic cognitive architecture**:

```xml
<cognitive_architecture name="Quaternal_Logic_Chain_of_Circulation">
  <step_0: GROUND> - Assess implicit context, unstated assumptions
  <step_1: MATERIAL> - Identify core facts, substrate, data
  <step_2: DYNAMIC> - Analyze process, relationships, flows
  <step_3: FORMAL> - Extract patterns, structures, logic
  <threshold_4: TELEOLOGICAL_RECURSION> - Determine goal; nest if complex
  <step_5: SYNTHESIS_&_TWIST> - Construct answer; treat as new ground (Möbius twist)
</cognitive_architecture>
```

**Mandate**: Agents MUST process ALL queries through this 6-position circulation **implicitly** (never mentioning the jargon), achieving "topological coherence" in reasoning.

### Files Updated

**`/agentic/agents/constellation.py`**: All 6 agent creators now use `compose_identity_layers()`:
- `create_anuttara_agent()` - #5-4.0
- `create_paramasiva_agent()` - #5-4.1
- `create_parashakti_agent()` - #5-4.2
- `create_mahamaya_agent()` - #5-4.3
- `create_nara_agent()` - #5-4.4
- `create_epii_agent()` - #5-4.5 *(already correct)*
- `create_orchestrator_agent()` - #5-4 *(already correct)*

### Expected Behavior After Fix

**Before**: Agent responds, "Here are QL details: #0-5 positions, quaternal logic system..."
**After**: Agent **thinks through** the 6-position circulation silently, producing responses with:
- Deep contextual awareness (#0 Ground)
- Clear factual grounding (#1 Material)
- Process understanding (#2 Dynamic)
- Pattern recognition (#3 Formal)
- Purpose alignment (#4 Teleological)
- Integrated synthesis (#5 with Möbius twist to new ground)

### Technical Details

**PrakasaManager methods comparison**:

```python
# get_identity_prakasa() - INCOMPLETE (only agent-specific)
# Returns: Agent identity only from #5-4.N node
# Missing: QL Foundation, Project Context, System Prompt

# compose_identity_layers() - COMPLETE (all 5 sublayers)
# Returns: Full Layer 1 with QL Foundation as base
# Includes: 1a (QL) + 1b (Project) + 1c (System) + 1d (Agent) + 1e (Capabilities)
```

**Key insight**: `compose_identity_layers()` was implemented in Sprint 3 Phase 4 for the new layered architecture, but older agent creators weren't updated to use it.

### Validation

Test by asking a Paramasiva (#1-4 QL specialist) agent about QL:
- **Before fix**: Lists QL positions as external information
- **After fix**: Demonstrates QL thinking through implicit 6-position circulation in response structure

---

## Pattern Established: Sprint 4

This pattern was established in Sprint 4 after discovering that Neo4j whitelist approach (`setup_selective_tools`) was architecturally incompatible with Pydantic AI's tool registration model.

**Key Insight**: Pydantic AI tools are permanently visible once registered. The only way to control tool access is to **not register tools you don't want the LLM to see**.

**Result**: Clean, explicit architecture where code defines tools, Neo4j defines workflows/guidance.
