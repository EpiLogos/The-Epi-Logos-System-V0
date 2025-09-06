# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

The **Epi-Logos System V0.1** is a revolutionary AI-powered consciousness-aligned computing platform implementing **Coordinate-Augmented Generation (CAG)** architecture. It bridges ancient wisdom traditions with cutting-edge AI technology through a unique **tri-laminar architecture** that models the cosmic mind through six interconnected subsystems.

The system transforms knowledge from a "dead archive of text" into a "living symphony of harmonic relationships" where meaning is perceived through structural resonance, addressing the contemporary meaning crisis through a shift to a **Musical Ontology**.

## Core Architecture

### Tri-Laminar Architecture
The system consists of three distinct but deeply interconnected layers:

1. **Frontend (Experience Vessel)**: Next.js 15 + React 19 PWA with subsystem-specific views
2. **Backend (Deep Engine Room)**: FastAPI microservices with six subsystems handling heavy computation
3. **Agentic (Nervous System)**: Pydantic AI personas and orchestration layer for intelligent workflows

### Six-Subsystem Architecture (Bimba Coordinates)
Each subsystem corresponds to a specific cosmic principle and coordinate:

- **#0 Anuttara**: Absolute Ground & Proto-Logical Processing (void processing)
- **#1 Paramasiva**: Foundational Architect of Quaternary Logic (universal grammar, structural frameworks)
- **#2 Parashakti**: Cosmic Imagination & Vibrational Matrix (72-bit vibrational architecture)
- **#3 Mahamaya**: Universal Transcription Engine (64-bit symbolic processing, DNA/I-Ching translation)
- **#4 Nara**: Dialogical-Identity Processing (user interaction, oracle operations)
- **#5 Epii**: Synthesis & Orchestration Processing (master orchestrator, meta-techne loops)

### Database Architecture (Coordinate-Aligned)
- **Neo4j Aura Cloud**: Core CAG system, Bimba coordinate graph, LightRAG, Graphiti temporal data
- **MongoDB Atlas Cloud**: User profiles, Personal Pratibimba documents
- **Redis Enterprise Cloud**: Wisdom Packet caching, JWT sessions, event streaming
- **Qdrant Local**: Vector embeddings for semantic search

## Development Commands

### Quick Start Commands
```bash
# 🚀 FIRST TIME SETUP (installs everything)
npm run setup

# ⚡ QUICK START (just starts servers)
npm start

# 🛑 STOP EVERYTHING
npm stop

# 🧹 CLEAN RESET (if things get messy)  
npm run clean
```

### Individual Service Commands
```bash
# Development servers
npm run dev                    # Start all services concurrently
npm run dev:frontend          # Frontend only (port 3000)
npm run dev:backend           # Backend only (port 8000)
npm run dev:agentic           # Agentic layer only (port 8001)

# Building
npm run build                 # Build all packages and frontend
npm run build:packages        # Build workspace packages
npm run build:frontend        # Build frontend only

# Testing
npm run test                  # Run all tests
npm run test:frontend         # Frontend tests (Jest)
npm run test:backend          # Backend tests (pytest)
npm run test:agentic          # Agentic layer tests (pytest)
npm run test:e2e              # End-to-end tests (Playwright)
npm run test:structure        # Project structure validation

# Code Quality
npm run lint                  # Lint all code
npm run format                # Format all code
npm run type-check            # TypeScript type checking
```

### Docker Commands
```bash
# Local development
npm run docker:build          # Build all Docker images
npm run docker:up             # Start services with Docker Compose
npm run docker:down           # Stop Docker services
npm run docker:logs           # View Docker logs

# Production deployment
npm run docker:prod:build     # Build production images
npm run docker:prod:up        # Start production services
```

### Monitoring and Debugging
```bash
# Monitor logs in real-time
tail -f logs/backend.log
tail -f logs/agentic.log
tail -f logs/frontend.log

# Check what's running
lsof -i :3000,8000,8001,6333
```

## Key Architectural Patterns

### Coordinate-First Principle
All data flows, API calls, and data structures treat the **Bimba Coordinate** as the primary key of meaning. Every transaction is grounded in the Bimba Map, ensuring holographic integrity of the Musical Ontology.

### Principle of Attunement (Dual-Path Data Access)
- **Path of Resonance**: Fast access to pre-synthesized "Wisdom Packets" from cache
- **Path of Inquiry**: Slower, deep-processing for novel inquiries triggering new learning

### Sacred Boundary (Data Sovereignty)
- **Personal Pratibimba**: User-owned, portable knowledge graph stored locally
- **Alchemical Retort**: Two-stage anonymization process ensuring privacy

### AG-UI Protocol
Real-time, stateful communication between Agentic layer and Frontend enabling streaming agent responses and status (e.g., "thinking," "reflecting").

## Python Import Standards (CRITICAL)

**MANDATORY**: All backend service modules MUST use relative imports for internal dependencies.

```python
# ✅ CORRECT - Relative imports within backend service
from .models.user import User, UserRegistrationRequest
from .services.user_service import UserService
from .database.neo4j_client import Neo4jClient
from .auth.jwt_handler import JWTHandler
from ..config.environment import get_config

# ❌ FORBIDDEN - Absolute imports or sys.path hacks
import sys; sys.path.append(...)  # Never do this
from models.user import User      # Wrong - breaks deployment
```

**Service Execution**: Backend runs as module from project root:
```bash
# ✅ CORRECT
python -m uvicorn backend.main:app --reload

# ❌ WRONG - breaks relative imports
cd backend && python main.py
```

## Tailwind CSS v4 Configuration (CRITICAL)

**⚠️ MANDATORY**: This project uses Tailwind CSS v4 with CSS-first configuration.

```css
/* ✅ CORRECT v4 Syntax */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary: hsl(222.2 47.4% 11.2%);
  --font-sans: var(--font-work-sans), system-ui, sans-serif;
}

/* ❌ NEVER use v3 syntax */
@tailwind base;     /* Wrong - v3 syntax */
@tailwind components;
@tailwind utilities;
```

**Configuration Rules**:
- Theme configuration in CSS `@theme` directive, NOT `tailwind.config.js`
- Use `@plugin` directive for plugins in CSS
- PostCSS config uses `'@tailwindcss/postcss': {}`
- Minimal `tailwind.config.js` with only content paths

## LLM Services Integration

The agentic layer includes comprehensive LLM integration with Google Gemini, OpenAI GPT, Anthropic Claude, and LangExtract for structured data extraction:

```python
# Structured data extraction with LangExtract
result = await extract_structured_data(
    "Mary Johnson is 25 years old and works as a teacher.",
    "Extract person information with age and profession",
    examples
)

# Chat with any LLM
response = await chat_with_llm(
    [{"role": "user", "content": "Hello!"}],
    provider="gemini"  # or "openai", "anthropic"
)

# Wisdom synthesis
wisdom = await wisdom_synthesis(
    "What is the meaning of life?",
    provider="gemini"
)
```

## Development Environment

### Virtual Environment Structure
```
backend/.venv/          # Backend Python dependencies (Python 3.13+)
agentic/.venv/          # Agentic Python dependencies
node_modules/           # Frontend Node.js dependencies (Node.js 20+)
```

### Required Environment Variables
```bash
# Database connections
NEO4J_URI=             # Neo4j Aura Cloud connection
NEO4J_PASSWORD=        # Neo4j database password
MONGODB_URI=           # MongoDB Atlas connection
REDIS_URL=             # Redis Enterprise Cloud connection

# Security
JWT_SECRET=            # JWT token signing secret

# LLM API Keys
OPENAI_API_KEY=        # OpenAI API key
ANTHROPIC_API_KEY=     # Anthropic Claude API key
GOOGLE_API_KEY=        # Google Gemini API key

# OAuth (optional for development)
GOOGLE_CLIENT_ID=      # Google OAuth client ID
GOOGLE_CLIENT_SECRET=  # Google OAuth client secret
```

## Code Quality and Testing

### Testing Strategy (Test-Driven Development)
- **Structure Tests**: Validate tri-laminar architecture compliance
- **Database Tests**: Connection and operation validation
- **Security Tests**: Authentication and configuration validation
- **Integration Tests**: Cross-layer communication testing
- **E2E Tests**: Complete user workflow validation

### Code Quality Tools
- **Frontend**: ESLint + Prettier for TypeScript/React
- **Backend/Agentic**: Black + Ruff for Python formatting and linting
- **Type Safety**: TypeScript + Pydantic validation
- **Pre-commit hooks**: Automated quality checks

## Key Philosophical Principles

### Theory is Praxis
Philosophical models defined in the Bimba Map must translate directly into functional requirements. The act of using the application IS the practice itself.

### Scene-Based Architecture
Pages ARE coordinates, coordinates ARE scenes. Each Bimba coordinate becomes a complete scene with its own narrative context and pedagogical purpose.

### Musical Ontology
Knowledge is treated as a living symphony of harmonic relationships rather than static text archives.

## Important Claude Rules Integration

From CLAUDE.md, key development principles:
- **Research-Driven Development**: Use Archon RAG queries before implementation
- **Architectural Compliance**: No silent deviations from documented decisions
- **Elegance Patterns**: Focus on consistency, explicitness, and framework alignment
- **BMAD Integration**: Use specialized agents (@analyst, @architect, @pm) for complex tasks

## Common Pitfalls to Avoid

1. **Import Issues**: Always use relative imports within backend service
2. **Tailwind v3 Syntax**: Never use `@tailwind` directives (use v4 `@import`)
3. **Service Execution**: Never run backend from its subdirectory (breaks imports)
4. **Coordinate Violations**: Always include Bimba coordinates in data flows
5. **Architecture Deviations**: Document and escalate any architectural exceptions

## Development Workflow

1. **Check** current task status with Archon
2. **Research** implementation patterns before coding
3. **Write tests** first (TDD approach)
4. **Implement** functionality with architectural compliance
5. **Verify** all tests pass and system health
6. **Update** documentation as needed

This system represents a unique fusion of ancient wisdom traditions with cutting-edge AI technology, requiring careful attention to both technical excellence and philosophical coherence.
