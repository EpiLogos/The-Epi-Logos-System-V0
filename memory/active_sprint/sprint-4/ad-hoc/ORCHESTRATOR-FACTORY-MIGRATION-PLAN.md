# Orchestrator Factory Migration Plan
**Date**: 2025-10-28
**Sprint**: Sprint 4
**Goal**: Properly integrate orchestrator (#5-4) into AgentFactory pattern as the root agent

---

## The Problem We're Solving

### Current Broken Architecture:
```
User Request → AgentRunner → AgentRouter
    ↓
Maps "system" persona → subsystem 5
    ↓
AgentFactory.create_agent(subsystem=5)
    ↓
create_epii_agent() from constellation.py
    ↓
Loads from #5-4.5 (Epii specialist)
    ↓
NO ORCHESTRATOR IN FLOW ❌
```

### What We Need:
```
User Request → AgentRunner → AgentRouter
    ↓
Routes to ORCHESTRATOR by default
    ↓
AgentFactory.create_orchestrator()
    ↓
Loads from #5-4 (root agent)
    ↓
Orchestrator has:
  - ALL shared tools (Bimba, Gnostic, Episodic)
  - Delegation tools (to subsystems 0-5)
  - General chat capability
  - Full error surfacing
    ↓
When EA mode detected OR explicit delegation:
    ↓
Orchestrator delegates to Epii (#5-4.5) via DelegationManager
```

---

## Coordinate System Clarification

### Agent Coordinate Structure:
```
#5 = Epii subsystem (top-level subsystem 5)
#5-4 = Agent branch under Epii subsystem

#5-4   = ROOT ORCHESTRATOR AGENT (all subsystems)
#5-4.0 = Anuttara agent (subsystem 0 specialist)
#5-4.1 = Paramasiva agent (subsystem 1 specialist)
#5-4.2 = Parashakti agent (subsystem 2 specialist)
#5-4.3 = Mahamaya agent (subsystem 3 specialist)
#5-4.4 = Nara agent (subsystem 4 specialist)
#5-4.5 = Epii agent (subsystem 5 specialist / EA specialist)
```

**Key Point**: #5-4 is the ROOT, #5-4.X are specialists

---

## What Must Be Preserved from orchestrator_agent.py

### 1. Tool Registry (ALL SHARED TOOLS)

#### Bimba Namespace Tools (15 tools):
- `create_bimba_node`
- `resolve_coordinate`
- `get_wisdom_packet`
- `get_quintessential_properties`
- `semantic_coordinate_discovery`
- `lexical_coordinate_search`
- `get_coordinate_relationships`
- `get_path_between_coordinates`
- `get_direct_children`
- `regenerate_node_embedding`
- `inspect_coordinate_detailed`
- `get_node_details_complete`
- `get_children_summary`
- `get_functional_properties`
- `update_functional_properties`

#### Gnostic Namespace Tools (LightRAG):
- `store_knowledge_fragment`
- `search_knowledge_patterns`
- `extract_wisdom_synthesis`

#### Episodic Namespace Tools (Graphiti):
- `remember_episode` ← SHARED (EA sessions use this too)
- `search_memory_patterns`
- `retrieve_session_continuity`
- `access_agent_ruminations`
- `link_aphorism_to_community` (if shared vs EA-specific?)

#### Delegation Tools:
- `delegate_to_subagent` (MEF delegation, A2A delegation)
- Agent-to-agent communication tools

#### Context Management:
- EA mode detection (`_is_ea_session()`)
- Tool gating (`_ea_gate()`)
- Session state management

### 2. Dependencies Container
- `OrchestratorDeps` class - MUST be used by ALL agents

### 3. System Prompt Logic (TO MIGRATE TO PRAKĀŚA)
- Currently in `setup_agent_prompts()` with inline Prakāśa
- Should be moved to proper Prakāśa loading in constructor

### 4. Tool Setup Functions
- `setup_agent_tools()` - registers all shared tools
- `setup_agent_prompts()` - DEPRECATED, but has EA workflow loading logic

---

## Migration Plan

### PHASE 1: Create `create_orchestrator_agent()` in constellation.py (3 hours)

**File**: `agentic/agents/constellation.py`

**Add after Epii agent** (around line 665):

```python
async def create_orchestrator_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create root orchestrator agent (#5-4).

    The orchestrator is the foundational agent that:
    - Has access to ALL shared tools (Bimba, Gnostic, Episodic)
    - Handles general chat and system requests
    - Delegates to specialized agents (subsystems 0-5) when needed
    - Manages agent-to-agent communication
    - Provides full error surfacing and debugging

    Specialized agents (#5-4.0 through #5-4.5) are created via delegation
    for domain-specific tasks (EA sessions, MEF analysis, etc.).

    Uses ASCP Prakāśa architecture:
    - Layer 1 (Identity): Loaded from #5-4 node as static system_prompt
    - Layer 2 (Workflow): Loaded dynamically when delegation occurs
    - Layer 3 (Tool Use): Guides tool selection and usage patterns

    Args:
        model: Model to use
        name: Optional agent name override
        bimba_client: Optional BimbaGraphQLClient
        redis_client: Optional RedisClient

    Returns:
        Pydantic AI Agent for root orchestrator (#5-4)
    """
    # Initialize clients
    if bimba_client is None:
        bimba_client = BimbaGraphQLClient()
    if redis_client is None:
        redis_client = RedisClient()

    # Initialize Prakāśa manager
    prakasa = PrakasaManager(bimba_client, redis_client)

    agent_coordinate = "#5-4"  # ROOT orchestrator coordinate

    # Load identity layers from #5-4 (Prakāśa Layer 1)
    identity_layers = await prakasa.compose_identity_layers(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_layers,
        retries=2
    )

    agent._metadata = {
        "subsystem": "orchestrator",  # Not a numbered subsystem
        "coordinate": "#5-4",
        "agent_coordinate": agent_coordinate,
        "name": name or "Orchestrator"
    }

    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    # Register ALL shared tools (Bimba, Gnostic, Episodic)
    # Use shared_tools.setup_all_cag_tools() to get everything
    from agentic.agents.shared_tools import setup_all_cag_tools
    setup_all_cag_tools(agent)

    # Register delegation tools
    await _setup_orchestrator_delegation_tools(agent, bimba_client, redis_client)

    logger.info(
        f"Created root orchestrator agent ({agent_coordinate}) with model {model} "
        f"using Prakāśa layered architecture"
    )
    return agent


async def _setup_orchestrator_delegation_tools(
    agent: Agent[OrchestratorDeps],
    bimba_client,
    redis_client
) -> None:
    """Register delegation tools on orchestrator agent."""
    from agentic.agents.delegation_manager import DelegationManager
    from agentic.agents.factory import AgentFactory

    # Create factory and delegation manager for orchestrator to use
    factory = AgentFactory()
    delegation_manager = DelegationManager(factory, redis_client)

    @agent.tool
    async def delegate_to_subagent(
        ctx: RunContext[OrchestratorDeps],
        target_subsystem: int,
        task_description: str,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Delegate a task to a specialized sub-agent (subsystems 0-5).

        Subsystems:
        0 = Anuttara (proto-logical processing)
        1 = Paramasiva (QL engine)
        2 = Parashakti (vibrational/MEF analysis)
        3 = Mahamaya (symbolic transcription)
        4 = Nara (personal interface)
        5 = Epii (EA specialist, wisdom synthesis)

        Args:
            target_subsystem: Subsystem number (0-5)
            task_description: What the sub-agent should do
            context: Optional context data to pass
        """
        # Use delegation manager to create and run sub-agent
        result = await delegation_manager.delegate(
            message=task_description,
            ctx=ctx,
            target_subsystem=target_subsystem,
            deps=ctx.deps
        )
        return result

    logger.info("Registered delegation tools on orchestrator")
```

### PHASE 2: Update AgentFactory to Support Orchestrator (1 hour)

**File**: `agentic/agents/factory.py`

**Current**: Factory has constructors for subsystems 0-5 only

**Add**:

```python
# factory.py - Update constructor map
self._agent_constructors = {
    "orchestrator": create_orchestrator_agent,  # ← NEW: Root agent
    0: create_anuttara_agent,
    1: create_paramasiva_agent,
    2: create_parashakti_agent,
    3: create_mahamaya_agent,
    4: create_nara_agent,
    5: create_epii_agent
}

async def create_agent(
    self,
    subsystem: Optional[int] = None,  # None means orchestrator
    model_name: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create an agent.

    Args:
        subsystem: Subsystem number (0-5) or None for orchestrator
        model_name: Model to use
        ...
    """
    # Get constructor
    key = "orchestrator" if subsystem is None else subsystem

    if key not in self._agent_constructors:
        raise ValueError(f"No constructor for subsystem={subsystem}")

    constructor = self._agent_constructors[key]

    # Create agent via constructor
    agent = await constructor(
        model=model_name,
        name=name,
        bimba_client=bimba_client,
        redis_client=redis_client
    )

    # Register in registry
    registry_key = "orchestrator" if subsystem is None else subsystem
    self.registry.register(registry_key, agent)

    return agent
```

### PHASE 3: Update AgentRouter to Route to Orchestrator (30 min)

**File**: `agentic/agents/agent_router.py`

**Change default routing**:

```python
async def route_request(
    self,
    message: str,
    deps: OrchestratorDeps,
    persona: Optional[str] = None,
    subsystem: Optional[int] = None,
    model_name: Optional[str] = None
) -> Any:
    """
    Route a request to the appropriate agent.

    NEW BEHAVIOR:
    - Default: Route to orchestrator (#5-4)
    - Explicit subsystem: Route to that subsystem (0-5)
    - Persona hints: Map to subsystem if specific persona requested
    """
    # Determine target
    if subsystem is not None:
        # Explicit subsystem requested
        target = subsystem
    elif persona and persona.lower() in ["anuttara", "paramasiva", "parashakti", "mahamaya", "nara", "epii"]:
        # Specific sub-agent requested
        target = SubsystemRouter.persona_to_subsystem(persona)
    else:
        # DEFAULT: Route to orchestrator (not a numbered subsystem)
        target = None  # None means orchestrator

    effective_model = model_name or self.default_model

    logger.info(
        f"🎯 ROUTING REQUEST: target={target or 'orchestrator'}, "
        f"persona={persona}, model={effective_model}"
    )

    # Create agent via factory
    agent = await self.factory.create_agent(
        subsystem=target,
        model_name=effective_model,
        bimba_client=self.bimba_client,
        redis_client=self.redis_client
    )

    # Run agent
    result = await agent.run(message, deps=deps)

    return result
```

### PHASE 4: Update AgentRegistry (30 min)

**File**: `agentic/agents/factory.py`

**Support non-numeric keys**:

```python
class AgentRegistry:
    def __init__(self):
        self._agents: Dict[Union[str, int], Agent[OrchestratorDeps]] = {}  # ← Allow str keys
        self._metadata: Dict[Union[str, int], Dict[str, Any]] = {}

    def register(self, key: Union[str, int], agent: Agent[OrchestratorDeps]) -> None:
        """Register an agent (key can be 'orchestrator' or subsystem number)."""
        self._agents[key] = agent
        self._metadata[key] = getattr(agent, '_metadata', {})
        logger.debug(f"Registered agent for key={key}")

    def get(self, key: Union[str, int]) -> Optional[Agent[OrchestratorDeps]]:
        """Get agent by key."""
        return self._agents.get(key)
```

### PHASE 5: Migrate Shared Tools to shared_tools.py (2 hours)

**Current Issue**: `setup_all_cag_tools()` in shared_tools.py doesn't have ALL the tools from orchestrator

**Missing Tools to Add**:
- `delegate_to_subagent` (orchestrator-specific, but shared pattern)
- Any other tools currently only in orchestrator_agent.py

**Check**: Go through orchestrator_agent.py `setup_agent_tools()` and ensure ALL shared tools are in `shared_tools.py`

### PHASE 6: Update EA Mode Detection (1 hour)

**Current**: EA mode logic is scattered in orchestrator_agent.py

**Solution**: Move to orchestrator constructor OR make orchestrator delegate to Epii automatically

**Option A - Auto-delegation**:
```python
# In create_orchestrator_agent()
@agent.tool
async def handle_ea_session(
    ctx: RunContext[OrchestratorDeps],
    message: str
) -> Dict[str, Any]:
    """Auto-delegate to Epii when EA session detected."""
    # Check if EA mode
    if ctx.deps.state and ctx.deps.state.get('ea_mode'):
        # Delegate to Epii (#5-4.5)
        return await delegate_to_subagent(
            ctx=ctx,
            target_subsystem=5,
            task_description=message,
            context={"ea_mode": True}
        )
    else:
        # Handle normally
        return {"message": "Not EA mode"}
```

**Option B - Explicit check in orchestrator system_prompt**:
Add to #5-4 Prakāśa prompt in Neo4j:
```
If EA session detected (ea_mode=true in context):
  Use delegate_to_subagent tool with target_subsystem=5 (Epii specialist)
```

---

## Testing Plan

### Test 1: General Chat Goes to Orchestrator
```python
# User sends: "What is Quaternal Logic?"
# Expected: Orchestrator responds using Bimba tools
# Verify: agent._agent_coordinate == "#5-4"
```

### Test 2: EA Session Goes to Epii
```python
# User starts EA session
# Expected: Orchestrator detects EA mode, delegates to Epii
# Verify: Epii agent created with coordinate "#5-4.5"
```

### Test 3: Explicit Delegation Works
```python
# User says: "Delegate MEF analysis to Parashakti"
# Expected: Orchestrator uses delegate_to_subagent(target_subsystem=2)
# Verify: Parashakti agent created with coordinate "#5-4.2"
```

### Test 4: All Shared Tools Available
```python
# From orchestrator: resolve_coordinate("#1-4")
# Expected: Works (Bimba tool available)
# From Epii: resolve_coordinate("#1-4")
# Expected: Works (shared tool available to all)
```

### Test 5: Orchestrator Tool Count
```python
# Check orchestrator tools
orchestrator_tools = orchestrator_agent._function_tools.keys()
# Expected: 20+ tools (Bimba + Gnostic + Episodic + delegation)
```

---

## Files to Modify

### 1. `agentic/agents/constellation.py`
- Add `create_orchestrator_agent()` (150 lines)
- Add `_setup_orchestrator_delegation_tools()` (50 lines)

### 2. `agentic/agents/factory.py`
- Update `_agent_constructors` dict to include orchestrator
- Update `create_agent()` to support `subsystem=None` for orchestrator
- Update `AgentRegistry` to support string keys

### 3. `agentic/agents/agent_router.py`
- Update `route_request()` default to orchestrator
- Update routing logic to handle orchestrator vs sub-agents

### 4. `agentic/agents/shared_tools.py`
- Ensure ALL shared tools from orchestrator are here
- Add any missing tools (delegation patterns, etc.)

### 5. `agentic/agents/orchestrator/orchestrator_agent.py`
- Add deprecation notices (already done)
- Keep as tool registry reference (don't delete yet)

---

## What NOT to Lose

### Critical Functionality:
✅ All Bimba tools (15 tools)
✅ All Gnostic tools (LightRAG)
✅ All Episodic tools (Graphiti)
✅ Delegation capability
✅ EA mode detection and routing
✅ OrchestratorDeps dependency container
✅ Tool gating for EA sessions
✅ Session state management
✅ Error surfacing and debugging

### Already Migrated:
✅ EA-specific tools now on Epii (#5-4.5) ✓
✅ Prakāśa loading pattern established ✓
✅ AgentFactory pattern working ✓

### Still to Do:
⏰ Create orchestrator agent constructor
⏰ Add to factory and router
⏰ Test delegation flow
⏰ Verify all tools preserved

---

## Success Criteria

1. ✅ User sends general message → orchestrator (#5-4) responds
2. ✅ User starts EA session → orchestrator delegates to Epii (#5-4.5)
3. ✅ Orchestrator can delegate to any subsystem (0-5)
4. ✅ All shared tools available to orchestrator
5. ✅ Specialist agents (Epii, Parashakti, etc.) can be created on-demand
6. ✅ No functionality lost from original orchestrator_agent.py
7. ✅ Prakāśa prompts loaded from Neo4j (#5-4 and #5-4.X nodes)
8. ✅ Agent registry tracks all created agents

---

## Estimated Time

| Phase | Task | Time |
|-------|------|------|
| 1 | Create `create_orchestrator_agent()` | 3 hours |
| 2 | Update AgentFactory | 1 hour |
| 3 | Update AgentRouter | 30 min |
| 4 | Update AgentRegistry | 30 min |
| 5 | Migrate shared tools | 2 hours |
| 6 | Update EA mode detection | 1 hour |
| **Testing** | End-to-end validation | 2 hours |
| **TOTAL** | | **10 hours** |

---

## Next Steps

**Immediate (Sprint 4)**:
1. Review this plan with user
2. Verify Neo4j has prompts at #5-4 node
3. Implement Phase 1 (create_orchestrator_agent)
4. Test basic orchestrator creation

**Sprint 5**:
5. Complete remaining phases
6. Delete/deprecate old orchestrator_agent.py global singleton
7. Update all documentation

---

## Questions for User

1. Does Neo4j have Prakāśa data at #5-4 node? (identity, capabilities, etc.)
2. Should orchestrator auto-delegate to Epii for EA sessions, or explicit tool call?
3. Are there any tools in orchestrator_agent.py that should be ORCHESTRATOR-ONLY (not shared)?
4. Should we keep orchestrator_agent.py as a reference, or delete after migration?
