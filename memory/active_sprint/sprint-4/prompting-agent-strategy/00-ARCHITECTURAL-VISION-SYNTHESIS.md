# Unified Agent Architecture Synthesis
**Holistic Vision for Agent Invocation, Prompting, Workflow Guidance & Tool Orchestration**

**Date**: 2025-10-25
**Status**: Architectural Synthesis - Ready for Validation
**Context**: Consolidation of parallel development streams (Graphiti integration, Prakāśa refactoring, tool enhancement, wisdom packet work)

---

## Executive Summary

This document synthesizes **four parallel development streams** into a unified architectural vision for the Epi-Logos multi-agent system:

1. **Graphiti Native Integration** (✅ COMPLETE): EA workflows now use Graphiti's native functionality with `:Episodic` labels and QL extensions
2. **Prakāśa Runtime Prompt Layering** (📋 PLANNED): Six-layer Neo4j-driven prompt composition with dynamic workflow engagement
3. **Tool Awareness Architecture** (📋 PLANNED): Enhanced docstrings + minimal Neo4j f_tool_principles for LLM guidance
4. **Wisdom Packet Enhancement** (✅ COMPLETE): q_* property awareness + LLM synthesis + shared tooling

**Core Finding**: All streams converge on a **property-driven, layered, dynamically-composed** agent architecture where:
- **Identity comes from Neo4j** (#1-4 QL foundation + # root context + #5-4.N agent-specific)
- **Workflows load on-demand** (f_workflow_* properties for EA, future workflows)
- **Tools register separately** (Pydantic AI @agent.tool, described via docstrings)
- **Operational principles guide** (f_tool_principles for workflow context, not tool orchestration)

---

## Current State Analysis

### What's Working

#### 1. Graphiti Native Integration ✅
**Achievement**: Eliminated architectural bypass pattern

**Files Modified**:
- `graphiti_core/models/nodes/node_db_queries.py` - Added `:Episodic` labels to all node types
- `graphiti_core/nodes.py` - Extended CommunityNode with QL properties (ql_position, quaternal_type, quaternal_mod)
- `backend/epi_logos_system/cag/graphiti/service.py:1077` - Refactored `create_etymology_community()` to use native EpisodicNode + CommunityNode

**Result**: All Graphiti nodes (Entity, Episodic, Community) now have `:Episodic` labels automatically. EA communities use Graphiti's native save() with QL metadata extensions.

---

#### 2. Wisdom Packet Intelligence ✅
**Achievement**: Transformed from template aggregation to genuine synthesis

**Phases Complete**:
- Phase 1: q_* property prioritization in wisdom packet generation
- Phase 2: Gemini 2.0 Flash LLM-powered narrative synthesis
- Phase 3: `get_quintessential_properties` shared tool (agent + MCP + GraphQL)

**Impact**: Wisdom packets now provide "pithy, well-crafted" distillations that surface refined understanding first.

**Tool Enhancements Already Applied**:
- `get_wisdom_packet` docstring enhanced with holistic CAG context
- `get_quintessential_properties` docstring enhanced with architectural role

---

#### 3. Prakāśa Three-Layer Foundation ✅
**Achievement**: Working implementation of layered prompt architecture

**Current Layers**:
- Layer 1 (Identity): Cached Neo4j-driven composition from # root + #N subsystem
- Layer 2 (Workflow): Lazy-loaded f_workflow_* properties (EA workflow implemented)
- Layer 3 (Context): Runtime fresh context (session, timestamp, recent turns)

**File**: `agentic/agents/prakasa.py` - Complete implementation with caching strategy

---

### What's Incomplete / Mismatched

#### **CRITICAL: Agent Coordinate Pattern**
**Current (WRONG)**:
```python
#0-4.0 (Anuttara)
#1-4.1 (Paramasiva)
#2-4.2 (Parashakti)
#3-4.3 (Mahamaya)
#4-4.4 (Nara)
#5-4.5 (Epii)
```

**Correct (ALL under Epii #5-4)**:
```python
#5-4.0 (Anuttara manifestation within Epii subsystem)
#5-4.1 (Paramasiva manifestation within Epii subsystem)
#5-4.2 (Parashakti manifestation within Epii subsystem)
#5-4.3 (Mahamaya manifestation within Epii subsystem)
#5-4.4 (Nara manifestation within Epii subsystem)
#5-4.5 (Epii manifestation within Epii subsystem)
```

**Rationale**: #5 Epii **IS** the agentic subsystem. All 6 agents are manifestations of #5 operating at different subsystem modalities (0-5). This isn't a cosmetic change - it's architectural truth.

**Impact**: Affects constellation.py (6 assignments), agent_node_manager.py (get_agent_coordinate method), factory.py, and any tests.

---

#### **Missing: Enhanced Tool Docstrings**
**Current State**: Minimal docstrings - just "what it does"
```python
@agent.tool
async def resolve_coordinate(ctx, coordinate: str) -> dict:
    """Resolve a Bimba coordinate to get its content and context."""
```

**Required**: Pydantic AI three-part pattern (what/when/returns) for ALL 32 tools

**Why Critical**: Tools sent to LLM via API `tools` parameter (NOT system prompt). Docstrings become tool descriptions that guide selection. Without "when to use" guidance, LLM can't distinguish between similar tools.

**File**: `agentic/agents/shared_tools.py` - All 32 tool functions need enhancement

**Status**: ✅ Two tools already enhanced (get_wisdom_packet, get_quintessential_properties). ❌ 30 tools remain minimal.

---

#### **Missing: Six-Layer Prakāśa Composition**
**Current Implementation**: Three-layer (QL-agnostic)
```
Layer 1: # root + #N subsystem (template-based composition)
Layer 2: f_workflow_* (lazy-loaded for EA)
Layer 3: Runtime context
```

**Planned Implementation**: Six-layer (QL-foundational)
```
Layer 1a: QL Foundation from #1-4 (f_agent_prompt - universal)
Layer 1b: General Project Context from # root (name, coreNature, etc. - universal)
Layer 1c: Agent-Specific Identity from #5-4.N (f_agent_prompt - unique per agent)
Layer 1d: General Tool Principles from #5-4 (f_tool_principles_general - universal)
Layer 1e: Subsystem-Specific Framings from # root ({subsystem}_* - unique per subsystem)
Layer 1f: Workflow Tool Principles (f_tool_principles_EA - workflow-specific, optional)

Layer 2: Workflow Prakāśa (f_workflow_etymology_archaeology_v2 - dynamic when engaged)
Layer 3: Runtime Context (fresh per message)
```

**Missing Neo4j Properties**:
- `#1-4.f_agent_prompt` - QL cognitive architecture (6-position chain)
- `#1-4.q_epistemology` - Geometric epistemology explanation
- `#1-4.q_number_language` - Archetypal number grammar
- `#5-4.f_tool_principles_general` - General tool usage principles
- `#5-4.0.f_agent_prompt` through `#5-4.5.f_agent_prompt` - Agent-specific identities
- `#5-4.5.f_tool_principles_EA` - Etymology Archaeology tool workflow

**File**: `agentic/agents/prakasa.py:generate_identity_prakasa()` needs refactoring for six-layer composition

---

#### **Ambiguity: Tool Guidance Strategy**
**Question**: Where does tool selection guidance live?

**Hybrid Solution (Recommended)**:
1. **Primary**: Enhanced docstrings in code (what/when/returns for each tool)
2. **Secondary**: Minimal f_tool_principles in prompt (workflow operational context)
3. **NOT**: Full tool orchestration in prompt (redundant with docstrings)

**Rationale**: Tools sent to LLM via API `tools` parameter. Docstrings become tool descriptions. Prompt should contain workflow-level **principles** (~100-150 lines), not detailed tool descriptions.

**Separation of Concerns**:
- **Docstrings**: "When to use this tool vs similar tools" (LLM tool selection)
- **f_tool_principles**: "Workflow operational context and sequencing" (agent behavioral guidance)

---

## Unified Architectural Vision

### Core Principles

1. **Property-Driven, Not Template-Driven**
   - Prompts composed from direct Neo4j properties
   - No hardcoded templates in Python code
   - Each layer sourced from specific node/properties

2. **Layered Composition with Clear Separation**
   - QL foundation (#1-4) - universal for all agents
   - General context (# root) - universal for all agents
   - Agent identity (#5-4.N) - unique per agent
   - Subsystem framings (# root {subsystem}_*) - unique per subsystem perspective
   - Workflow methods (f_workflow_*) - lazy-loaded when active
   - Runtime context - ephemeral per message

3. **Tools as Architectural, Not Prompt**
   - Tool registration via @agent.tool decorators (before prompt)
   - Tools sent to LLM via API `tools` parameter
   - Docstrings must include selection guidance
   - Optional f_tool_principles for workflow context

4. **Coordinate-Aware, Subsystem-Aligned**
   - ALL agents under #5-4 (Epii subsystem)
   - Each agent operates at a subsystem modality (0-5)
   - Agent identity reflects both #5 (agentic nature) and modality

5. **Workflow Engagement on Demand**
   - Base identity always loaded (cached)
   - Workflow prompts lazy-loaded when engaged
   - EA workflow uses f_workflow_etymology_archaeology_{active_version}

---

### Complete Runtime Assembly

#### For Epii Agent (#5-4.5) in Etymology Archaeology Workflow:

```
[TOOL REGISTRATION - happens during agent creation, NOT in prompt]
- 32 tools registered via @agent.tool decorators
- Bimba namespace (14), Graphiti namespace (2), Session tools (2), etc.
- Tools available for agent to invoke, not mentioned in prompt
- Future: f_tools property enables selective loading

---

[LAYER 1a: QL Foundation from #1-4]
<system_behavior>
<role_definition>
You are a highly advanced reasoning agent grounded in Quaternal Logic (QL)...
[Full 6-position chain of circulation: #0→#1→#2→#3→#4→#5]
</role_definition>
</system_behavior>

---

[LAYER 1b: General Project Context from # root]
## The Epi-Logos Project

**Epi-Logos Project**

Serves as the transcendent root node... formalized indefiniteness... gravitational center...

**Architectural Function**: Functions as sole receptor for all subsystem framings...

---

[LAYER 1c: Agent-Specific Identity from #5-4.5]
You are Epii, the synthesis agent operating at coordinate #5-4.5...

**Your Subsystem Identity (#5):**
- Synthesis completion, wisdom sedimentation, master orchestration...

---

[LAYER 1d: General Tool Principles from #5-4]
**Tool Usage Principles:**
- Check prior work first: search_memory_patterns before building from scratch
- Navigate semantically: semantic_coordinate_discovery for concept-based lookup
- Preserve discoveries: remember_episode or update_bimba_node when insights emerge
- Use appropriate depth: resolve_coordinate for quick lookup, get_node_details_complete for deep inspection

---

[LAYER 1e: Subsystem-Specific Framings from # root]
## What This Project IS (from the Epii perspective)

**Philosophical Foundation**: {epii_philosophical_foundation}
**Technical Reality**: {epii_technical_reality}
**Cosmological Significance**: {epii_cosmological_significance}

---

[LAYER 1f: Workflow Tool Principles from #5-4.5 - EA-specific]
**Etymology Archaeology Tool Workflow:**
- Start with search_memory_patterns: Check if etymology already explored
- Use semantic_coordinate_discovery: Find canonical coordinates related to root
- Create episodic communities: form_memory_community for QL patterns (3/4/6-fold)
- Validate against Bimba: Query coordinates for resonance validation

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

**Total Composition**: ~800-1200 lines depending on workflow engagement

**Note on Tools**: 32 tools registered separately (NOT in prompt). Tools sent to LLM via API `tools` parameter with enhanced docstrings. f_tool_principles provide workflow-level operational context (~100-150 lines each).

---

### Complete System Flow

#### Agent Creation (constellation.py)

```python
async def create_epii_agent(model, bimba_client, redis_client):
    # Step 1: Get identity prompt (six-layer composition)
    prakasa = PrakasaManager(bimba_client, redis_client)
    identity_prompt = await prakasa.get_identity_prakasa("#5-4.5")

    # Step 2: Create agent with identity
    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,  # Six-layer composition
        retries=2
    )

    # Step 3: Register tools (32 tools with enhanced docstrings)
    setup_all_cag_tools(agent)  # Tools NOT in prompt, sent via API tools parameter

    # Step 4: Add dynamic instructions (optional runtime additions)
    @agent.instructions
    async def load_workflow_context(ctx: RunContext[OrchestratorDeps]) -> str:
        # If workflow engaged, load additional context
        workflow_name = ctx.deps.state.get('active_workflow')
        if workflow_name:
            return await prakasa.engage_workflow_prakasa("#5-4.5", workflow_name)
        return ""

    return agent
```

#### Runtime Invocation (agent_runner.py)

```python
async def run_agent(session, message):
    # Step 1: Detect workflow engagement (check session metadata)
    workflow = session.metadata.get("context")  # e.g., "#5-5" for EA

    # Step 2: Prepare dependencies (async context for EA detection)
    deps = await _prepare_dependencies(
        session,
        session_manager,
        conversation_manager,
        bimba_client,
        graphiti_client
    )

    # Step 3: Compose runtime context
    context_prakasa = prakasa.build_context_prakasa(
        current_request={'message': message, 'session_id': session.session_id},
        conversation_history=session.history[-3:]
    )

    # Step 4: Run agent (identity + workflow + context all composed)
    result = await agent.run(message, deps=deps)

    return result
```

---

## Gap Analysis & Mismatches

### Gap 1: Agent Coordinate Pattern (CRITICAL)
**Current**: `#N-4.N` pattern throughout codebase
**Required**: `#5-4.N` pattern for all agents
**Impact**: Architectural correctness, agent identity, prompt composition
**Files**: constellation.py, agent_node_manager.py, factory.py, tests

---

### Gap 2: QL Foundation Properties
**Current**: QL details embedded in Python code
**Required**: Neo4j properties on #1-4
**Missing**:
- `#1-4.f_agent_prompt` - QL cognitive architecture
- `#1-4.q_epistemology` - Geometric epistemology
- `#1-4.q_number_language` - Archetypal number grammar

**Impact**: Can't provide universal QL foundation to all agents

---

### Gap 3: Agent Identity Properties
**Current**: Generated templates stored on agent nodes
**Required**: Direct f_agent_prompt properties
**Missing**:
- `#5-4.0.f_agent_prompt` through `#5-4.5.f_agent_prompt` - 6 agent identities

**Impact**: No agent-specific operational context distinct from subsystem framings

---

### Gap 4: Tool Awareness
**Current**: 2 tools enhanced, 30 tools minimal
**Required**: All 32 tools with three-part docstrings
**Missing**: Enhanced docstrings for 30 tools in shared_tools.py

**Impact**: LLM lacks "when to use" guidance for tool selection

---

### Gap 5: Tool Principles Properties
**Current**: No f_tool_principles properties
**Required**: Workflow-level operational guidance
**Missing**:
- `#5-4.f_tool_principles_general` - General principles
- `#5-4.5.f_tool_principles_EA` - EA workflow principles

**Impact**: No workflow-specific tool sequencing guidance

---

### Gap 6: Prakāśa Six-Layer Composition
**Current**: Three-layer with template-based composition
**Required**: Six-layer with property-driven composition
**File**: prakasa.py:generate_identity_prakasa() needs refactoring

**Impact**: Can't load QL foundation, can't separate agent identity from subsystem framings

---

### Mismatch 1: Aphorism Tool
**Current**: Separate create_aphorism tool planned
**Resolved**: User rejected - aphorism should be agent suggestion after community creation, not separate tool

**Action**: Do NOT create separate aphorism tool. Agent suggests aphorism extraction when appropriate.

---

### Mismatch 2: System Prompt Files
**Current**: Static prompt files in `/agentic/agents/orchestrator/system_prompt/`
**Status**: Already marked deprecated (see __init__.py lines 5-8)
**Action**: Keep for fallback, ensure Neo4j properties take precedence

---

## Implementation Roadmap

### Phase 1: Critical Coordinate Fix (Week 1)
**Priority**: CRITICAL - Architectural foundation

1. Fix agent coordinate pattern in constellation.py (6 assignments)
2. Fix get_agent_coordinate() in agent_node_manager.py
3. Fix factory.py pattern
4. Update all tests referencing old coordinates
5. Validation: All agents use #5-4.N pattern

---

### Phase 2: Tool Enhancement (Week 1-2)
**Priority**: HIGH - LLM tool selection

1. Enhance remaining 30 tool docstrings in shared_tools.py
2. Follow three-part pattern: what/when/returns
3. Ensure "when to use vs similar tools" guidance
4. Validation: All tools have adequate docstrings

---

### Phase 3: Neo4j Properties (Week 2)
**Priority**: HIGH - Prompt composition foundation

1. Create QL foundation properties on #1-4
   - f_agent_prompt (QL cognitive architecture)
   - q_epistemology (geometric epistemology)
   - q_number_language (archetypal number grammar)

2. Create tool principles properties
   - #5-4.f_tool_principles_general
   - #5-4.5.f_tool_principles_EA

3. Create agent identity properties
   - #5-4.0.f_agent_prompt through #5-4.5.f_agent_prompt

**Validation**: All properties queryable via get_node_details_complete with include_functional_properties=True

---

### Phase 4: Prakāśa Refactor (Week 3)
**Priority**: MEDIUM - Proper composition logic

1. Refactor generate_identity_prakasa() for six-layer composition
2. Add get_agent_prompt() to AgentNodeManager
3. Query #1-4, # root, #5-4, #5-4.N in correct order
4. Compose with proper separators
5. Update metadata tracking

**Validation**: Generated prompts include all six layers

---

### Phase 5: Documentation & Testing (Week 3-4)
**Priority**: MEDIUM - Knowledge preservation

1. Create architecture diagrams (Mermaid)
2. Update /docs/architecture/ documentation
3. Write comprehensive tests
4. User validation with live agents

**Validation**: Documentation complete, tests passing, users satisfied

---

## Success Criteria

### Technical
- ✅ All agents use #5-4.N coordinate pattern
- ✅ All 32 tools have three-part docstrings
- ✅ Six-layer prompt composition working
- ✅ LLM demonstrates improved tool selection
- ✅ EA workflow loads f_workflow_* correctly

### Architectural
- ✅ Clear separation: tools (docstrings) vs principles (prompt)
- ✅ Property-driven composition (not template-based)
- ✅ Layered architecture maintainable and extensible
- ✅ QL foundation universal for all agents

### Operational
- ✅ Agents receive appropriate context for their role
- ✅ Tool usage follows workflow principles
- ✅ Prompt composition traceable (metadata shows sources)
- ✅ Graphiti EA integration produces searchable communities

---

## Observations & Recommendations

### Key Insights

1. **Four Parallel Streams Converge**: Graphiti work, Prakāśa work, tool enhancement work, and wisdom packet work all point to the same architectural vision - property-driven, layered, dynamically-composed.

2. **Agent Coordinate Pattern is Foundational**: Fixing #N-4.N → #5-4.N isn't cosmetic - it's architectural truth. Must be done first.

3. **Tools Live Outside Prompts**: Critical understanding - tools sent via API parameter, not system prompt. Docstrings are the primary guidance mechanism.

4. **Hybrid Tool Guidance Works**: Enhanced docstrings (primary) + minimal f_tool_principles (secondary) balances LLM selection with workflow context.

5. **Six Layers are Necessary**: Can't collapse QL foundation + general context + agent identity + subsystem framings into fewer layers without losing separation of concerns.

6. **Graphiti Integration Complete**: EA workflow now uses native Graphiti with QL extensions - architectural bypass pattern eliminated.

### Risks

1. **Prompt Bloat**: Six layers could exceed 1500 lines
   - Mitigation: Monitor total size, optimize if needed
   - Use minimal f_tool_principles (~100-150 lines each)

2. **Breaking Existing Agents**: Coordinate fix and refactor could break functionality
   - Mitigation: Feature flags, gradual rollout, comprehensive tests

3. **Property Management Complexity**: Many Neo4j properties to maintain
   - Mitigation: Document property update workflow, consider versioning

### Critical Path

1. **Fix coordinates FIRST** - Everything else depends on this
2. **Enhance tool docstrings SECOND** - Quick win, immediate impact
3. **Create Neo4j properties THIRD** - Foundation for composition
4. **Refactor Prakāśa FOURTH** - Integrate all pieces
5. **Document and test LAST** - Validate and preserve

### Next Actions

1. **User Validation**: Review this synthesis document
2. **Prioritization**: Confirm implementation order
3. **Resource Allocation**: Assign Phase 1 tasks
4. **Execution**: Begin coordinate fix (constellation.py + agent_node_manager.py)

---

## Appendices

### Appendix A: Tool Categories

**Bimba Namespace (Canonical Knowledge) - 14 tools**:
- resolve_coordinate, semantic_coordinate_discovery, get_node_details_complete
- inspect_coordinate_detailed, get_coordinate_relationships
- get_path_between_coordinates, lexical_coordinate_search, get_direct_children
- update_bimba_node, create_bimba_node, create_bimba_relationship
- regenerate_node_embedding, regenerate_all_embeddings
- get_quintessential_properties (NEW - Sprint 4)

**Graphiti Namespace (Episodic Memory) - 2 tools**:
- remember_episode, search_memory_patterns

**Session/Context Tools - 2 tools**:
- get_session_context, check_context_window_status

**Wisdom Packet Tools - 1 tool**:
- get_wisdom_packet (ENHANCED - Sprint 4)

**Total**: ~19 tools registered (some may be inactive/premature)

### Appendix B: Property Naming Conventions

**Functional Properties (f_* prefix)**:
- f_agent_prompt - Agent identity/operational context
- f_workflow_* - Workflow-specific prompts/methods
- f_tool_principles_* - Tool usage guidance
- f_protocol_stage_* - Protocol step details

**Quintessential Properties (q_* prefix)**:
- q_ - Base distillation (highest priority)
- q0_, q1_, q2_ - Versioned distillations
- q_essence, q_epistemology, q_number_language - Specific aspects

**Subsystem Framings ({subsystem}_ prefix)**:
- epii_philosophical_foundation, epii_technical_reality, etc.
- anuttara_*, paramasiva_*, parashakti_*, mahamaya_*, nara_*

### Appendix C: File Reference

**Core Implementation Files**:
- `agentic/agents/constellation.py` - 6 agent creation functions
- `agentic/agents/prakasa.py` - Prompt layering manager
- `agentic/agents/shared_tools.py` - 32 CAG tools
- `agentic/agents/agent_node_manager.py` - Neo4j agent node operations
- `agentic/agents/factory.py` - Agent factory pattern
- `backend/epi_logos_system/cag/graphiti/service.py` - Graphiti integration

**Planning Documents**:
- `prakasa-runtime-prompt-layering.md` - Complete six-layer architecture
- `tool-awareness-architecture.md` - Tool guidance strategy
- `IMPLEMENTATION-PLAN-COMPLETE.md` - Seven-phase implementation plan
- `neo4j-prakasa-prompt-architecture.md` - Neo4j prompt loading vision
- `wisdom-packet-q-properties-llm-enhancement-IMPLEMENTED.md` - q_* work complete

---

**End of Synthesis Document**

This unified vision integrates all parallel streams into a coherent, implementable architecture. The critical path is clear: fix coordinates → enhance tools → create properties → refactor composition → validate.
