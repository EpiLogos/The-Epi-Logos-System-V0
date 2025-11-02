# Phase 4: Prakāśa Manager Enhancements - Implementation Specification

**Goal**: Enhance PrakasaManager to properly compose the 6-layer architecture by loading runtime properties and composing the full prompt dynamically.

**Dependencies**: Phase 3 must be complete (Neo4j properties written)

**Scope**: Code enhancements to prakasa.py, agent_node_manager.py, and constellation.py

---

## Current State Analysis

### What Already Works ✅

**In `/agentic/agents/prakasa.py`**:
- `get_identity_prakasa()`: Three-tier check (cache → stored → generate)
- `generate_identity_prakasa()`: Queries root + subsystem + capabilities
- `engage_workflow_prakasa()`: Loads f_workflow_* properties
- `_filter_subsystem_framings()`: Filters root properties by subsystem name

**In `/agentic/agents/agent_node_manager.py`**:
- `get_agent_capabilities()`: Loads all f_* properties (excluding f_system_prompt, f_workflow_prompts)
- `get_agent_prompt()`: NEW - added in Phase 1, loads f_agent_prompt

### What Needs Enhancement ❌

**Missing Methods**:
1. `get_ql_foundation()` - Load Layer 1a from #1-4.f_agent_prompt
2. `get_system_prompt()` - Load Layer 1c from #5-4.f_system_prompt
3. `get_capability_prompts()` - Load and GROUP f_*_capability_* properties by domain
4. `compose_full_prakasa()` - Compose complete 6-layer prompt dynamically

**Current `generate_identity_prakasa()` Issues**:
- Composes into single blob for f_system_prompt storage
- Doesn't use NEW f_agent_prompt properties
- Doesn't separate QL foundation (Layer 1a)
- Doesn't use orchestrator system prompt (Layer 1c)
- Mixes concerns that should be separate layers

---

## 6-Layer Architecture (Review)

### Layer 1: Universal Foundation (cached)
- **1a**: QL Foundation (`#1-4.f_agent_prompt`)
- **1b**: Project Context (`# root` full node - runtime fetch)
- **1c**: System Prompt (`#5-4.f_system_prompt`)
- **1d**: Agent Identity (`#5-4.f_agent_prompt` or `#5-4.5.f_agent_prompt`)
- **1e**: Agent Capabilities (`f_*_capability_*` - runtime fetch)

### Layer 2: Workflow Engagement (optional)
- `f_workflow_*` properties

### Layer 3: Runtime Context (fresh per message)
- Subsystem perspective (`{subsystem}_*` on # root)
- Message context

---

## New Methods to Add

### Method 1: get_ql_foundation()

**File**: `/agentic/agents/prakasa.py`

**Purpose**: Load QL cognitive architecture from #1-4.f_agent_prompt (Layer 1a)

**Implementation**:
```python
async def get_ql_foundation(self) -> str:
    """
    Load QL Foundation (Layer 1a) from #1-4.f_agent_prompt.

    This is universal for all agents and handles ALL implicit operational guidance.

    Returns:
        QL cognitive architecture prompt string
    """
    try:
        result = await self.bimba_client.get_node_details_complete(
            "#1-4",
            include_functional_properties=True
        )

        if not result or result.get("success") is False:
            logger.warning("Failed to load QL foundation from #1-4")
            return ""

        props = result.get("allProperties", {})
        ql_prompt = props.get("f_agent_prompt", "")

        if ql_prompt:
            logger.debug(f"Loaded QL foundation ({len(ql_prompt)} chars)")
            return ql_prompt
        else:
            logger.warning("No f_agent_prompt found on #1-4 node")
            return ""

    except Exception as e:
        logger.error(f"Error loading QL foundation: {e}")
        return ""
```

**Cache Strategy**: Cache separately with key `"ql_foundation"` (rarely changes)

---

### Method 2: get_system_prompt()

**File**: `/agentic/agents/prakasa.py`

**Purpose**: Load orchestrator system prompt from #5-4.f_system_prompt (Layer 1c)

**Implementation**:
```python
async def get_system_prompt(self) -> str:
    """
    Load Orchestrator System Prompt (Layer 1c) from #5-4.f_system_prompt.

    This is agent-agnostic operational grounding for ALL agents.

    Returns:
        System prompt string (CAG paradigm, three-namespace architecture, etc.)
    """
    try:
        result = await self.bimba_client.get_node_details_complete(
            "#5-4",
            include_functional_properties=True
        )

        if not result or result.get("success") is False:
            logger.warning("Failed to load system prompt from #5-4")
            return ""

        props = result.get("allProperties", {})
        system_prompt = props.get("f_system_prompt", "")

        if system_prompt:
            logger.debug(f"Loaded system prompt ({len(system_prompt)} chars)")
            return system_prompt
        else:
            logger.warning("No f_system_prompt found on #5-4 node")
            return ""

    except Exception as e:
        logger.error(f"Error loading system prompt: {e}")
        return ""
```

**Cache Strategy**: Cache separately with key `"system_prompt"` (rarely changes)

---

### Method 3: get_capability_prompts()

**File**: `/agentic/agents/prakasa.py`

**Purpose**: Load and GROUP f_*_capability_* properties by domain (Layer 1e)

**Implementation**:
```python
async def get_capability_prompts(self, agent_coordinate: str) -> Dict[str, List[str]]:
    """
    Load and group f_*_capability_* properties by domain (Layer 1e).

    Pattern: f_{domain}_capability_{specific}
    Example: f_etymology_capability_scent_following → domain="etymology"

    Args:
        agent_coordinate: Agent coordinate (e.g., "#5-4.5")

    Returns:
        Dict mapping capability domains to lists of capability prompts
        Example: {"etymology": ["scent_following prompt", "paradox_holding prompt"]}
    """
    try:
        # Get all f_* properties via agent_node_manager
        caps = await self.agent_nodes.get_agent_capabilities(agent_coordinate)

        grouped = {}
        for key, value in caps.items():
            # Only process f_*_capability_* pattern
            if "_capability_" in key:
                # Extract domain: f_{domain}_capability_{specific}
                parts = key.split("_capability_")
                if len(parts) == 2:
                    domain = parts[0].replace("f_", "")  # Remove f_ prefix
                    if domain not in grouped:
                        grouped[domain] = []
                    grouped[domain].append({
                        "name": parts[1],  # specific capability name
                        "content": value
                    })

        if grouped:
            logger.debug(
                f"Loaded {len(grouped)} capability domains for {agent_coordinate}: "
                f"{list(grouped.keys())}"
            )

        return grouped

    except Exception as e:
        logger.error(f"Error loading capability prompts for {agent_coordinate}: {e}")
        return {}


def _format_capabilities(self, capabilities: Dict[str, List[Dict[str, str]]]) -> str:
    """
    Format capability prompts for insertion into Layer 1e.

    Args:
        capabilities: Grouped capabilities from get_capability_prompts()

    Returns:
        Formatted string for prompt composition
    """
    if not capabilities:
        return ""

    lines = []
    for domain, cap_list in capabilities.items():
        lines.append(f"## {domain.title()} Capabilities\n")
        for cap in cap_list:
            lines.append(f"**{cap['name']}**: {cap['content']}\n")

    return "\n".join(lines)
```

---

### Method 4: compose_full_prakasa()

**File**: `/agentic/agents/prakasa.py`

**Purpose**: Compose complete 6-layer Prakāśa dynamically

**Implementation**:
```python
async def compose_full_prakasa(
    self,
    agent_coordinate: str,
    workflow_name: Optional[str] = None,
    message_context: Optional[str] = None,
    **workflow_params
) -> str:
    """
    Compose complete Prakāśa with 3-layer architecture.

    Layer 1: Universal Identity (QL + Project + System + Agent + Capabilities)
    Layer 2: Workflow (if workflow_name provided)
    Layer 3: Runtime Context (Subsystem Perspective + Message)

    Args:
        agent_coordinate: Agent coordinate (e.g., "#5-4.5")
        workflow_name: Optional workflow to engage (Layer 2)
        message_context: Optional user message for Layer 3
        **workflow_params: Optional workflow parameters

    Returns:
        Complete composed Prakāśa prompt
    """
    layers = []
    subsystem = self._extract_subsystem(agent_coordinate)
    subsystem_name = SUBSYSTEM_NAMES.get(subsystem)

    # ========== LAYER 1: UNIVERSAL FOUNDATION ==========

    # Layer 1a: QL Foundation
    ql_foundation = await self.get_ql_foundation()
    if ql_foundation:
        layers.append(f"# Layer 1a: QL Foundation\n\n{ql_foundation}")

    # Layer 1b: General Project Context (full # root node)
    root_data = await self.bimba_client.get_node_by_coordinate_extended("#")
    if root_data and root_data.get("success") is not False:
        root_props = root_data.get("allProperties", {})
        # Format full project context (NOT filtered by subsystem)
        project_context = self._format_project_context(root_props)
        if project_context:
            layers.append(f"# Layer 1b: Project Context\n\n{project_context}")

    # Layer 1c: Orchestrator System Prompt
    system_prompt = await self.get_system_prompt()
    if system_prompt:
        layers.append(f"# Layer 1c: System Prompt\n\n{system_prompt}")

    # Layer 1d: Agent Identity
    agent_prompt = await self.agent_nodes.get_agent_prompt(agent_coordinate)
    if agent_prompt:
        layers.append(f"# Layer 1d: Agent Identity\n\n{agent_prompt}")

    # Layer 1e: Agent Capabilities
    capabilities = await self.get_capability_prompts(agent_coordinate)
    if capabilities:
        cap_text = self._format_capabilities(capabilities)
        layers.append(f"# Layer 1e: Operational Capabilities\n\n{cap_text}")

    # ========== LAYER 2: WORKFLOW ENGAGEMENT ==========

    if workflow_name:
        workflow_prompt = await self.engage_workflow_prakasa(
            agent_coordinate, workflow_name, **workflow_params
        )
        if workflow_prompt:
            layers.append(f"# Layer 2: Workflow - {workflow_name}\n\n{workflow_prompt}")

    # ========== LAYER 3: RUNTIME CONTEXT ==========

    # Layer 3a: Subsystem Perspective (filtered root properties)
    if root_data and root_data.get("success") is not False:
        root_props = root_data.get("allProperties", {})
        subsystem_framing = self._filter_subsystem_framings(root_props, subsystem_name)
        if subsystem_framing:
            framing_text = self._format_subsystem_framing(subsystem_framing)
            layers.append(f"# Layer 3a: {subsystem_name.title()} Perspective\n\n{framing_text}")

    # Layer 3b: Message Context
    if message_context:
        layers.append(f"# Layer 3b: Current Request\n\n{message_context}")

    # Compose all layers
    full_prakasa = "\n\n---\n\n".join(layers)

    logger.info(
        f"Composed full Prakāśa for {agent_coordinate}: "
        f"{len(layers)} layers, {len(full_prakasa)} chars"
    )

    return full_prakasa


def _format_project_context(self, root_props: Dict[str, Any]) -> str:
    """
    Format # root properties as project context (Layer 1b).

    Include key properties like name, description, core concepts, internal structure.
    Exclude subsystem-specific properties (those go in Layer 3a).

    Args:
        root_props: All properties from # root node

    Returns:
        Formatted project context string
    """
    lines = []

    # Include general project properties only
    general_keys = [
        "name", "description", "primaryDesignation", "coreNature",
        "architecturalFunction", "operationalEssence", "internalStructure"
    ]

    for key in general_keys:
        if key in root_props and root_props[key]:
            value = root_props[key]
            # Truncate long values
            if isinstance(value, str) and len(value) > 500:
                value = value[:497] + "..."
            lines.append(f"**{key}**: {value}\n")

    return "\n".join(lines)


def _format_subsystem_framing(self, framing_props: Dict[str, str]) -> str:
    """
    Format subsystem-specific framing properties (Layer 3a).

    Args:
        framing_props: Filtered {subsystem}_* properties from # root

    Returns:
        Formatted subsystem perspective string
    """
    lines = []

    for key, value in framing_props.items():
        # Remove subsystem prefix for cleaner display
        # e.g., "epii_philosophical_foundation" → "Philosophical Foundation"
        display_key = key.split("_", 1)[1].replace("_", " ").title()

        # Truncate long values
        if isinstance(value, str) and len(value) > 500:
            value = value[:497] + "..."

        lines.append(f"**{display_key}**: {value}\n")

    return "\n".join(lines)
```

---

## Constellation.py Integration

**File**: `/agentic/agents/constellation.py`

**Change**: Update agent creation to use `compose_full_prakasa()` via `@agent.instructions`

**Current Pattern** (needs update):
```python
async def create_epii_agent(model: str, ...):
    prakasa = PrakasaManager(bimba_client, redis_client)

    # OLD: Single static identity
    identity_prompt = await prakasa.get_identity_prakasa("#5-4.5")

    agent = Agent(
        model=model,
        system_prompt=identity_prompt,  # Static Layer 1 only
        ...
    )
```

**NEW Pattern** (Phase 4):
```python
async def create_epii_agent(model: str, ...):
    prakasa = PrakasaManager(bimba_client, redis_client)

    # Layer 1 only (cached, static)
    # Compose: 1a (QL) + 1b (Project) + 1c (System) + 1d (Agent) + 1e (Capabilities)
    identity_layers = await prakasa.compose_identity_layers("#5-4.5")

    agent = Agent(
        model=model,
        system_prompt=identity_layers,  # Layers 1a-1e
        ...
    )

    # Layer 2 + 3: Dynamic per message via @agent.instructions
    @agent.instructions
    async def load_workflow_and_context(ctx: RunContext[OrchestratorDeps]) -> str:
        """Load Layer 2 (workflow) and Layer 3 (runtime context) dynamically."""

        # Extract workflow if present in context
        workflow_name = ctx.deps.context_package.get("workflow_name") if ctx.deps.context_package else None

        # Build message context
        message_context = f"User: {ctx.user_message}" if hasattr(ctx, 'user_message') else ""

        # Get subsystem perspective (Layer 3a)
        subsystem_perspective = await prakasa.get_subsystem_perspective("#5-4.5")

        layers = []

        # Layer 2: Workflow (if engaged)
        if workflow_name:
            workflow_prompt = await prakasa.engage_workflow_prakasa(
                "#5-4.5", workflow_name
            )
            if workflow_prompt:
                layers.append(f"# Layer 2: Workflow - {workflow_name}\n\n{workflow_prompt}")

        # Layer 3a: Subsystem Perspective
        if subsystem_perspective:
            layers.append(f"# Layer 3a: Epii Perspective\n\n{subsystem_perspective}")

        # Layer 3b: Message Context
        if message_context:
            layers.append(f"# Layer 3b: Current Request\n\n{message_context}")

        return "\n\n---\n\n".join(layers)

    return agent
```

**Helper Method to Add**:
```python
async def compose_identity_layers(self, agent_coordinate: str) -> str:
    """
    Compose Layer 1 only (1a-1e) for static system_prompt.

    This is cached and doesn't change per message.
    Layers 2-3 load dynamically via @agent.instructions.

    Args:
        agent_coordinate: Agent coordinate

    Returns:
        Composed Layer 1 (1a + 1b + 1c + 1d + 1e)
    """
    layers = []

    # Layer 1a: QL Foundation
    ql = await self.get_ql_foundation()
    if ql:
        layers.append(f"# Layer 1a: QL Foundation\n\n{ql}")

    # Layer 1b: Project Context
    root_data = await self.bimba_client.get_node_by_coordinate_extended("#")
    if root_data and root_data.get("success") is not False:
        project_ctx = self._format_project_context(root_data.get("allProperties", {}))
        if project_ctx:
            layers.append(f"# Layer 1b: Project Context\n\n{project_ctx}")

    # Layer 1c: System Prompt
    system = await self.get_system_prompt()
    if system:
        layers.append(f"# Layer 1c: System Prompt\n\n{system}")

    # Layer 1d: Agent Identity
    agent_id = await self.agent_nodes.get_agent_prompt(agent_coordinate)
    if agent_id:
        layers.append(f"# Layer 1d: Agent Identity\n\n{agent_id}")

    # Layer 1e: Capabilities
    caps = await self.get_capability_prompts(agent_coordinate)
    if caps:
        cap_text = self._format_capabilities(caps)
        layers.append(f"# Layer 1e: Operational Capabilities\n\n{cap_text}")

    return "\n\n---\n\n".join(layers)


async def get_subsystem_perspective(self, agent_coordinate: str) -> str:
    """
    Get subsystem perspective (Layer 3a) - filtered {subsystem}_* properties.

    Args:
        agent_coordinate: Agent coordinate

    Returns:
        Formatted subsystem perspective string
    """
    subsystem = self._extract_subsystem(agent_coordinate)
    subsystem_name = SUBSYSTEM_NAMES.get(subsystem)

    root_data = await self.bimba_client.get_node_by_coordinate_extended("#")
    if not root_data or root_data.get("success") is False:
        return ""

    root_props = root_data.get("allProperties", {})
    framing = self._filter_subsystem_framings(root_props, subsystem_name)

    if framing:
        return self._format_subsystem_framing(framing)

    return ""
```

---

## Implementation Sequence

### Step 1: Add New Methods to PrakasaManager
- `get_ql_foundation()`
- `get_system_prompt()`
- `get_capability_prompts()`
- `compose_identity_layers()`
- `get_subsystem_perspective()`
- `_format_project_context()`
- `_format_subsystem_framing()`

### Step 2: Update Constellation.py
- Modify `create_epii_agent()` to use `compose_identity_layers()`
- Add `@agent.instructions` for Layer 2+3 dynamic loading
- Repeat for other agents (orchestrator, etc.)

### Step 3: Deprecate Old Methods
- Mark `generate_identity_prakasa()` as deprecated
- Keep for backward compatibility but log warnings
- Update docstrings to point to new methods

### Step 4: Test
- Create agent and verify Layer 1 composition
- Send message and verify Layer 2+3 dynamic loading
- Test workflow engagement
- Verify capabilities grouping

---

## Testing Strategy

### Test 1: Layer 1 Composition
```python
prakasa = PrakasaManager(bimba_client, redis_client)
identity = await prakasa.compose_identity_layers("#5-4.5")

# Verify contains all 5 sublayers
assert "# Layer 1a: QL Foundation" in identity
assert "# Layer 1b: Project Context" in identity
assert "# Layer 1c: System Prompt" in identity
assert "# Layer 1d: Agent Identity" in identity
assert "# Layer 1e: Operational Capabilities" in identity
```

### Test 2: Capability Grouping
```python
caps = await prakasa.get_capability_prompts("#5-4.5")

# Verify grouping by domain
assert "etymology" in caps
assert isinstance(caps["etymology"], list)
```

### Test 3: Dynamic Layer Loading
```python
# Send message to agent
response = await agent.run(
    "What is the etymology of 'scent'?",
    deps=deps
)

# Verify workflow NOT loaded (no workflow_name in context)
# Verify subsystem perspective loaded
# Verify message context loaded
```

### Test 4: Workflow Engagement
```python
# Set workflow in context
deps.context_package["workflow_name"] = "etymology_archaeology"

response = await agent.run(
    "Trace SIGN family",
    deps=deps
)

# Verify Layer 2 workflow loaded
# Verify scent-following method in context
```

---

## Success Criteria

- ✅ Layer 1 composition works (5 sublayers)
- ✅ Capabilities grouped by domain correctly
- ✅ Dynamic Layer 2+3 loading works via @agent.instructions
- ✅ Workflow engagement loads correct f_workflow_* property
- ✅ No redundancy between layers
- ✅ Agent responses show proper synthesis
- ✅ Token usage optimized (dynamic loading vs static dump)

---

## Next Actions

1. **Complete Phase 3** (write Neo4j properties)
2. **Implement Phase 4 methods** (add to prakasa.py)
3. **Update constellation.py** (use new composition pattern)
4. **Test thoroughly** (unit + integration tests)
5. **Document final architecture** (update main docs)
