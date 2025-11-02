# EA Architecture Reality Check - WHERE THE FUCK IS EVERYTHING

**Date**: 2025-10-28
**Status**: CRITICAL CONFUSION - Need to map ACTUAL vs INTENDED architecture

---

## What We KNOW:

### 1. ✅ AgentFactory Pattern IS Active
- `agent_runner.py` ALWAYS uses `AgentRouter`
- `AgentRouter` uses `AgentFactory`
- `AgentFactory` calls `create_epii_agent()` from `constellation.py`

### 2. ✅ Epii Agent Creation (constellation.py:492-552)
```python
async def create_epii_agent(model, bimba_client, redis_client):
    prakasa = PrakasaManager(bimba_client, redis_client)
    agent_coordinate = "#5-4.5"

    # Load identity from Prakāśa (Layer 1)
    identity_layers = await prakasa.compose_identity_layers(agent_coordinate)

    agent = Agent(
        model=model,
        system_prompt=identity_layers,  # Static prompt from Prakāśa
        deps_type=OrchestratorDeps
    )

    # Register tools based on f_tools property in Neo4j
    await setup_selective_tools(agent, bimba_client, agent_coordinate)

    return agent
```

### 3. ✅ Tool Registration Pattern (shared_tools.py:1001-1051)
```python
async def setup_selective_tools(agent, bimba_client, agent_coordinate):
    """
    Query agent node's f_tools property in Neo4j.
    Register only those tools from shared CAG tool registry.
    Fallback: setup_all_cag_tools() if no f_tools found.
    """
    result = await bimba_client.get_functional_properties(agent_coordinate, "f_tools")
    tool_names = json.loads(result["properties"]["f_tools"])  # JSON array
    # Register only these tools from the CAG tool registry
```

### 4. ✅ EA Tools EXIST in epii/tools/ Directory
```
/agentic/agents/epii/tools/
├── __init__.py - Exports all EA tools
├── etymology_dialogue.py - etymology_search, trace_etymology_chain
├── graphiti_community.py - create_etymology_community, create_aphorism
├── session_onboarding.py - EA session onboarding
├── phase_guidance.py - Workflow phase guidance
├── bimba_resonance.py - Resonance detection
├── conversation_capture.py - Dialogue sedimentation
├── mef_delegation.py - MEF analysis delegation
├── pattern_detection.py - Pattern recognition
└── insight_surfacing.py - Insight extraction
```

### 5. ⚠️ PROBLEM: orchestrator_agent.py ALSO Has EA Tools (lines 1758-1850)
```python
# orchestrator_agent.py - DUPLICATE EA TOOLS

if _is_ea_session(ctx):  # Conditional registration
    @agent.tool
    async def etymology_search(...):
        from agentic.agents.epii.tools.etymology_dialogue import etymology_search as _search
        return await _search(...)

    @agent.tool
    async def create_etymology_community_tool(...):  # Wrong name
        from agentic.agents.epii.tools.graphiti_community import create_etymology_community as _create
        return await _create(...)
```

---

## THE CONFUSION:

### Question 1: Which Tools Are ACTUALLY Registered on Epii Agent?

**Path A** (constellation.py):
```
create_epii_agent()
  ↓
setup_selective_tools(agent, bimba_client, "#5-4.5")
  ↓
Query Neo4j: GET f_tools property from #5-4.5 node
  ↓
Register tools based on f_tools array
```

**Question**: What does `#5-4.5` node's `f_tools` property contain?
- If it contains EA tool names → EA tools registered ✅
- If it's empty → Falls back to `setup_all_cag_tools()` ❓
- If fallback happens → No EA tools (they're not in shared_tools.py) ❌

### Question 2: Are EA Tools in shared_tools.py?

**Check**: `shared_tools.py` has NO etymology-related tools
- Only Bimba, Gnostic, Episodic tools
- NO `etymology_search`, `create_etymology_community`, etc.

**This means**: If `setup_selective_tools()` falls back to `setup_all_cag_tools()`:
- ❌ EA tools NOT registered
- ❌ Epii can't use them
- ❌ EA workflow broken

### Question 3: Where Is EA Workflow Guidance?

**User says**: "YES! THIS IS WHY THIS IS SO FUCKING ANNOYING, DONE ALL THE WORK YOU JUST BYPASSING IT"

**This means**: EA workflow guidance IS in Prakāśa graph at `#5-4.5`

**orchestrator_agent.py lines 1893-1896**:
```python
# ❌ BYPASSING Prakāśa
ea_prompt = asyncio.run(manager.engage_workflow_prakasa("#5-4.5", "etymology_archaeology"))
# This loads FROM graph but in the WRONG place (orchestrator inline)
```

**Correct location**: Should be in Prakāśa Layer 2 or 3
- Layer 2: Workflow context (loaded via `@agent.instructions` or similar)
- Layer 3: Tool use guidance

---

## WHAT'S ACTUALLY HAPPENING (Best Guess):

### Scenario A: orchestrator_agent.py Is STILL Being Used ❌
- Despite AgentFactory migration, maybe orchestrator is still fallback?
- EA tools registered inline in orchestrator (lines 1758-1850)
- EA workflow loaded inline (lines 1893-1896)
- **This would explain why it works but bypasses Prakāśa architecture**

### Scenario B: Epii Agent Has NO EA Tools ❌
- `setup_selective_tools()` queries `#5-4.5` node
- `f_tools` is empty or doesn't have EA tools
- Falls back to `setup_all_cag_tools()`
- **EA tools never registered, workflow broken**

### Scenario C: Dual Registration (Clusterfuck) ❌
- Both orchestrator AND Epii have EA tools registered
- Orchestrator via inline conditionals
- Epii via... unclear mechanism
- **Competing implementations**

---

## CRITICAL QUESTIONS TO ANSWER:

### 1. Is orchestrator_agent STILL being used despite migration?
**Check**: Look at AgentRouter to see if it actually calls AgentFactory or falls back to orchestrator

### 2. What does `#5-4.5` node's `f_tools` property contain?
**Check**: Query Neo4j directly:
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: "#5-4.5"})
RETURN n.f_tools
```

### 3. How should EA tools be registered on Epii?
**Options**:
- **A**: Add to `shared_tools.py` (all agents get them)
- **B**: Add to `#5-4.5` node's `f_tools` property (selective)
- **C**: Create Epii-specific tool registration in `constellation.py`

### 4. Where should EA workflow guidance come from?
**Current**: orchestrator inline loads via `engage_workflow_prakasa("#5-4.5", "etymology_archaeology")`
**Correct**: Prakāśa Manager's layered prompt composition
- Layer 1 (Identity): Already loaded ✅
- Layer 2 (Workflow): Should load workflow guidance from `#5-4.5` node's workflow properties
- Layer 3 (Tool Use): Should load tool use instructions

---

## WHAT NEEDS TO HAPPEN:

### Immediate Investigation (15 min):

1. **Check if orchestrator is actually used**:
   - Review `AgentRouter.route_request()` implementation
   - Verify it calls `factory.create_agent()` not `orchestrator_agent`

2. **Query Neo4j for `#5-4.5` node**:
   - Check if `f_tools` property exists
   - Check if `f_workflow_etymology_archaeology` property exists
   - Understand what Prakāśa data is already there

3. **Verify Epii agent tool registration**:
   - Add logging to `setup_selective_tools()` to see what tools are registered
   - Check if EA tools appear in Epii's tool list

### Cleanup Plan (Depends on Investigation):

**If orchestrator is NOT used** (AgentFactory works):
- **Problem**: EA tools not registered on Epii
- **Solution**: Add EA tools to `shared_tools.py` OR populate `#5-4.5` node's `f_tools`

**If orchestrator IS used** (Factory migration incomplete):
- **Problem**: We didn't actually migrate, just added fallback
- **Solution**: Fix AgentRouter to ONLY use factory, never orchestrator

**If dual registration** (Both active):
- **Problem**: Competing implementations causing confusion
- **Solution**: Delete ALL EA code from orchestrator, ensure only Epii has it

---

## Expected Architecture (After Cleanup):

```
User Message → AG-UI
  ↓
AgentRunner (always uses factory now)
  ↓
AgentRouter.route_request(persona="system")
  ↓
Maps "system" → subsystem 5 (Epii)
  ↓
AgentFactory.create_agent(subsystem=5)
  ↓
create_epii_agent() in constellation.py
  ↓
PrakasaManager.compose_identity_layers("#5-4.5")
  ↓  Loads from Neo4j:
  ↓  - Layer 1a: QL Foundation
  ↓  - Layer 1b: Project Context
  ↓  - Layer 1c: System Prompt
  ↓  - Layer 1d: Agent Identity (#5-4.5 node)
  ↓  - Layer 1e: Capabilities
  ↓
Agent created with static system_prompt
  ↓
setup_selective_tools(agent, bimba_client, "#5-4.5")
  ↓  Queries f_tools from #5-4.5 node
  ↓  Registers: Bimba, Gnostic, Episodic, EA tools
  ↓
Agent ready with tools
  ↓
Agent.run(message, deps=...)
  ↓
IF EA session (#5-5 context):
  ↓  @agent.instructions (dynamic)
  ↓  Loads Layer 2 (Workflow) from #5-4.5 node
  ↓  Property: f_workflow_etymology_archaeology
  ↓  Contains: 5-step EA workflow guidance
  ↓
Agent responds using EA tools + workflow guidance
```

---

## Files to Investigate:

1. **`agentic/agents/agent_router.py`** - Does it actually call factory?
2. **`agentic/agents/shared_tools.py`** - Should EA tools be here?
3. **`agentic/agents/constellation.py`** - Is Epii registration complete?
4. **`agentic/agents/prakasa.py`** - How are Layers 2-3 loaded?
5. **Neo4j `#5-4.5` node** - What properties exist?

---

## Bottom Line:

**WE DON'T KNOW**:
- If AgentFactory is ACTUALLY being used for EA sessions
- Where EA tools are ACTUALLY registered (orchestrator vs Epii)
- If Prakāśa workflow guidance is ACTUALLY being loaded
- If `#5-4.5` node has `f_tools` populated

**WE NEED TO**:
1. Trace an actual EA session request through the code
2. Query Neo4j to see what's in `#5-4.5` node
3. Add logging to see which agent/tools are used
4. Figure out WTF is actually happening vs what we THINK is happening

**THEN** we can make a proper cleanup plan.
