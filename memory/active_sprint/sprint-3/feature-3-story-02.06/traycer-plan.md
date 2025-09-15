I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

The story 02.06 represents the first write operation in the system, establishing critical patterns for future content management capabilities. The existing CAG/Bimba service architecture provides a solid foundation with established GraphQL schema, service layer patterns, and tool integration frameworks. The story has comprehensive acceptance criteria covering mutation schema, validation, authorization, error handling, and Neo4j integration. The TDD cycles are well-structured but need specific file modification guidance to match the implementation patterns from stories 02.02 and 02.03.

### Approach

This implementation plan extends the existing CAG/Bimba service architecture to add node creation capabilities, following the established patterns from stories 02.02 and 02.03. The approach integrates GraphQL mutations, Neo4j write operations, role-based authorization, and comprehensive validation while maintaining consistency with existing coordinate resolution patterns. The plan includes both orchestrator tool integration for agent workflows and MCP server tool implementation for external client access, ensuring complete system integration across all access layers.

### Reasoning

I analyzed the story document for 02.06 Bimba Node Creation and found it has well-defined acceptance criteria and TDD cycles but needed specific file-level implementation guidance. I examined the existing CAG/Bimba service architecture and the patterns established in completed stories 02.02 and 02.03 to understand the integration approach. I identified the need for GraphQL schema extensions, service layer enhancements, authorization integration, and comprehensive tool ecosystem support including both orchestrator and MCP server implementations.

## Mermaid Diagram

sequenceDiagram
    participant Admin as Admin User
    participant Orchestrator as Orchestrator Agent
    participant MCP as MCP Client
    participant GraphQL as GraphQL API
    participant Auth as Auth Service
    participant Bimba as Bimba Service
    participant Neo4j as Neo4j Database

    Note over Admin,Neo4j: Admin Node Creation via Orchestrator
    Admin->>Orchestrator: Request node creation
    Orchestrator->>GraphQL: createBimbaNode mutation
    GraphQL->>Auth: Validate admin role
    Auth-->>GraphQL: Admin validated
    GraphQL->>Bimba: Create node with validation
    Bimba->>Neo4j: Check uniqueness + CREATE
    Neo4j-->>Bimba: Node created
    Bimba-->>GraphQL: Return node data
    GraphQL-->>Orchestrator: Success response
    Orchestrator-->>Admin: Node creation confirmed

    Note over MCP,Neo4j: External Client Access via MCP
    MCP->>GraphQL: createBimbaNode via MCP tool
    GraphQL->>Auth: Validate admin credentials
    Auth-->>GraphQL: Authorization check
    GraphQL->>Bimba: Process creation request
    Bimba->>Neo4j: Atomic check-and-create
    Neo4j-->>Bimba: Operation result
    Bimba-->>GraphQL: Formatted response
    GraphQL-->>MCP: Tool execution result

## Proposed File Changes

### /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Extend the existing GraphQL schema to add the first write operation mutation for Bimba node creation. Add the `createBimbaNode` mutation to the Mutation type, following the established query patterns in the existing schema. Define the `CreateBimbaNodeInput` input type with required fields: coordinate (String!), name (String!), and subsystem (Int!). Create the `CreateBimbaNodePayload` type that includes the created node data, success boolean, and errors array. Add the `MutationError` type for structured error responses with field, message, and code properties. Ensure the new types integrate seamlessly with existing `BimbaNodeBasic` type and follow the established naming conventions. The mutation should be: `createBimbaNode(input: CreateBimbaNodeInput!): CreateBimbaNodePayload`.

### /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/auth/services/auth_utilities.py

Add the `createBimbaNode` mutation resolver following the thin resolver pattern established in the existing codebase. The resolver should handle input validation, call the service layer for business logic, and return structured responses. Implement proper error handling for validation failures, authorization errors, and database operation failures. Integrate with the existing authorization middleware to enforce admin role requirements before mutation execution. The resolver should extract the input parameters, validate the user's admin role, call the service layer's create_node method, and format the response according to the `CreateBimbaNodePayload` schema. Include comprehensive error handling that maps service layer exceptions to appropriate GraphQL error responses with proper error codes and messages.

### /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/shared/database/neo4j_client.py
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)

Extend the existing Bimba service class to add node creation capabilities while maintaining consistency with existing coordinate resolution patterns. Implement the `create_node` method that handles coordinate uniqueness validation, Neo4j node creation, and transaction management. Add comprehensive input validation for coordinate format (must match Bimba coordinate structure like '#1-2-3'), name (1-100 characters), and subsystem (integer 0-5). Implement atomic check-and-create operation using Neo4j transactions to prevent race conditions. The method should use Cypher query: `CREATE (n:BimbaNode {bimbaCoordinate: $coordinate, name: $name, subsystem: $subsystem, createdAt: datetime()}) RETURN n`. Add proper exception handling for duplicate coordinates, database errors, and validation failures. Ensure the created node integrates properly with existing graph structure and follows the same property naming conventions as existing nodes.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/clients/bimba_graphql_client.py
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)

Add the `create_bimba_node` method to the HttpBimbaClient class following the established patterns from `resolve_coordinate`, `search_coordinates`, and `get_node_relationships` methods. The method should accept coordinate, name, and subsystem parameters, construct the GraphQL mutation request, handle authentication headers for admin operations, and process the response. Implement comprehensive error handling for authorization failures, validation errors, duplicate coordinates, and network issues. The method should return structured data about the created node or raise appropriate exceptions for error conditions. Include proper logging for admin operations and ensure the method integrates seamlessly with the existing HTTP client patterns. The GraphQL mutation should target the `createBimbaNode` mutation defined in the schema with proper input formatting.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/clients/bimba_graphql_client.py
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)

Add the `create_bimba_node` MCP tool to the existing server following the patterns established by `resolve_coordinate`, `search_coordinates`, and `get_node_relationships` tools. Define the tool with name 'create_bimba_node', description 'Create a new Bimba node in the knowledge graph (Admin only)', and input schema requiring coordinate, name, and subsystem parameters. Implement the tool handler that calls the backend GraphQL mutation, processes admin authentication, and formats responses for MCP clients. Include comprehensive error handling for authorization failures, validation errors, and duplicate coordinates. The tool should return formatted text describing the creation result or error details. Ensure proper integration with the existing MCP server infrastructure and maintain consistency with other Bimba tools. Add appropriate logging for admin operations and security auditing.

### /Users/admin/Documents/The Epi-Logos System V0/backend/tests/unit/cag/bimba/test_node_creation.py(NEW)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/services.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/backend/tests/conftest.py

Create comprehensive test suite for Bimba node creation functionality following TDD methodology. Implement tests for both TDD cycles covering all 7 acceptance criteria. **TDD Cycle 1 Tests**: Test basic mutation schema, core properties handling, successful node creation, Neo4j integration, and return data validation. **TDD Cycle 2 Tests**: Test coordinate uniqueness validation, admin role authorization, input validation, and error handling scenarios. Include unit tests for service layer validation logic, integration tests with Neo4j database operations, authorization tests for role-based access control, GraphQL mutation structure tests, and transaction atomicity tests. Test edge cases including duplicate coordinates, invalid input formats, unauthorized access attempts, database connection failures, and concurrent creation attempts. Use pytest framework with GraphQL testing utilities and mock objects for external dependencies.

### /Users/admin/Documents/The Epi-Logos System V0/backend/tests/integration/cag/bimba/test_node_creation_integration.py(NEW)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/shared/database/neo4j_client.py
- /Users/admin/Documents/The Epi-Logos System V0/backend/tests/conftest.py

Create integration tests for end-to-end node creation workflow including GraphQL mutation execution, Neo4j database operations, and authorization middleware integration. Test complete request flow from GraphQL mutation through resolver, service layer, and database operations. Include tests for successful node creation with proper database persistence, coordinate uniqueness enforcement across concurrent requests, admin authorization integration with JWT tokens, error propagation from database to GraphQL response, and transaction rollback on failures. Test integration with existing graph structure and verify created nodes are properly discoverable through existing query operations. Use real Neo4j test database instance and actual GraphQL execution engine for authentic integration testing.

### /Users/admin/Documents/The Epi-Logos System V0/agentic/tests/tools/bimba/test_node_creation_tools.py(NEW)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/agentic/cli/tests/__init__.py

Create comprehensive tests for orchestrator and MCP server node creation tools. Test the `create_bimba_node` method in HttpBimbaClient including successful node creation, error handling for validation failures, authorization error handling, network failure scenarios, and response data formatting. Test MCP server `create_bimba_node` tool including tool discovery, parameter validation, GraphQL mutation execution, response formatting for MCP clients, and error message formatting. Include integration tests that verify tools properly call backend GraphQL endpoints and handle various response scenarios. Test admin authentication flow and ensure proper error propagation from backend to tool consumers. Use mock GraphQL responses and test both successful and error scenarios comprehensively.

### /Users/admin/Documents/The Epi-Logos System V0/docs/stories/02.06.bimba-node-creation.md(MODIFY)

References: 

- /Users/admin/Documents/The Epi-Logos System V0/backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)
- /Users/admin/Documents/The Epi-Logos System V0/agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Update the story status from 'Draft' to 'Ready for Implementation' and enhance the Dev Agent Record section with comprehensive implementation guidance. Add specific file modification list including all backend service files, orchestrator tools, MCP server tools, and test files. Update the Technical Implementation section to reference integration with existing CAG/Bimba architecture patterns established in stories 02.02 and 02.03. Add detailed error code specifications for duplicate coordinates (DUPLICATE_COORDINATE), authorization failures (UNAUTHORIZED_ADMIN), and validation errors (INVALID_INPUT). Include performance requirements such as rate limiting for admin operations and transaction timeout specifications. Add integration testing specifications that detail how the mutation integrates with existing coordinate resolution and relationship discovery capabilities. Ensure all acceptance criteria remain exactly as specified while providing comprehensive implementation guidance for AI development handoff.