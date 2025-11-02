# Tool Awareness Architecture - Where Tools Live

**Question**: Should tool guidance be in Neo4j properties or is docstring sufficient?

---

## How Pydantic AI Tools Work

### 1. Tool Registration (Setup Phase - Before Any Messages)

**Location**: `shared_tools.py` via `setup_all_cag_tools(agent)` or `setup_selective_tools(agent, ...)`

**Mechanism**:
```python
@agent.tool
async def resolve_coordinate(ctx: RunContext[OrchestratorDeps], coordinate: str) -> dict:
    """Resolve a Bimba coordinate to get its content and context."""
    bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
    return await bimba_client.resolve_coordinate(coordinate)
```

**What happens**:
1. `@agent.tool` decorator registers function with agent's internal `_function_tools` registry
2. Pydantic AI introspects function signature (parameters, types, return type)
3. Docstring becomes tool description sent to LLM
4. This happens ONCE during agent creation, NOT per-message

---

### 2. Tool Availability to LLM (Per API Call)

**When agent receives message**, Pydantic AI:
1. Converts registered tools to JSON schema format
2. Sends tool definitions to LLM via API call (OpenAI function calling format)
3. LLM sees tools as available functions it can invoke
4. **Tools are NOT in the system prompt** - they're in a separate `tools` parameter

**Example API payload** (simplified):
```json
{
  "model": "gpt-4o",
  "messages": [
    {"role": "system", "content": "You are Epii... [full system prompt]"},
    {"role": "user", "content": "What is #5?"}
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "resolve_coordinate",
        "description": "Resolve a Bimba coordinate to get its content and context.",
        "parameters": {
          "type": "object",
          "properties": {
            "coordinate": {"type": "string"}
          },
          "required": ["coordinate"]
        }
      }
    },
    // ... 31 more tool definitions
  ]
}
```

**Key point**: Tools are architectural (in `tools` array), not prompt content.

---

## Current Tool Descriptions - Are They Adequate?

### Example 1: Good Tool Description
```python
@agent.tool
async def search_docs(ctx: RunContext[None], query: str) -> str:
    """Search technical documentation for relevant sections.

    Use this tool when you need API references, implementation
    examples, or technical specifications to answer the user's question.
    Prioritize this over general knowledge for framework-specific queries.

    Args:
        query: Natural language description of what to search for

    Returns:
        Formatted documentation sections with source URLs
    """
```

**Has**:
- ✅ What it does
- ✅ When to use it (selection guidance)
- ✅ Returns description
- ✅ Parameter descriptions

---

### Example 2: Minimal Tool Description (Current Codebase)
```python
@agent.tool
async def resolve_coordinate(ctx: RunContext[OrchestratorDeps], coordinate: str) -> dict:
    """Resolve a Bimba coordinate to get its content and context."""
    bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
    return await bimba_client.resolve_coordinate(coordinate)
```

**Has**:
- ✅ What it does
- ❌ When to use it (selection guidance) - MISSING
- ❌ Returns description - MISSING
- ❌ Parameter descriptions - MISSING

**Problem**: LLM doesn't know WHEN to use this tool vs other coordinate tools.

---

## Two Options for Tool Guidance

### Option A: Enhanced Docstrings (Recommended - Pydantic AI Best Practice)

**Where**: In `shared_tools.py` directly

**Example**:
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

**Pros**:
- ✅ Standard Pydantic AI pattern
- ✅ Tool definition and guidance in same place
- ✅ No extra prompt complexity
- ✅ LLM gets guidance directly via API tools parameter

**Cons**:
- ❌ Tool guidance lives in code, not Neo4j
- ❌ Harder to update without code changes

---

### Option B: f_tool_orchestration Prompt Guidance (Neo4j Property)

**Where**: Agent node property `f_tool_orchestration` loaded into system prompt

**Example property on #5-4.5**:
```
f_tool_orchestration: """
## Tool Orchestration Guidance

**Bimba Namespace** (Canonical Knowledge):
- resolve_coordinate: Quick coordinate lookup (name, description, relationships)
- semantic_coordinate_discovery: Find coordinates by meaning/topic
- get_node_details_complete: Deep property inspection (use include_functional_properties=True for f_* props)
- get_path_between_coordinates: Discover connections between coordinates

**When to use which**:
- User asks "what is #5?" → resolve_coordinate
- User asks "find coordinates about synthesis" → semantic_coordinate_discovery
- Need f_protocol_* properties → get_node_details_complete with include_functional_properties=True
- Exploring relationships → get_coordinate_relationships or get_path_between_coordinates

**Graphiti Namespace** (Episodic Memory):
- remember_episode: Preserve insights/discoveries
- search_memory_patterns: Find prior explorations

**Operational Principle**: Check prior work first (search_memory_patterns) before building from scratch.
"""
```

**Pros**:
- ✅ Tool orchestration in Neo4j (updatable without code)
- ✅ Agent-specific guidance (Epii might use tools differently than Anuttara)
- ✅ Can include operational principles

**Cons**:
- ❌ Adds ~200-400 lines to system prompt
- ❌ Duplicates information already in tool docstrings
- ❌ LLM already gets tool descriptions via API

---

## Recommendation: Hybrid Approach

### 1. Enhanced Docstrings (Immediate - Code Level)

Update all tool docstrings in `shared_tools.py` to follow three-part pattern:
- What it does
- When to use it (vs similar tools)
- Returns description

**This is standard Pydantic AI best practice** and gives LLM selection guidance directly.

---

### 2. Optional f_tool_principles (Minimal - Neo4j)

NOT full tool orchestration (that's redundant), but **operational principles** for tool use:

```
f_tool_principles: """
**Tool Usage Principles:**
- Check prior work first: search_memory_patterns before building from scratch
- Navigate semantically: semantic_coordinate_discovery for concept-based lookup
- Preserve discoveries: remember_episode or update_bimba_node when insights emerge
- Use appropriate depth: resolve_coordinate for quick lookup, get_node_details_complete for deep inspection
"""
```

**~100 lines, principles not orchestration**. Complements tool docstrings with workflow guidance.

---

## Answer to Your Question

> "is adequate guidance given in the tools and their definitions beforehand?"

**Currently**: NO - our tool docstrings are minimal (just "what it does")

**Should be**: YES - enhance docstrings to include "when to use" guidance

**f_tool_guidance in Neo4j**: Optional for high-level principles, NOT for detailed tool orchestration (that's redundant with docstrings)

---

## Implementation Path

### Phase 1: Enhance Tool Docstrings (Immediate)
Update `shared_tools.py` with three-part descriptions for all 32 tools.

### Phase 2: Add f_tool_principles (Optional)
Add minimal operational principles to agent nodes if workflow-specific guidance needed.

**Example - current tool needs enhancement**:
```python
# CURRENT (inadequate)
@agent.tool
async def semantic_coordinate_discovery(ctx, query: str, max_results: int = 5) -> dict:
    """Search for coordinates using semantic similarity."""
    ...

# ENHANCED (adequate)
@agent.tool
async def semantic_coordinate_discovery(
    ctx: RunContext[OrchestratorDeps],
    query: str,
    max_results: int = 5
) -> dict:
    """Search for Bimba coordinates using semantic similarity to natural language query.

    Use this tool when you need to find coordinates based on concepts, topics, or
    meanings rather than exact coordinate notation. Complements resolve_coordinate
    (which requires exact coordinate) and lexical_coordinate_search (which requires
    exact substrings).

    Args:
        query: Natural language description of concept to find (e.g., "synthesis and completion")
        max_results: Maximum coordinates to return (default 5, supports mod6 alignment with 7)

    Returns:
        Dict with ranked coordinate matches including similarity scores and semantic context
    """
    bimba_client = HttpBimbaClient(ctx.deps.bimba_client)
    return await bimba_client.semantic_coordinate_discovery(query, max_results)
```

---

## Key Insight

**Tools are NOT part of the system prompt**. They're sent to the LLM via the API's `tools` parameter. Therefore:

1. **Tool selection guidance belongs IN THE DOCSTRING** (sent as tool description to LLM)
2. **Operational principles can be in prompt** (f_tool_principles) - workflow-level guidance
3. **Don't duplicate tool descriptions in prompt** - redundant and bloats prompt

The LLM chooses which tool based on:
- Tool name (semantic meaning)
- Tool description (docstring)
- Current conversation context

Our docstrings are currently too minimal - that's the real issue.
