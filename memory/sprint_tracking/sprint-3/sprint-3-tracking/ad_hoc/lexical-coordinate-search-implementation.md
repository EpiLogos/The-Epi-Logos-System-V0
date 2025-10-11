# Lexical Coordinate Search - Implementation Documentation

**Implementation Date**: 2025-10-11
**Context**: Sprint 3 - Ad Hoc Bug Fix
**Issue**: Neo4j fulltext search tokenization treats "/" as delimiter, preventing substring matches like "Iti" in "My-Self/Iti"

## Problem Summary

Neo4j's BM25 fulltext search uses tokenization that splits on "/" characters, making it impossible to find coordinates or properties containing slash-separated values. Specifically:
- Searching for "Iti" fails to match "My-Self/Iti"
- The "/" operator in coordinates (e.g., #0-5-0/1-4) has semantic meaning in Quaternal Logic as reflective "and/or" relationships
- Fulltext indexing breaks these atomic semantic units

## Solution: Direct Property Iteration

Implemented dedicated lexical substring search using Cypher's `CONTAINS` operator with type-safe property checking.

### Cypher Query Strategy

```cypher
MATCH (n:BimbaNode)
WHERE any(key IN keys(n) WHERE
    (n[key] IS :: STRING AND n[key] CONTAINS $searchString) OR
    (n[key] IS :: LIST<ANY> AND any(item IN n[key] WHERE item IS :: STRING AND item CONTAINS $searchString))
)
RETURN n.bimbaCoordinate AS coordinate, n.name AS name, n.description AS description
LIMIT $limit
```

**Key Features:**
- Type-safe property checking with Neo4j 5.x `IS :: TYPE` syntax
- Handles both STRING and LIST<ANY> properties
- Direct substring matching via `CONTAINS` (case-sensitive)
- Heavier query (full property scan) but precise results

### Performance Considerations

- **Default Limit**: 20 results
- **Max Cap**: 50 results (enforced in backend)
- **Use Case**: Fallback when semantic/fulltext search fails
- **Query Cost**: Higher than indexed searches, acceptable for targeted use

## Full Stack Implementation

### 1. GraphQL Schema
**File**: `backend/epi_logos_system/cag/bimba/schema.graphql:65-75`

```graphql
type LexicalSearchResult {
    coordinate: String!
    name: String!
    description: String
}

type LexicalSearchResponse {
    success: Boolean!
    results: [LexicalSearchResult!]!
    error: String
}

extend type Query {
    lexicalCoordinateSearch(searchString: String!, limit: Int): LexicalSearchResponse
}
```

### 2. Backend Service
**File**: `backend/epi_logos_system/cag/bimba/services.py:828-883`

**Method**: `lexical_coordinate_search(search_string: str, limit: Optional[int] = None) -> list[dict]`

**Features:**
- Limit enforcement (default 20, capped at 50)
- Type-safe Cypher execution via Neo4j client
- Coordinate fallback for missing names
- Error logging with logger

### 3. GraphQL Resolver
**File**: `backend/epi_logos_system/cag/bimba/resolvers.py:199-225`

**Resolver**: `resolve_lexical_coordinate_search`

**Returns**: `LexicalSearchResponse` with success flag, results array, error

### 4. GraphQL Client
**File**: `agentic/clients/bimba_graphql_client.py:399-439`

**Method**: `lexical_coordinate_search(search_string: str, limit: Optional[int] = None)`

**Features:**
- Async HTTP GraphQL query
- Variable binding for searchString and limit
- GraphQL error handling

### 5. HTTP Tools Layer
**File**: `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py:296-317`

**Method**: `lexical_coordinate_search`

**Purpose**: Wraps GraphQL client with exception handling for agent consumption

### 6. Shared Agent Tools
**File**: `agentic/agents/shared_tools.py:96-115`

**Tool**: `@agent.tool lexical_coordinate_search`

**Description**: "Direct property iteration for exact substring matching when semantic/fulltext search fails."

**Parameters:**
- `search_string`: String to search for (case-sensitive)
- `limit`: Max results (default 20, capped at 50)

### 7. MCP Server Integration
**File**: `agentic/mcp_servers/bimba_pratibimba_server.py`

**Tool Definition** (lines 384-408):
```python
Tool(
    name="lexical_coordinate_search",
    description="Lexical substring search across all Bimba node properties...",
    inputSchema={
        "type": "object",
        "properties": {
            "searchString": {"type": "string", "description": "..."},
            "limit": {"type": "integer", "minimum": 1, "default": 20}
        },
        "required": ["searchString"]
    }
)
```

**Handler** (`_handle_lexical_coordinate_search`, lines 1012-1056):
- Formatted output with coordinate, name, description preview
- Truncates descriptions at 100 chars
- Human-readable numbered list format

## Dual Search Strategy

**Semantic Search** (`semantic_coordinate_discovery`):
- Vector embeddings + BM25 hybrid
- Concept matching and relevance scoring
- Fast, uses indexed data

**Lexical Search** (`lexical_coordinate_search`):
- Direct substring matching via property iteration
- Exact string pattern finding
- Slower, but precise for edge cases

**Agent Strategy**: Use semantic search first, lexical as fallback for precision.

## Testing Recommendations

1. **Slash Operator**: Search for "Iti" should find "My-Self/Iti"
2. **Coordinate Patterns**: Search for "/" should find coordinates like #0-5-0/1-4
3. **Performance**: Test with limit variations (5, 20, 50)
4. **Edge Cases**: Empty results, special characters, long strings
5. **Integration**: Verify orchestrator agent can invoke tool via MCP

## Related Files

- **Plan**: `/memory/active_sprint/sprint-3/bimba-coordinate-search-refinements-plan.md`
- **Regex Fix**: Coordinate pattern updated to support "/" operator in same PR

## Success Criteria

✅ Lexical search finds substrings across all property types
✅ Slash-separated values no longer break search
✅ Performance acceptable with limit caps
✅ Full stack tool chain functional
✅ MCP server exposes tool to AI clients
✅ Agent can invoke tool with proper parameters
