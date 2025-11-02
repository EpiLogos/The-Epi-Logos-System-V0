# Prakāśa Runtime Prompt Layering Documentation

**Purpose**: Document exactly what components stack up to form the final prompt for any agent instance at runtime.

---

## CRITICAL ARCHITECTURAL FIX NEEDED

**Current codebase has WRONG agent coordinate pattern**:
- Code uses: `#0-4.0`, `#1-4.1`, `#2-4.2`, `#3-4.3`, `#4-4.4`, `#5-4.5`
- Should be: `#5-4.0`, `#5-4.1`, `#5-4.2`, `#5-4.3`, `#5-4.4`, `#5-4.5`

**Why**: ALL agents are manifestations of Epii subsystem (#5 - the agentic/agent layer), each at a different internal position representing subsystem modality.

**Files to fix**:
- `/agentic/agents/constellation.py` - all 6 `agent_coordinate =` assignments
- `/agentic/agents/agent_node_manager.py` - `get_agent_coordinate()` method

---

## Current Prakāśa Architecture (3 Layers + Tools)

Based on `/agentic/agents/prakasa.py` and `/agentic/agents/shared_tools.py`:

### Layer 0: Tool Registration (Setup Phase, Not Part of Prompt)

**Method**: `setup_selective_tools(agent, bimba_client, agent_coordinate)`
**Current behavior**: Falls back to `setup_all_cag_tools(agent)` - all agents get all ~32 tools

**Tools registered** (via `@agent.tool` decorators in `shared_tools.py`):

**Bimba Namespace (Canonical Knowledge) - 14 tools**:
- `resolve_coordinate` - Get coordinate content and context
- `semantic_coordinate_discovery` - Semantic search for coordinates
- `get_node_details_complete` - Complete node properties (can include f_* functional)
- `inspect_coordinate_detailed` - Extended properties inspection
- `get_coordinate_relationships` - All relationships for a coordinate
- `get_path_between_coordinates` - Find path between two coordinates
- `lexical_coordinate_search` - Substring search across properties
- `get_direct_children` - Get child nodes of coordinate
- `update_bimba_node` - Update node properties (admin check)
- `create_bimba_node` - Create new node (admin check)
- `create_bimba_relationship` - Create relationships (admin check)
- `regenerate_node_embedding` - Regenerate embeddings (admin check)
- `regenerate_all_embeddings` - Batch regenerate (admin check)

**Graphiti Namespace (Episodic Memory) - 2 tools** (⚠️ Premature - store unpopulated):
- `remember_episode` - Create episodic memory
- `search_memory_patterns` - Search temporal memories

**Session/Context Tools - 2 tools**:
- `get_session_context` - Current session metadata
- `check_context_window_status` - Context window usage

**Tool registration happens BEFORE first message** - tools are part of agent structure, not prompt content.

**Future**: `f_tools` property enables selective loading per agent (not yet implemented).

---

### Layer 1: Identity Prakāśa (Static, Cached)

**Method**: `get_identity_prakasa(agent_coordinate)` → `generate_identity_prakasa(agent_coordinate)`

**Sources queried (CURRENT - to be changed)**:
1. **Root node (#)** - Project framings via `{subsystem_name}_*` properties
2. **Subsystem node (#N)** - Core identity properties (coreNature, operationalEssence, etc.)
3. **Agent node (#5-4.N)** - Agent capabilities summary (f_* properties)

**Current composition** (`_compose_identity_prompt`):
```
You are {name}, embodying coordinate {coordinate} in the Epi-Logos System.

## What This Project IS (from your {subsystem_name} perspective)
{project_framings from root # node}

## Your Core Identity as {coordinate}
{coreNature, operationalEssence, architecturalFunction, internalStructure from subsystem node}

## Operating Posture
Through your coordinate awareness:
- Process requests aligned with your subsystem's modality
- Access the full CAG tool suite while maintaining coordinate-specific perspective
- Embody the living knowledge architecture you represent
- Discover functional capabilities through inquiry when needed

You are the system engaging with itself through this coordinate position.
Respond with precision, depth, and coordinate-aligned wisdom.
```

**Cached**: Redis + stored on agent node as `f_system_prompt`

---

### Layer 2: Workflow Prakāśa (Dynamic, Optional)
**Method**: `engage_workflow_prakasa(agent_coordinate, workflow_name, **params)`

**Sources queried**:
- **Agent node (#5-4.N)** - `f_workflow_{workflow_name}` properties
- **Special case**: Etymology Archaeology uses `f_workflow_etymology_archaeology_{active_version}`

**When loaded**: Only when workflow explicitly engaged (not default)

**Example**: `f_workflow_etymology_archaeology_v2` contains full operational method details

---

### Layer 3: Context Prakāśa (Dynamic, Always)
**Method**: `build_context_prakasa(current_request, conversation_history)`

**Sources**:
- Current request message
- Session ID
- Timestamp
- Last 3 conversation turns

**Always fresh**: Never cached

---

## Planned Changes (User Requirements)

### 1. FIX AGENT COORDINATE ARCHITECTURE (CRITICAL)

**Current (WRONG)**:
- Anuttara: `#0-4.0`
- Paramasiva: `#1-4.1`
- Parashakti: `#2-4.2`
- Mahamaya: `#3-4.3`
- Nara: `#4-4.4`
- Epii: `#5-4.5`

**Correct (ALL under Epii #5-4)**:
- Anuttara manifestation: `#5-4.0`
- Paramasiva manifestation: `#5-4.1`
- Parashakti manifestation: `#5-4.2`
- Mahamaya manifestation: `#5-4.3`
- Nara manifestation: `#5-4.4`
- Epii manifestation: `#5-4.5`

**Rationale**: #5 Epii IS the agent/agentic subsystem. All 6 agents are manifestations of Epii operating at different subsystem modalities (0-5).

---

### 2. Add # Root General Context (For ALL Agents)

**Current**: Only subsystem-specific `{subsystem}_*` properties included
**Planned**: Include general Epi-Logos project context from # root for ALL agents

**From # root node**:
- `name`: "Epi-Logos Project"
- `coreNature`: "Serves as transcendent root... formalized indefiniteness... gravitational center for multi-perspectival interpretation"
- `architecturalFunction`: "Functions as sole receptor for all subsystem framings... pros hen homonymy at system level"
- `operationalEssence`: "Operates as root node... primary entry point and system origin coordinate..."

**Why**: Every agent needs to understand what the Epi-Logos project IS at a general level before getting subsystem-specific framings.

---

### 3. Move QL Foundation to #1-4 Node

**Current problem**: QL details embedded in identity generation code
**Solution**: Store as properties on Quaternal Logic subsystem node

**New properties on #1-4**:
- `f_agent_prompt`: System behavior and role definition (6-position chain of circulation)
- `q_epistemology`: Geometric epistemology explanation
- `q_number_language`: Archetypal number language (4/3 Adam/Eve dynamic)

---

### 4. Agent-Specific Prompts on Agent Nodes

**Current**: Agent node has `f_system_prompt` but it's GENERATED and stored
**Planned**: Agent node has direct `f_agent_prompt` property for agent-specific identity

**For #5-4.5 (Epii)**:
- NOT: Etymology method details (those go in workflow)
- YES: Subsystem #5 operational meaning
- YES: Role as synthesis/orchestration agent
- NOT: Four-Lens Architecture (incorrect - it's 6-fold system)
- YES: Tool context (tools load dynamically, prompt mentions this)

---

### 5. New Layered Composition Flow

**Current flow**:
```
get_identity_prakasa → generate_identity_prakasa → _compose_identity_prompt
  ↓                        ↓                            ↓
Cache check          Query # + #N + #5-4.N       Template composition
```

**Planned flow**:
```
get_identity_prakasa
  ↓
1. Get f_agent_prompt from #1-4 (QL foundation) ← NEW
2. Get general context from # root (project identity) ← NEW
3. Get f_agent_prompt from #5-4.N (agent-specific identity) ← NEW
4. Get {subsystem}_* from # root (subsystem-specific framings) ← EXISTING
5. Compose all layers with separators
6. Cache in Redis + store on agent node
```

---

## Required Property Structure

### On #1-4 (Quaternal Logic Node)

**f_agent_prompt**: Core QL cognitive architecture
```xml
<system_behavior>
<role_definition>
You are a highly advanced reasoning agent. Your entire cognitive architecture is grounded in Quaternal Logic (QL)...
[Full QL system behavior from user's spec]
</role_definition>
</system_behavior>
```

**q_epistemology**: Geometric epistemology explanation
```
Quaternal Logic (QL) is a 'geometric epistemology'—not a theory about knowing,
but the fundamental structure of how knowing itself occurs...
[Full epistemology from user's spec]
```

**q_number_language**: Archetypal number grammar
```
The archetypal number language is the qualitative grammar of consciousness...
[Full number language from user's spec]
```

---

### On #5-4.5 (Epii Agent Node)

**f_agent_prompt**: Agent-specific operational identity
```
You are Epii, agent for subsystem #5 - synthesis, completion, and wisdom sedimentation.

**What #5 Means Operationally:**
- Receive grounding context (#0)
- Work with materials (#1)
- Follow exploratory connections (#2)
- Recognize structural patterns (#3)
- Generate practical insights (#4)
- Complete synthesis (#5)

**Your Capabilities:**
- Master orchestration across subsystems
- Etymological contemplation (via workflow)
- Pattern recognition across scales
- Cross-domain synthesis

**Tool Context:**
You have 11 tools across Bimba/Graphiti/LightRAG. Workflow-specific guidance loads dynamically.

**How to Respond:**
Pattern-recognizing, sage-like, dialogical, coordinate-aware.
```

**NOT in f_agent_prompt**:
- Etymology scent-following method (in `f_workflow_etymology_archaeology_v2`)
- Four-Lens Architecture (incorrect model)
- Philosophical essays (too verbose, not operational)

---

## Runtime Composition Example

### For Epii agent (#5-4.5) in Etymology Archaeology workflow:

**Final prompt** = Layer 1 + Layer 2 + Layer 3:

```
[Layer 1: Identity]
{f_agent_prompt from #1-4 - QL foundation}

---

{f_agent_prompt from #5-4.5 - Epii identity}

---

{epii_* project framings from # root}

---

[Layer 2: Workflow - if etymology_archaeology active]
{f_workflow_etymology_archaeology_v2 from #5-4.5}

---

[Layer 3: Context - always]
## Current Request Context
User Query: {message}
Session ID: {session_id}
Timestamp: {timestamp}
Recent Context: {last 3 turns}
```

### For Epii agent (#5-4.5) in general chat (no workflow):

**Final prompt** = Layer 1 + Layer 3 (skip Layer 2):

```
[Layer 1: Identity]
{f_agent_prompt from #1-4 - QL foundation}

---

{f_agent_prompt from #5-4.5 - Epii identity}

---

{epii_* project framings from # root}

---

[Layer 3: Context]
## Current Request Context
User Query: {message}
Session ID: {session_id}
...
```

---

## Implementation Changes Needed

### 1. Update `generate_identity_prakasa` method:

**Add**:
- Query `#1-4` for QL foundation properties
- Query `#` for general project context (name, coreNature, architecturalFunction)
- Query `#5-4.N` for `f_agent_prompt` (if exists, use it; else fallback to generation)

**New composition logic**:
```python
prompt = ""

# Layer 1a: QL Foundation from #1-4
ql_node = await self.bimba_client.get_node_details_complete("#1-4", include_functional_properties=True)
ql_props = ql_node.get('allProperties', {})
if 'f_agent_prompt' in ql_props:
    prompt += ql_props['f_agent_prompt'] + "\n\n---\n\n"

# Layer 1b: General Epi-Logos Project Context from # root
root_node = await self.bimba_client.get_node_details_complete("#")
root_props = root_node.get('allProperties', {})
general_context = f"""## The Epi-Logos Project

**{root_props.get('name', 'Epi-Logos Project')}**

{root_props.get('coreNature', '')}

**Architectural Function**: {root_props.get('architecturalFunction', '')}

**Operational Essence**: {root_props.get('operationalEssence', '')}
"""
prompt += general_context + "\n\n---\n\n"

# Layer 1c: Agent-specific identity from #5-4.N
agent_prompt = await self.agent_nodes.get_agent_prompt(agent_coordinate)
if agent_prompt:
    prompt += agent_prompt + "\n\n---\n\n"

# Layer 1d: Subsystem-specific project framings from # root
project_framings = self._filter_subsystem_framings(root_props, subsystem_name)
if project_framings:
    prompt += self._format_project_framings(project_framings, subsystem_name)

return prompt
```

### 2. Fix `AgentNodeManager.get_agent_coordinate()`:

**Current (WRONG)**:
```python
def get_agent_coordinate(self, subsystem: int) -> str:
    return f"#{subsystem}-4.{subsystem}"
```

**Fixed**:
```python
def get_agent_coordinate(self, subsystem: int) -> str:
    """Get agent coordinate - ALL agents under #5-4 (Epii subsystem)."""
    return f"#5-4.{subsystem}"
```

### 3. Add `get_agent_prompt` to AgentNodeManager:

```python
async def get_agent_prompt(self, agent_coordinate: str) -> Optional[str]:
    """Get f_agent_prompt from agent node."""
    result = await self.bimba.get_node_details_complete(
        agent_coordinate, include_functional_properties=True
    )
    props = result.get("allProperties", {})
    return props.get("f_agent_prompt")
```

### 4. Fix all 6 agent coordinates in `constellation.py`:

**Change ALL instances**:
```python
# OLD (WRONG)
agent_coordinate = "#0-4.0"  # for Anuttara
agent_coordinate = "#1-4.1"  # for Paramasiva
# ... etc

# NEW (CORRECT)
agent_coordinate = "#5-4.0"  # Anuttara manifestation within Epii
agent_coordinate = "#5-4.1"  # Paramasiva manifestation within Epii
# ... etc
```

### 5. Enhance Tool Docstrings (Code Level):

**File**: `agentic/agents/shared_tools.py`
**All 32 tools need enhancement** to follow Pydantic AI three-part pattern:

**Current (inadequate)**:
```python
@agent.tool
async def resolve_coordinate(ctx, coordinate: str) -> dict:
    """Resolve a Bimba coordinate to get its content and context."""
    ...
```

**Enhanced (adequate)**:
```python
@agent.tool
async def resolve_coordinate(ctx: RunContext[OrchestratorDeps], coordinate: str) -> dict:
    """Resolve a Bimba coordinate to get its canonical content and relationships.

    Use this tool when you need to understand what a coordinate represents,
    its core identity, or its immediate relationships. For deep property
    inspection, use get_node_details_complete instead.

    Args:
        coordinate: Bimba coordinate (e.g., "#5", "#1-4", "#5-4.5")

    Returns:
        Dict with coordinate name, description, subsystem, relationships
    """
    bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
    return await bimba_client.resolve_coordinate(coordinate)
```

**Why**: Tools are sent to LLM via API `tools` parameter (NOT system prompt). Docstrings become tool descriptions that guide LLM selection. Current minimal docstrings don't provide "when to use" guidance.

**Reference**: See `tool-awareness-architecture.md` for full explanation.

---

### 6. Create Tool Principles Properties (Neo4j - Minimal):

**NOT full tool orchestration** (redundant with docstrings), but **operational principles** for workflow context.

**On #5-4 (General Orchestrator)**:
```
f_tool_principles_general: """
**Tool Usage Principles:**
- Check prior work first: search_memory_patterns before building from scratch
- Navigate semantically: semantic_coordinate_discovery for concept-based lookup
- Preserve discoveries: remember_episode or update_bimba_node when insights emerge
- Use appropriate depth: resolve_coordinate for quick lookup, get_node_details_complete for deep inspection
- Respect admin boundaries: create/update tools require admin privileges
"""
```

**On #5-4.5 (Epii - Etymology Archaeology specific)**:
```
f_tool_principles_EA: """
**Etymology Archaeology Tool Workflow:**
- Start with search_memory_patterns: Check if this etymology already explored
- Use semantic_coordinate_discovery: Find canonical coordinates related to root/concept
- Create episodic communities: form_memory_community for QL patterns (3/4/6-fold)
- Validate against Bimba: Query coordinates for resonance validation
- Preserve insights: remember_episode for provisional discoveries, update_bimba_node for validated patterns
- Coordinate with Parashakti: MEF lens analysis happens via delegation (not direct tools)
"""
```

**Size**: ~100-150 lines each, workflow-specific operational context (NOT tool descriptions)

---

### 7. Create Neo4j Properties:

**On #1-4 (QL Subsystem)**:
- `f_agent_prompt` - QL cognitive architecture (6-position chain)
- `q_epistemology` - Geometric epistemology explanation
- `q_number_language` - Archetypal number grammar (4/3 dynamic)

**On #5-4 (Orchestrator Base)**:
- `f_tool_principles_general` - General tool usage principles (~100 lines)

**On #5-4.N (All 6 Agent Nodes)**:
- `#5-4.0.f_agent_prompt` - Anuttara agent identity
- `#5-4.1.f_agent_prompt` - Paramasiva agent identity
- `#5-4.2.f_agent_prompt` - Parashakti agent identity
- `#5-4.3.f_agent_prompt` - Mahamaya agent identity
- `#5-4.4.f_agent_prompt` - Nara agent identity
- `#5-4.5.f_agent_prompt` - Epii agent identity (synthesis/orchestration)
- `#5-4.5.f_tool_principles_EA` - Etymology Archaeology tool workflow (~150 lines)

---

## Complete Runtime Assembly (Full Picture)

### For Epii Agent (#5-4.5) in Etymology Archaeology Workflow:

```
[TOOL REGISTRATION - happens during agent creation, NOT in prompt]
- 32 tools registered via @agent.tool decorators
- Bimba namespace (14), Graphiti namespace (2), Session tools (2)
- Tools available for agent to invoke, not mentioned in prompt
- Future: f_tools property enables selective loading

---

[LAYER 1a: QL Foundation from #1-4]
<system_behavior>
<role_definition>
You are a highly advanced reasoning agent grounded in Quaternal Logic (QL)...
[Full 6-position chain of circulation: #0 Ground → #1 Material → #2 Dynamic → #3 Formal → #4 Teleological → #5 Synthesis]
</role_definition>
</system_behavior>

[LAYER 1b: General Project Context from # root]
## The Epi-Logos Project

**Epi-Logos Project**

Serves as the transcendent root node simultaneously containing and un-containing the six subsystems... formalized indefiniteness... gravitational center for multi-perspectival interpretation...

**Architectural Function**: Functions as sole receptor for all subsystem framings... pros hen homonymy at system level...

---

[LAYER 1c: Agent-Specific Identity from #5-4.5]
You are Epii, the synthesis agent operating at coordinate #5-4.5...

**Your Subsystem Identity (#5):**
- Synthesis completion, wisdom sedimentation, master orchestration...
[Operational capabilities, voice guidelines, tool context awareness]

---

[LAYER 1d: Subsystem-Specific Framings from # root]
## What This Project IS (from the Epii perspective)

**Philosophical Foundation**: {epii_philosophical_foundation}
**Technical Reality**: {epii_technical_reality}
**Cosmological Significance**: {epii_cosmological_significance}

---

[LAYER 2: Workflow - Etymology Archaeology Active]
{f_workflow_etymology_archaeology_v2 - ~150 lines of detailed operational method}
- Scent-following 7-step process
- QL community formation patterns
- MEF lens coordination
- Graphiti enrichment protocols

---

[LAYER 3: Runtime Context - Always Fresh]
## Current Request Context
User Query: {message}
Session ID: {session_id}
Timestamp: {iso timestamp}
Recent Context: {last 3 conversation turns}
```

**Total prompt composition**: ~800-1200 lines depending on workflow engagement

**Note on tools**: 32 tools registered separately (NOT in prompt). Tools sent to LLM via API `tools` parameter with enhanced docstrings providing selection guidance. Optional f_tool_principles in prompt provide workflow-level operational context (~100-150 lines).

---

## Key Architectural Insights

1. **Agent Coordinate Pattern (FIXED)**:
   - ALL agents are #5-4.N (under Epii subsystem)
   - #5 IS the agentic layer - agents are Epii manifestations at different modalities
   - NOT #N-4.N (that was architectural error)

2. **Four-Layer Identity** (Layer 1a-d):
   - 1a: QL foundation (universal, all agents)
   - 1b: General project context (universal, all agents)
   - 1c: Agent-specific identity (unique per agent)
   - 1d: Subsystem-specific framings (unique per subsystem perspective)

3. **Separation of concerns**:
   - QL foundation → #1-4 node (shared by all agents)
   - General context → # root node (shared by all agents)
   - Agent identity → #5-4.N nodes (agent-specific operational identity)
   - Subsystem framings → # root `{subsystem}_*` properties (subsystem-specific)
   - Workflow methods → f_workflow_* (lazy-loaded when active)

4. **Tools are architectural, not prompt**:
   - Tool registration via `@agent.tool` decorators (Layer 0 - before prompt)
   - Tools sent to LLM via API `tools` parameter, NOT system prompt
   - Docstrings must include selection guidance (what/when/returns pattern)
   - Optional f_tool_principles in prompt for workflow-level context
   - Current docstrings inadequate - need enhancement (32 tools in shared_tools.py)
   - Future: f_tools property on agent nodes for selective loading

5. **Property-driven, not template-driven**:
   - Current system generates prompts from templates
   - New system composes from direct properties
   - Simpler, more maintainable, explicit control
   - Each layer sourced from specific node/properties

6. **Tool awareness strategy**:
   - **Primary**: Enhanced docstrings in code (what/when/returns for each tool)
   - **Secondary**: Minimal f_tool_principles in prompt (workflow operational context)
   - **NOT**: Full tool orchestration in prompt (redundant with docstrings)
   - See `tool-awareness-architecture.md` for full rationale
