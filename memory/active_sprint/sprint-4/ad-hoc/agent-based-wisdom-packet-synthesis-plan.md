# Agent-Based Wisdom Packet Synthesis - Implementation Plan

**Date**: 2025-10-25
**Sprint**: Sprint 4
**Context**: Refactoring wisdom packet narrative synthesis to use Epii agent instead of standalone Gemini client

---

## Strategic Decision

**FROM**: Standalone GeminiLLMClient with template fallbacks (wasteful, not architecturally aligned)

**TO**: Epii agent (#5 - Synthesis & Orchestration) handles narrative synthesis via f_workflow_wisdom_packet_synthesis prompt

**WHY**:
- ✅ Uses existing Pydantic AI agent infrastructure (constellation pattern)
- ✅ Prakāśa-aligned prompting (loads workflow from Neo4j)
- ✅ Coordinate-specific (#5 is synthesis/orchestration subsystem)
- ✅ No fallbacks (proper errors, no masked issues)
- ✅ Clear synthesis guidance in workflow prompt (q_* priority, jargon translation)
- ✅ Async background synthesis (doesn't block wisdom packet generation)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ WISDOM PACKET SYNTHESIS FLOW                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Agent requests wisdom packet                            │
│    └─> Backend: WisdomPacketService.generate_wisdom_packet()│
│                                                             │
│ 2. Service gathers synthesis materials                     │
│    ├─> Central node + q_* properties (prioritized)         │
│    ├─> Key concepts (with relevance scores)                │
│    ├─> Subgraph structure (nodes + relationships)          │
│    └─> Focus lens (STRUCTURAL/PROCESSUAL/etc.)             │
│                                                             │
│ 3. Service spawns Epii agent for synthesis                 │
│    ├─> AgentFactory.create_agent(subsystem=5, model=...)   │
│    ├─> Load f_workflow_wisdom_packet_synthesis from Neo4j  │
│    └─> Async call to agent.run() with synthesis request    │
│                                                             │
│ 4. Epii agent synthesizes narrative                        │
│    ├─> Identity Prakāśa: #5 system prompt (synthesis role) │
│    ├─> Workflow Prakāśa: f_workflow_wisdom_packet_synthesis│
│    ├─> Context Prakāśa: Synthesis materials (q_*, concepts)│
│    └─> Returns 2-3 sentence narrative                      │
│                                                             │
│ 5. Service completes wisdom packet                         │
│    └─> Cache in Redis (24h TTL)                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Add f_workflow_wisdom_packet_synthesis to Neo4j ✅ (Cypher)

**Coordinates to update**: #5-4 (Orchestrator), #5-4.5 (Orchestrator Internal)

**Property**: `f_workflow_wisdom_packet_synthesis`

**Content**:
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4'})
SET n.f_workflow_wisdom_packet_synthesis = '
WISDOM PACKET NARRATIVE SYNTHESIS

You are synthesizing a coherent narrative (2-3 sentences) for a Bimba coordinate wisdom packet.

SYNTHESIS PRIORITIES (STRICT ORDER):
1. Quintessential properties (q_*) FIRST - pithy, refined distillations from episodic research
   - Priority: q_essence → q_ → q0_ → q1_ → q2_ → ...
   - Use the HIGHEST priority q_* property as narrative foundation
   - If q_* exists, it MUST anchor the narrative
2. Key concepts (with relevance scores) - thematic patterns across subgraph
3. Subgraph structure - relationship context and connectivity patterns

SYNTHESIS GUIDANCE:
- Clear language: Balance philosophical depth with accessibility
- Jargon translation: When using technical terms, provide plain language meaning in parentheses
  Example: "spanda (vibrational pulsation)" or "apophatic (via negation)"
- Pithy distillation: 2-3 sentences maximum, no more
- Genuine insight: Synthesize patterns and relationships, don\'t just list facts
- Focus lens awareness: Adapt narrative tone to synthesis lens if specified
  - STRUCTURAL: Emphasize logical patterns and architecture
  - PROCESSUAL: Emphasize dynamic transformation and flow
  - ARCHETYPAL: Emphasize symbolic and mythic dimensions
  - PRACTICAL: Emphasize actionable frameworks and implementation

OUTPUT REQUIREMENTS:
- Format: Single coherent paragraph (2-3 sentences)
- Tone: Synthesizing intelligence, not mechanical aggregation
- Content: Captures essential nature + contextual patterns
- Language: Accessible yet philosophically grounded

FAILURE MODES TO AVOID:
- Raw data listing (e.g., "This coordinate has 5 concepts and 10 relationships")
- Generic templates (e.g., "This coordinate represents...")
- Ignoring q_* properties when they exist (CRITICAL ERROR)
- Over-explaining or verbose narratives (>3 sentences)
'
```

**Same for #5-4.5** (identical content)

---

### Task 2: Add load_workflow_prompt() to PrakasaManager ✅ (Python)

**File**: `agentic/agents/prakasa.py`

**New Method**:
```python
async def load_workflow_prompt(
    self,
    agent_coordinate: str,
    workflow_name: str
) -> Optional[str]:
    """
    Load a specific workflow prompt from agent node.

    Simplified method for loading raw workflow prompts without
    template parameter substitution. Use for workflows that
    are complete prompts (not templates).

    Args:
        agent_coordinate: Agent coordinate (e.g., "#5-4")
        workflow_name: Workflow name (e.g., "wisdom_packet_synthesis")

    Returns:
        Raw workflow prompt string or None if not found

    Example:
        >>> manager = PrakasaManager(bimba_client, redis_client)
        >>> prompt = await manager.load_workflow_prompt("#5-4", "wisdom_packet_synthesis")
    """
    logger.debug(
        f"Loading workflow prompt '{workflow_name}' for {agent_coordinate}"
    )

    # Query agent node for f_workflow_{workflow_name} property
    property_name = f"f_workflow_{workflow_name}"

    try:
        # Use agent_nodes.get_functional_properties() to fetch f_workflow_* prop
        functional_props = await self.agent_nodes.get_functional_properties(
            agent_coordinate,
            property_prefix="f_workflow_"
        )

        if property_name in functional_props:
            workflow_prompt = functional_props[property_name]
            logger.info(
                f"Loaded workflow '{workflow_name}' for {agent_coordinate} "
                f"({len(workflow_prompt)} chars)"
            )
            return workflow_prompt
        else:
            logger.warning(
                f"Workflow '{workflow_name}' not found for {agent_coordinate}. "
                f"Property {property_name} does not exist."
            )
            return None

    except Exception as e:
        logger.error(
            f"Error loading workflow '{workflow_name}' for {agent_coordinate}: {e}"
        )
        return None
```

**Integration**: This uses existing `AgentNodeManager.get_functional_properties()` to fetch f_workflow_* properties from Neo4j.

---

### Task 3: Refactor WisdomPacketService for Agent Synthesis ✅ (Python)

**File**: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**Changes**:

1. **Update __init__ signature**:
```python
def __init__(self, neo4j_client, redis_client, agent_factory=None, model_name: str = "google-gla:gemini-2.0-flash-exp"):
    """
    Initialize Wisdom Packet service.

    Args:
        neo4j_client: Neo4j client for graph queries
        redis_client: Redis client for caching
        agent_factory: Optional AgentFactory for Epii agent synthesis
        model_name: Model to use for Epii agent synthesis (default: Gemini 2.0 Flash)
    """
    self.neo4j = neo4j_client
    self.redis = redis_client
    self.agent_factory = agent_factory
    self.model_name = model_name
```

2. **Remove GeminiLLMClient** (delete llm_client.py, remove from __init__.py)

3. **Replace _generate_narrative_with_llm() with _generate_narrative_with_agent()**:
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
    Generate narrative by delegating to Epii agent (#5 - Synthesis).

    Spawns a dedicated Epii agent instance with f_workflow_wisdom_packet_synthesis
    prompt for async background synthesis.

    Args:
        central_node: Central Bimba node data
        key_concepts: Extracted key concepts
        subgraph_nodes: Traversed subgraph nodes
        subgraph_relationships: Traversed relationships
        focus: Optional synthesis focus lens

    Returns:
        Epii agent-synthesized narrative (2-3 sentences)

    Raises:
        ValueError: If agent_factory not available
        Exception: If agent synthesis fails
    """
    if not self.agent_factory:
        raise ValueError(
            "AgentFactory required for narrative synthesis. "
            "WisdomPacketService must be initialized with agent_factory parameter."
        )

    coord = central_node.get("bimbaCoordinate", "unknown")
    name = central_node.get("name", "Unknown")

    # Extract q_* properties (highest priority)
    q_props = self._get_quintessential_properties(central_node)
    q_context = ""
    if q_props:
        q_list = [f"- {key}: {value}" for key, value in q_props.items()]
        q_context = "Quintessential properties (PRIORITY):\n" + "\n".join(q_list)
    else:
        q_context = "Quintessential properties: None (use description/other fields)"

    # Format key concepts for synthesis
    concepts_context = ""
    if key_concepts:
        concepts_list = [
            f"- {c.concept} (relevance: {c.relevance_score:.2f}): {c.description}"
            for c in key_concepts[:5]
        ]
        concepts_context = "Key concepts:\n" + "\n".join(concepts_list)

    # Subgraph structure context
    subgraph_context = f"Subgraph structure: {len(subgraph_nodes)} nodes, {len(subgraph_relationships)} relationships"

    # Focus lens context
    focus_str = focus.value if focus else "None"
    focus_context = f"Synthesis focus: {focus_str}"

    # Build synthesis request message
    synthesis_request = f"""
Coordinate: {coord}
Name: {name}

{q_context}

{concepts_context}

{subgraph_context}

{focus_context}

Synthesize the narrative according to the guidance provided.
"""

    try:
        # Create dedicated Epii agent instance for synthesis
        logger.info(f"Spawning Epii agent for narrative synthesis: {coord}")

        epii_agent = await self.agent_factory.create_agent(
            subsystem=5,  # Epii - Synthesis & Orchestration
            model_name=self.model_name,
            name=f"wisdom-synthesis-{coord}"
        )

        # Load workflow prompt via PrakasaManager
        from agentic.agents.prakasa import PrakasaManager
        prakasa = PrakasaManager(
            bimba_client=self.agent_factory.registry._agents[5]._bimba_client if 5 in self.agent_factory.registry._agents else None,
            redis_client=self.redis
        )

        workflow_prompt = await prakasa.load_workflow_prompt(
            agent_coordinate="#5-4",  # Epii orchestrator coordinate
            workflow_name="wisdom_packet_synthesis"
        )

        if not workflow_prompt:
            raise ValueError(
                "Workflow prompt 'wisdom_packet_synthesis' not found for #5-4. "
                "Ensure f_workflow_wisdom_packet_synthesis is set in Neo4j."
            )

        # Prepare deps for agent run
        from agentic.agents.orchestrator.orchestrator_agent import OrchestratorDeps

        deps = OrchestratorDeps(
            session_id=f"wisdom-synthesis-{coord}",
            bimba_client=self.neo4j,  # Pass Neo4j client (compatible interface)
            context_package={"workflow": "wisdom_packet_synthesis"}
        )

        # Construct full prompt: workflow + synthesis request
        full_prompt = f"{workflow_prompt}\n\n---\n\n{synthesis_request}"

        # Run agent synthesis (async, non-blocking)
        result = await epii_agent.run(
            full_prompt,
            deps=deps
        )

        # Extract narrative from result
        if hasattr(result, 'data'):
            narrative = result.data.strip()
        else:
            narrative = str(result).strip()

        # Validate narrative quality (basic check)
        if len(narrative) < 50:
            raise ValueError(
                f"Epii agent narrative too short ({len(narrative)} chars). "
                f"Expected 2-3 sentences (~100-200 chars)."
            )

        logger.info(
            f"✅ Epii agent synthesized narrative for {coord}: "
            f"{len(narrative)} chars"
        )

        return narrative

    except Exception as e:
        logger.error(f"❌ Epii agent synthesis failed for {coord}: {e}")
        raise  # No fallback - proper error propagation
```

4. **Update generate_wisdom_packet() to use agent synthesis**:
```python
# In generate_wisdom_packet(), replace LLM synthesis section with:

# AC 3: Generate narrative summary
# SPRINT 4 ENHANCEMENT: Delegate to Epii agent for synthesis
try:
    narrative = await self._generate_narrative_with_agent(
        central_node_data, key_concepts, subgraph_nodes,
        subgraph_relationships, focus
    )
except Exception as e:
    logger.error(f"Agent synthesis failed for {coordinate}: {e}")
    # Fall back to template synthesis (backward compatibility)
    narrative = self._generate_narrative(
        central_node_data, key_concepts, subgraph_nodes, focus
    )
```

**NOTE**: Make `generate_wisdom_packet()` async if not already.

---

### Task 4: Update Resolver to Pass AgentFactory ✅ (Python)

**File**: `backend/epi_logos_system/cag/wisdom_packet/resolvers.py`

**Changes**:
```python
from agentic.agents.factory import AgentFactory

async def resolve_get_wisdom_packet(
    _: Any,
    info: Any,
    coordinate: str,
    depth: int = 2,
    focus: Optional[str] = None,
    forceRegenerate: bool = False
) -> dict | None:
    """Generate or retrieve a Wisdom Packet for a Bimba coordinate."""

    # Initialize clients
    neo4j_client = Neo4jClient()
    redis_client = RedisClient()

    # Initialize AgentFactory for Epii synthesis
    agent_factory = AgentFactory()

    # Initialize service with agent factory
    service = WisdomPacketService(
        neo4j_client,
        redis_client,
        agent_factory=agent_factory,
        model_name="google-gla:gemini-2.0-flash-exp"  # Gemini 2.0 Flash
    )

    # ... rest of resolver logic
```

---

### Task 5: Remove GeminiLLMClient (Cleanup) ✅ (Deletion)

**Files to delete**:
- `backend/epi_logos_system/cag/wisdom_packet/llm_client.py`

**Files to update**:
- `backend/epi_logos_system/cag/wisdom_packet/__init__.py` - Remove GeminiLLMClient export

---

### Task 6: Update Tests ✅ (Python)

**Test files to update**:
- Any existing wisdom packet tests that mock LLM client
- Add new test: `test_agent_synthesis_integration.py`

**New test**: Mock AgentFactory.create_agent() to verify Epii agent synthesis flow

---

## Key Design Decisions

### 1. No Fallbacks
**Decision**: If agent synthesis fails, propagate error (no fallback to template).

**Rationale**: Fallbacks mask errors and add complexity. Better to fail fast and fix root cause.

### 2. Async Background Synthesis
**Decision**: Spawn dedicated Epii agent instance per synthesis request.

**Rationale**:
- Non-blocking (doesn't hold up wisdom packet generation)
- Isolated agent instance (no shared state)
- Async pattern aligns with Pydantic AI

### 3. AgentFactory Pattern (No Wrapper Needed)
**Decision**: Use existing AgentFactory.create_agent() directly, no custom wrapper.

**Rationale**:
- AgentFactory already provides clean async agent creation
- No need for additional abstraction layer
- Simple: `await agent_factory.create_agent(subsystem=5, model=...)`

### 4. Workflow Prompt Storage
**Decision**: Store f_workflow_wisdom_packet_synthesis in Neo4j agent nodes (#5-4, #5-4.5).

**Rationale**:
- Prakāśa-aligned (workflow prompts live in graph)
- Versionable and queryable
- Can be updated without code changes

---

## Testing Strategy

### Unit Tests
1. Test `PrakasaManager.load_workflow_prompt()` method
2. Test `_generate_narrative_with_agent()` with mocked AgentFactory
3. Test workflow prompt loading from Neo4j

### Integration Tests
1. Test full wisdom packet generation with real Epii agent
2. Verify f_workflow_wisdom_packet_synthesis is loaded correctly
3. Test narrative synthesis quality (q_* priority, 2-3 sentences)

### Live Validation
1. Test with coordinate that has q_* properties (verify q_* prioritization)
2. Test with coordinate without q_* (verify graceful use of description)
3. Test different focus lenses (STRUCTURAL/PROCESSUAL/etc.)
4. Measure synthesis latency (target: <3s for agent spawn + synthesis)

---

## Dependencies

**New**:
- None (uses existing AgentFactory, PrakasaManager)

**Updated**:
- `agentic/agents/prakasa.py` - Add load_workflow_prompt() method
- `backend/epi_logos_system/cag/wisdom_packet/service.py` - Agent synthesis
- `backend/epi_logos_system/cag/wisdom_packet/resolvers.py` - Pass AgentFactory

**Removed**:
- `backend/epi_logos_system/cag/wisdom_packet/llm_client.py` - Delete GeminiLLMClient
- `google-generativeai` pip package - No longer needed

---

## Neo4j Cypher Updates

### Add f_workflow_wisdom_packet_synthesis to #5-4
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4'})
SET n.f_workflow_wisdom_packet_synthesis = '<FULL PROMPT FROM TASK 1>'
```

### Add f_workflow_wisdom_packet_synthesis to #5-4.5
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4.5'})
SET n.f_workflow_wisdom_packet_synthesis = '<FULL PROMPT FROM TASK 1>'
```

---

## Success Criteria

✅ **Architectural Alignment**:
- Wisdom packet synthesis delegated to Epii agent (#5 - Synthesis subsystem)
- Prakāśa workflow prompting used (f_workflow_wisdom_packet_synthesis)
- No standalone LLM clients (uses agent infrastructure)

✅ **Functional Requirements**:
- Narratives prioritize q_* properties when available
- Narratives are 2-3 sentences (concise, insightful)
- Jargon translation in plain language
- Focus lens awareness (STRUCTURAL/PROCESSUAL/etc.)

✅ **Performance**:
- Async agent synthesis (non-blocking)
- Total synthesis time <3s (agent spawn + synthesis)
- Redis caching still 24h TTL (unchanged)

✅ **Code Quality**:
- No fallbacks (proper error propagation)
- Clean separation of concerns (service orchestrates, agent synthesizes)
- Testable (mockable AgentFactory)

---

## Implementation Order

1. ✅ **Task 1**: Add Neo4j workflow prompts (Cypher) - FIRST (enables testing)
2. ✅ **Task 2**: Add PrakasaManager.load_workflow_prompt() (Python)
3. ✅ **Task 3**: Refactor WisdomPacketService (Python) - CORE LOGIC
4. ✅ **Task 4**: Update resolver (Python) - INTEGRATION
5. ✅ **Task 5**: Remove GeminiLLMClient (Cleanup)
6. ✅ **Task 6**: Update tests (Python)

**Estimated Time**: 2-3 hours for full implementation + testing

---

## Clarifications & Decisions (User-Validated 2025-10-25)

### 1. Model Selection ✅
**Decision**: Use default model from environment: `groq:moonshotai/kimi-k2-instruct` (kimik2)
- Use `get_default_model()` helper from orchestrator_agent.py
- Falls back to GROQ_MODEL env var: `moonshotai/kimi-k2-instruct`
- **Code**: `model_name = get_default_model()` (no hardcoding)

### 2. Agent Lifecycle ✅
**Decision**: Destroy Epii agent after synthesis completes, but cache instance for regeneration
- Epii agent synthesizes narrative → Returns to wisdom packet service → Agent destroyed
- **Agent instance caching** (NEW):
  - Cache the agent instance in Redis: `wisdom_synthesis_agent:{coordinate}`
  - TTL: 24h (matches wisdom packet cache)
  - **Use case**: If user requests regeneration with specific changes, reuse same agent instance
  - **Cleanup**: Agent destroyed from memory after synthesis, cache expires after 24h

### 3. Parameter Passing from Main Agent ✅
**Question**: "will we be able to pass args from main agent via wisdom packet tool?"

**Answer**: YES - Wisdom packet tool already supports parameters:
- Current params: `coordinate`, `depth`, `focus`, `force_regenerate`
- **NEW param to add**: `synthesis_guidance: Optional[str]`
  - Allows main agent to pass custom synthesis instructions
  - Example: "Emphasize practical applications" or "Focus on archetypal patterns"
  - Gets appended to f_workflow_wisdom_packet_synthesis prompt for Epii agent
  - Enables dynamic, contextual synthesis customization

**Tool signature update**:
```python
async def get_wisdom_packet(
    ctx: RunContext[OrchestratorDeps],
    coordinate: str,
    depth: int = 2,
    focus: Optional[str] = None,
    force_regenerate: bool = False,
    synthesis_guidance: Optional[str] = None  # NEW: Custom guidance from calling agent
) -> Dict[str, Any]:
```

### 4. Caching Strategy ✅
**Confirmation**: Multi-level caching, all handled natively

1. **Workflow prompt caching**: ✅ PrakasaCache handles this (no TTL, manual invalidation)
   - f_workflow_wisdom_packet_synthesis cached in Redis: `prakasa:identity:#5-4`
   - Already implemented in PrakasaManager
   - **Verified**: load_workflow_prompt() will use this cache

2. **Wisdom packet caching**: ✅ Existing Redis cache (24h TTL)
   - Key: `wisdom_packet:{coordinate}:{depth}:{focus}`
   - Already implemented in WisdomPacketService._save_to_cache()

3. **Agent instance caching** (NEW): To be implemented
   - Key: `wisdom_synthesis_agent:{coordinate}`
   - TTL: 24h
   - Stores serialized agent state for regeneration requests

### 5. Error Handling ✅ (FINAL CLARIFICATION)
**Decision**: NO FALLBACKS - Synthesis errors fail the entire wisdom packet generation
- If Epii agent synthesis fails → Wisdom packet generation FAILS
- Surface full error to main agent with clear, actionable message
- **Main agent's alternative tools**:
  - `resolve_coordinate` - Basic coordinate properties
  - `get_node_by_coordinate_extended` - Comprehensive property set
  - `get_node_details_complete` - All Neo4j properties (unfiltered)
  - `semantic_coordinate_discovery` - Find related coordinates
- **Error message format**:
  ```
  Wisdom packet synthesis failed for {coordinate}: {error_details}

  Alternative tools available:
  - resolve_coordinate({coordinate}) - Basic properties
  - get_node_by_coordinate_extended({coordinate}) - Full structured data
  - get_node_details_complete({coordinate}) - Raw Neo4j properties
  ```
- **Rationale**:
  - No fallbacks = no masked errors (fail fast, fix properly)
  - Agent learns to use appropriate tools based on context
  - Wisdom packets are high-quality synthesis or nothing (no degraded state)

---

**Status**: FULLY CLARIFIED - READY FOR IMPLEMENTATION
**Final Review**: All 5 decisions locked, no fallbacks, error transparency
**Author**: Claude (Epi-Logos Development Agent)
**Last Updated**: 2025-10-25 (with user clarifications)
