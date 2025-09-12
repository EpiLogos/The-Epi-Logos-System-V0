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

### Current Structure (Feature-Based Organization)
```
backend/
├── main.py                    # FastAPI application entry
├── epi_logos_system/          # Core system modules
│   ├── auth/                  # Authentication domain
│   │   ├── api.py             # Auth API endpoints
│   │   ├── models.py          # Auth data models
│   │   ├── oauth/             # OAuth implementation
│   │   │   ├── exchange.py, handler.py, routes.py
│   │   │   ├── nonce.py, state.py
│   │   │   └── token_revocation.py
│   │   └── services/          # Auth business logic
│   │       ├── jwt_service.py, mfa_service.py
│   │       ├── password_service.py
│   │       └── validation.py
│   ├── users/                 # User management (domain pattern)
│   │   ├── api.py             # User API endpoints
│   │   ├── models/            # Domain entities
│   │   ├── repositories/      # Data access layer
│   │   └── services/          # User business logic
│   ├── cag/                   # CAG coordinate system
│   │   ├── bimba/             # Coordinate services
│   │   │   ├── services.py, resolvers.py
│   │   └── lightrag/          # Document intelligence
│   │       ├── service.py, api.py
│   │       ├── models.py, document_operations.py
│   │       └── gemini_llm.py, graphql.py
│   └── shared/                # Cross-feature utilities
│       ├── config.py          # Configuration management
│       ├── container.py       # Dependency injection
│       ├── exceptions.py      # Error handling
│       ├── security.py        # Security utilities
│       └── utils.py           # General utilities
└── subsystems/                # Six-coordinate subsystems
    ├── anuttara/              # Coordinate #0 (placeholder)
    ├── paramasiva/            # Coordinate #1 (placeholder)
    ├── parashakti/            # Coordinate #2 (placeholder)
    ├── mahamaya/              # Coordinate #3 (placeholder)
    ├── nara/                  # Coordinate #4 (placeholder)
    └── epii/                  # Coordinate #5 (placeholder)
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

### Architectural Patterns

**Feature-Based Modules**: Authentication, users, CAG as separate packages
- **Domain Architecture Emerging**: Users module demonstrates repository pattern
- **Shared Infrastructure**: Dependency injection container, security utilities
- **Container Pattern** - Centralized dependency management (`shared/container.py`)
- **Service Layer** - Clean business logic separation
- **Repository Pattern** - Database abstraction (see users module)
- **Configuration Management** - Environment validation (`shared/config.py`)
- **Security Framework** - Comprehensive utilities (`shared/security.py`)

### Import Standards (Python Best Practice)
```python
# Absolute imports from project root - MANDATORY
from backend.epi_logos_system.auth.models import User
from backend.epi_logos_system.users.services.user_service import UserService
from backend.epi_logos_system.shared.container import Container
from backend.epi_logos_system.cag.bimba.services import BimbaService

# Never use sys.path.append() - maintain service isolation
# Never use relative imports for internal modules
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

# Run with proper absolute imports from project root
python -m uvicorn backend.main:app --reload --port 8000

# Services run as modules from project root - maintains import consistency
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

## Architectural Approach & Evolution

### Current Development Philosophy

**Feature-Based Organization**: The current structure organizes code by business domain (auth, users, cag) rather than technical layer, promoting:
- **Domain Cohesion** - Related functionality stays together
- **Service Independence** - Clear module boundaries
- **Evolutionary Architecture** - Easy to refactor toward full domain-driven design

**Emerging Domain Patterns**: The users module demonstrates the target architecture:
- `models/` - Domain entities and value objects
- `repositories/` - Data access abstraction layer  
- `services/` - Domain business logic coordination
- `api.py` - HTTP/GraphQL interface layer

**Shared Infrastructure Strategy**: Cross-cutting concerns centralized in `shared/`:
- **Dependency Injection** (`container.py`) - Service lifecycle management
- **Configuration Management** (`config.py`) - Environment validation
- **Security Framework** (`security.py`) - Authentication/authorization utilities
- **Error Handling** (`exceptions.py`) - Structured exception hierarchy

**Coordinate System Integration**: Six-subsystem placeholders in `subsystems/` prepare for:
- **#0 Anuttara** - Proto-logical processing patterns
- **#1 Paramasiva** - Quaternal Logic engine implementation
- **#2 Parashakti** - Vibrational processing services
- **#3 Mahamaya** - Symbolic transcription systems
- **#4 Nara** - Personal interface management
- **#5 Epii** - Orchestration synthesis coordination

### Future Evolution Path

The Backend Layer provides stable foundational infrastructure while evolving toward:
- **Full Domain Architecture** - Complete domain-driven design implementation
- **Coordinate System Activation** - Six-subsystem operational services
- **Service Mesh Integration** - Enhanced microservice communication
- **Advanced Security** - Zero-trust architecture patterns

**Development Standards**: All development follows absolute import patterns, user validation requirements, and architectural discipline ensuring files remain in designated locations without scattered directory creation.

This architecture ensures the Backend Layer remains the reliable **Deep Engine Room** powering the entire Epi-Logos System while supporting consciousness-aligned computing principles through structured domain organization.
