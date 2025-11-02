# Implementation Handover: Prakāśa Foundation (This Chat)

**Ready to Begin Implementation**
**Phases 1-4 Only** (Wisdom Packet work in other chat)

---

## What We're Building

Six-layer Prakāśa agent prompting architecture with Neo4j-driven composition:

```
Layer 0: Tool Registration (architectural, before prompt)
Layer 1a: QL Foundation (#1-4.f_agent_prompt) - universal
Layer 1b: General Project (#root) - universal  
Layer 1c: Agent Identity (#5-4.N.f_agent_prompt) - per agent
Layer 1d: Subsystem Framings (#root {subsystem}_*) - per subsystem
Layer 2: Workflow (f_workflow_*) - lazy-loaded when engaged
Layer 3: Runtime Context - fresh per message
```

---

## Reference Documentation

**Primary Plan** (read this first):
- `/memory/active_sprint/sprint-4/prompting-agent-strategy/FINAL-IMPLEMENTATION-PLAN.md`

**Supporting Docs**:
- `00-ARCHITECTURAL-VISION-SYNTHESIS.md` - Architectural vision
- `prakasa-runtime-prompt-layering.md` - Six-layer technical details
- `operational-system-prompts-final.md` - **Property content source** (USE THIS)

---

## Phase 1: Fix Agent Coordinates

**Files to Modify**:
1. `/agentic/agents/constellation.py` - Lines with `agent_coordinate =` assignments (6 total)
2. `/agentic/agents/agent_node_manager.py` - `get_agent_coordinate()` method
3. `/agentic/agents/factory.py` - Agent factory coordinate pattern

**Change Pattern**:
```python
# OLD (WRONG)
agent_coordinate = "#0-4.0"  # Anuttara
agent_coordinate = "#1-4.1"  # Paramasiva
# etc.

# NEW (CORRECT)
agent_coordinate = "#5-4.0"  # Anuttara manifestation
agent_coordinate = "#5-4.1"  # Paramasiva manifestation
# etc.
```

**Why**: #5 Epii IS the agentic subsystem. All 6 agents are Epii manifestations at different modalities.

**Validation**: 
- All agents use #5-4.N pattern
- Tests pass
- No broken references

---

## Phase 2: Enhance Tool Docstrings

**File**: `/agentic/agents/shared_tools.py`

**Task**: Enhance 30 remaining tools (2 already done: get_wisdom_packet, get_quintessential_properties)

**Pattern** (three-part):
```python
@agent.tool
async def tool_name(ctx: RunContext[OrchestratorDeps], param: str) -> dict:
    """[What it does - one sentence]

    [When to use it - explain vs similar tools - one sentence]

    Args:
        param: [Description]

    Returns:
        [Description of return value]
    """
```

**Example**:
```python
@agent.tool
async def resolve_coordinate(ctx: RunContext[OrchestratorDeps], coordinate: str) -> dict:
    """Resolve a Bimba coordinate to get its canonical content and relationships.

    Use this tool when you need to understand what a coordinate represents,
    its core identity, or its immediate relationships. For deep property
    inspection, use get_node_details_complete instead. For concept-based
    search when you don't know the coordinate, use semantic_coordinate_discovery.

    Args:
        coordinate: Bimba coordinate notation (e.g., "#5", "#1-4", "#5-4.5")

    Returns:
        Dict with coordinate name, description, subsystem, primary designation,
        and immediate relationships
    """
    bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
    return await bimba_client.resolve_coordinate(coordinate)
```

**Validation**: All 32 tools have adequate docstrings with "when to use" guidance

---

## Phase 3: Create Neo4j Functional Properties

**CRITICAL**: DO NOT create content from scratch. Use existing files as source.

### 3.1 QL Foundation Property

**Source**: `operational-system-prompts-final.md` - Section "Part 1: QL Foundation (#1-4 node properties)"

**Cypher**:
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#1-4'})
SET n.f_agent_prompt = '
[COPY ENTIRE CONTENT from operational-system-prompts-final.md Part 1 - #1-4.f_agent_prompt section]
'
```

**Content Preview**: ~400 lines with:
- 6-position chain of circulation
- Step mandates (#0 Ground → #1 Material → #2 Dynamic → #3 Formal → #4 Teleological → #5 Synthesis)
- Internal monologue triggers

### 3.2 Agent Identity Properties (6 total)

**Source**: `operational-system-prompts-final.md` - Section "Part 2: Agent-Specific Prompts"

**Agents to Create**:
- #5-4.0 (Anuttara)
- #5-4.1 (Paramasiva)
- #5-4.2 (Parashakti)
- #5-4.3 (Mahamaya)
- #5-4.4 (Nara)
- #5-4.5 (Epii)

**Cypher Template**:
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4.5'})
SET n.f_agent_prompt = '
[COPY from operational-system-prompts-final.md Part 2 - Epii section]
'

// Repeat for all 6 agents
```

**Content Preview**: ~200-250 lines per agent with:
- Subsystem identity (#N operational meaning)
- Agent capabilities
- Knowledge access (CAG namespaces)
- Voice guidelines

### 3.3 Verify Workflow Properties

**Task**: Verify EA workflow already exists (no creation needed)

```cypher
// Check if EA workflow exists
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4.5'})
RETURN n.f_workflow_etymology_archaeology_v2
```

**Note**: Wisdom packet synthesis workflow (f_workflow_wisdom_packet_synthesis) will be created in OTHER CHAT.

**Validation**: All 7 properties queryable via get_node_details_complete

---

## Phase 4: Refactor Prakāśa Manager

**File**: `/agentic/agents/prakasa.py`

### 4.1 Add load_workflow_prompt() Method

**Location**: Add as new method in PrakasaManager class

```python
async def load_workflow_prompt(
    self,
    agent_coordinate: str,
    workflow_name: str
) -> Optional[str]:
    """
    Load f_workflow_* property for dynamic workflow engagement.

    Args:
        agent_coordinate: Agent coordinate (e.g., "#5-4.5")
        workflow_name: Workflow name (e.g., "wisdom_packet_synthesis", "etymology_archaeology_v2")

    Returns:
        Workflow prompt content or None if not found
    """
    try:
        node_data = await self.bimba_client.get_node_details_complete(
            agent_coordinate, include_functional_properties=True
        )
        all_props = node_data.get('allProperties', {})

        prompt_key = f"f_workflow_{workflow_name}"
        prompt = all_props.get(prompt_key)

        if not prompt:
            logger.warning(
                f"Workflow '{workflow_name}' not found at {agent_coordinate} "
                f"(expected property: {prompt_key})"
            )
            return None

        logger.debug(
            f"Loaded workflow prompt '{workflow_name}' for {agent_coordinate}: "
            f"{len(prompt)} chars"
        )
        return prompt

    except Exception as e:
        logger.error(
            f"Error loading workflow prompt '{workflow_name}' for {agent_coordinate}: {e}"
        )
        return None
```

### 4.2 Refactor generate_identity_prakasa()

**Current**: Three-layer (# root + #N subsystem + template)
**New**: Six-layer (QL + general + agent + framings)

**Replace method with**:

```python
async def generate_identity_prakasa(self, agent_coordinate: str) -> str:
    """
    Generate six-layer identity prompt from Neo4j properties.

    Layers:
    1a. QL Foundation from #1-4
    1b. General Project Context from # root
    1c. Agent-Specific Identity from #5-4.N
    1d. Subsystem-Specific Framings from # root
    """
    subsystem = self._extract_subsystem(agent_coordinate)
    subsystem_name = SUBSYSTEM_NAMES.get(subsystem, f"agent_{subsystem}")

    prompt = ""

    # Layer 1a: QL Foundation (universal)
    ql_node = await self.bimba_client.get_node_details_complete(
        "#1-4", include_functional_properties=True
    )
    ql_props = ql_node.get('allProperties', {})
    if 'f_agent_prompt' in ql_props:
        prompt += ql_props['f_agent_prompt'] + "\n\n---\n\n"

    # Layer 1b: General Epi-Logos Project Context (universal)
    root_node = await self.bimba_client.get_node_details_complete("#")
    root_props = root_node.get('allProperties', {})
    general_context = f"""## The Epi-Logos Project

**{root_props.get('name', 'Epi-Logos Project')}**

{root_props.get('coreNature', '')}

**Architectural Function**: {root_props.get('architecturalFunction', '')}

**Operational Essence**: {root_props.get('operationalEssence', '')}
"""
    prompt += general_context + "\n\n---\n\n"

    # Layer 1c: Agent-specific Identity (unique per agent)
    agent_prompt = await self.agent_nodes.get_agent_prompt(agent_coordinate)
    if agent_prompt:
        prompt += agent_prompt + "\n\n---\n\n"

    # Layer 1d: Subsystem-specific Framings (unique per subsystem)
    project_framings = self._filter_subsystem_framings(root_props, subsystem_name)
    if project_framings:
        prompt += self._format_project_framings(project_framings, subsystem_name)

    # Save and cache
    metadata = {
        'generated_from': [
            {'source': '#1-4', 'properties': ['f_agent_prompt']},
            {'source': '#', 'properties': ['name', 'coreNature', 'architecturalFunction', 'operationalEssence']},
            {'source': agent_coordinate, 'properties': ['f_agent_prompt']},
            {'source': '#', 'properties': list(project_framings.keys())},
        ],
        'last_updated': datetime.now(timezone.utc).isoformat(),
        'version': '2.0.0'
    }

    await self.agent_nodes.save_system_prompt(agent_coordinate, prompt, metadata)
    await self.cache.set(agent_coordinate, prompt)

    logger.info(f"Generated six-layer identity Prakāśa for {agent_coordinate} ({len(prompt)} chars)")
    return prompt
```

### 4.3 Update compose_full_prakasa()

**Replace method with**:

```python
async def compose_full_prakasa(
    self,
    agent_coordinate: str,
    current_request: Dict[str, Any],
    workflow_name: Optional[str] = None,
    conversation_history: Optional[List[Dict]] = None
) -> str:
    """
    Compose complete Prakāśa with 2 or 3 layers.

    Layers:
    - Identity (Layer 1): Always present (six sublayers, cached/stored)
    - Workflow (Layer 2): Only if workflow_name provided
    - Context (Layer 3): Always present (runtime)
    """
    # Layer 1: Identity (six sublayers, cached)
    identity = await self.get_identity_prakasa(agent_coordinate)

    # Layer 2: Workflow (optional, lazy-loaded)
    workflow = ""
    if workflow_name:
        workflow = await self.load_workflow_prompt(agent_coordinate, workflow_name)
        if not workflow:
            logger.warning(
                f"Workflow '{workflow_name}' requested but not found for {agent_coordinate}. "
                f"Continuing without workflow layer."
            )

    # Layer 3: Context (runtime)
    context = self.build_context_prakasa(current_request, conversation_history)

    # Combine layers
    if workflow:
        full_prakasa = f"{identity}\n\n---\n\n{workflow}\n\n---\n\n{context}"
        logger.debug(
            f"Composed 3-layer Prakāśa for {agent_coordinate}: "
            f"identity + {workflow_name} + context"
        )
    else:
        full_prakasa = f"{identity}\n\n---\n\n{context}"
        logger.debug(
            f"Composed 2-layer Prakāśa for {agent_coordinate}: "
            f"identity + context"
        )

    return full_prakasa
```

### 4.4 Add get_agent_prompt() to AgentNodeManager

**File**: `/agentic/agents/agent_node_manager.py`

**Add method**:

```python
async def get_agent_prompt(self, agent_coordinate: str) -> Optional[str]:
    """Get f_agent_prompt from agent node.

    Args:
        agent_coordinate: Agent coordinate (e.g., "#5-4.5")

    Returns:
        Agent-specific prompt content or None
    """
    try:
        result = await self.bimba.get_node_details_complete(
            agent_coordinate, include_functional_properties=True
        )
        props = result.get("allProperties", {})
        return props.get("f_agent_prompt")
    except Exception as e:
        logger.error(f"Error getting agent prompt for {agent_coordinate}: {e}")
        return None
```

**Validation**: 
- Six-layer identity generated correctly
- Workflow loading works (test with EA workflow)
- Open chat works (no workflow = 2-layer: identity + context)

---

## Testing Strategy

### Phase 1 Tests
- All agents use #5-4.N pattern
- No broken coordinate references
- Tests pass

### Phase 2 Tests
- All 32 tools have three-part docstrings
- "When to use" guidance present

### Phase 3 Tests
- All 7 properties created in Neo4j
- Properties queryable via get_node_details_complete
- Content matches source files

### Phase 4 Tests
- Six-layer identity generated for test agent
- Workflow loading works (EA workflow)
- Open chat works (no workflow layer)
- Prompt composition correct

### Integration Test
- Create Epii agent with six-layer identity
- Test EA workflow engagement
- Test open chat mode
- Validate full Prakāśa composition

---

## Success Criteria

✅ All agents use #5-4.N coordinate pattern
✅ All 32 tools have adequate docstrings
✅ 7 Neo4j properties created and queryable
✅ Six-layer identity Prakāśa generated
✅ Workflow loading works dynamically
✅ Open chat works (2-layer composition)

---

## What's Out of Scope (Other Chat)

❌ Wisdom packet agent synthesis (Phase 5)
❌ Agent synthesis runner
❌ f_workflow_wisdom_packet_synthesis property
❌ Service-to-agent delegation pattern

These are being handled in the other chat stream.

---

**Ready to begin Phase 1: Fix agent coordinates!**
