I have created the following plan after thorough exploration and analysis of the codebase. Follow the below plan verbatim. Trust the files and references. Do not re-verify what's written in the plan. Explore only when absolutely necessary. First implement all the proposed file changes and then I'll review all the changes together at the end.

### Observations

I've analyzed the existing story 02.03.1.semantic-to-coordinate-resolution.md and the current Epi-Logos system architecture. The story is well-structured with clear acceptance criteria for implementing semantic search functionality that converts natural language descriptions into vector embeddings and finds similar Bimba coordinates through vector similarity search.

The current system has established patterns for Bimba coordinate operations with GraphQL schema, resolvers, services, and orchestrator tools. There's existing vector infrastructure with Qdrant, LightRAG, and Gemini embeddings, but no vector embeddings stored on BimbaNode properties yet. The story requires cross-namespace search across Bimba (canonical), Episodic (temporal), and Gnostic (document) namespaces with semantic clustering capabilities.

### Approach

I'll convert the existing story structure into a comprehensive implementation plan that:

1. **Extends existing Bimba GraphQL schema** with semantic search types and queries as specified in the story
2. **Implements vector embedding generation and storage** for BimbaNode properties using existing Gemini embedding infrastructure
3. **Creates Neo4j vector indexes** for efficient similarity search across all three namespaces
4. **Adds semantic clustering functionality** to group conceptually related coordinates
5. **Integrates with orchestrator agent tools** and MCP server following established patterns
6. **Provides comprehensive testing** with TDD methodology as outlined in the story

The approach leverages existing trilaminar architecture patterns, building incrementally on established Bimba service infrastructure while adding new semantic discovery capabilities that bridge meaning to structure in the CAG system.

### Reasoning

I explored the repository structure to understand the trilaminar architecture with backend, agentic, and frontend layers. I examined the existing Bimba coordinate system implementation including GraphQL schema, resolvers, services, and orchestrator tools. I read the story file to understand the detailed requirements for semantic-to-coordinate resolution functionality and identified the key integration points across architecture layers. I also explored existing vector infrastructure including LightRAG, Qdrant, and Gemini embeddings to understand available capabilities.

## Mermaid Diagram

sequenceDiagram
    participant Client as GraphQL Client
    participant API as FastAPI Main
    participant Resolver as Bimba Resolver
    participant Service as Semantic Service
    participant Embedding as Embedding Service
    participant Neo4j as Neo4j Database
    participant Orchestrator as Orchestrator Agent
    participant MCP as MCP Server
    participant MCPClient as MCP Client

    Note over Client,MCPClient: Semantic-to-Coordinate Resolution Flow

    Client->>API: semanticCoordinateDiscovery(queryText, maxResults)
    API->>Resolver: resolve_semantic_coordinate_discovery(queryText, maxResults)
    
    Resolver->>Resolver: validate_query_text(queryText)
    Resolver->>Resolver: validate_max_results(1-20 range)
    
    Resolver->>Service: semantic_coordinate_discovery(queryText, maxResults)
    Service->>Embedding: generate_embedding(queryText)
    Embedding-->>Service: query_vector[768]
    
    Service->>Neo4j: vector similarity search across namespaces
    Neo4j-->>Service: ranked coordinate matches with scores
    
    Service->>Service: apply_cross_namespace_weighting()
    Service->>Service: semantic_clustering(matches)
    Service->>Service: apply_performance_safeguards()
    
    Service-->>Resolver: SemanticSearchResults with clusters
    Resolver-->>API: Formatted semantic search response
    API-->>Client: SemanticSearchResults with coordinate matches

    Note over Orchestrator,MCPClient: Agent & MCP Integration Flow
    
    Orchestrator->>Orchestrator: semantic_coordinate_discovery(query_text, max_results)
    Orchestrator->>API: GraphQL HTTP request
    API-->>Orchestrator: Semantic search results with clusters
    Orchestrator->>Orchestrator: Process results for agent workflow
    
    MCPClient->>MCP: semantic_coordinate_discovery tool call
    MCP->>API: GraphQL query via HTTP client
    API-->>MCP: Semantic search response
    MCP->>MCP: Format for MCP protocol with visualization
    MCP-->>MCPClient: Structured semantic results with clusters

## Proposed File Changes

### backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)

References: 

- backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)

Extend the existing Bimba GraphQL schema to include semantic search functionality as specified in the story. Add the `semanticCoordinateDiscovery` query that accepts `queryText: String!` and optional `maxResults: Int = 5` parameters (AC1, AC2). Define new types exactly as specified in the story: `SemanticSearchResults` with query, totalResults, clusters, matches, and processingTime fields; `BimbaCoordinateMatch` with coordinate, name, subsystem, namespace, similarity, semanticContext, and cluster fields; `SemanticCluster` with id, theme, averageSimilarity, and memberCount fields; `NamespaceType` enum with BIMBA, EPISODIC, and GNOSTIC values (AC3, AC5). The query will handle null returns for no matches (AC4) and support performance safeguards through maxResults validation (AC6). This extends the existing comprehensive Bimba schema following the established SDL merge pattern.

### backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)

References: 

- backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Add the semantic search resolver to the existing Bimba resolvers. Implement `resolve_semantic_coordinate_discovery` function that accepts queryText and maxResults parameters (AC1, AC2). Follow the same thin-resolver pattern as existing resolvers like `resolve_get_node_by_coordinate`, delegating business logic to the service layer. The resolver will handle semantic search that returns ranked coordinate matches with similarity scores (AC3, AC5), proper null handling when no matches found (AC4), and performance safeguards including maxResults validation (1-20 range) and timeout protection (15 seconds) (AC6). Integrate seamlessly with the existing resolver infrastructure and dependency injection patterns used throughout the Bimba service.

### backend/epi_logos_system/cag/bimba/services.py(MODIFY)

References: 

- shared/database/neo4j_client.py(MODIFY)
- backend/epi_logos_system/shared/services/embedding_service.py(NEW)

Extend the existing Bimba service layer to include semantic coordinate discovery functionality. Add `semantic_coordinate_discovery` method to the existing `NodeService` class that implements the core semantic search logic (AC1, AC2). The method will use the new `EmbeddingService` to convert query text into vector embeddings, perform vector similarity search across Neo4j embeddings using the new vector indexes, and implement cross-namespace search across Bimba, Episodic, and Gnostic namespaces (AC5). Add semantic clustering functionality to group conceptually related coordinates (AC7). Implement performance safeguards including query timeout protection (15 seconds), maxResults validation (1-20 range), and resource consumption monitoring (AC6). Include comprehensive error handling for embedding service failures, database timeouts, and malformed queries. Follow the existing service patterns and integrate with the current Neo4j client infrastructure used in `get_node` and `get_path_between_coordinates` methods.

### backend/epi_logos_system/shared/services/embedding_service.py(NEW)

References: 

- backend/epi_logos_system/cag/lightrag/gemini_embeddings.py

Create a shared embedding service that abstracts vector embedding generation for the semantic search functionality. Implement `EmbeddingService` class with methods for generating embeddings from text using Gemini embedding models (following the pattern in `backend/epi_logos_system/cag/lightrag/gemini_embeddings.py`). Include embedding caching functionality to store frequently used query embeddings for performance optimization. Add support for batch embedding generation for efficient processing of multiple texts. Implement fallback mechanisms for embedding service failures and comprehensive error handling. The service should be configurable via environment variables (GEMINI_API_KEY, EMBEDDING_MODEL) and integrate with the existing Gemini embedding infrastructure. Include methods for embedding similarity calculation and vector normalization. This service will be used by the Bimba semantic search functionality and can be reused across other system components.

### shared/database/neo4j_client.py(MODIFY)

References: 

- backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Extend the Neo4j client to support vector similarity search operations for semantic coordinate discovery. Add methods for creating and managing Neo4j vector indexes on BimbaNode embeddings as specified in the story technical notes: `CREATE VECTOR INDEX coordinate_embeddings_index FOR (n:BimbaNode) ON (n.embedding)`. Implement `semantic_similarity_search` method that performs vector similarity search using `CALL db.index.vector.queryNodes('coordinate_embeddings_index', $k, $queryEmbedding) YIELD node, score`. Add support for cross-namespace search across Bimba, Episodic, and Gnostic node types with proper label filtering. Implement embedding storage methods for updating BimbaNode properties with generated embeddings. Include performance optimizations for large vector datasets and proper error handling for vector operations. Add methods for batch embedding updates and index maintenance. Follow the existing patterns used in `get_bimba_node` and `get_bimba_node_relationships` methods.

### scripts/init-databases.py(MODIFY)

References: 

- backend/epi_logos_system/shared/services/embedding_service.py(NEW)

Update the database initialization script to create the required Neo4j vector indexes for semantic search functionality. Add creation of the coordinate embeddings vector index as specified in the story: `CREATE VECTOR INDEX coordinate_embeddings_index FOR (n:BimbaNode) ON (n.embedding)`. Include similar vector indexes for Episodic and Gnostic namespace nodes to support cross-namespace semantic search. Add embedding property initialization for existing BimbaNode records using the new `EmbeddingService`. Include proper error handling and rollback mechanisms for index creation failures. Add validation checks to ensure Neo4j version supports vector operations. Follow the existing patterns used for creating other indexes like `bimba_node_subsystem` and `bimba_node_fulltext`. Include progress logging for embedding generation and index creation processes.

### agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

References: 

- agentic/clients/bimba_graphql_client.py(MODIFY)

Add the new `semantic_coordinate_discovery()` method to the existing `HttpBimbaClient` class to enable orchestrator agent access to semantic search functionality. Implement the method following the existing patterns from `resolve_coordinate()` and `search_coordinates()` methods. The method should accept query_text and optional max_results parameters (default 5), make HTTP requests to the backend GraphQL endpoint using the existing infrastructure, and return structured semantic search data including coordinate matches with similarity scores and semantic clusters. Include proper error handling for network failures, embedding service timeouts, and malformed responses. Add comprehensive logging for debugging agent workflows. Return formatted response that includes total results, processing time, semantic clusters, and ranked coordinate matches for easy agent consumption. This enables the orchestrator to use semantic search as a core tool for natural language to coordinate resolution workflows as specified in the story.

### agentic/clients/bimba_graphql_client.py(MODIFY)

References: 

- agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Add a new method `semantic_coordinate_discovery(query_text: str, max_results: int = 5)` to the `BimbaGraphQLClient` class that sends GraphQL requests to the backend's `semanticCoordinateDiscovery` query. Follow the existing pattern used in `search_coordinates` method for consistency with the established GraphQL client architecture. Handle GraphQL request/response formatting including the new semantic search types (SemanticSearchResults, BimbaCoordinateMatch, SemanticCluster). Include comprehensive error handling for GraphQL errors, network timeouts, and malformed responses. Return structured semantic search data that matches the GraphQL schema response format including similarity scores, semantic clusters, and cross-namespace results. Add proper logging and debugging support following the patterns used in other client methods.

### agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

References: 

- agentic/clients/bimba_graphql_client.py(MODIFY)

Update the bimba-pratibimba MCP server to include the new `semantic_coordinate_discovery` tool in the tool list following the existing pattern used for other tools. Add comprehensive tool description as specified in the story: "Discover Bimba coordinates matching natural language descriptions through semantic vector similarity search, enabling inverse CAG flow from meaning to structure". Define detailed input schema with query_text (required string parameter) and max_results (optional integer, default 5, range 1-20) parameters. Implement the tool handler that calls the backend GraphQL endpoint using the same HTTP client patterns as other tools like `resolve_coordinate`. Format the response for MCP clients with clear semantic search visualization including: total results, processing time, semantic clusters with themes and member counts, and ranked coordinate matches with similarity scores and semantic context. Add comprehensive error handling for invalid queries, embedding service failures, and performance timeouts. Include usage examples in the tool description to help MCP clients understand the expected input/output format. This makes semantic coordinate discovery fully accessible to external MCP clients for natural language knowledge graph exploration.

### backend/tests/test_bimba_semantic_discovery.py(NEW)

References: 

- backend/epi_logos_system/cag/bimba/resolvers.py(MODIFY)
- backend/epi_logos_system/cag/bimba/services.py(MODIFY)

Create comprehensive test suite for the semantic coordinate discovery functionality following TDD methodology as outlined in the story. Implement RED phase tests for basic semantic search infrastructure (AC1, AC2, AC3, AC4) including tests for semanticCoordinateDiscovery query parameter acceptance, query text embedding conversion pipeline, vector similarity search against Neo4j embeddings, and response containing ranked BimbaCoordinateMatch objects with similarity scores. Add GREEN phase tests for cross-namespace search and performance (AC5, AC6) including semantic search across Bimba, Episodic, and Gnostic namespaces, performance safeguards (timeout, result limits), and query performance with large embedding datasets. Include REFACTOR phase tests for semantic clustering and integration (AC7, AC8) including semantic clustering of similar coordinate results and integration with existing coordinate resolution pipeline. Follow the existing testing patterns used in other Bimba tests with proper mocking of embedding services, Neo4j vector operations, and GraphQL resolvers. Include performance benchmarks and timeout validation.

### agentic/tests/test_orchestrator_semantic_discovery.py(NEW)

References: 

- agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Create comprehensive tests for orchestrator agent integration with semantic coordinate discovery functionality. Test the `semantic_coordinate_discovery()` method in `HttpBimbaClient` with various scenarios including successful semantic search, no matches found, invalid query text, and performance edge cases. Verify proper error handling, response formatting, and integration with the orchestrator's tool system. Include tests for different max_results values, timeout scenarios, and semantic clustering results. Mock the backend GraphQL responses to ensure isolated testing of the orchestrator tool layer. Test integration with the broader orchestrator workflow including tool discovery and result processing. Follow the testing patterns established in other orchestrator tool tests with proper fixtures and mocking strategies.

### agentic/tests/test_mcp_semantic_discovery.py(NEW)

References: 

- agentic/mcp_servers/bimba_pratibimba_server.py(MODIFY)

Create comprehensive tests for MCP server semantic coordinate discovery tool integration. Test the `semantic_coordinate_discovery` MCP tool with various input scenarios including valid queries, edge cases, response formatting, and error handling. Verify that the tool properly calls the backend GraphQL endpoint and formats responses appropriately for MCP clients. Include tests for tool discovery, parameter validation, input schema compliance, and integration with the MCP protocol. Test edge cases like empty queries, very long queries, invalid max_results values, and performance timeouts. Verify proper error message formatting and response structure for MCP clients. Follow the testing patterns established for other MCP server tools with proper mocking of GraphQL client responses and MCP protocol validation.

### docs/stories/02.03.1.semantic-to-coordinate-resolution.md(MODIFY)

References: 

- backend/epi_logos_system/cag/bimba/schema.graphql(MODIFY)
- backend/epi_logos_system/cag/bimba/services.py(MODIFY)
- agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py(MODIFY)

Update the story to reflect the implementation plan completion and mark it as "Ready for Implementation". Update the Dev Agent Record section to reflect the comprehensive implementation plan creation including all acceptance criteria coverage, orchestrator and MCP integration details, and proper architectural alignment with the existing CAG infrastructure. Add references to the specific files that will be created and modified as part of this implementation, with particular emphasis on the semantic search functionality, vector embedding integration, cross-namespace search capabilities, and semantic clustering features. Update the Testing Standards section to reference the specific test files that will be created including backend unit tests, orchestrator integration tests, and MCP server tests. Ensure all acceptance criteria remain exactly as specified while adding implementation guidance for full system integration with the trilaminar architecture.