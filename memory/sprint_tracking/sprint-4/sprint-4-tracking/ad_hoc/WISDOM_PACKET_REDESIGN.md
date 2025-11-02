# Wisdom Packet Synthesis Redesign
## LLM-Guided Multi-Phase Tool-Based Generation

### Current Issues
1. Agent returns malformed key_concepts (lists instead of strings)
2. No root context grounding (missing connection to `#`)
3. No architectural lineage awareness (path from coordinate → `#`)
4. Generic/duplicate concepts from keyword clustering
5. Workflow prompt unnecessary complexity

### New Design: Autonomous Agent Workflow

#### Tool Whitelist for Wisdom Packet Synthesis
Agent gets access to these Bimba MCP tools:
- `get_node_by_coordinate_extended(coordinate)` - Full node properties
- `get_path_between_coordinates(start, end, max_hops)` - Path discovery
- `get_node_relationships(coordinate)` - Direct edges
- `get_direct_children(coordinate)` - Child nodes

#### Multi-Phase Synthesis Protocol

**Phase 1: ROOT CONTEXT GROUNDING**
```python
# Agent calls:
root_context = get_node_by_coordinate_extended("#")

# Agent reasons:
# - What are the system's foundational principles?
# - What is the architectural essence at root?
# - How does root inform all coordinates?

# Result: System-wide grounding
```

**Phase 2: PATH TO ROOT DISCOVERY**
```python
# Agent calls:
path_to_root = get_path_between_coordinates(coordinate, "#", max_hops=5)

# Agent reasons:
# - How does this coordinate descend from root?
# - What properties are inherited vs specialized?
# - What is the architectural genealogy?

# Result: Lineage-aware understanding
```

**Phase 3: LOCAL CONTEXT EXPLORATION**
```python
# Agent calls:
node_details = get_node_by_coordinate_extended(coordinate)
relationships = get_node_relationships(coordinate)
children = get_direct_children(coordinate)

# Agent reasons:
# - What is the coordinate's immediate role?
# - What are its key relationships?
# - What internal structure (children)?

# Result: Complete local picture
```

**Phase 4: COMPREHENSIVE SYNTHESIS**
```python
# Agent synthesizes across ALL phases:
# - Root principles (Phase 1)
# - Genealogical path (Phase 2)
# - Local context (Phase 3)

# Output:
{
  "narrative": "4-6 sentences, ROOT-AWARE, genealogically grounded",
  "key_concepts": [
    {
      "concept": "STRING (not list!)",
      "description": "Reasoned from multi-phase context",
      "relevance_score": 0.85,
      "source_coordinates": ["#coord1", "#coord2"]
    }
  ],
  "apophatic_pointers": [
    {
      "missing_theme": "Identified architectural gap",
      "suggestion": "Why it matters (from root context)",
      "expected_coordinates": ["#coord"]
    }
  ],
  "contextual_themes": ["theme1", "theme2", "theme3"]
}
```

### Implementation Changes

#### File: `backend/epi_logos_system/cag/wisdom_packet/service.py`

**Change 1**: Remove workflow prompt loading (lines 714-737)
**Change 2**: Create multi-phase synthesis prompt
**Change 3**: Let agent make tool calls autonomously

#### New Synthesis Prompt Structure

```python
synthesis_prompt = f"""You are synthesizing a Wisdom Packet for Bimba coordinate {coord}.

This is a MULTI-PHASE process. You will use tools to gather context, then synthesize.

PHASE 1: ROOT CONTEXT GROUNDING
Call: get_node_by_coordinate_extended("#")
Reason: What are the system's foundational principles at root?

PHASE 2: PATH TO ROOT DISCOVERY
Call: get_path_between_coordinates("{coord}", "#", max_hops=5)
Reason: How does this coordinate descend from root genealogically?

PHASE 3: LOCAL CONTEXT EXPLORATION
Call: get_node_by_coordinate_extended("{coord}")
Call: get_node_relationships("{coord}")
Call: get_direct_children("{coord}")
Reason: What is this coordinate's immediate role and relationships?

PHASE 4: COMPREHENSIVE SYNTHESIS
Using ALL context from Phases 1-3, generate wisdom packet:

OUTPUT REQUIREMENTS:
{{
  "narrative": "4-6 sentences. Root-aware. Genealogically grounded. Uses q_* properties if present.",
  "key_concepts": [
    {{
      "concept": "SINGLE STRING - not a list!",
      "description": "Why this matters (reasoned from context)",
      "relevance_score": 0.0-1.0,
      "source_coordinates": ["array of coordinates"]
    }}
  ],
  "apophatic_pointers": [
    {{
      "missing_theme": "What's missing architecturally",
      "suggestion": "Why this gap matters",
      "expected_coordinates": ["where to find it"]
    }}
  ],
  "contextual_themes": ["5-10 specific thematic keywords"]
}}

CRITICAL RULES:
1. concept field MUST be STRING, never list
2. Use root context to ground synthesis
3. Use path-to-root for genealogical awareness
4. Avoid generic/duplicate concepts
5. Apophatic pointers should identify ARCHITECTURAL gaps
6. Prioritize q_* quintessential properties if present

Execute all 4 phases systematically. Return final JSON only."""
```

### Agent Factory Tool Restriction

Need to ensure agent ONLY gets these tools (not all Bimba tools):
- `get_node_by_coordinate_extended`
- `get_path_between_coordinates`
- `get_node_relationships`
- `get_direct_children`

### Benefits

1. **Root Awareness**: Every wisdom packet grounded in system foundations
2. **Genealogical Context**: Path shows HOW coordinate fits architecturally
3. **Reasoned Synthesis**: Agent THINKS about what data means, not keyword clustering
4. **No More Lists**: Agent explicitly instructed concept is STRING
5. **Architectural Gaps**: Apophatic pointers informed by root lineage
6. **Clean Invocation**: No workflow prompt complexity

### Testing Plan

Test coordinates:
- `#` (root itself) - special case, no path-to-root
- `#1` (Paramasiva) - direct child of root
- `#5-4.5` (Epii agent) - deep nested, multi-hop to root
- `#4.4.3-3-3` (previous error case) - deep nested

Expected results:
- Narratives include root-aware context
- Key concepts semantically distinct
- No "unhashable type" errors
- Apophatic pointers identify architectural gaps
