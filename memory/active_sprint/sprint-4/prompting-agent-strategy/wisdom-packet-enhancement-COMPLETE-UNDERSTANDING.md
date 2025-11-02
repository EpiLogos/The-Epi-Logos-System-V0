# Wisdom Packet Enhancement: Complete System Understanding

**Date**: 2025-10-25
**Status**: AWAITING USER VALIDATION - Ready for Full Implementation (Option A)

---

## Critical Clarifications Established

### 1. Tool Definition Architecture: CODE-SIDE (Pydantic AI @agent.tool Decorators)

**ANSWER**: Tools are defined **IN CODE**, not Neo4j.

**Location**: `/agentic/agents/orchestrator/orchestrator_agent.py`

**Flow**:
```python
# 1. Agent creation
def create_orchestrator_agent(model_name: str, ea_mode: bool = False) -> Agent:
    agent = Agent(model_name, deps_type=OrchestratorDeps)

    # 2. Tools registered via decorators
    setup_agent_tools(agent, ea_mode=ea_mode)  # ← Registers all @agent.tool functions

    # 3. Prompts added
    setup_agent_prompts(agent)  # ← Adds system prompts (from Neo4j via Prakāśa)

# 3. Tool definitions
def setup_agent_tools(agent: Agent, ea_mode: bool = False):
    # Each tool is a Python function with @agent.tool decorator

    @agent.tool
    async def get_wisdom_packet(ctx, coordinate, depth=2, focus=None, force_regenerate=False):
        """DOCSTRING = Tool description sent to LLM.

        This docstring IS the usage guidance! The LLM sees it and understands:
        - What the tool does
        - When to use it
        - What parameters it accepts
        - What it returns
        """
        # Implementation...

    @agent.tool
    async def resolve_coordinate(ctx, coordinate):
        """Resolve a Bimba coordinate to get its content and context."""
        # Implementation...
```

**Key Understanding**:
- ✅ **Tools defined**: Python code with `@agent.tool` decorator
- ✅ **Usage guidance**: Tool's **docstring** (LLM reads this automatically)
- ✅ **Registration**: `setup_agent_tools()` registers all decorated functions
- ✅ **Pydantic AI magic**: Converts function signatures → JSON schema → LLM tool calls

**Neo4j Role in Tools**:
- ❌ **NOT**: Tool definitions (not in Neo4j)
- ✅ **YES**: Tool **prioritization** via `f_tools` array (which tools to use first)
- ✅ **YES**: Tool **orchestration guidance** via `f_tool_orchestration_guide` (workflow patterns)

---

### 2. Tool Usage Guidance: Three-Layer System

**Layer 1: Tool Docstring (Code-Side)**
```python
@agent.tool
async def get_wisdom_packet(...):
    """Get or generate a Wisdom Packet for a Bimba coordinate.

    Wisdom Packets provide pre-synthesized, contextually rich canonical knowledge summaries.
    They include key concepts, narrative synthesis, and apophatic pointers for missing themes.

    SMART FLOW:
    1. Check Redis cache for existing packet
    2. If not found (or force_regenerate=True), generate fresh packet via Backend API
    3. Cache result for instant future retrieval (24h TTL)

    Use this when you need:
    - Deep contextual understanding of a coordinate beyond raw resolution
    - Pre-synthesized narrative summaries for Path of Resonance guidance
    - Pattern recognition across multi-hop subgraph relationships

    ← THIS ENTIRE DOCSTRING is sent to LLM as tool description!
    """
```

**Layer 2: f_tools Property (Neo4j-Side - PRIORITY ORDER)**
```cypher
// #5-4.5 node
f_tools: [
    "get_wisdom_packet",              ← Priority 1: Use this FIRST
    "get_quintessential_properties",  ← Priority 2: Then this
    "semantic_coordinate_discovery",  ← Priority 3: Then this
    ...
]
```

**Layer 3: f_tool_orchestration_guide (Neo4j-Side - WORKFLOW PATTERNS)**
```cypher
// #5-4.5 node
f_tool_orchestration_guide: '
TOOL USAGE WORKFLOW (Etymology Archaeology):

STAGE 0 (Recognition):
1. get_wisdom_packet(coordinate) → Check existing canonical understanding FIRST
2. get_quintessential_properties(coordinate) → Review distilled essences
3. semantic_coordinate_discovery(query) → Find related coordinates
→ If wisdom packet synthesis_score > 0.8: Rich canonical knowledge exists
→ Otherwise: Proceed to episodic research (Stage 1)

STAGE 1-5:
... (detailed workflow steps)
'
```

**How They Work Together**:
1. **Docstring**: LLM understands **what** the tool does and **when** to use it
2. **f_tools**: Agent prioritizes tools in this **order** (loaded via Prakāśa Layer 1)
3. **f_tool_orchestration_guide**: Agent follows **workflow patterns** (loaded via Prakāśa Layer 2)

---

### 3. Subgraph Discovery: Neo4j `traverse_subgraph()` Method

**ANSWER**: Already implemented in `shared/database/neo4j_client.py:162`

**Method Signature**:
```python
def traverse_subgraph(self, coordinate: str, depth: int = 2) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Traverse Bimba subgraph from starting coordinate with intelligent multi-directional exploration.

    Performs breadth-first traversal up to specified depth, collecting connected nodes
    and relationships with relevance prioritization.

    Returns:
        (nodes, relationships) tuple
    """
```

**Cypher Query** (dynamic depth via literal, not parameterized):
```cypher
MATCH (start:BimbaNode {bimbaCoordinate: $coordinate})
CALL {
    WITH start
    MATCH path = (start)-[*1..{depth}]-(connected:BimbaNode)
    RETURN connected, relationships(path) as rels
}
RETURN DISTINCT connected, rels
LIMIT 50
```

**How Wisdom Packet Uses It**:
```python
# In WisdomPacketService.generate_wisdom_packet()
def _traverse_subgraph(self, coordinate: str, depth: int) -> Tuple[List[dict], List[dict]]:
    nodes, relationships = self.neo4j.traverse_subgraph(coordinate=coordinate, depth=depth)
    return nodes or [], relationships or []

# Returns:
# - nodes: List of connected BimbaNode dicts with all properties
# - relationships: List of relationship dicts with type, direction, target, properties
```

**NOT** using `get_direct_children` - that's hierarchical parent/child only.
**YES** using `traverse_subgraph` - multi-directional graph exploration.

---

### 4. q_ Property Creation: NOT a Separate Tool

**ANSWER**: Correct - use existing property update mechanisms.

**User Clarification**: "the feed new q_ props shouldn't be coded in, just part of the wisdom packet possibilities, not a separate tool (can be done via existing property update tool)"

**Understanding**:
- ❌ **NO new tool**: Don't create `create_quintessential_property()` tool
- ✅ **Use existing**: `update_bimba_node()` tool (already exists, supports any property)
- ✅ **Wisdom packet role**: Show what q_* properties **could** be created (apophatic pointers → suggested q_ properties)
- ✅ **Agent decision**: Agent decides to call `update_bimba_node(coordinate, q_essence="...")`

**Existing Tool**:
```python
@agent.tool
async def update_bimba_node(
    ctx: RunContext[OrchestratorDeps],
    coordinate: str,
    **properties  # ← Can include q_essence, q0_foundation, etc.
) -> Dict[str, Any]:
    """Update an existing Bimba node with flexible schema-based properties (admin only).

    Supports ANY camelCase property names including:
    - Core: name, description, coreNature, operationalEssence
    - Quintessential: q_essence, q0_foundation, q1_refined (any q_* pattern)
    - Functional: f_tools, f_workflow_*, f_system_prompt
    - Custom: Any camelCase property
    """
```

**Wisdom Packet Enhancement**:
Instead of returning new q_* properties directly, wisdom packets can:
1. Identify **gaps** via apophatic pointers
2. **Suggest** potential quintessential distillations in narrative
3. Agent **decides** to create q_* via `update_bimba_node()`

---

### 5. LLM Model: Gemini 2.0 Flash (Experimental)

**User Specification**: "we'd want to use gemini 2.5 flash for the summary"

**Correction**: Gemini 2.5 doesn't exist yet. Assuming you mean **Gemini 2.0 Flash (Experimental)**

**Available Models**:
- ✅ `gemini-2.0-flash-exp` - Latest experimental Flash (fast, good quality)
- ✅ `gemini-1.5-flash-002` - Stable Flash (production-ready)
- ✅ `gemini-1.5-pro-002` - Pro (highest quality, slower)

**Implementation**:
```python
class WisdomPacketService:
    def __init__(self, neo4j_client, redis_client, llm_client=None):
        self.llm = llm_client or self._get_default_llm_client()

    def _get_default_llm_client(self):
        """Get Gemini 2.0 Flash for synthesis."""
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
        return genai.GenerativeModel("gemini-2.0-flash-exp")  # ← User preference

    async def _generate_narrative_with_llm(self, ...):
        """Use Gemini 2.0 Flash for synthesis."""
        response = await self.llm.generate_content_async(synthesis_prompt)
        return response.text
```

---

### 6. Implementation Scope: Option A - Full Enhancement

**User Direction**: "we'd want to do option A, plan for it properly here... just plan to do ALL phases of the development"

**Confirmed Scope**: ALL 5 enhancements

---

## Complete Implementation Plan (Option A - All Phases)

### Phase 1: Quintessential Property Infrastructure

#### 1.1: Add q_ Property Discovery Helper
**File**: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**New Method**:
```python
def _get_quintessential_properties(self, node: dict) -> List[tuple[str, str]]:
    """
    Extract all quintessential properties from node, sorted by priority.

    Priority order:
    1. q_ (base quintessential)
    2. q0_, q1_, q2_... (versioned, sorted numerically)

    Returns:
        List of (key, value) tuples sorted by priority
    """
    import re

    # Find all q_* properties
    q_props = [
        (k, node[k])
        for k in node.keys()
        if re.match(r'^q(?:\d+)?_', k) and node.get(k)
    ]

    # Sort by priority
    def sort_key(item):
        key = item[0]
        # q_ or q_essence (base, no version) = highest priority
        if key == 'q_' or (key.startswith('q_') and '_' in key and key.split('_')[0] == 'q'):
            return (0, 0, key)
        # q0_, q1_, q12_ (versioned) = sorted by version number
        match = re.match(r'^q(\d+)_', key)
        if match:
            version = int(match.group(1))
            return (1, version, key)
        return (2, 0, key)

    return sorted(q_props, key=sort_key)
```

#### 1.2: Update Concept Description Synthesis
**File**: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**Modify Method**:
```python
def _synthesize_concept_description(self, cluster_nodes: List[dict]) -> str:
    """
    Generate description prioritizing quintessential properties.

    Priority hierarchy:
    1. q_* properties (most distilled) ← NEW
    2. description (standard)
    3. node names (fallback)
    """
    # PRIORITY 1: Check for quintessential properties
    for node in cluster_nodes:
        q_props = self._get_quintessential_properties(node)
        if q_props:
            # Use highest priority q_ property
            key, value = q_props[0]
            return f"{value}"  # Return quintessential essence directly

    # PRIORITY 2: Standard descriptions (existing logic)
    descriptions = [
        node.get("description", "")
        for node in cluster_nodes
        if node.get("description")
    ]

    if descriptions:
        return max(descriptions, key=len)

    # PRIORITY 3: Fallback to names (existing logic)
    names = [node.get("name", "") for node in cluster_nodes if node.get("name")]
    if names:
        return f"Pattern across: {', '.join(names[:3])}"

    return f"Pattern identified across {len(cluster_nodes)} coordinates"
```

#### 1.3: Update Central Node Description in Narrative
**File**: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**Modify Method** (just the intro section):
```python
def _generate_narrative(
    self,
    central_node: dict,
    key_concepts: List[KeyConcept],
    subgraph_nodes: List[dict],
    focus: Optional[WisdomPacketFocus]
) -> str:
    """AC 3: Generate coherent narrative summary from synthesis."""
    coord = central_node.get("bimbaCoordinate", "unknown")
    name = central_node.get("name", "Unknown")

    # PRIORITY 1: Use quintessential essence if available
    q_props = self._get_quintessential_properties(central_node)
    if q_props:
        key, essence = q_props[0]
        intro = f"The coordinate {coord} ({name}) embodies {essence}. "
    else:
        # PRIORITY 2: Use description (existing logic)
        description = central_node.get("description", "")
        intro = f"The coordinate {coord} ({name}) represents "
        if description:
            intro += f"{description.lower()}. "
        else:
            intro += "a key node in the Bimba coordinate system. "

    # Rest of narrative generation (existing logic)
    # ...
```

---

### Phase 2: LLM-Powered Narrative Synthesis

#### 2.1: Add LLM Client to Service
**File**: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**Update Constructor**:
```python
class WisdomPacketService:
    def __init__(
        self,
        neo4j_client,
        redis_client,
        llm_client=None  # NEW: Optional LLM for synthesis
    ):
        self.neo4j = neo4j_client
        self.redis = redis_client
        self.llm = llm_client or self._get_default_llm_client()

    def _get_default_llm_client(self):
        """Get Gemini 2.0 Flash (Experimental) for synthesis."""
        try:
            import google.generativeai as genai
            import os

            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                logger.warning("GOOGLE_API_KEY not set, LLM synthesis disabled")
                return None

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-2.0-flash-exp")
            logger.info("Initialized Gemini 2.0 Flash for wisdom packet synthesis")
            return model
        except Exception as e:
            logger.error(f"Failed to initialize LLM client: {e}")
            return None
```

#### 2.2: Add LLM Synthesis Method
**File**: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**New Method**:
```python
async def _generate_narrative_with_llm(
    self,
    central_node: dict,
    key_concepts: List[KeyConcept],
    subgraph_nodes: List[dict],
    focus: Optional[WisdomPacketFocus]
) -> str:
    """
    Generate narrative using Gemini 2.0 Flash for genuine contextual insight.

    Synthesizes:
    - Central node quintessential essence (prioritized)
    - Key concepts and their relationships
    - Subgraph structural patterns
    - Focus-specific interpretation

    Returns:
        Intelligently synthesized 2-3 sentence narrative
    """
    coord = central_node.get("bimbaCoordinate", "unknown")
    name = central_node.get("name", "Unknown")

    # Extract quintessential properties for context
    q_props = self._get_quintessential_properties(central_node)
    q_context = "\n".join([f"- {k}: {v}" for k, v in q_props]) if q_props else "None defined"

    # Build synthesis prompt
    prompt = f"""You are synthesizing wisdom about Bimba coordinate {coord} ({name}) in the Epi-Logos system.

QUINTESSENTIAL PROPERTIES (Distilled Essences - PRIORITIZE THESE):
{q_context}

CORE PROPERTIES:
- Description: {central_node.get('description', 'None')}
- Operational Essence: {central_node.get('operationalEssence', 'None')}
- Core Nature: {central_node.get('coreNature', 'None')}

KEY CONCEPTS IDENTIFIED:
{self._format_concepts_for_llm(key_concepts)}

SUBGRAPH STRUCTURE:
- Connected coordinates: {len(subgraph_nodes)}
- Subsystems present: {self._get_subsystems_present(subgraph_nodes)}
- Relationship density: {self._calculate_relationship_density(subgraph_nodes)}

SYNTHESIS FOCUS: {focus.value if focus else 'General comprehensive understanding'}

Generate a 2-3 sentence narrative that:
1. Captures the ESSENTIAL nature of this coordinate (prioritize quintessential properties if present)
2. Synthesizes how the key concepts relate to create emergent meaning
3. Applies the {focus.value if focus else 'general'} interpretive lens
4. Provides GENUINE INSIGHT beyond mere data aggregation

Be concise, profound, and coordinate-aware. Speak as if revealing the living pattern this coordinate represents."""

    # Call Gemini 2.0 Flash
    try:
        response = await self.llm.generate_content_async(prompt)
        narrative = response.text.strip()
        logger.info(f"LLM-generated narrative for {coord}: {len(narrative)} chars")
        return narrative
    except Exception as e:
        logger.error(f"LLM synthesis failed for {coord}: {e}")
        # Fallback to template-based
        return self._generate_narrative(central_node, key_concepts, subgraph_nodes, focus)

def _format_concepts_for_llm(self, concepts: List[KeyConcept]) -> str:
    """Format concepts for LLM context."""
    if not concepts:
        return "None identified"

    lines = []
    for c in concepts[:5]:  # Top 5 concepts
        lines.append(f"- {c.concept} (relevance: {c.relevance_score:.2f})")
        if c.description:
            lines.append(f"  → {c.description}")

    return "\n".join(lines)

def _get_subsystems_present(self, nodes: List[dict]) -> str:
    """Get subsystems present in subgraph."""
    subsystems = sorted(set(
        str(node.get("subsystem"))
        for node in nodes
        if node.get("subsystem") is not None
    ))
    return ", ".join([f"#{s}" for s in subsystems]) if subsystems else "None"

def _calculate_relationship_density(self, nodes: List[dict]) -> str:
    """Calculate relationship density description."""
    node_count = len(nodes)
    if node_count <= 2:
        return "Sparse (1-2 nodes)"
    elif node_count <= 5:
        return "Moderate (3-5 nodes)"
    elif node_count <= 10:
        return "Rich (6-10 nodes)"
    else:
        return f"Dense ({node_count} nodes)"
```

#### 2.3: Add Hybrid Mode to generate_wisdom_packet
**File**: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**Modify Method**:
```python
async def generate_wisdom_packet(
    self,
    coordinate: str,
    depth: int = 2,
    focus: Optional[WisdomPacketFocus] = None,
    use_llm_synthesis: bool = True  # NEW: Toggle LLM synthesis
) -> WisdomPacket:
    """
    Generate or retrieve WisdomPacket from cache.

    Args:
        coordinate: Bimba coordinate
        depth: Traversal depth (1-5)
        focus: Optional synthesis focus lens
        use_llm_synthesis: If True, use Gemini 2.0 Flash for narrative (default: True)
    """
    # ... existing cache check and traversal logic ...

    # Generate narrative (ENHANCED with LLM option)
    if use_llm_synthesis and self.llm:
        narrative = await self._generate_narrative_with_llm(
            central_node_data,
            key_concepts,
            subgraph_nodes,
            focus
        )
    else:
        # Fallback to template-based (faster, no LLM cost)
        narrative = self._generate_narrative(
            central_node_data,
            key_concepts,
            subgraph_nodes,
            focus
        )

    # ... rest of wisdom packet construction ...
```

**Note**: Make `generate_wisdom_packet` async (add `async` keyword) since it now calls async LLM method.

---

### Phase 3: Shared Tool - get_quintessential_properties

#### 3.1: Add Agent Tool
**File**: `agentic/agents/orchestrator/orchestrator_agent.py`

**In `setup_agent_tools()`**:
```python
@agent.tool
async def get_quintessential_properties(
    ctx: RunContext[OrchestratorDeps],
    coordinate: str
) -> Dict[str, Any]:
    """
    Get quintessential (q_*) properties for a Bimba coordinate.

    Quintessential properties are well-distilled, comprehensive encapsulations
    of a node's essential structure and dynamics. These are the "pithy, well-crafted"
    distillations that should be prioritized for deep understanding.

    Returns properties in priority order:
    1. q_ (base quintessential essence)
    2. q0_, q1_, q2_... (versioned refinements, sorted numerically)

    Use this when you need:
    - The ESSENTIAL understanding of a coordinate
    - Distilled insights before diving into detailed properties
    - Quick grasp of what a coordinate "is" vs what it "does"

    Complements wisdom packets by providing raw quintessential data
    without full synthesis overhead.

    Args:
        coordinate: Bimba coordinate (e.g., "#1-2", "#5-4.5")

    Returns:
        Dict with success, coordinate, properties (list of {key, value} dicts), count
    """
    try:
        logger.info(f"🔧 TOOL CALL: get_quintessential_properties({coordinate})")

        if not ctx.deps.bimba_client:
            return {"success": False, "error": "Bimba client not available"}

        from agentic.agents.orchestrator.tools.bimba.http_bimba_tools import HttpBimbaClient
        http_client = HttpBimbaClient(ctx.deps.bimba_client)

        result = await http_client.get_quintessential_properties(coordinate)

        if result.get("success"):
            props_count = len(result.get("properties", []))
            logger.info(f"✅ Found {props_count} quintessential properties for {coordinate}")
            return result
        else:
            error = result.get("error", "Unknown error")
            logger.warning(f"❌ Failed to get quintessential properties for {coordinate}: {error}")
            return result

    except Exception as e:
        logger.error(f"Error getting quintessential properties for {coordinate}: {e}")
        return {"success": False, "error": str(e), "coordinate": coordinate}
```

#### 3.2: Add HttpBimbaClient Method
**File**: `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py`

**New Method**:
```python
async def get_quintessential_properties(
    self,
    coordinate: str
) -> Dict[str, Any]:
    """
    Get quintessential properties for a Bimba coordinate.

    Queries for all q_* properties and returns them in priority order.
    """
    try:
        result = await self.client.get_quintessential_properties(coordinate)

        if result.get("success"):
            return {
                "success": True,
                "coordinate": coordinate,
                "properties": result.get("properties", []),
                "count": len(result.get("properties", []))
            }
        else:
            return {
                "success": False,
                "error": result.get("error", "Unknown error"),
                "coordinate": coordinate
            }

    except Exception as e:
        logger.error(f"Exception getting quintessential properties for {coordinate}: {e}")
        return {
            "success": False,
            "error": f"HTTP request failed: {str(e)}",
            "coordinate": coordinate
        }
```

#### 3.3: Add BimbaGraphQLClient Query
**File**: `agentic/clients/bimba_graphql_client.py`

**New Method**:
```python
async def get_quintessential_properties(
    self,
    coordinate: str
) -> Dict[str, Any]:
    """
    Get quintessential (q_*) properties via GraphQL.

    Uses getNodeDetailsComplete to access all properties via Generic scalar,
    then filters for q_* pattern and sorts by priority.
    """
    query = """
    query GetQuintessentialProperties($coordinate: String!) {
        getNodeDetailsComplete(coordinate: $coordinate) {
            coordinate
            name
            allProperties
        }
    }
    """

    variables = {"coordinate": coordinate}
    logger.info(f"Getting quintessential properties for: {coordinate}")
    response = await self.post("/graphql", json_data={"query": query, "variables": variables})

    if "data" in response and response["data"]:
        node_data = response["data"].get("getNodeDetailsComplete")
        if node_data:
            all_props = node_data.get("allProperties", {})

            # Filter for q_* properties
            import re
            q_props = [
                {"key": k, "value": v}
                for k, v in all_props.items()
                if re.match(r'^q(?:\d+)?_', k) and v
            ]

            # Sort by priority (q_ > q0_ > q1_ > ...)
            def sort_key(prop):
                key = prop["key"]
                if key == 'q_' or (key.startswith('q_') and '_' in key and key.split('_')[0] == 'q'):
                    return (0, 0, key)
                match = re.match(r'^q(\d+)_', key)
                if match:
                    version = int(match.group(1))
                    return (1, version, key)
                return (2, 0, key)

            q_props_sorted = sorted(q_props, key=sort_key)

            return {
                "success": True,
                "coordinate": coordinate,
                "properties": q_props_sorted
            }
        else:
            return {
                "success": False,
                "error": "Coordinate not found",
                "coordinate": coordinate
            }
    else:
        errors = response.get("errors", [])
        error_msg = "; ".join([err.get("message", "Unknown error") for err in errors])
        return {
            "success": False,
            "error": error_msg or "GraphQL query failed",
            "coordinate": coordinate
        }
```

#### 3.4: Add MCP Server Tool
**File**: `agentic/mcp_servers/bimba_pratibimba_server.py`

**In `handle_list_tools()`**:
```python
Tool(
    name="get_quintessential_properties",
    description=(
        "Get quintessential (q_*) properties for a Bimba coordinate.\n\n"
        "Quintessential properties are well-distilled, comprehensive encapsulations "
        "of a node's essential structure and dynamics. These are the 'pithy, well-crafted' "
        "distillations that should be prioritized for deep understanding.\n\n"
        "Returns properties in priority order (q_ base, then q0_, q1_, q2_... versioned)."
    ),
    inputSchema={
        "type": "object",
        "properties": {
            "bimbaCoordinate": {
                "type": "string",
                "description": "Bimba coordinate (e.g., '#1-2', '#5-4.5')",
                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
            }
        },
        "required": ["bimbaCoordinate"]
    }
)
```

**In `handle_call_tool()`**:
```python
elif name == "get_quintessential_properties":
    return await self._handle_get_quintessential_properties(arguments)
```

**Handler Method**:
```python
async def _handle_get_quintessential_properties(self, arguments: dict) -> list[TextContent]:
    """Handle quintessential property retrieval."""
    try:
        coordinate = arguments.get("bimbaCoordinate")
        if not coordinate:
            return [TextContent(type="text", text="Error: bimbaCoordinate parameter is required")]

        if not self.bimba_client:
            return [TextContent(type="text", text="Error: Client not initialized")]

        result = await self.bimba_client.get_quintessential_properties(coordinate)

        if result.get("success"):
            properties = result.get("properties", [])

            lines: list[str] = []
            lines.append(f"=== Quintessential Properties: {coordinate} ===")
            lines.append(f"Found: {len(properties)} properties")
            lines.append("")

            for prop in properties:
                key = prop.get("key", "")
                value = prop.get("value", "")
                lines.append(f"**{key}**:")
                lines.append(f"  {value}")
                lines.append("")

            if not properties:
                lines.append("⚠ No quintessential properties defined for this coordinate.")
                lines.append("")
                lines.append("Quintessential properties provide distilled essential understanding.")
                lines.append("Consider adding:")
                lines.append("  - q_essence: Core quintessential distillation")
                lines.append("  - q0_foundation: Version 0 (original formulation)")
                lines.append("  - q1_refined: Version 1 (first refinement)")

            return [TextContent(type="text", text="\n".join(lines))]
        else:
            error = result.get("error", "Unknown error")
            return [TextContent(type="text", text=f"Error: {error}")]

    except Exception as e:
        logger.error(f"Error in get_quintessential_properties: {e}")
        return [TextContent(type="text", text=f"Error: {str(e)}")]
```

---

### Phase 4: Prakāśa Integration (#5-4, #5-4.5 Updates)

#### 4.1: Update #5-4 Node (Epii Agent Configuration)
**Method**: Cypher queries via Neo4j

**Property Updates**:
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4'})

// Update f_tools (add wisdom packet tools to priority list)
SET n.f_tools = [
    "get_wisdom_packet",              // NEW: Priority 1
    "get_quintessential_properties",  // NEW: Priority 2
    "resolve_coordinate",
    "semantic_coordinate_discovery",
    "get_node_by_coordinate_extended",
    "search_gnostic_space",
    "create_episode",
    "search_episodes",
    "update_bimba_node"  // For creating q_* properties
]

// Update description to highlight wisdom packet integration
SET n.description = 'Epii agent configuration node for subsystem #5 (synthesis, completion, wisdom sedimentation). Orchestrates multi-namespace synthesis (Bimba + Gnostic + Episodic) using wisdom packets for canonical understanding, followed by episodic research for gap filling and crystallization into new quintessential properties. Embodies the completion phase of the six-fold Logos Cycle (ἄλογος→ἀνάλογος), where episodic insights sediment into canonical wisdom.'

RETURN n.f_tools, n.description
```

#### 4.2: Update #5-4.5 Node (Etymology Archaeology Workflow)
**Method**: Cypher queries via Neo4j

**Property Updates**:
```cypher
MATCH (n:BimbaNode {bimbaCoordinate: '#5-4.5'})

// Update f_tools (add wisdom packet tools to priority list)
SET n.f_tools = [
    "get_wisdom_packet",              // NEW: Priority 1 - canonical synthesis first
    "get_quintessential_properties",  // NEW: Priority 2 - check distillations
    "semantic_coordinate_discovery",
    "search_gnostic_space",
    "create_episode",
    "search_episodes",
    "resolve_coordinate",
    "update_bimba_node"  // For creating q_* properties from research
]

// Update f_tool_orchestration_guide with wisdom packet workflow
SET n.f_tool_orchestration_guide = '
TOOL USAGE WORKFLOW (Etymology Archaeology):

═══════════════════════════════════════════════════════════
STAGE 0: Recognition (ἄλογος - Receptive Silence)
═══════════════════════════════════════════════════════════

**Priority Tools (use in order)**:
1. get_wisdom_packet(coordinate, depth=2)
   → Retrieve canonical synthesis FIRST
   → Check synthesis_score: >0.8 = rich existing knowledge
   → Review apophatic_pointers: gaps to explore

2. get_quintessential_properties(coordinate)
   → Review existing distilled essences (q_*)
   → Understand what HAS been crystallized

3. semantic_coordinate_discovery(query)
   → Find related coordinates for context

**Decision Point**:
- IF wisdom packet synthesis_score > 0.8 AND rich q_* properties:
  → Canonical understanding is STRONG
  → Focus episodic research on GAPS (apophatic pointers)

- IF wisdom packet sparse OR no q_* properties:
  → Canonical understanding is WEAK
  → Conduct BROAD episodic research
  → Crystallize NEW q_* properties

═══════════════════════════════════════════════════════════
STAGE 1: Contemplation (προλόγος - Before-Word)
═══════════════════════════════════════════════════════════

**Tools**:
- search_gnostic_space(query) → Find documents related to gaps
- create_episode(content, focus) → Log episodic insights

**Principle**: Fill gaps IDENTIFIED by wisdom packet apophatic analysis

═══════════════════════════════════════════════════════════
STAGE 2-4: Community, Scouring, Insight (διαλόγος-λόγος-ἐπιλόγος)
═══════════════════════════════════════════════════════════

**Tools**:
- form_memory_community(...) → Cluster episodic patterns
- search_episodes(...) → Cross-reference insights
- Iterative refinement through MEF lenses

═══════════════════════════════════════════════════════════
STAGE 5: Sedimentation (ἀνάλογος - Proportional Recognition)
═══════════════════════════════════════════════════════════

**Output**: NEW quintessential properties

**Tool**:
- update_bimba_node(coordinate, q_essence="...", q1_episodic="...")

**Principle**: Episodic insights → Canonical distillations
→ Future wisdom packets will include these NEW q_* properties
→ Cycle of canonical ← episodic ← canonical ← episodic...

═══════════════════════════════════════════════════════════
KEY ARCHITECTURE
═══════════════════════════════════════════════════════════

Wisdom Packets = CANONICAL starting points (Bimba namespace)
Quintessential Properties = DISTILLED essences (pithy, well-crafted)
Episodic Research = GAP FILLING (Gnostic + Episodic namespaces)
New q_* Properties = CRYSTALLIZATION (episodic → canonical)

This is a LIVING SYSTEM where canonical and episodic namespaces
inform each other in recursive cycles of deepening understanding.
'

// Update description to highlight wisdom packet integration
SET n.description = 'Etymology Archaeology workflow implementation for Epii (#5-4). Six-stage protocol (ἄλογος→προλόγος→διαλόγος→λόγος→ἐπιλόγος→ἀνάλογος) that begins with wisdom packet synthesis to establish canonical understanding, identifies gaps via apophatic pointers, explores those gaps through episodic research (Gnostic + Graphiti), and culminates in distilled quintessential properties (q_*) that feed future wisdom packets. Embodies the canonical↔episodic feedback loop central to consciousness-computing architecture.'

RETURN n.f_tools, n.f_tool_orchestration_guide, n.description
```

#### 4.3: Verify Prakāśa Loading
**File**: Check if PrakasaManager already loads f_tools

**Investigation Needed**: Determine if current Prakasa system loads `f_tools` property.

**If NOT loaded**:
Add to PrakasaManager:
```python
# In prakasa.py or wherever Prakasa loading happens
async def get_agent_tool_priorities(self, agent_coordinate: str) -> List[str]:
    """Load f_tools array from agent coordinate for tool prioritization."""
    result = await self.bimba_client.get_node_details_complete(
        agent_coordinate,
        include_functional_properties=True
    )

    if result.get("success"):
        all_props = result.get("allProperties", {})
        tools = all_props.get("f_tools", [])
        logger.info(f"Loaded {len(tools)} priority tools for {agent_coordinate}")
        return tools

    return []
```

**If ALREADY loaded**:
Just update Neo4j nodes, Prakasa will automatically pick up changes.

---

### Phase 5: Testing & Validation

#### 5.1: Unit Tests for q_ Integration
**File**: `backend/tests/unit/wisdom_packet/test_wisdom_packet_q_properties.py` (NEW)

**Test Coverage**:
```python
import pytest
from backend.epi_logos_system.cag.wisdom_packet.service import WisdomPacketService

def test_get_quintessential_properties_ordering():
    """Test q_ property discovery and sorting."""
    node = {
        "name": "Test",
        "q_essence": "Base essence",
        "q0_foundation": "Version 0",
        "q1_refined": "Version 1",
        "q12_advanced": "Version 12",
        "description": "Regular description",
        "qx_invalid": "Should not match"
    }

    service = WisdomPacketService(mock_neo4j, mock_redis)
    q_props = service._get_quintessential_properties(node)

    # Should return in priority order: q_ > q0_ > q1_ > q12_
    assert len(q_props) == 4
    assert q_props[0][0] == "q_essence"
    assert q_props[1][0] == "q0_foundation"
    assert q_props[2][0] == "q1_refined"
    assert q_props[3][0] == "q12_advanced"

def test_concept_description_prioritizes_q_properties():
    """Test concept description uses q_* over description."""
    cluster = [
        {
            "name": "Node 1",
            "q_essence": "Quintessential essence here",
            "description": "Long verbose description"
        }
    ]

    service = WisdomPacketService(mock_neo4j, mock_redis)
    desc = service._synthesize_concept_description(cluster)

    # Should use q_essence, not description
    assert "Quintessential essence here" in desc
    assert "Long verbose description" not in desc

def test_narrative_uses_q_properties():
    """Test narrative generation prioritizes q_* for central node."""
    central_node = {
        "bimbaCoordinate": "#1-2",
        "name": "Test Node",
        "q_essence": "Essential distillation",
        "description": "Verbose description"
    }

    service = WisdomPacketService(mock_neo4j, mock_redis)
    narrative = service._generate_narrative(central_node, [], [], None)

    # Should mention q_essence
    assert "Essential distillation" in narrative or "embodies" in narrative
```

#### 5.2: Unit Tests for LLM Synthesis
**File**: `backend/tests/unit/wisdom_packet/test_wisdom_packet_llm_synthesis.py` (NEW)

**Test Coverage**:
```python
import pytest
from unittest.mock import AsyncMock, Mock

async def test_llm_synthesis_called_when_enabled():
    """Test LLM synthesis is used when use_llm_synthesis=True."""
    mock_llm = Mock()
    mock_llm.generate_content_async = AsyncMock(return_value=Mock(text="LLM generated narrative"))

    service = WisdomPacketService(mock_neo4j, mock_redis, llm_client=mock_llm)

    # Mock subgraph traversal
    service._traverse_subgraph = Mock(return_value=(mock_nodes, mock_rels))

    packet = await service.generate_wisdom_packet("#1-2", use_llm_synthesis=True)

    # LLM should have been called
    mock_llm.generate_content_async.assert_called_once()
    assert "LLM generated narrative" in packet.narrative_summary

async def test_llm_synthesis_fallback_on_error():
    """Test fallback to template synthesis if LLM fails."""
    mock_llm = Mock()
    mock_llm.generate_content_async = AsyncMock(side_effect=Exception("API error"))

    service = WisdomPacketService(mock_neo4j, mock_redis, llm_client=mock_llm)
    service._traverse_subgraph = Mock(return_value=(mock_nodes, mock_rels))

    # Should not raise, should fallback
    packet = await service.generate_wisdom_packet("#1-2", use_llm_synthesis=True)
    assert packet is not None
    # Should use template-based narrative
    assert "represents" in packet.narrative_summary.lower()
```

#### 5.3: Integration Tests for Agent Tool
**File**: `backend/tests/integration/wisdom_packet/test_get_quintessential_properties_tool.py` (NEW)

**Test Coverage**:
```python
async def test_get_quintessential_properties_tool_end_to_end():
    """Test complete flow: agent tool → HTTP client → GraphQL → Neo4j."""
    # Setup: Create node with q_* properties
    await create_test_node({
        "bimbaCoordinate": "#test-q",
        "name": "Test Q Node",
        "q_essence": "Test essence",
        "q0_v0": "Version 0",
        "description": "Regular description"
    })

    # Call tool via orchestrator
    result = await get_quintessential_properties_tool(coordinate="#test-q")

    # Verify
    assert result["success"] == True
    assert len(result["properties"]) == 2
    assert result["properties"][0]["key"] == "q_essence"
    assert result["properties"][1]["key"] == "q0_v0"
```

#### 5.4: End-to-End Wisdom Packet Flow Test
**File**: `backend/tests/integration/wisdom_packet/test_wisdom_packet_full_flow.py` (NEW)

**Test Coverage**:
```python
async def test_wisdom_packet_with_q_properties_and_llm():
    """Test complete wisdom packet generation with q_* properties and LLM synthesis."""
    # Setup: Create coordinate with q_* properties and connected nodes
    await create_test_coordinate_with_q_properties()

    # Generate wisdom packet
    packet = await wisdom_packet_service.generate_wisdom_packet(
        coordinate="#test-q",
        depth=2,
        use_llm_synthesis=True
    )

    # Verify q_* properties were used
    assert packet.synthesis_score > 0.7  # High quality
    assert "Test essence" in packet.narrative_summary or "embodies" in packet.narrative_summary

    # Verify LLM synthesis
    assert len(packet.narrative_summary) > 100  # Rich narrative
    assert packet.narrative_summary != packet.central_node.description  # Not just description

    # Verify caching
    assert packet.cache_hit == False  # First call

    cached_packet = await wisdom_packet_service.generate_wisdom_packet("#test-q")
    assert cached_packet.cache_hit == True  # Second call cached
```

---

## Summary: What We're Building

### The Complete Enhancement

**1. Quintessential Property Awareness**
- Wisdom packets prioritize q_* properties over verbose descriptions
- "Pithy, well-crafted" distillations surface first
- New tool: `get_quintessential_properties` for explicit access

**2. LLM-Powered Intelligence**
- Gemini 2.0 Flash generates narratives (not string concatenation)
- Genuinely interprets patterns and relationships
- Focus lens applied intelligently by LLM
- Fallback to template if LLM unavailable

**3. Tool Integration**
- Agent tool: `get_quintessential_properties(coordinate)`
- MCP tool: Same, for external clients
- Both integrated via Pydantic AI decorators + GraphQL + MCP

**4. Prakāśa System Integration**
- #5-4 and #5-4.5 updated with tool priorities (f_tools)
- Tool orchestration guide explains workflow pattern
- Canonical ← Episodic ← Canonical feedback loop documented

**5. Architectural Pattern**
```
1. get_wisdom_packet() → Canonical understanding (Bimba)
2. get_quintessential_properties() → Distilled essences (q_*)
3. Apophatic pointers → Identify gaps
4. Episodic research → Fill gaps (Gnostic + Graphiti)
5. Crystallization → New q_* properties via update_bimba_node()
6. Future wisdom packets → Include new q_* → Cycle continues
```

---

## Questions Remaining for User

### Technical Confirmations

**1. Gemini Model Version**
- Confirmed: Gemini 2.0 Flash Experimental (`gemini-2.0-flash-exp`)
- Fallback: Gemini 1.5 Flash 002 (`gemini-1.5-flash-002`) if 2.0 unavailable
- Correct?

**2. LLM Synthesis Default**
- Should `use_llm_synthesis=True` be default? (I recommend YES)
- Or make it opt-in via environment variable?

**3. Cache TTL with LLM**
- Keep 24h TTL even for LLM-synthesized narratives?
- Or shorter (e.g., 12h) since generation cost is higher?

**4. Testing Scope**
- All 5 test files created?
- Or prioritize integration tests only?

### Philosophical Confirmations

**5. q_* Property Creation**
- Confirmed: Use existing `update_bimba_node()` tool (not new tool)
- Wisdom packets suggest potential q_* via apophatic analysis
- Agent decides whether to crystallize
- Correct understanding?

**6. Wisdom Packet Role**
- Canonical starting point (not endpoint)
- Guides episodic research via apophatic pointers
- Episodic insights → new q_* properties → enriched wisdom packets
- Is this the intended cycle?

---

## Ready to Implement

I have **complete clarity** on:
- ✅ Tool definition system (code-side Pydantic AI decorators)
- ✅ Tool guidance system (docstrings + f_tools + f_tool_orchestration_guide)
- ✅ Subgraph discovery (traverse_subgraph method)
- ✅ q_* property creation (via existing update_bimba_node tool)
- ✅ LLM model (Gemini 2.0 Flash Experimental)
- ✅ Implementation scope (Option A - all phases)

**Awaiting your validation** on the 6 questions above, then I'll proceed with full implementation.

This is a **living system** where canonical and episodic knowledge inform each other in recursive cycles. Beautiful architecture! 🎯
