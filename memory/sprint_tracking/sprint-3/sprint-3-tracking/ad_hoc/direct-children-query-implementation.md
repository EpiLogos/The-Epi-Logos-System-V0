# Direct Children Query - Implementation Documentation

**Implementation Date**: 2025-10-11
**Context**: Sprint 3 - Ad Hoc Feature
**Purpose**: Lightweight hierarchical coordinate exploration

## Problem Summary

Existing coordinate discovery tools return heavy data structures:
- `get_node_relationships` returns full node objects with all relationships
- `semantic_coordinate_discovery` uses vector embeddings for concept matching
- No dedicated tool for simple parent-child hierarchy traversal

**Need**: Lean query for direct children with minimal data (name, coordinate, primaryDesignation, description only).

## Solution: Direct Children Query

Implemented dedicated hierarchical query using coordinate prefix matching and relationship traversal.

### Cypher Query Strategy

```cypher
MATCH (parent:BimbaNode {bimbaCoordinate: $bimbaCoordinate})-[]->(child:BimbaNode)
WHERE child.bimbaCoordinate STARTS WITH parent.bimbaCoordinate
RETURN child {
    .name,
    .bimbaCoordinate,
    .primaryDesignation,
    .description
} AS child
```

**Key Features:**
- Relationship traversal ensures graph connectivity
- `STARTS WITH` ensures hierarchical coordinate matching
- Map projection returns only requested fields (lean data)
- No limit - returns all direct children

### Use Cases

1. **Coordinate Hierarchy Exploration**: Discover sub-coordinates of a parent
2. **Navigation Aid**: Build coordinate tree structures
3. **Context Discovery**: Find related child nodes for context building
4. **Mod6 Structure**: Explore #N-[0-5] children of any coordinate

## Full Stack Implementation

### 1. GraphQL Schema
**File**: `backend/epi_logos_system/cag/bimba/schema.graphql:77-106`

```graphql
type DirectChildrenResult {
    coordinate: String!
    name: String!
    primaryDesignation: String
    description: String
}

type DirectChildrenResponse {
    success: Boolean!
    children: [DirectChildrenResult!]!
    error: String
}

extend type Query {
    directChildren(bimbaCoordinate: String!): DirectChildrenResponse
}
```

### 2. Backend Service
**File**: `backend/epi_logos_system/cag/bimba/services.py:885-931`

**Method**: `get_direct_children(bimba_coordinate: str) -> list[dict]`

**Features:**
- Hierarchical coordinate matching via `STARTS WITH`
- Maps `bimbaCoordinate` to `coordinate` for consistency
- No pagination - returns all children
- Error logging with logger

### 3. GraphQL Resolver
**File**: `backend/epi_logos_system/cag/bimba/resolvers.py:228-253`

**Resolver**: `resolve_direct_children`

**Returns**: `DirectChildrenResponse` with success flag, children array, error

### 4. GraphQL Client
**File**: `agentic/clients/bimba_graphql_client.py:441-480`

**Method**: `get_direct_children(bimba_coordinate: str)`

**Features:**
- Async HTTP GraphQL query
- Variable binding for bimbaCoordinate
- GraphQL error handling

### 5. HTTP Tools Layer
**File**: `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py:319-338`

**Method**: `get_direct_children`

**Purpose**: Wraps GraphQL client with exception handling for agent consumption

### 6. Shared Agent Tools
**File**: `agentic/agents/shared_tools.py:117-134`

**Tool**: `@agent.tool get_direct_children`

**Description**: "Returns lean data (name, coordinate, primaryDesignation, description) for hierarchical children. Useful for exploring coordinate hierarchies and discovering sub-coordinates."

**Parameters:**
- `bimba_coordinate`: Parent coordinate to find children for

### 7. MCP Server Integration
**File**: `agentic/mcp_servers/bimba_pratibimba_server.py`

**Tool Definition** (lines 409-427):
```python
Tool(
    name="get_direct_children",
    description="Get direct child nodes of a Bimba coordinate...",
    inputSchema={
        "type": "object",
        "properties": {
            "bimbaCoordinate": {
                "type": "string",
                "description": "Parent Bimba coordinate (#N[-|.]N...)",
                "pattern": r"^#(\d+([-\.\/]\d+)*)?$"
            }
        },
        "required": ["bimbaCoordinate"]
    }
)
```

**Handler** (`_handle_get_direct_children`, lines 1058-1106):
- Formatted output with coordinate, name, primaryDesignation
- Truncates descriptions at 100 chars
- Human-readable numbered list format
- Shows "(No children found)" for leaf nodes

## Coordinate Hierarchy Context

### Mod6 QL Framework
The Epi-Logos system uses mod6 Quaternal Logic with standard coordinate range 0-5 as foundational basis within any branch:
- **#0 Anuttara**: Proto-logical processing
- **#1 Paramasiva**: Quaternal Logic engine
- **#2 Parashakti**: Vibrational processing
- **#3 Mahamaya**: Symbolic transcription
- **#4 Nara**: Personal interface
- **#5 Epii**: Orchestration synthesis

### Hierarchical Structure
- **Root**: `#` (system root)
- **Subsystems**: `#0` through `#5`
- **Sub-coordinates**: `#1-0`, `#1-1`, ..., `#1-5` (mod6 children)
- **Deep hierarchies**: `#1-2-3`, `#2-3-4.1`, `#0-5-0/1-4` (with operators)

### Example Usage

**Query**: `get_direct_children("#1")`
**Expected Results**:
```
1. #1-0 - Absolute (Shiva-Nishkala)
2. #1-1 - I-I Principle
3. #1-2 - Dynamic Archetype
4. #1-3 - Structural Mapping
5. #1-4 - Reflexive Intelligence
6. #1-5 - Integration-Manifestation
```

## Performance Characteristics

- **Query Cost**: Medium - single-hop traversal with prefix filter
- **Result Size**: Typically 6 children (mod6) but can vary
- **No Pagination**: Returns all children (acceptable for coordinate hierarchies)
- **Lean Data**: Only 4 fields per child, minimal payload

## Comparison with Other Tools

| Tool | Use Case | Data Weight | Performance |
|------|----------|-------------|-------------|
| `get_direct_children` | Hierarchical exploration | Lean (4 fields) | Fast |
| `get_node_relationships` | Full relationship graph | Heavy (full nodes + edges) | Medium |
| `semantic_coordinate_discovery` | Concept matching | Medium (semantic context) | Fast (indexed) |
| `lexical_coordinate_search` | String pattern matching | Lean (3 fields) | Slow (full scan) |

## Testing Recommendations

1. **Root Children**: Query `#` should return 6 subsystems (#0-#5)
2. **Subsystem Children**: Query `#1` should return mod6 children (#1-0 through #1-5)
3. **Deep Hierarchies**: Test with #1-2, #2-3-4, etc.
4. **Leaf Nodes**: Coordinates with no children should return empty array
5. **Slash Operators**: Test with coordinates like #0-5-0/1-4 (now supported by regex fix)
6. **Integration**: Verify orchestrator agent can invoke tool via MCP

## Related Features

- **Coordinate Regex Fix**: Updated pattern to support "/" operator (same PR)
- **Lexical Search**: Companion tool for substring matching
- **Semantic Discovery**: Complementary concept-based search

## Success Criteria

✅ Query returns only direct hierarchical children
✅ Lean data structure (4 fields per child)
✅ Relationship + prefix matching ensures accuracy
✅ Full stack tool chain functional
✅ MCP server exposes tool to AI clients
✅ Agent can explore coordinate hierarchies efficiently
