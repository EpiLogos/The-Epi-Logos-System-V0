# Story 02.03: Graph Path Traversal - Sprint 3 Tracking

## Story Overview
**Story ID**: 02.03  
**Title**: Graph Path Traversal (Advanced graph ops)  
**Current Status**: Traycer Plan Complete - Ready for Implementation  
**Sprint**: 3  
**Priority**: PRIMARY STORY  
**Completion**: 60%  

## Story Description
**As a** system agent,  
**I want** to provide a starting and an ending Bimba Coordinate,  
**so that** I can find a path of relationships that connects them through the Bimba Map.

## Acceptance Criteria Status
| AC# | Criteria | Status | Notes |
|-----|----------|---------|-------|
| AC1 | GraphQL query `getPathBetweenCoordinates` with startCoordinate/endCoordinate | 🟡 PLANNED | Schema design complete |
| AC2 | Optional maxDepth parameter (1-5 range) for performance | 🟡 PLANNED | Validation patterns defined |
| AC3 | Return ordered list of nodes and relationships | 🟡 PLANNED | Path component structure defined |
| AC4 | Return null if no path found within constraints | 🟡 PLANNED | Error handling patterns established |
| AC5 | Include both nodes and relationships in proper sequence | 🟡 PLANNED | GraphPath type structure complete |
| AC6 | Performance safeguards for resource consumption | 🟡 PLANNED | Timeout and depth limits defined |

**Legend**: ✅ COMPLETE | 🟡 PLANNED | 🔴 TODO

## Implementation Plan Status

### Phase 1: Traycer Planning ✅ COMPLETE
- **Status**: COMPLETE (2025-01-14)
- **Deliverable**: Comprehensive implementation plan created
- **Key Achievements**:
  - Architectural correction: Integrated with existing CAG/Bimba service instead of separate subsystem
  - Complete file modification plan with 9 targeted changes
  - Full orchestrator and MCP server integration specified
  - TDD test strategy defined across all layers

### Phase 2: Core Implementation 🔴 PENDING
- **Backend Extensions** (3 files to modify):
  - `backend/epi_logos_system/cag/bimba/schema.graphql` - Add GraphQL schema types
  - `backend/epi_logos_system/cag/bimba/resolvers.py` - Add path traversal resolver
  - `backend/epi_logos_system/cag/bimba/services.py` - Add Neo4j path finding logic
- **Testing** (1 new file):
  - `backend/tests/test_bimba_path_traversal.py` - Comprehensive TDD test suite

### Phase 3: Agent Integration 🔴 PENDING  
- **Orchestrator Tool** (1 file to modify):
  - `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py` - Add path traversal method
- **MCP Server Tool** (1 file to modify):
  - `agentic/mcp_servers/bimba_pratibimba_server.py` - Add MCP tool interface
- **Testing** (2 new files):
  - `agentic/tests/test_orchestrator_path_traversal.py` - Orchestrator integration tests
  - `agentic/tests/test_mcp_path_traversal.py` - MCP server integration tests

### Phase 4: Documentation Updates 🔴 PENDING
- **Story Documentation** (1 file to modify):
  - `docs/stories/02.03.graph-path-traversal.md` - Update with implementation completion

## Architectural Corrections Made

### Original Architecture Error
- Initially planned as separate subsystem at `backend/subsystems/graph_path_traversal/`
- Would have violated established CAG architecture patterns

### Corrected Architecture 
- Integrated with existing CAG/Bimba service at `backend/epi_logos_system/cag/bimba/`
- Extends existing GraphQL schema and service layer
- Maintains architectural consistency with coordinate resolution patterns

### Key Design Decisions
1. **Neo4j Integration**: Uses existing `Neo4jClient` infrastructure
2. **GraphQL Extension**: Adds to existing Bimba schema rather than separate endpoint
3. **Performance Safeguards**: 
   - MaxDepth parameter range: 1-5 (aligned with CLAUDE.md guardrails)
   - Query timeout: 10 seconds maximum
   - Variable-length path patterns: `[*1..maxDepth]` (literal hop counts per guardrails)
4. **Node Identity**: Uses `bimbaCoordinate` property (per Neo4j guardrails)

## Neo4j/Bimba Guardrails Compliance

### Critical Guardrails Applied
- ✅ **Graph Identity**: Uses `bimbaCoordinate` for node identity (not `coordinate`)
- ✅ **Read Purity**: GraphQL resolvers perform read-only operations
- ✅ **Variable-Length Paths**: Uses literal hop counts `[*1..maxDepth]`, no parameterization
- ✅ **API Semantics**: Uses `maxHops` terminology (default 5, cap at 10)
- ✅ **Node Anchoring**: Precise node matching with `MATCH (n:BimbaNode { bimbaCoordinate: $coord })`

### Performance Protection
- **Backend Cap**: `BIMBA_MAX_HOPS_CAP` environment variable (default 10)
- **Query Timeout**: 10-second maximum execution time
- **Resource Monitoring**: Early termination for high-degree nodes

## Technical Implementation Details

### Neo4j Cypher Strategy
```cypher
MATCH path = shortestPath(
  (start:BimbaNode {bimbaCoordinate: $startCoordinate})
  -[*1..$maxDepth]-
  (end:BimbaNode {bimbaCoordinate: $endCoordinate})
) 
RETURN path
```

### GraphQL Schema Addition
```graphql
type Query {
  getPathBetweenCoordinates(
    startCoordinate: String!
    endCoordinate: String!
    maxDepth: Int = 3
  ): GraphPath
}

type GraphPath {
  startNode: BimbaNodeBasic!
  endNode: BimbaNodeBasic!
  pathLength: Int!
  pathComponents: [PathComponent!]!
}

union PathComponent = PathNode | PathRelationship
```

### Orchestrator Tool Integration
- **Method**: `get_path_between_coordinates(start, end, maxDepth=3)`
- **Returns**: Structured path data for agent workflow
- **Error Handling**: Network failures, invalid coordinates, timeouts
- **Usage**: Core orchestrator capability for knowledge graph navigation

### MCP Server Tool
- **Tool Name**: `get_path_between_coordinates`
- **Description**: "Find a path of relationships connecting two Bimba coordinates through the knowledge graph"
- **Input Schema**: startCoordinate (required), endCoordinate (required), maxDepth (optional, 1-5)
- **Output**: Formatted path visualization for external MCP clients

## Testing Strategy

### TDD Cycle Structure
1. **RED Phase**: Failing tests for all 6 acceptance criteria
2. **GREEN Phase**: Minimal implementation to pass tests
3. **REFACTOR Phase**: Architectural elegance improvements

### Test Coverage Areas
- **Unit Tests**: Path finding algorithm, GraphQL resolvers
- **Integration Tests**: Neo4j interactions, various graph topologies
- **Performance Tests**: Large graphs, timeout handling
- **Edge Cases**: Invalid inputs, disconnected components, cycles
- **Agent Integration**: Orchestrator tool functionality
- **MCP Integration**: External client tool access

## Dependencies and Blockers

### Prerequisites ✅ COMPLETE
- Neo4j database operational
- Existing CAG/Bimba infrastructure
- GraphQL schema loading mechanism
- Orchestrator HTTP tools infrastructure
- MCP server framework

### No Blockers Identified
- All dependencies satisfied by Sprint 2 completions
- Infrastructure ready for immediate implementation

## Success Metrics

### Functional Completion
- [ ] All 6 acceptance criteria implemented and tested
- [ ] GraphQL query returns correct path structure
- [ ] Performance safeguards prevent resource exhaustion
- [ ] Null handling for disconnected graph components

### Integration Success
- [ ] Orchestrator agent can use path traversal as core tool
- [ ] MCP clients can access path finding functionality
- [ ] Comprehensive test coverage across all layers

### Performance Targets
- [ ] Query execution under 10 seconds for typical requests
- [ ] MaxDepth limits prevent exponential expansion
- [ ] Resource monitoring prevents database overload

## Risk Mitigation

### Performance Risks
- **Risk**: Large graph traversals causing timeouts
- **Mitigation**: MaxDepth hard limits (1-5 range), query timeouts

### Data Integrity Risks  
- **Risk**: Invalid coordinate references
- **Mitigation**: Comprehensive input validation, node existence checks

### Integration Risks
- **Risk**: Breaking existing CAG/Bimba functionality
- **Mitigation**: Extend existing patterns, comprehensive regression testing

## Next Steps

### Immediate Implementation Tasks
1. **Backend Core** (Priority 1):
   - Extend GraphQL schema with path types
   - Add resolver following thin-resolver pattern
   - Implement service layer with Neo4j shortest path

2. **Testing Foundation** (Priority 2):
   - Create comprehensive test suite
   - Validate all acceptance criteria
   - Performance and edge case testing

3. **Agent Integration** (Priority 3):
   - Add orchestrator tool method
   - Implement MCP server tool
   - Create integration test suites

4. **Final Validation** (Priority 4):
   - End-to-end testing
   - Documentation updates
   - Story completion verification

## Learning and Insights

### Architectural Learning
- **CAG Integration**: Path traversal naturally extends existing coordinate resolution
- **Service Layer Patterns**: Thin resolvers with rich service logic maintain clean architecture
- **Performance Guardrails**: Neo4j/Bimba guardrails provide clear implementation constraints

### Planning Process Improvement
- **Traycer Planning Value**: Comprehensive upfront planning prevents architectural errors
- **User Validation Critical**: Early architectural review prevented major rework
- **Implementation-Ready Status**: Detailed file specifications enable efficient development

## Status History

| Date | Status Change | Notes |
|------|---------------|--------|
| 2025-01-13 | Story Created | Initial BMAD story definition |
| 2025-01-14 | Traycer Plan Complete | Comprehensive implementation plan finalized |
| 2025-01-14 | Architecture Corrected | Integrated with CAG/Bimba instead of separate subsystem |
| 2025-01-14 | Ready for Implementation | All planning phases complete, development can begin |

---

**Current Phase**: Traycer Planning Complete ✅  
**Next Phase**: Core Implementation (Backend Extensions) 🔴  
**Target Completion**: Sprint 3 Primary Story  
**Story Tracker Updated**: 2025-01-14