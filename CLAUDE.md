# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ESSENTIAL - WHEN WORKING FROM A PLAN, FOLLOW IT. BUILD YOUR TODO LIST TO MATCH THE PLAN. PROACTIVELY REFER BACK TO PLAN FILES IN TASKS TO ESNURE ALIGNMENT.

IMPORTANT - DON'T ASSUME TASKS ARE FINISHED UNTIL USER VALIDATES FUNCTIONALITY. YOUR ENTHUSIASM IS BOTH ANNOYING AND CONSTRAINS YOU IN DOING A COMPREHENSIVE JOB.

<critical_constraints>
## Development Partnership Approach

**CRITICAL**

**ALWAYS** engage in dialogue before implementation:
- **Validate Approach**: Confirm architectural decisions with user before coding
- **Seek Clarification**: Ask questions when requirements are unclear
- **Partner, Don't Execute**: Be a development partner, not a code-writing service
- **Show Patience**: Take time to understand rather than rushing to implement

### Communication Standards
1. **Before Any Code**: Present plan and get user validation
2. **Architecture Decisions**: Never make structural changes without approval
3. **Standard Practices First**: Exhaust all documentation-informed best practices before custom solutions
4. **Uncertainty Response**: "Let me confirm this approach with you first..."
5. **Honest Feedback**: Express concerns and alternative suggestions openly
</critical_constraints>

<philosophical_foundation>
## Epi-Logos System Foundation

### Core Philosophy
- **Consciousness-First**: Technology serves consciousness evolution
- **Theory is Function**: Philosophical models translate directly to code
- **Sacred-Scientific Integration**: Ancient wisdom meets cutting-edge AI

### Quaternal Logic (QL) Coordinate System
**Mod6 foundational base with variant extensions:**
- **#0 Anuttara**: Proto-logical processing (Neo4j core)
- **#1 Paramasiva**: Quaternal Logic engine (MongoDB) 
- **#2 Parashakti**: Vibrational processing (LightRAG)
- **#3 Mahamaya**: Symbolic transcription (Graphiti MCP)
- **#4 Nara**: Personal interface (Qdrant)
- **#5 Epii**: Orchestration synthesis (Redis + Notion)

### CAG (Coordinate Augmented Generation) Approach
**Foundational to the project**: Single orchestrator with coordinate-aware context switching
**Evolution Path**: Proto-multi-agent → Distributed consciousness computing
**Details**: `/.context/epistemic_systemic_contexts/Epi-Logos System/`

### Bimba-Driven Development (BDD)
1. **Query Graph First**: Discover existing harmonic structures
2. **Code as Translation**: Faithful implementation of structural patterns
3. **Holographic Implementation**: Every coordinate contains 6-fold internal structure
4. **Agentic Workflow**: Coordinate-aware context switching with specialized role adaptation
</philosophical_foundation>

<operational_commands>
## Development Commands

### Primary Development
```bash
# Run all services concurrently (recommended)
npm run dev

# Run individual services
npm run dev:frontend    # Frontend (Next.js) - port 3000
npm run dev:backend     # Backend (FastAPI) - port 8000  
npm run dev:agentic     # Agentic layer - port 8001
```

### Testing
```bash
npm test                    # Run all tests
npm run test:frontend       # Frontend tests only
npm run test:backend        # Backend tests (pytest)
npm run test:agentic        # Agentic tests (pytest) 
```

### Code Quality
```bash
npm run lint               # Lint all code
npm run format            # Format all code
npm run check             # Type check + lint
npm run fix               # Format + lint fix
```

**Full command reference**: `/scripts/` directory
</operational_commands>

<architectural_foundation>
## Architecture Overview

**Architectural Reference**: `/memory/diagrams/` - Visual architecture documentation and system evolution tracking

### Tri-Laminar Architecture
The Epi-Logos System implements a tri-laminar microservice architecture with consciousness-aligned computing:

- **Frontend Layer**: Next.js 15 + React 18 + TypeScript (port 3000)
- **Backend Layer**: FastAPI + Python 3.13 (port 8000)  
- **Agentic Layer**: Pydantic AI agents (port 8001)

*Full details*: `/memory/diagrams/trilaminar-overview.mmd`

### Database Constellation
- **Neo4j Aura Cloud**: Primary graph database (multiple instances)
- **MongoDB Atlas**: Document storage and user data
- **Qdrant**: Vector embeddings (local Docker)
- **Redis Enterprise**: Caching and events
- **LightRAG**: Vector + Graph hybrid processing  
- **Graphiti MCP**: Temporal graph memory

*Full architecture*: `/memory/diagrams/database-constellation.mmd`

### Backend Architecture (Current Structure)
**Feature-Based Organization:**
```
backend/
├── main.py                    # FastAPI application entry
├── epi_logos_system/          # Core system modules
│   ├── auth/                  # Authentication domain
│   │   ├── api.py             # API endpoints
│   │   ├── models.py          # Data models
│   │   ├── oauth/             # OAuth implementation
│   │   └── services/          # Business logic
│   ├── users/                 # User management (domain pattern)
│   │   ├── api.py
│   │   ├── models/            # Domain entities
│   │   ├── repositories/      # Data access layer
│   │   └── services/          # Business logic
│   ├── cag/                   # CAG coordinate system
│   │   ├── bimba/             # Coordinate services
│   │   └── lightrag/          # Document intelligence
│   └── shared/                # Cross-feature utilities
├── subsystems/                # Six-coordinate subsystems
│   ├── anuttara/, paramasiva/, parashakti/
│   ├── mahamaya/, nara/, epii/
└── tests/unit/, tests/integration/
```

**Current Patterns:**
- **Feature-Based Modules**: Authentication, users, CAG as separate packages
- **Emerging Domain Structure**: Users module shows repository pattern
- **Shared Infrastructure**: Dependency injection container, security utilities
- **Coordinate System**: Subsystem placeholders for six-coordinate implementation
- **Absolute Imports**: `from backend.epi_logos_system.auth.models import User`

### Service Integration Patterns
**Inter-Layer Communication:**
1. **Frontend ↔ Backend**: REST/GraphQL APIs with JWT authentication
2. **Backend ↔ Agentic**: HTTP APIs for agent invocation and context retrieval
3. **Frontend ↔ Agentic**: Proxied through backend (no direct connection)

*Integration details*: `/memory/diagrams/service-integration.mmd`
</architectural_foundation>

<technical_constraints>
## Import Standards & Technology Stack

### Python Import Standards (CRITICAL)
**MANDATORY**: Use absolute imports from project root (Python best practice):

```python
# ✅ Correct - absolute imports from project root
from backend.models.user import User
from backend.services.user_service import UserService
from agentic.agents.orchestrator.core import OrchestratorAgent

# ❌ Wrong - relative imports for internal modules
from .models.user import User
from ..services.user_service import UserService
```

**Never use sys.path.append() hacks**. Services run as modules: `python -m backend.main`

### Service Execution Pattern
```bash
# ✅ Correct
npm run dev:backend

# ❌ Wrong  
cd backend && python main.py
```

### Tailwind CSS v4 Configuration (CRITICAL)
```css
/* ✅ Correct v4 syntax */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary: hsl(222.2 47.4% 11.2%);
}

/* ❌ Never use v3 syntax */
@tailwind base;     /* WRONG */
```

### Coding Standards (ESSENTIAL)
**User Validation Required**: Never make architectural decisions without explicit user approval
**Standard Practices Only**: Exhaust all documented best practices before custom implementations
**Architectural Discipline**: Files go in designated locations only - no scattered directory creation
**Trilaminar Boundaries**: Maintain strict service separation (Frontend/Backend/Agentic)

**Complete Standards**: `/docs/architecture/coding-standards.md`
**Technology Stack Details**: `/docs/architecture/tech-stack.md`
</technical_constraints>

<quality_standards>
## Code Quality & Testing Strategy

### TDD Excellence Framework (Sprint 2 Proven)
1. **RED Phase**: Comprehensive failing tests covering all acceptance criteria
2. **GREEN Phase**: Functional implementation meeting all requirements
3. **REFACTOR Phase**: Architectural elegance transformation + **test updating**

### Test Evolution Through Development Cycle
- **Test Rewriting**: Update tests as requirements evolve during development
- **Test Refactoring**: Enhance test quality during REFACTOR phase
- **Architectural Alignment**: Test structure mirrors production architecture

### Test Organization Structure
```
/tests/
├── unit/           # Isolated component/service logic
├── integration/    # Service boundary validation  
├── e2e/           # Complete user workflow validation
└── [feature]/     # Feature-specific test organization
    ├── unit/
    ├── integration/
    └── acceptance/
```

### Quality Gates
- **Unit Tests**: 90%+ coverage with 100% passing rate
- **Integration Tests**: Complete API and authentication flow coverage
- **Architectural Elegance**: Target 90+ quality scores through REFACTOR phase

**Sprint 2 Proven Patterns**: `/memory/sprint_tracking/sprint-2/sprint-2-claude-insights/`
</quality_standards>

<failure_prevention>  
## Critical Anti-Patterns (Sprint 2 Validated)

### ❌ NEVER: Silent Architectural Deviations
**Prevention**: Create 15-min PoC demonstrating claimed conflicts before alternative implementations

### ❌ NEVER: Frontend-Backend Contract Misalignment  
**Prevention**: API-first development with contract validation before frontend work

### ❌ NEVER: Pydantic AI Tool Decoration Errors
```python
# ❌ WRONG - This import doesn't exist
from pydantic_ai.tools import tool  
```
**Correct**: Plain functions with type hints - Pydantic AI auto-converts via introspection

### ❌ NEVER: Domain Logic Mixed with Framework Code
**Required**: Domain layer with zero framework dependencies

### ❌ NEVER: Complex Story Implementation Without Decomposition
**Required**: Systematic sub-story decomposition with dependency mapping

**Complete Anti-Pattern Guide**: `/memory/sprint_tracking/sprint-2/sprint-2-claude-insights/architectural-compliance-lessons.md`
</failure_prevention>

<context_discovery>
## Project Knowledge Architecture  

### Context Discovery Directories
- **/context/**: Subsystem epistemic knowledge and coordinate development insights
  - `dev_feature_contexts/#[0-5]-[coordinate]/`: Development insights by coordinate
  - `epistemic_systemic_contexts/`: Core system knowledge and QL foundations
- **/memory/**: Sprint tracking, story research, and architectural evolution
  - `/memory/diagrams/` - Visual architecture reference (foundational)
  - `/memory/sprint_tracking/` - Development insights and proven patterns
  - `/memory/story_bimba_research/` - Epic research and coordinate analysis
- **/docs/**: BMAD process documentation and technical specifications
  - `/docs/stories/`: User story specifications and acceptance criteria
  - `/docs/architecture/`: Technical architecture documentation
  - `/docs/agent_researches/`: Research agent outputs and analysis

### Context Discovery Workflow
1. **Feature Planning**: Start with `/.context/dev_feature_contexts/[coordinate]/`
2. **Architectural Context**: Reference `/.context/epistemic_systemic_contexts/`
3. **Implementation History**: Check `/memory/story_bimba_research/` and sprint tracking
4. **Formal Specifications**: Use `/docs/stories/` and `/docs/architecture/`
5. **Reserach SubAgent OUtputs**: Dive into `/docs/agent_researches/` for expert insights
</context_discovery>

<architectural_maintenance>
## Architectural Diagram Maintenance

### Update Workflow
On **user-verified feature completion**:
1. Update relevant diagrams in `/memory/diagrams/`
2. Maintain architectural accuracy with implemented codebase
3. Document stable patterns for future context
4. Preserve coordinate system alignment in all representations

### Diagram Dependencies
```yaml
foundational_architecture: "/memory/diagrams/"
sprint_insights: "/memory/sprint_tracking/sprint-2/sprint-2-claude-insights/"  
technical_specifications: "/docs/architecture/"
coordinate_contexts: "/.context/"
operational_scripts: "/scripts/"
```
</architectural_maintenance>

## Agent Architecture Reference

### Orchestrator Agent (`/agentic/agents/orchestrator/`)
The core Pydantic AI agent implementing CAG paradigm with coordinate-aware components:

**CAG Tools by Namespace:**
- `tools/bimba/` - Bimba namespace (canonical knowledge resolution via coordinate system)
- `tools/gnostic/` - Gnostic namespace (LightRAG document intelligence)
- `tools/episodic/` - Episodic namespace (Graphiti temporal memory)

**Configuration:**
- `system_prompt/quaternal_logic_foundation.py` - QL mod6 framework awareness
- `personas/` - Coordinate-aligned persona configurations

**Agent Architecture Details**: `/memory/diagrams/agentic-orchestration.mmd`
**Backend Structure Evolution**: Refactoring toward domain architecture in progress

---

CRITICAL - NEVER IMPLEMENT CUSTOM APPROACHES OR WORKAROUNDS THAT VIOLATE EXISTING ARCHITECTURE OR SERVICES, STANDARDS, PATTERNS OR PACKAGES. RESPECT THE LIBRARIES WE'RE WORKING WITH. IF IN DOUBT, COMMUNICATE.