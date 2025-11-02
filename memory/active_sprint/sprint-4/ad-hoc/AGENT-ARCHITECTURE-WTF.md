# AGENT ARCHITECTURE - WHAT THE FUCK IS ACTUALLY HAPPENING 🚨

**Date**: 2025-10-28
**Severity**: CRITICAL - You (Claude Code) are getting confused between two completely different agent patterns

---

## The Core Problem

**WE HAVE TWO AGENT CREATION PATTERNS RUNNING IN PARALLEL AND THE WRONG ONE IS DEFAULT**

---

## Pattern A: AgentFactory Multi-Agent Constellation ✅ (CORRECT)

**Location**: `agentic/agents/factory.py`, `constellation.py`

### How It SHOULD Work:

```python
# factory.py:95-147
class AgentFactory:
    async def create_agent(subsystem: int, model_name: str) -> Agent[OrchestratorDeps]:
        """Create coordinate-specific agent with Prakāśa identity."""
        # Get constructor for subsystem (0-5)
        constructor = self._agent_constructors[subsystem]
        # e.g., create_epii_agent, create_nara_agent, etc.

        # Constructor handles Prakāśa integration properly
        agent = await constructor(
            model=model_name,
            bimba_client=bimba_client,
            redis_client=redis_client
        )

        # Register in registry for tracking
        self.registry.register(subsystem, agent)
        return agent
```

```python
# constellation.py:85-142 - Example: Epii Agent Constructor
async def create_epii_agent(
    model: str,
    bimba_client,
    redis_client
) -> Agent[OrchestratorDeps]:
    """Create Epii agent (#5) using ASCP Prakāśa architecture."""

    # ✅ CORRECT: PrakasaManager passed as constructor argument
    prakasa = PrakasaManager(bimba_client, redis_client)

    # ✅ CORRECT: Get identity from agent node #5-4.5
    agent_coordinate = "#5-4.5"
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    # ✅ CORRECT: Create agent with static identity prompt
    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,  # Static prompt from Prakāśa
        retries=2
    )

    # ✅ CORRECT: Store manager reference for workflow engagement
    agent._prakasa_manager = prakasa
    agent._agent_coordinate = agent_coordinate

    # ✅ CORRECT: Register tools selectively
    await setup_selective_tools(agent, bimba_client, agent_coordinate)

    return agent
```

### Architecture Flow (CORRECT):

```
User Message
    ↓
AgentRunner (agent_runner.py:115-124)
    ↓
AgentRouter (if ENABLE_MULTI_AGENT=true)
    ↓
AgentFactory.create_agent(subsystem=5)
    ↓
create_epii_agent(model, bimba_client, redis_client)
    ↓
PrakasaManager.get_identity_prakasa("#5-4.5")
    ↓
Agent created with static identity
    ↓
Agent registered in AgentRegistry
    ↓
Agent.run(message, deps=OrchestratorDeps)
```

### Used By:
- ✅ `DelegationManager` (delegation_manager.py:170) - For MEF delegation
- ✅ `AgentRunner` with `ENABLE_MULTI_AGENT=true` (agent_runner.py:54-56)
- ❌ **NOT used by default** because flag is false

### Files:
- `agentic/agents/factory.py` (191 lines) ✅
- `agentic/agents/constellation.py` (17,371 lines) ✅
  - Contains all 6 agent constructors
  - Each properly integrates Prakāśa
- `agentic/agents/agent_router.py` (7,960 bytes) ✅
- `agentic/agents/delegation_manager.py` (10,072 bytes) ✅

---

## Pattern B: Orchestrator Inline Hackery ❌ (WRONG - BUT DEFAULT)

**Location**: `orchestrator_agent.py:1851-1951`

### How It WRONGLY Works:

```python
# orchestrator_agent.py:1855-1865
@agent.system_prompt
def system_prompt(ctx: RunContext[OrchestratorDeps]) -> str:
    """Base system prompt loaded from Neo4j via PrakasaManager."""
    from agentic.agents.prakasa import PrakasaManager
    import asyncio  # ❌ TERRIBLE - sync function calling async

    # ❌ CREATES NEW MANAGER ON EVERY SINGLE MESSAGE
    manager = PrakasaManager(ctx.deps.bimba_client, ctx.deps.redis_client)

    # ❌ USES asyncio.run() IN SYNC DECORATOR - HUGE PERFORMANCE HIT
    foundation = asyncio.run(manager.get_identity_prakasa("#5-4"))

    # Check if manual delegation is requested
    target_agent = ctx.deps.state.get("target_agent")
    delegation_notice = ""
    if target_agent is not None:
        delegation_notice = f"""MANUAL DELEGATION ACTIVE..."""

    # Check for etymology session context (#5-5)
    etymology_context = ""
    if ctx.deps.state and ctx.deps.state.get('ea_mode'):
        # ❌ ANOTHER asyncio.run() call
        ea_prompt = asyncio.run(manager.engage_workflow_prakasa("#5-4.5", "etymology_archaeology"))
        onboarding_text = asyncio.run(generate_session_onboarding(...))
        etymology_context = f"""## Etymology Archaeology Session..."""

    # ❌ 100+ LINES OF PROMPT COMPOSITION THAT SHOULD BE IN PrakasaManager
    final_prompt = f"""{foundation}

**Coordinate Reasoning Protocol:**...
Current persona: {ctx.deps.current_persona}
{delegation_notice}
{etymology_context}
...
"""
    return final_prompt  # Returned on EVERY message
```

```python
# orchestrator_agent.py:2073-2075 - Default Agent Creation
try:
    default_model = get_default_model()
    orchestrator_agent = create_orchestrator_agent(default_model)  # ❌ GLOBAL SINGLETON
    logger.info(f"Default orchestrator agent created with model: {default_model}")
except Exception as e:
    logger.error(f"Error creating default orchestrator agent: {e}")
    orchestrator_agent = None
```

### Architecture Flow (WRONG):

```
User Message
    ↓
AgentRunner (agent_runner.py:127-144)
    ↓
Uses global `orchestrator_agent` singleton ❌
    ↓
orchestrator_agent.run(message, deps=...)
    ↓
@agent.system_prompt decorator fires ON EVERY MESSAGE ❌
    ↓
Creates PrakasaManager inline ❌
    ↓
Calls asyncio.run() multiple times ❌
    ↓
100-line prompt composition in decorator ❌
    ↓
No factory, no registry, no tracking ❌
```

### Problems:

1. **PER-REQUEST INSTANTIATION**:
   - Creates new `PrakasaManager` on EVERY message
   - Should create ONCE in constructor

2. **SYNC/ASYNC ABUSE**:
   - `@agent.system_prompt` is SYNC decorator
   - Calls `asyncio.run()` for async methods
   - Huge performance hit, potential event loop conflicts

3. **BYPASSES FACTORY**:
   - Doesn't use `AgentFactory.create_agent()` AT ALL
   - No agent registry
   - Can't track or reference agent

4. **MASSIVE FUNCTION**:
   - 100-line `system_prompt` function
   - Doing Prakāśa's job (prompt composition)
   - Should delegate to `PrakasaManager.compose_full_prakasa()`

5. **GLOBAL SINGLETON**:
   - `orchestrator_agent` created at module import
   - Can't create multiple instances
   - Can't customize per request

### Used By:
- ✅ `AgentRunner` with `ENABLE_MULTI_AGENT=false` (DEFAULT) ❌
- ✅ Default mode for all AG-UI requests ❌
- **THIS IS THE CURRENT DEFAULT BEHAVIOR** ❌❌❌

### Files:
- `agentic/agents/orchestrator/orchestrator_agent.py` (2,137 lines) ❌

---

## Why This Confusion Exists

### Historical Context:

1. **Phase 1 (Sprint 1-2)**:
   - Created `orchestrator_agent.py` as single monolithic agent
   - Inline everything, no factory pattern

2. **Phase 2 (Sprint 3 - Story 02.24)**:
   - Implemented `AgentFactory` + `constellation.py`
   - Created proper 6-agent pattern
   - Added `AgentRouter` for routing
   - **BUT** - kept old orchestrator as default via flag

3. **Phase 3 (Sprint 3 - Prakāśa)**:
   - Created `PrakasaManager` for layered prompts
   - Updated constellation to use Prakāśa properly
   - **BUT** - also updated orchestrator to use Prakāśa WRONGLY (inline)

4. **Phase 4 (Sprint 4 - Now)**:
   - Added EA tools to orchestrator
   - File size exploded to 2,137 lines
   - **STILL using old pattern as default**

### The Migration That Never Finished:

**We're 75% migrated to AgentFactory but still using the old pattern by default.**

```python
# agent_runner.py:33-58
ENABLE_MULTI_AGENT = os.getenv("ENABLE_MULTI_AGENT", "false").lower() == "true"

class AgentRunner:
    def __init__(self):
        # Legacy persona system (default) ❌
        self.agent = orchestrator_agent

        # Multi-agent routing (feature flag) ✅
        self.router = None
        if ENABLE_MULTI_AGENT:
            self.router = AgentRouter()
            logger.info("Multi-agent mode via AgentRouter")
        else:
            logger.info("Persona mode (legacy orchestrator)")  # ❌ DEFAULT
```

**THE FLAG SHOULD ALWAYS BE TRUE - REMOVE IT**

---

## How to Fix This Immediately (Sprint 4 - 2 hours)

### Step 1: Enable Multi-Agent Mode Globally

```bash
# .env or environment
ENABLE_MULTI_AGENT=true
```

This forces `AgentRunner` to use `AgentRouter` → `AgentFactory` → `constellation.py`

### Step 2: Verify AgentRouter Uses Factory

Check `agent_router.py` - confirm it calls `AgentFactory.create_agent()`

### Step 3: Deprecate Inline Prakāśa in Orchestrator

```python
# orchestrator_agent.py - DELETE lines 1855-1951

# BEFORE:
@agent.system_prompt
def system_prompt(ctx: RunContext[OrchestratorDeps]) -> str:
    manager = PrakasaManager(...)  # ❌
    foundation = asyncio.run(...)  # ❌
    # 100 lines...
    return final_prompt

# AFTER:
# Remove decorator entirely - identity loaded in create_orchestrator_agent()
# OR use simple static string
```

### Step 4: Update create_orchestrator_agent() to Use Factory Pattern

```python
# orchestrator_agent.py:143-170

# BEFORE:
def create_orchestrator_agent(model_name: str, ea_mode: bool = False) -> Agent:
    agent = Agent(model_name, deps_type=OrchestratorDeps, retries=2)
    setup_agent_tools(agent, ea_mode=ea_mode)
    setup_agent_prompts(agent)  # ❌ Registers inline decorator
    return agent

# AFTER:
async def create_orchestrator_agent(
    model_name: str,
    bimba_client,
    redis_client
) -> Agent:
    """Create orchestrator using Prakāśa manager (like constellation.py)."""
    prakasa = PrakasaManager(bimba_client, redis_client)
    identity = await prakasa.get_identity_prakasa("#5-4")

    agent = Agent(
        model_name,
        deps_type=OrchestratorDeps,
        system_prompt=identity,  # ✅ Static prompt
        retries=2
    )
    setup_agent_tools(agent)
    return agent
```

---

## How to Fix This Properly (Sprint 5 - 8 hours)

### Option A: Delete Orchestrator Entirely

**Radical but clean:**

1. Delete `orchestrator_agent.py` entirely
2. Extract core tools to `agentic/agents/shared_tools.py`
3. Use ONLY `AgentFactory` + `constellation.py`
4. Remove `ENABLE_MULTI_AGENT` flag
5. Update all imports to use factory

**Pros**: Clean break, proper architecture
**Cons**: Large refactor, potential breakage

### Option B: Reduce Orchestrator to Tools Only

**Conservative approach:**

1. Remove all agent creation logic from `orchestrator_agent.py`
2. Keep only tool definitions (500 lines)
3. Move prompt logic to `PrakasaManager`
4. Have `constellation.py` import tools from orchestrator
5. Deprecate `create_orchestrator_agent()` function

**Pros**: Incremental, safer
**Cons**: Still have legacy file hanging around

---

## Clear Separation of Concerns (What Goes Where)

### AgentFactory (`factory.py`)
- Agent creation coordination
- Registry management
- Constellation building
- **191 lines** ✅

### Constellation (`constellation.py`)
- 6 agent constructors (`create_epii_agent`, etc.)
- Prakāśa integration per agent
- Tool registration per agent
- **17,371 lines** ✅

### PrakasaManager (`prakasa.py`)
- Identity prompt loading (Layer 1)
- Workflow prompt loading (Layer 2)
- Context prompt building (Layer 3)
- Full prompt composition
- **1,490 lines** ✅

### Shared Tools (`shared_tools.py`)
- CAG tool definitions (Bimba, Gnostic, Episodic)
- Tool registration functions
- EA tools (should be here, not in orchestrator)
- **Current: scattered** ❌

### Orchestrator (`orchestrator_agent.py`) - LEGACY
- **Should be**: Tool definitions only (500 lines)
- **Currently is**: Everything (2,137 lines) ❌
- **Should become**: Deleted or reduced

---

## Decision Matrix

| Approach | Time | Risk | Cleanliness | Recommendation |
|----------|------|------|-------------|----------------|
| **Enable flag only** | 1 hour | Low | Medium | ✅ Do this NOW (Sprint 4) |
| **Remove inline Prakāśa** | 2 hours | Medium | High | ✅ Do this NOW (Sprint 4) |
| **Reduce orchestrator to tools** | 8 hours | Medium | High | ⏰ Sprint 5 |
| **Delete orchestrator entirely** | 16 hours | High | Perfect | ⏰ Sprint 6 |

---

## Testing Checklist

### After Enabling ENABLE_MULTI_AGENT=true:

- [ ] AG-UI chat still works
- [ ] Agent responses use factory-created agents
- [ ] EA sessions work (#5-5 mode)
- [ ] Delegation works (DelegationManager)
- [ ] Agent registry populates correctly
- [ ] No asyncio.run() warnings in logs

### After Removing Inline Prakāśa:

- [ ] System prompts still load correctly
- [ ] Identity prompts cached in Redis
- [ ] No performance degradation
- [ ] EA workflow prompts load
- [ ] Logs show Prakāśa sources (cache/storage/generated)

---

## Summary: What You (Claude Code) Need to Remember

**DO NOT MIX THESE PATTERNS:**

✅ **CORRECT**:
```python
# Use AgentFactory
factory = AgentFactory()
agent = await factory.create_agent(subsystem=5, model_name="...")
# Agent has Prakāśa identity built-in
# Agent is registered
# Agent is trackable
```

❌ **WRONG**:
```python
# Use global orchestrator_agent
from agentic.agents.orchestrator.orchestrator_agent import orchestrator_agent
result = await orchestrator_agent.run(message, deps=...)
# Creates PrakasaManager on every message
# No registry
# No tracking
# Performance hit
```

**DEFAULT SHOULD BE FACTORY, NOT ORCHESTRATOR**

**THE FLAG IS A CRUTCH - REMOVE IT**

---

## Files to Review

### CORRECT Architecture (Keep These):
- `agentic/agents/factory.py` ✅
- `agentic/agents/constellation.py` ✅
- `agentic/agents/prakasa.py` ✅
- `agentic/agents/agent_router.py` ✅
- `agentic/agents/delegation_manager.py` ✅

### LEGACY Architecture (Fix or Delete):
- `agentic/agents/orchestrator/orchestrator_agent.py` ❌
- Lines 1855-1951 (inline Prakāśa) - DELETE
- Lines 2073-2099 (global singleton) - DEPRECATE

### Needs Update:
- `agentic/agents/agent_runner.py` - Remove flag, use factory only
- `agentic/api/ag_ui.py` - Ensure uses factory
