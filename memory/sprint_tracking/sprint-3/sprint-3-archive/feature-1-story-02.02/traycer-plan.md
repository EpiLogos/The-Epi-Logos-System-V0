I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The existing codebase has a well-established pattern for Bimba coordinate operations with GraphQL schema, resolvers, services, and orchestrator tools. The story requests neighboring node discovery functionality that would extend this system with relationship traversal capabilities. 

The current implementation uses `bimbaCoordinate` as the Neo4j property name and has established patterns for GraphQL client communication between the agentic and backend layers. The MCP server provides external tool access, and the orchestrator tools wrap the GraphQL client for agent operations.

### Approach

This plan implements neighboring node discovery functionality for the Bimba coordinate system by extending the existing GraphQL schema, Neo4j queries, and orchestrator tools. The implementation follows the established trilaminar architecture pattern, building incrementally on existing patterns in `backend/epi_logos_system/cag/bimba/` and `agentic/agents/orchestrator/tools/bimba/`. 

The approach leverages the existing `BimbaGraphQLClient` and `HttpBimbaClient` infrastructure, adding relationship discovery capabilities that integrate seamlessly with the current coordinate resolution system. All changes maintain backward compatibility while extending functionality through new GraphQL types and queries.

### Reasoning

I explored the repository structure to understand the trilaminar architecture with backend, agentic, and frontend layers. I examined the existing Bimba coordinate system implementation including GraphQL schema, resolvers, services, and orchestrator tools. I read the story file to understand the requirements for neighboring node discovery functionality and identified the key integration points across the architecture layers.

## Mermaid Diagram

sequenceDiagram
    participant MCP as MCP Client
    participant Server as Bimba MCP Server
    participant Tools as HttpBimbaClient
    participant GraphQL as BimbaGraphQLClient
    participant Backend as Backend GraphQL
    participant Service as NodeService
    participant Neo4j as Neo4j Database

    MCP->>Server: get_node_relationships(coordinate)
    Server->>Tools: get_node_relationships(coordinate)
    Tools->>GraphQL: get_node_relationships(coordinate)
    GraphQL->>Backend: getNodeWithRelationships query
    Backend->>Service: get_node_relationships(coordinate)
    Service->>Neo4j: get_bimba_node_relationships(coordinate)
    
    Neo4j-->>Service: relationship data with edges
    Service-->>Backend: structured node with relationships
    Backend-->>GraphQL: GraphQL response
    GraphQL-->>Tools: relationship data
    Tools-->>Server: formatted response with edges
    Server-->>MCP: relationship discovery result

    Note over Neo4j: Executes Cypher queries for<br/>incoming/outgoing relationships<br/>using bimbaCoordinate property
    Note over Service: Extracts relationship types,<br/>directions, neighbor data,<br/>and properties
    Note over Tools: Provides error handling<br/>and response formatting<br/>following existing patterns

## Proposed File Changes

### /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)

Extend the GraphQL schema to support neighboring node discovery by adding new types for relationship edges and node relationships. Add `RelationshipEdge` type with fields for relationship type, direction, neighbor node, and properties. Add `NodeWithEdges` type containing node data and edges array. Add `RelationshipDirection` enum for INCOMING/OUTGOING. Add `RelationshipProperty` type for key-value relationship properties. Add new query `getNodeWithRelationships(coordinate: String!): NodeWithEdges` to retrieve a node with all its direct relationships.

### /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Add a new resolver function `resolve_get_node_with_relationships` that handles the `getNodeWithRelationships` GraphQL query. The resolver will call the node service to get relationship data and transform it into the GraphQL response format. Follow the existing pattern used in `resolve_get_node_by_coordinate` for consistency with the current resolver architecture.

### /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/shared/database/neo4j_client.py(MODIFY)

Add a new method `get_node_relationships(coordinate: str)` to the NodeService class that retrieves a node with all its direct relationships. The method will use the Neo4j client to execute relationship queries, handling both incoming and outgoing relationships. Extract relationship types, directions, neighbor node data, and relationship properties. Use `bimbaCoordinate` property for Neo4j queries as established in the existing codebase. Return structured data compatible with the GraphQL schema including node basic data and edges array with relationship details.

### /Users/admin/Documents/The Epi-Logos System V0/shared/database/neo4j_client.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Add a new method `get_bimba_node_relationships(coordinate: str)` that executes Neo4j queries to retrieve all direct relationships for a given Bimba coordinate. Implement efficient Cypher queries for both outgoing and incoming relationships: `MATCH (n:BimbaNode {bimbaCoordinate: $coordinate})-[r]->(neighbor) RETURN type(r), neighbor, properties(r)` and `MATCH (n:BimbaNode {bimbaCoordinate: $coordinate})<-[r]-(neighbor) RETURN type(r), neighbor, properties(r)`. Return structured data with relationship types, directions, neighbor node information, and relationship properties.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/clients/bimba_graphql_client.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Add a new method `get_node_relationships(coordinate: str)` to the BimbaGraphQLClient class that sends GraphQL requests to the backend's `getNodeWithRelationships` query. Follow the existing pattern used in `resolve_coordinate` method for consistency. Handle GraphQL request/response formatting and error handling. Return structured relationship data that matches the GraphQL schema response format.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Add a new method `get_node_relationships(coordinate: str)` to the HttpBimbaClient class that wraps the BimbaGraphQLClient's relationship query functionality. Follow the existing pattern used in `resolve_coordinate`, `search_coordinates`, and `get_subsystem_coordinates` methods for consistency. Include comprehensive error handling, logging, and response formatting. Return structured data with success/error status, coordinate information, and relationship edges array containing neighbor details and relationship properties.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/clients/bimba_graphql_client.py(MODIFY)

Add a new MCP tool `get_node_relationships` to the server's tool list following the existing pattern used for `resolve_coordinate`. Define the tool with description "Get all direct relationship connections for a Bimba coordinate", input schema requiring coordinate parameter, and output format showing relationship edges with neighbor details. Implement the tool handler that calls the BimbaGraphQLClient's relationship method and formats the response for MCP clients. Include proper error handling and response formatting consistent with existing MCP tools.

### /Users/admin/Documents/The Epi-Logos System V0/backend/tests/test_bimba_relationships.py(NEW)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/tests/test_coordinate_resolution.py
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Create comprehensive test suite for the neighboring node discovery functionality. Include unit tests for the GraphQL resolver, service layer relationship queries, and Neo4j client relationship methods. Test various scenarios: nodes with multiple relationships, isolated nodes with no connections, non-existent coordinates, relationship properties extraction, and performance with high-degree nodes. Follow the existing testing patterns used in `backend/tests/test_coordinate_resolution.py` for consistency with the project's testing standards.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/tests/test_bimba_relationship_tools.py(NEW)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/agentic/clients/bimba_graphql_client.py(MODIFY)

Create test suite for the agentic layer relationship tools including HttpBimbaClient relationship methods and BimbaGraphQLClient integration. Test the orchestrator tool functionality, error handling, and response formatting. Include integration tests that verify the complete flow from orchestrator tools through GraphQL client to backend services. Mock the GraphQL responses to test various relationship scenarios and edge cases.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/tests/test_mcp_bimba_relationships.py(NEW)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/mcp_servers/test_bimba_pratibimba_server.py
- /Users/admin/Documents/The Epi-Logos System V0/agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Create test suite for the MCP server relationship tool functionality. Test the `get_node_relationships` tool registration, request handling, and response formatting. Include tests for various MCP client scenarios, error handling, and integration with the underlying BimbaGraphQLClient. Follow the existing testing patterns used in `agentic/mcp_servers/test_bimba_pratibimba_server.py` for consistency.