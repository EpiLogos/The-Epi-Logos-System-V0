I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

I've analyzed the existing story 02.03.graph-path-traversal.md and compared it with other stories in the system. The current story is already well-structured following the BMAD template with clear acceptance criteria, TDD cycles, and comprehensive implementation details. However, I need to convert this into a proper implementation plan that ensures all acceptance criteria are retained while providing actionable development steps, with particular emphasis on orchestrator agent and MCP server integration.

### Approach

I'll convert the existing story structure into a comprehensive implementation plan that:

1. **Preserves all 6 acceptance criteria** exactly as specified
2. **Transforms TDD cycles into actionable file changes** with specific implementation steps
3. **Maintains the GraphQL schema design** and Neo4j integration approach
4. **Adds proper file structure** following the established backend architecture patterns
5. **Ensures comprehensive integration** with orchestrator agent tools and MCP server functionality
6. **Provides clear testing strategy** with specific test file locations and requirements

The plan will follow the established patterns from other stories like 02.01 and 02.02, ensuring consistency with the system's architecture while making the path traversal functionality fully accessible to both the orchestrator agent and MCP clients.

### Reasoning

I examined the current story file and found it's already well-structured with clear acceptance criteria and TDD cycles. I also reviewed the BMAD story development process and compared with other implemented stories to understand the expected format. The task is to convert this into an actionable implementation plan while preserving all acceptance criteria and ensuring robust orchestrator and MCP integration.

## Mermaid Diagram

sequenceDiagram
    participant Client as GraphQL Client
    participant API as FastAPI Main
    participant Resolver as Path Traversal Resolver
    participant Service as PathTraversalService
    participant Neo4j as Neo4j Database
    participant Orchestrator as Orchestrator Agent
    participant MCP as MCP Server
    participant MCPClient as MCP Client

    Note over Client,MCPClient: Graph Path Traversal Implementation Flow

    Client->>API: getPathBetweenCoordinates(start, end, maxDepth)
    API->>Resolver: resolve_path_query(start, end, maxDepth)
    
    Resolver->>Resolver: validate_coordinates(start, end)
    Resolver->>Resolver: validate_maxDepth(1-5 range)
    
    Resolver->>Service: find_path(start, end, maxDepth)
    Service->>Neo4j: MATCH shortestPath((start)-[*1..maxDepth]-(end))
    
    alt Path Found
        Neo4j-->>Service: Return path with nodes and relationships
        Service->>Service: format_path_components()
        Service->>Service: apply_performance_safeguards()
        Service-->>Resolver: GraphPath object
        Resolver-->>API: Formatted path response
        API-->>Client: GraphPath with ordered components
    else No Path Found
        Neo4j-->>Service: No path within constraints
        Service-->>Resolver: null
        Resolver-->>API: null response
        API-->>Client: null (AC4)
    end

    Note over Orchestrator,MCPClient: Agent & MCP Integration Flow
    
    Orchestrator->>Orchestrator: get_path_between_coordinates(start, end, maxDepth)
    Orchestrator->>API: GraphQL HTTP request
    API-->>Orchestrator: Path response with formatted data
    Orchestrator->>Orchestrator: Process path for agent workflow
    
    MCPClient->>MCP: get_path_between_coordinates tool call
    MCP->>API: GraphQL query via HTTP client
    API-->>MCP: Path response
    MCP->>MCP: Format for MCP protocol
    MCP-->>MCPClient: Structured path data with visualization

## Proposed File Changes

### backend/subsystems/graph_path_traversal/__init__.py(NEW)

References: 

- backend/subsystems/coordinate_resolution/__init__.py

Create the graph path traversal subsystem package initialization file. This will establish the subsystem as a proper Python package following the established backend architecture patterns seen in `backend/subsystems/coordinate_resolution/`.

### backend/subsystems/graph_path_traversal/schema.graphql(NEW)

References: 

- backend/subsystems/coordinate_resolution/schema.graphql

Create the GraphQL schema definition for path traversal functionality. Define the `getPathBetweenCoordinates` query that accepts `startCoordinate`, `endCoordinate`, and optional `maxDepth` parameters (AC1, AC2). Define the `GraphPath` return type with `startNode`, `endNode`, `pathLength`, and `pathComponents` fields. Define the `PathComponent` union type for `PathNode` and `PathRelationship` types. Define `PathNode` type with coordinate, name, subsystem, and position fields. Define `PathRelationship` type with type, direction, properties, and position fields (AC3, AC5). This schema will handle null returns for paths not found (AC4) and support performance safeguards through maxDepth validation (AC6).

### backend/subsystems/graph_path_traversal/resolvers.py(NEW)

References: 

- backend/subsystems/coordinate_resolution/resolvers.py
- backend/epi-logos-system/services/health_service.py

Implement the GraphQL resolvers for path traversal functionality. Create the `get_path_between_coordinates` resolver function that accepts startCoordinate, endCoordinate, and maxDepth parameters (AC1, AC2). Implement Neo4j shortest path algorithm using Cypher's shortestPath function with depth limiting (AC6). Handle path finding logic that returns ordered sequence of nodes and relationships (AC3, AC5). Implement null return handling when no path exists within constraints (AC4). Add performance safeguards including query timeout protection (10 seconds), maxDepth validation (1-5 range), and resource consumption monitoring (AC6). Include comprehensive error handling for invalid coordinates, database failures, and malformed queries. Follow the same dependency injection patterns established in `backend/subsystems/coordinate_resolution/resolvers.py`.

### backend/subsystems/graph_path_traversal/services.py(NEW)

References: 

- backend/subsystems/coordinate_resolution/resolvers.py
- shared/database/neo4j_client.py

Create the service layer for graph path traversal business logic. Implement `PathTraversalService` class with methods for path finding, depth validation, and performance monitoring. Implement `PathRepository` class for Neo4j database interactions using shortest path algorithms. Add path validation logic, coordinate existence checking, and performance safeguards. Include timeout handling, resource monitoring, and early termination for complex traversals. Follow the service layer patterns established in other subsystems and integrate with the existing Neo4j client infrastructure.

### backend/main.py(MODIFY)

References: 

- backend/subsystems/graph_path_traversal/resolvers.py(NEW)
- backend/subsystems/graph_path_traversal/schema.graphql(NEW)

Update the main FastAPI application to include the new graph path traversal GraphQL schema and resolvers. Add import for the path traversal resolvers and integrate them with the existing GraphQL schema loading mechanism. Update the schema loading to include the new `schema.graphql` file from the graph_path_traversal subsystem. Ensure the new query is properly registered with the existing GraphQL infrastructure following the patterns established for coordinate resolution.

### backend/tests/test_graph_path_traversal_unit.py(NEW)

References: 

- backend/tests/test_resolvers.py
- backend/subsystems/graph_path_traversal/resolvers.py(NEW)

Create comprehensive unit tests for the graph path traversal functionality following TDD methodology. Implement RED phase tests for basic path finding (AC1, AC3, AC4) including tests for query parameter acceptance, successful path finding with ordered sequences, path not found scenarios, and same start/end coordinate handling. Add GREEN phase tests for maxDepth and performance controls (AC2, AC6) including maxDepth parameter validation, depth limit respect, query timeout protection, and performance with complex graphs. Include REFACTOR phase tests for edge cases including invalid coordinate formats, disconnected graph components, database failures, and malformed queries. Follow the testing patterns established in `backend/tests/test_resolvers.py` with proper mocking and isolation.

### backend/tests/test_graph_path_traversal_integration.py(NEW)

References: 

- backend/tests/test_integration.py
- backend/subsystems/graph_path_traversal/services.py(NEW)

Create integration tests for the complete graph path traversal pipeline including full HTTP + GraphQL stack testing. Test the complete getPathBetweenCoordinates query with real Neo4j database interactions using various graph topologies. Include performance tests with large graph structures, timeout handling validation, and resource consumption monitoring. Test integration with the existing coordinate resolution system and validate proper error handling across the full stack. Follow the integration testing patterns from `backend/tests/test_integration.py` with proper database setup and teardown.

### agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Add the new `get_path_between_coordinates()` method to the HttpBimbaClient class to enable orchestrator agent access to path traversal functionality. Implement the method following the existing patterns from `resolve_coordinate()` and `search_coordinates()` methods. The method should accept startCoordinate, endCoordinate, and optional maxDepth parameters (default 3), make HTTP requests to the backend GraphQL endpoint, and return structured path data including the full path with nodes and relationships. Include proper error handling for network failures, invalid coordinates, and timeout scenarios. Add comprehensive logging for debugging agent workflows. Return formatted response that includes path length, start/end nodes, and ordered path components for easy agent consumption. This enables the orchestrator to use path traversal as a core tool for knowledge graph navigation and contextual analysis.

### agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Update the bimba-pratibimba MCP server to include the new `get_path_between_coordinates` tool in the tool list. Add comprehensive tool description: "Find a path of relationships connecting two Bimba coordinates through the knowledge graph, enabling narrative discovery and contextual relationship analysis". Define detailed input schema with startCoordinate and endCoordinate (required string parameters), and maxDepth (optional integer, default 3, range 1-5) parameters. Implement the tool handler that calls the backend GraphQL endpoint using the same HTTP client patterns as other tools. Format the response for MCP clients with clear path visualization including: path length, start and end node details, and step-by-step path components with relationship types and directions. Add comprehensive error handling for invalid coordinates, no path found scenarios, and performance timeouts. Include usage examples in the tool description to help MCP clients understand the expected input/output format. This makes path traversal functionality fully accessible to external MCP clients for knowledge graph exploration.

### agentic/tests/test_orchestrator_path_traversal.py(NEW)

References: 

- agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Create comprehensive tests for orchestrator agent integration with path traversal functionality. Test the `get_path_between_coordinates()` method in HttpBimbaClient with various scenarios including successful path finding, no path found, invalid coordinates, and performance edge cases. Verify proper error handling, response formatting, and integration with the orchestrator's tool system. Include tests for different maxDepth values and timeout scenarios. Mock the backend GraphQL responses to ensure isolated testing of the orchestrator tool layer. Follow the testing patterns established in other orchestrator tool tests.

### agentic/tests/test_mcp_path_traversal.py(NEW)

References: 

- agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Create comprehensive tests for MCP server path traversal tool integration. Test the `get_path_between_coordinates` MCP tool with various input scenarios, response formatting, and error handling. Verify that the tool properly calls the backend GraphQL endpoint and formats responses appropriately for MCP clients. Include tests for tool discovery, parameter validation, and integration with the MCP protocol. Test edge cases like disconnected graphs, invalid coordinates, and performance timeouts. Follow the testing patterns established for other MCP server tools.

### docs/stories/02.03.graph-path-traversal.md(MODIFY)

Update the story status from "Draft" to "Ready for Implementation" and add implementation plan completion notes. Update the Dev Agent Record section to reflect the comprehensive implementation plan creation including orchestrator and MCP integration details. Add references to the specific files that will be created and modified as part of this implementation, with particular emphasis on the orchestrator tool and MCP server enhancements. Update the Testing Standards section to reference the specific test files that will be created including orchestrator and MCP integration tests. Ensure all acceptance criteria remain exactly as specified while adding implementation guidance for full system integration.

**PLAN UPDATED - IMMEDIATE REFACTOR NEEDED**

I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

You're absolutely right - I made a critical architectural error. Looking at the existing structure, I can see that this should be part of the core CAG (Core Analytics Graph) functionality in `backend/epi_logos_system/cag/bimba/`, not a separate subsystem. The existing Bimba service already has coordinate resolution and relationship discovery - path traversal is a natural extension of these core capabilities. I also see that there's already a comprehensive GraphQL schema in place that should be extended rather than creating a separate schema.

### Approach

I'll completely refactor the plan to properly integrate path traversal as a core CAG/Bimba capability:

1. **Extend existing Bimba GraphQL schema** - Add the path traversal query to the existing `schema.graphql`
2. **Enhance existing Bimba resolvers** - Add path traversal resolver to the existing `resolvers.py`
3. **Extend existing Bimba services** - Add path traversal logic to the existing `services.py`
4. **Remove the incorrectly created subsystem** - Clean up the mistakenly created subsystem directory
5. **Focus on orchestrator tool integration** - This is the primary goal, making path traversal available as a core orchestrator capability
6. **Maintain all 6 acceptance criteria** - Ensure the core functionality requirements are preserved

This approach aligns with the existing architecture where Bimba is the core graph operations service within the CAG.

### Reasoning

I initially misunderstood the architecture and incorrectly assumed this was a new subsystem. After examining the existing file structure, I can see that Bimba coordinate operations are already established in `backend/epi_logos_system/cag/bimba/` with existing GraphQL schema and resolvers. The user correctly pointed out that this should be a core orchestrator tool extension, not a separate subsystem.

## Mermaid Diagram

sequenceDiagram
    participant Orchestrator as Orchestrator Agent
    participant HttpClient as HttpBimbaClient
    participant API as FastAPI Main
    participant BimbaResolver as Bimba Resolver
    participant BimbaService as Bimba Service
    participant Neo4j as Neo4j Database
    participant MCP as MCP Server
    participant MCPClient as MCP Client

## Dev Notes (2025-09-15)

- Terminology: Replaced all references to “maxDepth” with “maxHops” to match Cypher hop semantics. Schema, resolver, services, and agentic clients updated accordingly.
- Identity: All graph queries now anchor strictly on `bimbaCoordinate`. Removed permissive `OR` matching and any fallback to a `coordinate` property.
- Planner limits: Stopped parameterizing the variable-length bound. Python now selects a literal hop count (default from `BIMBA_MAX_HOPS_DEFAULT`, safety-capped by `BIMBA_MAX_HOPS_CAP`).
- Read purity: Removed silent node creation in read flows; reads are side-effect free. `create_bimba_node` was deleted from the shared client.
- Direction typing: Relationship `type/direction/properties` returned from Cypher to avoid Python-side inference.
- Indexes: Added uniqueness constraint on `BimbaNode(bimbaCoordinate)` and a full-text index on `[name, description, coreNature, operationalEssence]` for future semantic search.
- Cleanup: Removed `nodeType` from GraphQL schema, services, agentic clients, and frontend types; documentation adjusted.

Open Testing Items:
- Verify reachable and unreachable cases with varying `maxHops`.
- Validate error paths: `maxHops < 1` and `maxHops > cap`.
- Consider Neo4j v5 `SHORTEST` migration once baseline is stable.

    Note over Orchestrator,MCPClient: Core CAG Path Traversal Integration

    Orchestrator->>HttpClient: get_path_between_coordinates(start, end, maxDepth)
    HttpClient->>API: GraphQL getPathBetweenCoordinates query
    API->>BimbaResolver: resolve_get_path_between_coordinates(start, end, maxDepth)
    
    BimbaResolver->>BimbaResolver: validate_coordinates(start, end)
    BimbaResolver->>BimbaResolver: validate_maxDepth(1-5 range)
    
    BimbaResolver->>BimbaService: get_path_between_coordinates(start, end, maxDepth)
    BimbaService->>Neo4j: MATCH shortestPath((start)-[*1..maxDepth]-(end))
    
    alt Path Found
        Neo4j-->>BimbaService: Return path with nodes and relationships
        BimbaService->>BimbaService: format_path_components()
        BimbaService->>BimbaService: apply_performance_safeguards()
        BimbaService-->>BimbaResolver: GraphPath object
        BimbaResolver-->>API: Formatted path response
        API-->>HttpClient: GraphPath with ordered components
        HttpClient-->>Orchestrator: Structured path data for agent workflow
    else No Path Found
        Neo4j-->>BimbaService: No path within constraints
        BimbaService-->>BimbaResolver: null
        BimbaResolver-->>API: null response
        API-->>HttpClient: null (AC4)
        HttpClient-->>Orchestrator: No path found response
    end

    Note over MCP,MCPClient: MCP Integration Flow
    
    MCPClient->>MCP: get_path_between_coordinates tool call
    MCP->>API: GraphQL query via HTTP client
    API-->>MCP: Path response from Bimba service
    MCP->>MCP: Format for MCP protocol
    MCP-->>MCPClient: Structured path data with visualization

## Proposed File Changes

### backend/subsystems/graph_path_traversal(DELETE)

Remove the incorrectly created subsystem directory and all its contents. This was created based on a misunderstanding of the architecture - path traversal should be part of the core CAG/Bimba functionality, not a separate subsystem.

### backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)

Extend the existing Bimba GraphQL schema to include path traversal functionality. Add the `getPathBetweenCoordinates` query that accepts `startCoordinate`, `endCoordinate`, and optional `maxDepth` parameters (AC1, AC2). Define new types: `GraphPath` with `startNode`, `endNode`, `pathLength`, and `pathComponents` fields; `PathComponent` union type for `PathNode` and `PathRelationship`; `PathNode` type with coordinate, name, subsystem, and position fields; `PathRelationship` type with type, direction, properties, and position fields (AC3, AC5). The query will handle null returns for paths not found (AC4) and support performance safeguards through maxDepth validation (AC6). This extends the existing comprehensive Bimba schema rather than creating a separate one.

### backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)

Add the path traversal resolver to the existing Bimba resolvers. Implement `resolve_get_path_between_coordinates` function that accepts startCoordinate, endCoordinate, and maxDepth parameters (AC1, AC2). Follow the same thin-resolver pattern as existing resolvers, delegating business logic to the service layer. The resolver will handle path finding that returns ordered sequences of nodes and relationships (AC3, AC5), null returns when no path exists (AC4), and performance safeguards including maxDepth validation and timeout protection (AC6). Integrate seamlessly with the existing resolver infrastructure and dependency injection patterns.

### backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Extend the existing Bimba service layer to include path traversal functionality. Add `get_path_between_coordinates` method to the existing service class that implements Neo4j shortest path algorithm using Cypher's shortestPath function with depth limiting (AC6). Implement path finding logic that returns ordered sequences of nodes and relationships (AC3, AC5), handles null returns when no path exists within constraints (AC4), and includes performance safeguards such as query timeout protection (10 seconds), maxDepth validation (1-5 range), and resource consumption monitoring (AC6). Add comprehensive error handling for invalid coordinates, database failures, and malformed queries. Follow the existing service patterns and integrate with the current Neo4j client infrastructure.

### backend/tests/test_bimba_path_traversal.py(NEW)

References: 

- backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)
- backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Create comprehensive tests for the Bimba path traversal functionality following TDD methodology. Implement tests for all acceptance criteria: basic path finding (AC1, AC3, AC4) including query parameter acceptance, successful path finding with ordered sequences, path not found scenarios, and same start/end coordinate handling; maxDepth and performance controls (AC2, AC6) including maxDepth parameter validation, depth limit respect, query timeout protection, and performance with complex graphs; edge cases including invalid coordinate formats, disconnected graph components, database failures, and malformed queries. Follow the existing Bimba testing patterns and integrate with the current test infrastructure.

### agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Add the new `get_path_between_coordinates()` method to the existing HttpBimbaClient class to enable orchestrator agent access to path traversal functionality. Implement the method following the existing patterns from `resolve_coordinate()` and other methods. The method should accept startCoordinate, endCoordinate, and optional maxDepth parameters (default 3), make HTTP requests to the backend GraphQL endpoint using the existing infrastructure, and return structured path data including the full path with nodes and relationships. Include proper error handling for network failures, invalid coordinates, and timeout scenarios. Add comprehensive logging for debugging agent workflows. Return formatted response that includes path length, start/end nodes, and ordered path components for easy agent consumption. This makes path traversal a core orchestrator tool capability.

### agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Update the bimba-pratibimba MCP server to include the new `get_path_between_coordinates` tool in the tool list. Add comprehensive tool description: "Find a path of relationships connecting two Bimba coordinates through the knowledge graph, enabling narrative discovery and contextual relationship analysis". Define detailed input schema with startCoordinate and endCoordinate (required string parameters), and maxDepth (optional integer, default 3, range 1-5) parameters. Implement the tool handler that calls the backend GraphQL endpoint using the same HTTP client patterns as other tools. Format the response for MCP clients with clear path visualization including: path length, start and end node details, and step-by-step path components with relationship types and directions. Add comprehensive error handling for invalid coordinates, no path found scenarios, and performance timeouts. This makes path traversal functionality fully accessible to external MCP clients for knowledge graph exploration.

### agentic/tests/test_orchestrator_path_traversal.py(MODIFY)

References: 

- agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Create comprehensive tests for orchestrator agent integration with path traversal functionality. Test the `get_path_between_coordinates()` method in HttpBimbaClient with various scenarios including successful path finding, no path found, invalid coordinates, and performance edge cases. Verify proper error handling, response formatting, and integration with the orchestrator's tool system. Include tests for different maxDepth values and timeout scenarios. Mock the backend GraphQL responses to ensure isolated testing of the orchestrator tool layer. Follow the testing patterns established in other orchestrator tool tests.

### agentic/tests/test_mcp_path_traversal.py(MODIFY)

References: 

- agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Create comprehensive tests for MCP server path traversal tool integration. Test the `get_path_between_coordinates` MCP tool with various input scenarios, response formatting, and error handling. Verify that the tool properly calls the backend GraphQL endpoint and formats responses appropriately for MCP clients. Include tests for tool discovery, parameter validation, and integration with the MCP protocol. Test edge cases like disconnected graphs, invalid coordinates, and performance timeouts. Follow the testing patterns established for other MCP server tools.

### docs/stories/02.03.graph-path-traversal.md(MODIFY)

Update the story to reflect the correct architectural approach. Change the implementation notes to clarify that this is a core CAG/Bimba functionality extension, not a separate subsystem. Update the technical implementation section to reference the existing Bimba GraphQL schema and service extensions. Correct the architecture integration notes to emphasize this as a core orchestrator tool capability. Update the Dev Agent Record section to reflect the corrected implementation plan that properly integrates with the existing CAG infrastructure. Ensure all acceptance criteria remain exactly as specified while correcting the architectural guidance.
