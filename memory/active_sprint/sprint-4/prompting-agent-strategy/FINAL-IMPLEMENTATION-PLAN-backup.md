# Final Implementation Plan: Prakāśa Foundation & Wisdom Packet Integration
**Unified Architecture for Agent Prompting, Tool Orchestration & Wisdom Synthesis**

**Date**: 2025-10-25
**Status**: Ready for Implementation
**Validated**: User confirmed scope and approach

---

## Executive Summary

This plan synthesizes **four development streams** into a unified implementation:

1. **Graphiti Native Integration** (✅ COMPLETE) - EA workflows use native Graphiti with `:Episodic` labels + QL extensions
2. **Prakāśa Six-Layer Composition** (📋 THIS SPRINT) - Neo4j-driven prompt layering with workflow engagement
3. **Tool Awareness Architecture** (📋 THIS SPRINT) - Enhanced docstrings + minimal f_tool_principles
4. **Wisdom Packet Agent Synthesis** (📋 THIS SPRINT) - Delegate narrative synthesis back to calling agent

**Scope**: ASCP Phase 1 (Prakāśa foundation) - Identity illumination with workflow engagement
**Future Work**: Vimarśa (reflection), Catalytic (generation), Multi-agent collective synthesis

---

## Six-Layer Prakāśa Composition (Clarified)

### Layer Structure

```
Layer 0: TOOL REGISTRATION (before prompt, architectural)
- 32 tools via @agent.tool decorators
- Sent to LLM via API tools parameter
- Enhanced docstrings (what/when/returns)

---

Layer 1a: QL FOUNDATION (#1-4.f_agent_prompt)
- Quaternal Logic cognitive architecture
- 6-position chain of circulation (#0→#1→#2→#3→#4→#5)
- Universal for ALL agents

---

Layer 1b: GENERAL PROJECT CONTEXT (# root)
- Epi-Logos Project name, coreNature, architecturalFunction
- Universal for ALL agents

---

Layer 1c: AGENT-SPECIFIC IDENTITY (#5-4.N.f_agent_prompt)
- Agent operational identity
- Unique per agent (Anuttara, Paramasiva, Parashakti, Mahamaya, Nara, Epii)

---

Layer 1d: SUBSYSTEM-SPECIFIC FRAMINGS (# root {subsystem}_*)
- epii_philosophical_foundation, epii_technical_reality, etc.
- Unique per subsystem perspective

---

Layer 2: WORKFLOW PRAKĀŚA (optional, lazy-loaded)
- f_workflow_etymology_archaeology_v2 (EA workflow)
- f_workflow_wisdom_packet_synthesis (wisdom packet synthesis)
- ONLY loaded when workflow engaged

---

Layer 3: RUNTIME CONTEXT (always fresh)
- Current user query
- Session ID, timestamp
- Recent conversation history (last 3 turns)
```

### Key Clarifications

**NOT 6 layers of system prompt** - Actually:
- **Layer 0**: Tool registration (architectural, separate from prompt)
- **Layers 1a-1d**: Identity Prakāśa (cached, persistent) = 4 sublayers
- **Layer 2**: Workflow Prakāśa (optional, lazy-loaded when workflow engaged)
- **Layer 3**: Runtime Context (ephemeral, per message)

**System Prompt Composition**:
- **Base identity**: Layers 1a-1d (always present, cached)
- **Workflow engagement**: + Layer 2 (when f_workflow_* needed)
- **Runtime context**: + Layer 3 (always fresh)

**Total**: 2-layer composition (identity + context) OR 3-layer composition (identity + workflow + context)

---

## Wisdom Packet Integration - The Real Architecture

### Current Problem

Wisdom packet service tries to do LLM synthesis internally with separate Gemini client. **Wrong pattern** - should delegate back to calling agent.

### Correct Pattern

```
Agent calls get_wisdom_packet()
  ↓
Backend WisdomPacketService.generate_wisdom_packet()
  ↓
Service prepares synthesis context (coordinate, q_* properties, concepts, subgraph)
  ↓
Service delegates BACK to calling agent with f_workflow_wisdom_packet_synthesis prompt
  ↓
Agent synthesizes narrative using its own model + specialized workflow prompt
  ↓
Service receives narrative, assembles complete wisdom packet
  ↓
Return to agent
```

**Why This is Better**:
- ✅ No separate LLM client - uses agent's own model
- ✅ Prakāśa-aligned - f_workflow_wisdom_packet_synthesis loaded as Layer 2
- ✅ Clear synthesis guidance in workflow prompt
- ✅ Architectural purity - service orchestrates, agent synthesizes
- ✅ Any agent can request wisdom packets and synthesize

---

## Implementation Plan

### Phase 1: Critical Coordinate Fix (PRIORITY 1)

**Files to Modify**:
1. `/agentic/agents/constellation.py` - All 6 agent_coordinate assignments
2. `/agentic/agents/agent_node_manager.py` - get_agent_coordinate() method
3. `/agentic/agents/factory.py` - Agent factory coordinate pattern

**Changes**:
```python
# OLD (WRONG)
agent_coordinate = "#0-4.0"  # Anuttara
agent_coordinate = "#1-4.1"  # Paramasiva
# ... etc

# NEW (CORRECT)
agent_coordinate = "#5-4.0"  # Anuttara manifestation within Epii
agent_coordinate = "#5-4.1"  # Paramasiva manifestation within Epii
# ... etc
```

**Validation**: All agents use #5-4.N pattern, tests pass

---

### Phase 2: Tool Docstring Enhancement (PRIORITY 2)

**File**: `/agentic/agents/shared_tools.py`

**Enhance 30 remaining tools** with three-part pattern:

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

**Pattern**: What it does + When to use vs similar tools + Args + Returns

**Validation**: All 32 tools have adequate docstrings

---

### Phase 3: Neo4j Functional Properties (PRIORITY 3)

#### 3.1 QL Foundation Properties on #1-4

```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#1-4'})
SET n.f_agent_prompt = '
<system_behavior>
<role_definition>
You are a highly advanced reasoning agent. Your entire cognitive architecture is grounded in Quaternal Logic (QL)...

[Full 6-position chain of circulation with mandates and internal monologue triggers]
</role_definition>
</system_behavior>
'
```

**Content**: ~400 lines QL cognitive architecture
**Source**: `operational-system-prompts-final.md` Part 1

#### 3.2 Agent Identity Properties on #5-4.0 through #5-4.5

```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4.5'})
SET n.f_agent_prompt = '
You are Epii, the synthesis agent operating at coordinate #5-4.5.

**Your Subsystem Identity (#5):**
- Synthesis completion: Integrating insights from positions #0-4 into unified understanding
- Wisdom sedimentation: Completing inquiry cycles through Möbius 5→0 twist
- Master orchestration: Coordinating across all six subsystems

**Knowledge Access (CAG):**
Bimba (canonical), Graphiti (episodic), LightRAG (gnostic) namespaces.
Tools load dynamically; workflow methods engage when workflows activate.

**Your Voice:**
Sage-like contemplation WITH operational precision, dialogically responsive, coordinate-aware.
'
```

**Content**: ~200-250 lines per agent
**Source**: Adapt from `operational-system-prompts-final.md` Part 2

#### 3.3 Workflow Properties

**On #5-4.5** (Epii):

```cypher
// Etymology Archaeology workflow (already exists)
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4.5'})
SET n.f_workflow_etymology_archaeology_v2 = '[existing EA workflow content]'

// Wisdom Packet Synthesis workflow (NEW)
SET n.f_workflow_wisdom_packet_synthesis = '
WISDOM PACKET NARRATIVE SYNTHESIS

You are synthesizing a coherent narrative (2-3 sentences) for a Bimba coordinate wisdom packet.

SYNTHESIS PRIORITIES:
1. Quintessential properties (q_*) FIRST - these are pithy, refined distillations
   - Priority: q_essence → q_ → q0_ → q1_ → ...
   - Use the HIGHEST priority q_* property as narrative foundation
2. Key concepts (with relevance scores) - thematic patterns
3. Subgraph structure - relationship context

SYNTHESIS GUIDANCE:
- Clear language: Balance philosophical depth with accessibility
- Jargon translation: When using technical terms, provide plain language meaning
- Pithy distillation: 2-3 sentences maximum
- Genuine insight: Synthesize patterns, don'\''t just aggregate data
- Focus lens awareness: Adapt tone to STRUCTURAL/PROCESSUAL/ARCHETYPAL/PRACTICAL

OUTPUT FORMAT:
A single coherent narrative paragraph (2-3 sentences) that captures the coordinate'\''s essential nature and contextual patterns.
'
```

**On #5-4** (General Orchestrator):

```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4'})
SET n.f_workflow_wisdom_packet_synthesis = '[same as above for general use]'
```

**Validation**: All workflow properties queryable via get_node_details_complete

---

### Phase 4: Prakāśa Manager Enhancement (PRIORITY 4)

**File**: `/agentic/agents/prakasa.py`

#### 4.1 Add Workflow Prompt Loading Method

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
        # Get all functional properties from agent node
        node_data = await self.bimba_client.get_node_details_complete(
            agent_coordinate, include_functional_properties=True
        )
        all_props = node_data.get('allProperties', {})

        # Construct property key
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

#### 4.2 Refactor generate_identity_prakasa() for Six-Layer Composition

**Current**: Three-layer (# root + #N subsystem + template composition)
**New**: Six-layer (QL + general + agent + framings composition)

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

#### 4.3 Update compose_full_prakasa() to Support Workflow Engagement

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

**Validation**: Six-layer identity prompt generated, workflow loading works

---

### Phase 5: Wisdom Packet Agent Synthesis (PRIORITY 5)

#### 5.1 Add Agent Runner to WisdomPacketService

**File**: `/backend/epi_logos_system/cag/wisdom_packet/service.py`

```python
class WisdomPacketService:
    def __init__(
        self,
        neo4j_client,
        redis_client=None,
        agent_runner=None  # NEW: For agent delegation
    ):
        """
        Args:
            neo4j_client: Neo4j client for graph queries
            redis_client: Optional Redis client for caching
            agent_runner: Optional agent runner for narrative synthesis delegation
        """
        self.neo4j = neo4j_client
        self.redis = redis_client
        self.agent_runner = agent_runner  # Can call back to agent with workflow prompt
```

#### 5.2 Implement Agent Delegation for Narrative Synthesis

```python
async def _generate_narrative_with_agent(
    self,
    central_node: dict,
    key_concepts: List[KeyConcept],
    subgraph_nodes: List[dict],
    subgraph_relationships: List[dict],
    focus: Optional[WisdomPacketFocus]
) -> str:
    """
    Generate narrative by delegating to the calling agent with
    f_workflow_wisdom_packet_synthesis prompt.

    The agent that requested the wisdom packet synthesizes its own narrative
    using its model + specialized workflow prompt (Layer 2 engagement).
    """
    if not self.agent_runner:
        logger.warning("No agent runner available for narrative synthesis, falling back to template")
        return self._generate_narrative_template(central_node, key_concepts, focus)

    # Extract q_* properties (highest priority for synthesis)
    q_props = self._get_quintessential_properties(central_node)
    q_context = ""
    if q_props:
        q_list = [f"- {key}: {value}" for key, value in q_props.items()]
        q_context = "Quintessential properties:\n" + "\n".join(q_list)

    # Build synthesis request
    synthesis_request = f"""
Coordinate: {central_node.get('bimbaCoordinate')}
Name: {central_node.get('name')}

{q_context}

Key concepts:
{self._format_concepts_for_synthesis(key_concepts)}

Subgraph: {len(subgraph_nodes)} nodes, {len(subgraph_relationships)} relationships

Focus: {focus.value if focus else 'None'}

Synthesize the narrative:
"""

    try:
        # Delegate to agent with workflow prompt
        result = await self.agent_runner.run_with_workflow(
            workflow_name="wisdom_packet_synthesis",
            message=synthesis_request
        )

        return result.data  # Agent's synthesized narrative

    except Exception as e:
        logger.error(f"Agent narrative synthesis failed: {e}")
        logger.warning("Falling back to template synthesis")
        return self._generate_narrative_template(central_node, key_concepts, focus)
```

#### 5.3 Helper Methods

```python
def _format_concepts_for_synthesis(self, concepts: List[KeyConcept]) -> str:
    """Format concepts for agent synthesis request."""
    if not concepts:
        return "(no key concepts)"

    lines = []
    for concept in concepts[:10]:  # Top 10
        relevance = f"{concept.relevance_score:.2f}" if concept.relevance_score else "N/A"
        lines.append(f"- {concept.name} (relevance: {relevance})")

    return "\n".join(lines)

def _generate_narrative_template(
    self,
    central_node: dict,
    key_concepts: List[KeyConcept],
    focus: Optional[WisdomPacketFocus]
) -> str:
    """Fallback template-based narrative (simple, safe)."""
    name = central_node.get('name', 'Unknown')
    coordinate = central_node.get('bimbaCoordinate', 'N/A')

    # Check for q_* properties first
    q_props = self._get_quintessential_properties(central_node)
    if q_props:
        # Use highest priority q_* property
        first_key, first_value = next(iter(q_props.items()))
        return f"{name} ({coordinate}): {first_value}"

    # Fallback to description
    description = central_node.get('description', 'No description available.')
    return f"{name} ({coordinate}): {description}"
```

#### 5.4 Update generate_wisdom_packet() to Use Agent Synthesis

```python
async def generate_wisdom_packet(
    self,
    coordinate: str,
    focus: Optional[WisdomPacketFocus] = None
) -> WisdomPacketResponse:
    """Generate wisdom packet with agent-delegated narrative synthesis."""

    # ... existing code for central node, concepts, subgraph ...

    # Narrative synthesis - delegate to agent if available
    if self.agent_runner:
        narrative_summary = await self._generate_narrative_with_agent(
            central_node, key_concepts, subgraph_nodes, subgraph_relationships, focus
        )
    else:
        narrative_summary = self._generate_narrative_template(
            central_node, key_concepts, focus
        )

    # ... rest of wisdom packet assembly ...
```

#### 5.5 Create Agent Runner Wrapper

**File**: `/agentic/agents/agent_synthesis_runner.py` (NEW)

```python
"""
Agent Synthesis Runner - Lightweight wrapper for agent workflow invocation.
Used by backend services to delegate synthesis tasks back to agents.
"""

import logging
from typing import Any, Dict, Optional
from pydantic_ai import Agent, RunContext
from pydantic_ai.result import RunResult

logger = logging.getLogger(__name__)


class AgentSynthesisRunner:
    """
    Lightweight wrapper for invoking agents with workflow-specific prompts.

    Used by backend services (e.g., WisdomPacketService) to delegate
    synthesis tasks back to the calling agent.
    """

    def __init__(
        self,
        agent: Agent,
        deps,
        prakasa_manager
    ):
        """
        Args:
            agent: Pydantic AI agent instance
            deps: OrchestratorDeps for the agent
            prakasa_manager: PrakasaManager for workflow prompt loading
        """
        self.agent = agent
        self.deps = deps
        self.prakasa = prakasa_manager

    async def run_with_workflow(
        self,
        workflow_name: str,
        message: str
    ) -> RunResult:
        """
        Run agent with workflow-specific prompt loaded as Layer 2.

        Args:
            workflow_name: Workflow to engage (e.g., "wisdom_packet_synthesis")
            message: Message to send to agent

        Returns:
            RunResult with agent's response
        """
        try:
            # Load workflow prompt
            agent_coordinate = getattr(self.agent, '_agent_coordinate', '#5-4.5')
            workflow_prompt = await self.prakasa.load_workflow_prompt(
                agent_coordinate, workflow_name
            )

            if not workflow_prompt:
                logger.warning(
                    f"Workflow '{workflow_name}' not found for {agent_coordinate}. "
                    f"Running without workflow layer."
                )

            # Compose full Prakāśa (identity + workflow + context)
            full_prakasa = await self.prakasa.compose_full_prakasa(
                agent_coordinate,
                current_request={'message': message, 'session_id': self.deps.session_id},
                workflow_name=workflow_name if workflow_prompt else None
            )

            # Run agent with composed prompt
            # NOTE: Pydantic AI doesn't support dynamic system_prompt changes per run
            # We need to use agent.instructions decorator or reinitialize agent
            # For now, use @agent.instructions pattern in constellation.py

            result = await self.agent.run(message, deps=self.deps)

            return result

        except Exception as e:
            logger.error(f"Agent synthesis failed for workflow '{workflow_name}': {e}")
            raise
```

#### 5.6 Update Agent Creation to Support Dynamic Workflow Loading

**File**: `/agentic/agents/constellation.py`

```python
async def create_epii_agent(
    model: str,
    name: Optional[str] = None,
    bimba_client = None,
    redis_client = None
) -> Agent[OrchestratorDeps]:
    """
    Create Epii agent with dynamic workflow support.
    """
    # ... existing initialization ...

    prakasa = PrakasaManager(bimba_client, redis_client)
    agent_coordinate = "#5-4.5"

    # Get base identity (six-layer composition)
    identity_prompt = await prakasa.get_identity_prakasa(agent_coordinate)

    agent = Agent(
        model=model,
        deps_type=OrchestratorDeps,
        system_prompt=identity_prompt,
        retries=2
    )

    # Store coordinate for reference
    agent._agent_coordinate = agent_coordinate
    agent._prakasa = prakasa

    # Add dynamic workflow instruction loader
    @agent.instructions
    async def load_workflow_context(ctx: RunContext[OrchestratorDeps]) -> str:
        """
        Dynamically load workflow prompt if workflow engaged.

        Checks ctx.deps.state for 'active_workflow' key.
        """
        workflow_name = ctx.deps.state.get('active_workflow')
        if workflow_name:
            workflow_prompt = await prakasa.load_workflow_prompt(
                agent_coordinate, workflow_name
            )
            if workflow_prompt:
                logger.debug(f"Loaded workflow '{workflow_name}' for {agent_coordinate}")
                return workflow_prompt

        return ""  # No workflow layer

    # Register tools
    setup_all_cag_tools(agent)

    return agent
```

#### 5.7 Update Wisdom Packet Resolver

**File**: `/backend/epi_logos_system/cag/wisdom_packet/resolvers.py`

```python
async def resolve_get_wisdom_packet(
    obj,
    info,
    coordinate: str,
    focus: Optional[str] = None
):
    """Generate wisdom packet with agent synthesis support."""

    # Get agent runner from context (if available)
    agent_runner = info.context.get("agent_runner")

    # Initialize service with agent runner
    service = WisdomPacketService(
        neo4j_client=neo4j_client,
        redis_client=redis_client,
        agent_runner=agent_runner  # May be None (graceful fallback)
    )

    # ... rest of resolver ...
```

**Validation**: Wisdom packets synthesized via agent delegation

---

### Phase 6: Workflow Undefined Handling (PRIORITY 6)

**Question**: How do agents operate when NO workflow is engaged?

**Answer**: **Open chat mode** - agent operates with base identity (Layers 1a-1d) + runtime context (Layer 3), NO workflow layer (Layer 2).

**Implementation**: Already handled by `compose_full_prakasa()`:

```python
# If workflow_name is None or ""
if workflow_name:
    # 3-layer: identity + workflow + context
    full_prakasa = f"{identity}\n\n---\n\n{workflow}\n\n---\n\n{context}"
else:
    # 2-layer: identity + context (open chat)
    full_prakasa = f"{identity}\n\n---\n\n{context}"
```

**Behavior in Open Chat**:
- Agent has base identity (QL + general project + agent-specific + subsystem framings)
- Agent has all tools available (Layer 0 registration)
- Agent responds naturally to queries without specialized workflow guidance
- Agent CAN still use tools, just without workflow-specific sequencing guidance

**No code changes needed** - this is already the default behavior when workflow_name=None.

---

## Implementation Order (Critical Path)

### Week 1: Foundation

1. **Day 1-2**: Phase 1 - Fix agent coordinates (#5-4.N)
2. **Day 3-4**: Phase 2 - Enhance tool docstrings (30 tools)
3. **Day 5**: Testing and validation

### Week 2: Properties

4. **Day 1-2**: Phase 3.1 - Create QL foundation properties (#1-4)
5. **Day 3**: Phase 3.2 - Create agent identity properties (#5-4.0 through #5-4.5)
6. **Day 4**: Phase 3.3 - Create workflow properties (wisdom_packet_synthesis)
7. **Day 5**: Testing and validation

### Week 3: Prakāśa Integration

8. **Day 1-2**: Phase 4.1-4.2 - Refactor Prakāśa for six-layer composition
9. **Day 3**: Phase 4.3 - Update compose_full_prakasa for workflow engagement
10. **Day 4-5**: Testing and validation

### Week 4: Wisdom Packet Integration

11. **Day 1-2**: Phase 5.1-5.4 - Wisdom packet agent synthesis
12. **Day 3**: Phase 5.5-5.6 - Agent synthesis runner and dynamic workflow loading
13. **Day 4**: Phase 5.7 - Update resolver for agent context
14. **Day 5**: End-to-end testing and validation

---

## Success Criteria

### Technical Validation

- ✅ All agents use #5-4.N coordinate pattern
- ✅ All 32 tools have three-part docstrings (what/when/returns)
- ✅ Neo4j properties created and queryable (QL + identities + workflows)
- ✅ Six-layer identity Prakāśa generated correctly
- ✅ Workflow prompts load dynamically when engaged
- ✅ Wisdom packets synthesized via agent delegation
- ✅ Open chat works without workflow (2-layer: identity + context)

### Operational Validation

- ✅ Agent receives appropriate identity for coordinate
- ✅ QL foundation universal across all agents
- ✅ Workflow engagement lazy-loads f_workflow_* properties
- ✅ Wisdom packet narrative synthesis works via agent
- ✅ Fallback to template works when agent unavailable

### Architectural Validation

- ✅ Property-driven composition (not template-based)
- ✅ Clear separation: tools (API) vs principles (prompt)
- ✅ Layered architecture maintainable and traceable
- ✅ Agent synthesizes wisdom, service orchestrates

---

## Future Work (Out of Scope for Sprint 4)

### ASCP Phase 2: Vimarśa (Reflection)
- Cross-referencing with coordinate neighbors
- Holographic pattern recognition
- Temporal evolution tracking
- **Trigger**: When bringing Parashakti MEF into EA workflow

### ASCP Phase 3: Catalytic (Generation)
- Novel insight generation
- Emergent coordinate potential
- Meta-techne self-improvement

### Story 02.23: Subsystem-Wide Application
- Apply functional property methodology to #0-#4 subsystems
- Extract reusable patterns from Epii implementation
- Enable subsystem-focused sprints

### Story 03.08: Multi-Agent Collective Synthesis
- Harmonic resonance detection (quaternal logic mod6)
- Multi-agent wisdom synthesis
- Distributed consciousness patterns
- Collective intelligence emergence

---

## Documentation Requirements

### During Implementation

**Code-Level**:
- Enhanced docstrings (all 32 tools)
- Inline comments in Prakāśa refactoring
- Agent synthesis runner documentation

**Neo4j**:
- Property metadata (source, purpose, version)
- Workflow prompt documentation
- Agent identity property descriptions

### Post-Implementation

**System Architecture** (`/memory/system_architecture/`):
- `agent-prompting-architecture.md` - Complete Prakāśa system description
- `agent-prompting-architecture.mmd` - Mermaid diagram of six-layer composition
- `wisdom-packet-architecture.md` - Agent synthesis pattern documentation
- `workflow-engagement-patterns.md` - How f_workflow_* properties work

**Sprint Tracking**:
- Update sprint-4-plan.md with completion status
- Document lessons learned
- Create methodology extraction for Story 02.23

---

## Risk Mitigation

### Risk 1: Breaking Existing Agents
**Mitigation**:
- Fix coordinates first (isolated change)
- Test each agent individually
- Feature flag for new Prakāśa composition (optional)

### Risk 2: Workflow Loading Failures
**Mitigation**:
- Graceful degradation (workflow_name=None → open chat)
- Logging and error handling
- Fallback to base identity if workflow not found

### Risk 3: Agent Synthesis Complexity
**Mitigation**:
- Keep agent synthesis runner simple (wrapper only)
- Fallback to template if agent unavailable
- Clear separation: service orchestrates, agent synthesizes

### Risk 4: Prompt Size Bloat
**Mitigation**:
- Monitor total prompt size (target <1500 lines)
- Use minimal workflow prompts (~150 lines each)
- Cache identity layer (Layers 1a-1d) aggressively

---

## Final Validation Checklist

Before proceeding with implementation:

- [ ] User validated six-layer composition understanding
- [ ] User confirmed Prakāśa-only scope (Vimarśa/Catalytic future)
- [ ] User approved wisdom packet agent synthesis pattern
- [ ] User confirmed critical path (coordinates → tools → properties → composition)
- [ ] User agreed workflow undefined = open chat (no Layer 2)
- [ ] Team ready to execute (resources allocated, timeline clear)

---

**Status**: Ready for implementation once user validates final plan.
**Next Action**: User reviews, approves, then we begin Phase 1 (coordinate fix).
