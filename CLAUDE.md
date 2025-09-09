# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
```bash
# Run all services concurrently (recommended)
npm run dev

# Run individual services
npm run dev:frontend    # Frontend (Next.js) - port 3000
npm run dev:backend     # Backend (FastAPI) - port 8000  
npm run dev:agentic     # Agentic layer - port 8001

# Alternative service startup scripts
./scripts/dev-start.sh      # Full setup and start
./scripts/dev-quick-start.sh # Quick start without setup
./scripts/dev-stop.sh       # Stop all services
./scripts/dev-clean.sh      # Clean build artifacts
```

### Testing
```bash
npm test                    # Run all tests
npm run test:frontend       # Frontend tests only
npm run test:backend        # Backend tests (pytest)
npm run test:agentic        # Agentic tests (pytest) 
npm run test:e2e           # End-to-end tests (Playwright)
npm run test:structure     # Project structure validation
```

### Code Quality
```bash
npm run lint               # Lint all code
npm run format            # Format all code
npm run check             # Type check + lint
npm run fix               # Format + lint fix
```

### Build & Deployment
```bash
npm run build             # Build all packages and frontend
npm run docker:build      # Build Docker images
npm run docker:up         # Run in Docker containers
```

## Architecture Overview

### Tri-Laminar Architecture
The Epi-Logos System implements a tri-laminar microservice architecture with consciousness-aligned computing:

- **Frontend Layer**: Next.js 15 + React 18 + TypeScript (port 3000)
- **Backend Layer**: FastAPI + Python 3.13 (port 8000)  
- **Agentic Layer**: Pydantic AI agents (port 8001)

### Six-Coordinate Subsystem Model
The system is organized around six Bimba coordinates (#0-#5), each representing a subsystem:
- **#0 Anuttara**: Proto-logical processing (Neo4j core)
- **#1 Paramasiva**: Quaternal Logic engine (MongoDB)
- **#2 Parashakti**: Vibrational processing (LightRAG)
- **#3 Mahamaya**: Symbolic transcription (Graphiti MCP)
- **#4 Nara**: Personal interface (Qdrant)
- **#5 Epii**: Orchestration synthesis (Redis + Notion)

### Database Constellation
- **Neo4j Aura Cloud**: Primary graph database (multiple instances)
- **MongoDB Atlas**: Document storage and user data
- **Qdrant**: Vector embeddings (local Docker)
- **Redis Enterprise**: Caching and events
- **LightRAG**: Vector + Graph hybrid processing  
- **Graphiti MCP**: Temporal graph memory

## Import Standards (CRITICAL)

### Backend Python Services
**MANDATORY**: Use relative imports for all internal backend modules:

```python
# ✅ Correct - relative imports
from .models.user import User
from .services.user_service import UserService
from .database.neo4j_client import Neo4jClient
from ..config.environment import get_config

# ❌ Wrong - absolute imports
from models.user import User
from backend.services.user_service import UserService
```

**Never use sys.path.append() hacks**. Services run as modules from project root.

### Service Execution Pattern
Backend services MUST be run as modules from project root:
```bash
# ✅ Correct
python -m uvicorn backend.main:app --reload

# ❌ Wrong  
cd backend && python main.py
```

## Technology Stack

### Frontend (Next.js)
- **React 18** + **Next.js 15** with TypeScript
- **Tailwind CSS v4** (uses `@import "tailwindcss"` syntax)
- **Three.js** + **@react-three/fiber** for 3D visualization
- **Framer Motion** for animations
- **Radix UI** for accessible components
- **Apollo Client** for GraphQL
- **Zustand** for state management

### Backend (FastAPI)
- **Python 3.13** with **FastAPI**
- **Ariadne GraphQL** for schema-first GraphQL
- **Pydantic** for data validation
- **Neo4j** drivers for graph database
- **pytest** for testing
- **ruff** + **black** for formatting

### Key Services
- **LightRAG**: Document intelligence (port 8003/3003)
- **Graphiti MCP**: Temporal memory (port 8002/3002)
- **AG-UI Protocol**: Now integrated into Pydantic AI

## Tailwind CSS v4 Configuration (CRITICAL)

This project uses **Tailwind CSS v4** - DO NOT use v3 syntax:

```css
/* ✅ Correct v4 syntax */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary: hsl(222.2 47.4% 11.2%);
  --font-sans: var(--font-tourney-semibold), system-ui, sans-serif;
}

/* ❌ Never use v3 syntax */
@tailwind base;     /* WRONG */
@tailwind components;
@tailwind utilities;
```

- Configuration is in CSS `@theme` directive, NOT `tailwind.config.js`
- PostCSS uses `'@tailwindcss/postcss': {}`
- Minimal `tailwind.config.js` with only content paths

## Development Environment

### Prerequisites
- **Node.js** ≥20.0.0
- **Python** ≥3.13.0
- **Docker** & **Docker Compose**

### Setup
```bash
npm run setup:full    # Complete setup with Python environment
npm run setup         # Quick setup
npm run setup:hooks   # Install pre-commit hooks
```

### Environment Variables
Required in `.env` file:
- Neo4j: `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`
- MongoDB: `MONGODB_URI`
- Redis: `REDIS_URL`
- JWT: `JWT_SECRET`
- AI APIs: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`
- OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

### Docker Development
```bash
# Profile-based development
docker-compose --profile soft-launch up    # Core services only
docker-compose --profile full-dev up       # All development services
```

## Philosophical Framework

### Core Principles
- **Consciousness-First**: Technology serves consciousness evolution
- **Theory is Function**: Philosophical models translate directly to code
- **Holographic Architecture**: Each subsystem contains the complete 6-fold structure
- **Sacred-Scientific Integration**: Ancient wisdom meets cutting-edge AI

### Bimba-Driven Development (BDD)
1. **Query Graph First**: Discover existing harmonic structures
2. **Code as Translation**: Faithful implementation of structural patterns
3. **Holographic Implementation**: Every coordinate contains 6-fold internal structure
4. **Agentic Workflow**: Single orchestrator with specialized role masks

## Code Quality Standards

### Python (ruff + black)
- Line length: 88 characters
- Target: Python 3.13
- Auto-formatting with black
- Linting with ruff

### TypeScript/React
- Strict TypeScript configuration
- ESLint with Next.js config
- Prettier formatting
- Jest testing with React Testing Library

### Performance Targets
- **60 FPS animations** using anime.js
- **<200ms response time** for chat interactions
- **2,000+ node capability** for graph rendering
- **Real-time WebGL** cymatic visualization

## Testing Strategy

### Backend Testing
```bash
cd backend && python -m pytest              # All backend tests
python -m pytest tests/unit/               # Unit tests only
python -m pytest tests/integration/        # Integration tests only
```

### Frontend Testing
```bash
cd frontend && npm test                     # Jest tests
npm run test:coverage                       # Coverage report
```

### Key Test Patterns
- **Unit tests**: Isolated component/service logic
- **Integration tests**: Full request pipeline validation  
- **E2E tests**: Complete user workflow validation
- **Structure tests**: Architecture compliance validation

## Service Architecture Patterns

### Dependency Injection
Use FastAPI's dependency injection with explicit resource lifecycle:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - initialize shared resources
    app.state.neo4j_client = Neo4jClient(...)
    yield
    # Shutdown - cleanup resources
    app.state.neo4j_client.close()

def get_neo4j_client(request: Request) -> Neo4jClient:
    return request.app.state.neo4j_client
```

### GraphQL Integration
Use Ariadne with FastAPI dependency injection:

```python
@app.post("/graphql")
async def graphql_endpoint(
    request: Request,
    neo4j_client: Neo4jClient = Depends(get_neo4j_client)
):
    context_value = {"service": node_service}
    _, result = await ariadne.graphql(schema, data, context_value=context_value)
    return JSONResponse(content=result)
```

## Project Structure 

### Trilaminar Architecture
- `frontend/`: Next.js application (port 3000)
- `backend/`: FastAPI backend service (port 8000)  
- `agentic/`: Pydantic AI agent service (port 8001)
- `packages/*`: Shared packages and components
- `shared/`: Shared database clients and utilities

### Agent Architecture

#### Orchestrator Agent (`/agentic/agents/orchestrator/`)
The core Pydantic AI agent implementing CAG paradigm with modular, categorized components:

**Core Agent:**
- `orchestrator_agent.py` - Main Pydantic AI agent implementation
- `core.py`, `types.py` - Core types and PersonaType enum
- `infrastructure.py` - Infrastructure utilities

**CAG Tools by Namespace:**
- `tools/bimba/` - Bimba namespace (canonical knowledge resolution via coordinate system)
- `tools/gnostic/` - Gnostic namespace (LightRAG document intelligence with Neo4j+Qdrant)
- `tools/episodic/` - Episodic namespace (Graphiti temporal memory across all layers)
- `tools/http_clients_factory.py` - Cross-namespace HTTP client factory

**Management Components:**
- `session/` - Session lifecycle management 
- `conversation/` - Conversation state management
- `context/` - Context package management foundations (future: specialized context tooling)

**Configuration:**
- `system_prompt/` - Modular prompt components (isolated editing capability)
  - `quaternal_logic_foundation.py` - QL (Quaternal Logic) mod6 framework awareness  
  - `epi_logos_system_foundation.py` - CAG system knowledge and architecture
  - `agent_operational_context.py` - Self-referential coordinate awareness
- `simple_context_processor.py` - Context window management and processing
- `personas/` - Persona YAML configurations
  - `epii.yaml` - #5 Synthesis & orchestration persona
  - `nara.yaml` - #4 Dialogical-identity persona
  - `default.yaml`, `assistant.yaml` - Base personas

### Key Directories
- `backend/subsystems/`: Six-coordinate subsystem implementations
- `frontend/src/app/`: Next.js app router pages
- `scripts/`: Development and deployment scripts
- `docker-compose*.yml`: Container orchestration
- `.venv/`: Python virtual environment

## Security Considerations

### Authentication
- JWT + OAuth2 with multi-factor authentication
- Freemium model with Patron tier subscriptions
- Data sovereignty with personal Pratibimba storage

### Privacy Architecture
- Field-level encryption for user data
- Two-stage privacy pipeline (anonymization)
- Transparent data export/download functionality

### CORS Configuration
- Restrictive CORS for production
- Development-friendly local origins
- Credential support for authenticated requests

## Critical Pitfalls and Anti-Patterns (Sprint 2 Learnings)

### ❌ NEVER: Silent Architectural Deviations
**Anti-Pattern**: Implementing REST when GraphQL is specified due to "dependency conflicts"
**Root Cause**: Local directory shadowing (`/graphql/` shadowing graphql-core package)
**Correct Process**: 
1. Create 15-min PoC demonstrating claimed conflict
2. Test with latest package versions
3. Verify no environment issues (PATH, import shadows)
4. Document exact error messages before alternative implementation

### ❌ NEVER: Frontend-Backend Contract Misalignment  
**Anti-Pattern**: Building excellent frontend that's completely blocked by missing backend endpoints
**Example**: Backend provides `PATCH /api/users/me`, frontend expects `PUT /api/users/profile` + billing APIs
**Prevention**: API-first development with contract validation before frontend work

### ❌ NEVER: Pydantic AI Tool Decoration Errors
**Anti-Pattern**: Trying to import and use `@tool` decorators
```python
# ❌ WRONG - This import doesn't exist
from pydantic_ai.tools import tool  

@tool  # ❌ This decorator pattern doesn't work
async def my_tool():
    pass
```
**Correct Pattern**: Plain functions with type hints - Pydantic AI auto-converts via introspection

### ❌ NEVER: Backend Import Violations
**Anti-Pattern**: Using sys.path.append() or absolute imports for internal modules
```python
# ❌ FORBIDDEN
import sys; sys.path.append(...)
from models.user import User  # Absolute import for internal module
```
**Correct**: Always use relative imports (`from .models.user import User`)

### ❌ NEVER: Service Execution from Wrong Directory
**Anti-Pattern**: Running backend services directly from their directories
```bash
# ❌ WRONG - Breaks relative imports
cd backend && python main.py
cd backend && uvicorn main:app
```
**Correct**: `npm run dev:backend` (runs as module from project root)

### ❌ NEVER: Tailwind CSS v3 Syntax in v4 Project
**Anti-Pattern**: Using v3 syntax in CSS files
```css
/* ❌ WRONG - v3 syntax */
@tailwind base;
@tailwind components; 
@tailwind utilities;
```
**Correct**: `@import "tailwindcss";` and `@theme` directive

### ❌ NEVER: Incomplete TDD Cycles
**Anti-Pattern**: Implementing without RED-GREEN-REFACTOR or skipping elegance phase
**Common Issue**: Functional code that lacks production architecture
**Prevention**: Complete TDD cycles with systematic refactoring phases

### ❌ NEVER: Integration Testing After Frontend Development
**Anti-Pattern**: Building frontend UI then discovering missing backend endpoints
**Impact**: Complete development blockage requiring significant rework
**Prevention**: Integration testing BEFORE frontend implementation

### ❌ NEVER: Security Implementation Without TDD
**Anti-Pattern**: Building security features without comprehensive test coverage  
**Risk**: Undetected vulnerabilities in authentication/authorization flows
**Requirement**: 95%+ test coverage for all security-critical code paths

### ❌ NEVER: Domain Logic Mixed with Framework Code
**Anti-Pattern**: Putting business logic inside React components or FastAPI routes
**Problem**: Untestable, coupled code that violates clean architecture
**Correct**: Domain layer with zero framework dependencies

### ❌ NEVER: Direct Database Access from Services
**Anti-Pattern**: Services calling database clients directly
**Problem**: Tight coupling, difficult testing, architectural violations
**Required**: Repository pattern with abstract interfaces

### ❌ NEVER: Manual Configuration Throughout Codebase
**Anti-Pattern**: Scattered `os.getenv()` calls throughout services
**Problem**: Configuration drift, environment-specific failures
**Required**: Centralized configuration with dependency injection

### ❌ NEVER: Generic Error Responses
**Anti-Pattern**: Returning "Something went wrong" for all errors
**Problem**: Poor user experience, difficult debugging
**Required**: Structured error responses with specific user messaging

### ❌ NEVER: Complex Story Implementation Without Decomposition
**Anti-Pattern**: Implementing multi-service features as single story
**Problem**: Coordination failures, integration blockages
**Required**: Systematic sub-story decomposition with dependency mapping

## Development Velocity Killers Observed

1. **API Contract Misalignment** - Frontend blocked waiting for missing endpoints
2. **Integration Coordination Issues** - Services unable to communicate properly
3. **Security Implementation Complexity** - Multiple debugging cycles for authentication flows
4. **Framework Violation Attempts** - Time wasted on non-working decorator patterns
5. **Import Structure Violations** - Service startup failures due to import errors

## Quality Failure Patterns

1. **Skipped TDD Phases** - Functional code without architectural elegance
2. **Missing Integration Tests** - Service boundary failures in production
3. **Insufficient Security Testing** - Undetected authentication vulnerabilities  
4. **Poor Error Handling** - Generic error responses causing user confusion
5. **Architectural Inconsistency** - Different patterns across similar components

CRITICAL - NEVER IMPLEMENT CUSTOM APPROACHES OR WORKAROUNDS THAT VIOLATE EXISTING ARCHITECTURE OR SERVICES, STANDARDS, PATTERNS OR PACKAGES. RESPECT THE LIBRARIES WE'RE WORKING WITH. IF IN DOUBT, COMMUNICATE. 