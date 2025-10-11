# Bimba Coordinate & Search Refinements Plan

**Sprint**: 3
**Created**: 2025-10-08
**Status**: Validated & Ready for Implementation

## Problem Summary

### Issue 1: Coordinate Regex Pattern Doesn't Support Slash Operator
- **Current Pattern**: `^#(\d+([-\.]\d+)*)?$`
- **Problem**: Coordinates like `#0-5-0/1-4` and `#0-4.0/1-0` are rejected at MCP validation layer
- **Impact**: Entire regions of the Bimba graph are inaccessible via direct resolution
- **Root Cause**: Slash operator (`/`) not included in pattern character class

### Issue 2: BM25 Fulltext Search Can't Find Slash-Separated Substrings
- **Problem**: Query "Iti" doesn't match "My-Self/Iti" in node properties
- **Root Cause**: Neo4j fulltext tokenization treats `/` as delimiter, but whole-token matching fails
- **Impact**: Lexical search missing valid results, forcing reliance on semantic search only

### Issue 3: Error Messages Don't Surface Real Problem
- **Problem**: Pattern validation failure returns "Node doesn't exist" (same as genuine not-found)
- **Impact**: Debugging difficulty - can't distinguish format errors from missing data

## Validated Solutions

### Solution 1A: Update Regex Pattern to Support Slash Operator ✅
**Implementation**: Add `/` to character class in regex pattern

**Updated Pattern**:
```regex
^#(\d+([-\.\/]\d+)*)?$
```

**Locations to Update**:
1. `agentic/mcp_servers/bimba_pratibimba_server.py` (lines 135, 153, 178, 204, 276, 281, 323, 357, 362)

**Rationale**:
- Coordinates are plastic by design
- Slash operator enables reflective "and/or" relationships in QL
- Agent semantic search ensures precise lookups
- Simple, non-over-engineered fix

**Testing Coordinates**:
- `#0-5-0/1-4` (previously inaccessible)
- `#0-4.0/1-0` (dot + slash combination)
- `#0-4` (baseline - ensure no regression)

### Solution 1B: Keep Pattern Validation (No Removal) ✅
**Rationale**:
- Regex update (1A) provides precision
- Early validation prevents malformed queries from hitting backend
- Schema-level guidance helpful for MCP clients

### Solution 2A: Add Dedicated Lexical String Search Tool ✅
**Purpose**: Direct property substring matching when BM25 fulltext fails

**Cypher Query** (Base):
```cypher
MATCH (n:BimbaNode)
WHERE any(key IN keys(n) WHERE
    (n[key] IS :: STRING AND n[key] CONTAINS $searchString) OR
    (n[key] IS :: LIST<ANY> AND any(item IN n[key] WHERE item IS :: STRING AND item CONTAINS $searchString))
)
RETURN n.bimbaCoordinate AS coordinate, n.name AS name, n.description AS description
LIMIT $limit
```

**Implementation Locations**:
1. **Backend GraphQL** (`backend/epi_logos_system/cag/bimba/`):
   - Add resolver to `resolvers.py`
   - Add service method to `services.py`
   - Add query to `schema.graphql`

2. **Agentic Layer** (`agentic/agents/`):
   - Add tool to `shared_tools.py` (decorated for orchestrator)
   - Register in orchestrator agent tool set

3. **MCP Server** (`agentic/mcp_servers/bimba_pratibimba_server.py`):
   - Add tool definition to `handle_list_tools()`
   - Add handler method `_handle_lexical_search()`

**Tool Specification**:
- **Name**: `lexical_coordinate_search`
- **Parameters**:
  - `searchString` (required): String to search for in properties
  - `limit` (optional, default 20): Max results to return
- **Returns**: Lightweight results (coordinate, name, description only)
- **Use Case**: When semantic search fails or exact substring matching needed

**Tradeoff**: Heavier query (property iteration) but more direct - acceptable for targeted lexical lookup

### Solution 2B/2C: Data Property Structure Improvements (User-Handled) ✅
**Status**: Acknowledged - user will handle property structure refinements
**Note**: Issues revealing data structure clarity needs, not tooling deficiency

## GraphQL Schema Changes

### New Query in `schema.graphql`
```graphql
"""Lexical search for coordinates by substring matching across all properties"""
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

## Implementation Checklist

### Phase 1: Regex Pattern Fix
- [ ] Update pattern in `bimba_pratibimba_server.py` (9 instances)
- [ ] Test MCP tool validation with slash coordinates
- [ ] Verify direct resolution works for `#0-5-0/1-4`

### Phase 2: Backend Lexical Search
- [ ] Add `LexicalSearchResult` and `LexicalSearchResponse` to `schema.graphql`
- [ ] Add `lexicalCoordinateSearch` query to schema
- [ ] Implement `lexical_coordinate_search()` in `services.py`
- [ ] Add GraphQL resolver in `resolvers.py`
- [ ] Add corresponding method to `BimbaGraphQLClient`

### Phase 3: Agentic Tool Integration
- [ ] Create `lexical_coordinate_search()` in `shared_tools.py`
- [ ] Decorate with appropriate metadata for orchestrator
- [ ] Register in orchestrator agent's tool set
- [ ] Add tool documentation

### Phase 4: MCP Server Integration
- [ ] Add tool definition to `handle_list_tools()`
- [ ] Implement `_handle_lexical_search()` handler
- [ ] Add to tool routing in `handle_call_tool()`
- [ ] Update MCP server documentation

### Phase 5: Testing & Validation
- [ ] Test regex pattern with slash coordinates
- [ ] Test lexical search with "Iti" → finds "My-Self/Iti"
- [ ] Test lexical search with "/" substring
- [ ] Verify orchestrator agent can invoke new tool
- [ ] Verify MCP clients can access new tool
- [ ] Integration test: semantic search + lexical fallback workflow

## Success Criteria

1. **Coordinate Accessibility**: Direct resolution of `#0-5-0/1-4` and similar slash-containing coordinates works
2. **Lexical Search Precision**: Query "Iti" returns nodes containing "My-Self/Iti"
3. **Tool Integration**: Orchestrator agent and MCP clients can invoke lexical search
4. **No Regressions**: Existing coordinate patterns (`#0`, `#1-2`, `#4.5`) still work
5. **Clear Tool Purpose**: Semantic search for concepts, lexical search for exact strings

## Architecture Notes

### Dual Search Strategy
- **Semantic Search** (`semantic_coordinate_discovery`): Concept/meaning matching via embeddings + BM25
- **Lexical Search** (`lexical_coordinate_search`): Exact substring matching via property iteration
- **Agent Decision**: Orchestrator chooses based on query type and context

### Performance Considerations
- Lexical search is heavier (full property scan) - acceptable for targeted use
- Limit default to 20 results to prevent bloat
- Semantic search remains primary discovery mechanism
- Lexical search is fallback/precision tool

## Related Coordinates
- `#0-4`: Holographic Matrix of Context (uses `(4.0/1-4/5)` formulation)
- `#0-5-0/1-4`: Previously inaccessible coordinate
- `#0-4.0/1-0`: Dot + slash coordinate pattern

## Notes
- Slash operator semantically represents reflective "and/or" relationship in QL
- Coordinate plasticity is intentional design feature
- Data property structure improvements (separate concern, user-handled)
- MCP pattern validation kept for early validation benefits
