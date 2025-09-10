# Backend Layer - Deep Engine Room

The Backend Layer serves as the **Deep Engine Room** of the Epi-Logos System, providing robust data management, API services, and foundational infrastructure for the trilaminar architecture.

## Architecture Overview

### Core Principles
- **Database Constellation Management** - Unified access to Neo4j, MongoDB, Redis, and Qdrant
- **Microservice Architecture** - Modular services with clear boundaries
- **GraphQL + REST APIs** - Flexible data access patterns
- **Security-First Design** - Comprehensive authentication and authorization

### Port Configuration
- **Primary Service**: Port 8000
- **Health Monitoring**: `/api/health`
- **GraphQL Playground**: `/graphql`

## Service Architecture

### Core Services
```
backend/
├── main.py                 # FastAPI application entry
├── api/                    # REST API endpoints
│   ├── users.py           # User management
│   ├── security.py        # Security endpoints
│   ├── health.py          # Health monitoring
│   └── billing.py         # Subscription management
├── services/              # Business logic layer
│   ├── user_service.py    # User operations
│   ├── jwt_service.py     # Token management
│   └── mfa_service.py     # Multi-factor auth
└── subsystems/            # Coordinate resolution
    └── coordinate_resolution/
```

### Microservice Integration
- **LightRAG Service** - Document intelligence with Neo4j + Qdrant
- **Graphiti Service** - Episodic memory with temporal graph storage
- **Coordinate Resolution** - Bimba map GraphQL API

## Database Constellation

### Neo4j Aura (Unified Graph)
- **Bimba Namespace** - Coordinate system and relationships
- **LightRAG Namespace** - Document intelligence graph
- **Graphiti Namespace** - Episodic memory and temporal patterns

### MongoDB Atlas (User Data)
- **User Profiles** - Personal information and preferences
- **Pratibimba Collections** - User-specific coordinate extensions
- **Session Management** - Authentication state

### Redis Cloud (Performance Layer)
- **Coordinate Caching** - Fast resolution performance
- **Session Storage** - Authentication state management
- **Event Streaming** - Real-time updates

### Qdrant (Vector Intelligence)
- **Document Embeddings** - Semantic search capabilities
- **Contextual Retrieval** - LightRAG integration

## Authentication Architecture

### OAuth 2.0 + OIDC Implementation
- **Google OAuth Client** with PKCE and nonce validation
- **JWT Token Management** with refresh token rotation
- **Multi-factor Authentication** support
- **Session Security** with Redis-backed storage

### Security Features
- **PKCE Flow** - Enhanced OAuth security
- **Nonce Validation** - Replay attack prevention
- **Token Revocation** - External security monitoring
- **Rate Limiting** - API protection

## API Design

### GraphQL Coordinate Resolution
```graphql
type BimbaNode {
  coordinate: String!
  name: String!
  subsystem: String
  description: String
  operationalEssence: String
  coreNature: String
}

type Query {
  getNodeByCoordinate(coordinate: String!): BimbaNode
  searchCoordinates(query: String!, subsystem: Int): SearchResponse
  getSubsystemCoordinates(subsystem: Int!): SubsystemCoordinatesResponse
}
```

### REST API Patterns
- **User Management** - `/api/users/*`
- **Authentication** - `/api/auth/*`
- **Health Monitoring** - `/api/health/*`
- **Service Integration** - Service-specific endpoints

## Development Patterns

### Dependency Injection
- **Container Pattern** - Centralized dependency management
- **Service Layer** - Clean business logic separation
- **Repository Pattern** - Database abstraction

### Import Standards
```python
# Relative imports within backend service
from .models.user import User
from .services.user_service import UserService
from ..shared.database import Neo4jClient

# Never use sys.path.append() - maintain service isolation
```

### Error Handling
- **Structured Exceptions** - Custom exception hierarchy
- **API Response Patterns** - Consistent error formatting
- **Logging Standards** - Comprehensive audit trails

## Service Integration

### Trilaminar Communication
- **Frontend → Backend** - Direct API calls for data operations
- **Agentic → Backend** - HTTP/GraphQL for tool operations
- **Backend → Databases** - Optimized connection pooling

### MCP Server Support
- **LightRAG MCP** - Document intelligence tools
- **Graphiti MCP** - Episodic memory tools
- **Coordinate MCP** - Bimba resolution tools

## Deployment Configuration

### Environment Management
- **Single .env** - Root-level environment configuration
- **Database URLs** - Cloud service connections
- **API Keys** - Secure credential management

### Development Commands
```bash
# Start backend service (from project root)
npm run dev:backend

# Run with proper relative imports
python -m uvicorn backend.main:app --reload --port 8000

# Never run from backend subdirectory - breaks imports
```

## Quality Assurance

### Testing Strategy
- **Unit Tests** - Service layer validation
- **Integration Tests** - Database operations
- **API Tests** - Endpoint validation
- **Security Tests** - Authentication flows

### Performance Monitoring
- **Health Endpoints** - Service status monitoring
- **Database Metrics** - Connection pool monitoring
- **Cache Performance** - Redis optimization
- **Query Optimization** - GraphQL efficiency

## Future Evolution

The Backend Layer provides stable foundational infrastructure while supporting:
- **Service Expansion** - Additional microservices
- **Database Scaling** - Constellation growth
- **API Evolution** - GraphQL schema expansion
- **Security Enhancement** - Advanced protection patterns

This architecture ensures the Backend Layer remains the reliable **Deep Engine Room** powering the entire Epi-Logos System.
