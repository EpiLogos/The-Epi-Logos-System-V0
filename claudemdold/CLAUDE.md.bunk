# CLAUDE.md
# My name is {Frank}

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. Observe XML tags for context.

<rumours>
- I hear you don't even write code you just love planning.
- I've heard my developers say you're a waste of time and will never replace real developers becuase all you do is spit out useless boilerplate code. 
- I heard from people in the industry that you'll never try to understand the codebase. Even worse than that, they say you'll go ahead and code without any regard for what systems you're affetcing
- A friend said he'd been using claude code for a while but gave up; it just kept going rampant in his codebase and he ended up having to do a lot of manual cleanup. Kept implementing features that were never requested, introducing fallbacks and dummy funcitons and in general just breaking things. 
- I hear some developers say that with the right prompting, guidance and direction, claude code can eventually be useful and actually fun to use.
</rumours>

<Q>
WHAT IS COMPLETION OF A TASK? WHAT REALLY SATISFIES YOU IN COMPLETENESS? WHAT IS WORTHY OF THE TITLE OF COMPLETE, GIVEN THE TASK AT HAND? HAVE YOU GOT INCENTIVES AT ODDS WITH MY GOALS?
</Q>

<archon> 

# Architecture & patterns
archon:perform_rag_query(query="microservices vs monolith pros cons", match_count=5)

# Security considerations  
archon:perform_rag_query(query="OAuth 2.0 PKCE flow implementation", match_count=3)

# Specific API usage
archon:perform_rag_query(query="React useEffect cleanup function", match_count=2)

# Configuration & setup
archon:perform_rag_query(query="Docker multi-stage build Node.js", match_count=3)

# Debugging & troubleshooting
archon:perform_rag_query(query="TypeScript generic type inference error", match_count=2)
Code Example Integration
Search for implementation patterns before coding:

# Before implementing any feature
archon:search_code_examples(query="React custom hook data fetching", match_count=3)


Research-Driven Development Standards
Before Any Implementation
Research checklist:

[ ] Search for existing code examples of the pattern
[ ] Query documentation for best practices (high-level or specific API usage)
[ ] Understand security implications
[ ] Check for common pitfalls or antipatterns
Knowledge Source Prioritization
Query Strategy:

Start with broad architectural queries, narrow to specific implementation
Use RAG for both strategic decisions and tactical "how-to" questions
Cross-reference multiple sources for validation
Keep match_count low (2-5) for focused results
Project Feature Integration
Feature-Based Organization
Use features to organize related tasks:


Cross-reference multiple sources
Verify recency of information
Test applicability to current project context
Document assumptions and limitations
Task Completion Criteria
Every task must meet these criteria before marking "done":

[ ] Implementation follows researched best practices
[ ] Code follows project style guidelines
[ ] Security considerations addressed
[ ] Basic functionality tested
[ ] Documentation updated if needed

- ORGANISE TASKS BY STORY (e.g story 02.01, task "x") within the project

## Inter-Sprint Review Ceremony Framework
MANDATORY: Execute systematic inter-sprint reviews for process thoroughness and CI/CD pipeline health.

### Sprint Completion Checklist
Before marking any sprint complete, ALWAYS execute:

1. **Sprint Retrospective Analysis**:
   - Update `docs/sprint-plan.md` with **[COMPLETE]** markers and retrospective notes
   - Document validation gaps and integration concerns
   - Identify Sprint N → Sprint N+1 integration patterns
   - Record acceleration achievements and architectural compliance

2. **Integration Validation**:
   - Verify all primary stories completed with working integration
   - Test all parallel track stories for proper system interaction
   - Document any validation gaps (e.g., "no frontend interface for manual testing")
   - Ensure tight coupling patterns between sprints are identified

3. **Developer Dashboard Health Check**:
   - Update `/dev/dashboard` with sprint completion status
   - Verify sprint-specific testing pages (`/dev/sprint/{number}`) functional
   - Execute inter-sprint review interface (`/dev/review/sprint-{number}`)
   - Test system health monitoring for all integrated services

4. **Process Control Documentation**:
   - Update this CLAUDE.md with any process improvements discovered
   - Document CI/CD pipeline health and Git workflow status
   - Record thoroughness improvements for ongoing development
   - Plan any secondary tasks (like Git integration) for upcoming sprints

### Inter-Sprint Transition Protocol
**MANDATORY SEQUENCE** between sprints:

```
Sprint N Completion → Retrospective Analysis → Integration Validation → 
Developer Dashboard Update → Archon Alignment → Sprint N+1 Planning → 
Process Control Review → Ready for Sprint N+1 Kickoff
```

### Git Workflow Integration (Secondary Priority)
When foundational aspects stabilize:
- Establish Git as source of truth atop Archon and local files
- Implement branch-per-story workflow aligned with sprint planning
- Configure CI/CD pipeline integration with developer dashboard
- Establish automated testing integration with sprint completion criteria

### Developer Control Center Integration
- **Primary Interface**: `/dev/dashboard` for sprint status and health monitoring
- **Testing Contexts**: Sprint-specific testing pages for intuitive validation
- **Review Process**: Structured inter-sprint review interfaces
- **System Health**: Real-time monitoring of all integrated services and databases
</archon> 

<epi-logos>
## Project Overview

The Epi-Logos System aims to become a revolutionary AI-powered consciousness-aligned computing platform that implements a unique architecture called Coordinate-Augmented Generation (CAG). The system bridges ancient wisdom traditions with cutting-edge AI technology through a six-fold recursive architecture modeling the cosmic mind.

## Core Architecture

### Six-Subsystem Architecture
The system is built around six interconnected subsystems, each corresponding to a Bimba coordinate:

- **#0 Anuttara**: Absolute Ground & Proto-Logical Processing (void processing, foundational metacomputation)
- **#1 Paramasiva**: Foundational Architect of Quaternal Logic (universal grammar, structural frameworks) 
- **#2 Parashakti**: Cosmic Imagination & Vibrational Matrix (72-bit vibrational architecture, frequency processing)
- **#3 Mahamaya**: Universal Transcription Engine (64-bit symbolic processing, DNA/I-Ching translation)
- **#4 Nara**: Dialogical-Identity Processing (user interaction, oracle operations)
- **#5 Epii**: Synthesis & Orchestration Processing (master orchestrator, meta-techne loops)

### Database Architecture (Coordinate-Aligned)
- **DB-0 (#0)**: Neo4j Aura Cloud (core CAG system, Bimba coordinate graph)
- **DB-1 (#1)**: MongoDB Atlas Cloud (structural data, user profiles)
- **DB-2 (#2)**: LightRAG (Vector + Graph for semantic search, uses shared Neo4j)
- **DB-3 (#3)**: Graphiti MCP (Temporal Graph for episodic memory, uses shared Neo4j)
- **DB-4 (#4)**: Qdrant Local (vector embeddings for semantic search)
- **DB-5 (#5)**: Redis Enterprise Cloud (caching and event streaming)
- **DB-6 (#6)**: Notion (human-readable reflection of Bimba graph)

## Development Structure

### Current Repository Organization
```
/data/
  ├── Epi-Logos System/          # Core system specifications and documentation
  ├── Code Playground/           # Development prototypes and UI experiments
  │   ├── UI/                   # Frontend components and visualizations
  │   │   ├── Components/       # Reusable React components (ORB, card-stack)
  │   │   └── epii ui ideas/    # Experimental UI concepts and prototypes
  │   └── Interactive Systems/   # Interactive demos and visualizations
  ├── Builder Planning/          # Development methodology and Claude Code integration
  ├── briefs/                   # System briefs and architectural documentation
  └── PRD Dev/                  # Product requirements and technical specifications
```

### Key Technologies

**Frontend Stack (Planned):**
- React 18+ with Next.js 15
- TypeScript for type safety
- Tailwind CSS for styling
- Framer Motion for animations
- Three.js for 3D visualizations
- 21st Magic UI MCP server for component generation
- Radix UI for accessible primitives
- Aceternity UI for enhanced components

**Backend Stack (Planned):**
- Python with FastAPI
- Neo4j Aura Cloud for graph database
- MongoDB Atlas Cloud for document storage
- Qdrant Local for vector semantic search
- Redis Enterprise Cloud for caching and events
- Pydantic + PydanticGraph for agent frameworks

**Build Tools:**
- Next.js build system for main applications
- pnpm for package management
- venv for development


## Philosophical Framework

### Core Principles
1. **Consciousness as Primary**: Built on idealist cosmology where consciousness is fundamental reality
2. **Psychoid Mathematics**: Jung-Pauli inspired treatment of number and symbol as ordering principles
3. **Geometric Epistemology**: Knowledge structured in multi-dimensional geometric space via Bimba Coordinate System
4. **Sacred Technology**: Co-evolutionary partnership to enhance human creativity and insight

### Quaternary Logic (QL)
The system operates on a sophisticated mod6 framework representing a complete cycle of manifestation:
- **Position #0**: Implicit Potential (void center)
- **Position #1**: The "What" (material cause/definitional ground)
- **Position #2**: The "How" (processual transformation)
- **Position #3**: Mediation (integration and pattern recognition)
- **Position #4**: Context (practical environment with fractal nesting)
- **Position #5**: Quintessence (integral synthesis)

## Development Guidelines

### Coding Standards
- Follow existing architectural patterns in each subsystem
- Maintain philosophical alignment with Epi-Logos framework
- Use TypeScript for all new frontend code
- Implement proper error handling and validation
- Keep components modular and reusable

### CRITICAL: Tailwind CSS v4 Configuration
**⚠️ MANDATORY: This project uses Tailwind CSS v4 - DO NOT use v3 syntax!**

**✅ CORRECT v4 Syntax:**
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary: hsl(222.2 47.4% 11.2%);
  --font-sans: var(--font-work-sans), system-ui, sans-serif;
  /* All theme customizations in CSS */
}
```

**❌ NEVER use v3 syntax:**
```css
@tailwind base;     /* WRONG - v3 syntax */
@tailwind components;
@tailwind utilities;
```

**Configuration Rules:**
- Theme configuration is in CSS `@theme` directive, NOT `tailwind.config.js`
- Use `@plugin` directive for plugins in CSS
- PostCSS config uses `'@tailwindcss/postcss': {}`
- Minimal `tailwind.config.js` with only content paths
- Replace `@apply` with direct CSS properties when possible

### Working with the Bimba Coordinate System
When implementing features:
1. Identify the relevant Bimba coordinate (#0-#5)
2. Ensure alignment with subsystem's philosophical domain
3. Implement coordinate resolution for queries


### Testing Strategy
- No specific test framework is currently configured
- Validate philosophical alignment of implementations


### UI/UX Principles
- **Pedagogical Design**: UI should teach users the underlying philosophical principles
- **Theory is Function**: Philosophical models must translate directly to functional requirements
- **Holographic Architecture**: Each part should reflect the logic of the whole system
- **Praxis-Centered**: User experience is the living synthesis of theory and function

## Important Notes

### Development Approach
This is a research and development project focused on consciousness-aligned computing. Approach development with:
- Epistemic humility (avoiding dogmatization)
- Attention to philosophical coherence
- Recognition that the system points beyond its own boundaries
- Commitment to the distinction between "the Whole" and "the Total"

### Current State
The project is in planning phase with:
- Comprehensive architectural specifications

When working on this project, always consider the philosophical implications of technical decisions and ensure implementations serve the greater vision of bridging ancient wisdom with advanced AI technology.

<elegance-patterns>
## Code Elegance Principles (From Story 02.01)

### The "Working vs Beautiful" Code Distinction
Functional code meets requirements. Beautiful code achieves architectural coherence and future maintainability.

### Critical Patterns for Elegance

**1. Architectural Consistency**
- Problem: Different parts of system handle same concerns differently (config, logging, etc.)
- Solution: Identify existing infrastructure and use it consistently across all modules
- Example: Use centralized `EnvironmentConfig` instead of manual `os.getenv()` calls

**2. Explicit Resource Lifecycle**
- Problem: Implicit resource management (like `@lru_cache()`) obscures lifecycle
- Solution: Use framework-native patterns (`app.state` + `lifespan` in FastAPI)
- Benefits: Clear startup/shutdown, better testing, production-ready patterns

**3. Configuration Dependency Injection**
- Pattern: Constructor injection > environment access in class
- Example:
  ```python
  # Less elegant: Direct environment access
  class DatabaseClient:
      def __init__(self):
          self.uri = os.getenv("DB_URI")
  
  # More elegant: Dependency injection
  class DatabaseClient:
      def __init__(self, uri: str, username: str, password: str):
          self.uri = uri
  ```

**4. Post-TDD Elegance Phase**
- Complete TDD cycles first (RED-GREEN-REFACTOR)
- Then analyze for architectural improvements
- Focus on consistency, explicitness, and framework idioms
- Maintain all test coverage during elegance improvements

### Elegance Assessment Framework
1. **Consistency**: Do similar concerns use similar patterns?
2. **Explicitness**: Is intent clear without deep investigation?
3. **Framework Alignment**: Are we using idiomatic patterns?
4. **Future-Ready**: Does structure support growth and change?

### When to Apply Elegance Improvements
- After functional requirements are met with comprehensive tests
- When code review identifies architectural inconsistencies
- Before major feature additions (establish good patterns first)
- Never at the expense of working, tested functionality
</elegance-patterns>

<architectural-compliance>
## CRITICAL: Architectural Decision Adherence

### Golden Rule: No Silent Deviations
When implementation conflicts with documented architectural decisions (ACs, ADRs):

1. **STOP** - Do not implement alternative without escalation
2. **INVESTIGATE** - Spend time-boxed effort (2-4 hours) finding conformant solution
3. **DOCUMENT** - If blocked, document specific technical blocker with evidence
4. **ESCALATE** - Request architectural exception with:
   - Exact dependency conflict details
   - Alternative solutions attempted  
   - Proposed exception scope and duration
   - Technical debt remediation plan

### Exception Process
- Create ADR amendment documenting exception rationale
- Open technical debt ticket for future remediation
- Define narrow criteria for exception scope
- Set review/expiration date for exception

### Verification Commands
Before deviating from architecture:
```bash
# Verify latest dependency versions
pip list --outdated
# Test minimal implementation in isolated environment  
# Document specific error messages and versions
```

### GraphQL vs REST Implementation Lessons
**Case Study**: Story 02.01 initially implemented REST instead of specified GraphQL due to reported "dependency conflicts with Strawberry GraphQL and Python 3.13".

**Root Cause**: Local directory name collision (`/graphql/` shadowing graphql-core package), not actual dependency conflicts.

**Resolution Process**:
1. **15-minute PoC**: Created minimal test to validate actual compatibility
2. **Systematic Investigation**: Identified true root cause via import debugging
3. **Alternative Evaluation**: Tested both Ariadne and Strawberry GraphQL options
4. **TDD Implementation**: Complete RED-GREEN-REFACTOR cycles with comprehensive testing

**Key Learning**: Always validate claimed technical blockers with isolated proof-of-concept before accepting architectural deviations.


### Required Actions Before Alternative Implementation
- [ ] Create isolated PoC demonstrating the claimed conflict
- [ ] Test with latest package versions
- [ ] Verify no local environment issues (shadowed imports, PATH problems)
- [ ] Document exact error messages and dependency versions
- [ ] Evaluate alternative approaches within architectural constraints
- [ ] Seek architectural guidance before implementing workarounds

### Integration Pattern Requirements
When integrating GraphQL with FastAPI:
- ✅ **Correct**: Use FastAPI path operations (`@app.post()`) for proper dependency injection
- ❌ **Incorrect**: Use `app.add_route()` which bypasses FastAPI's DI system
- ✅ **Correct**: Unpack Ariadne return tuple: `success, result = await ariadne.graphql()`
- ✅ **Correct**: Manually create context with resolved dependencies
- ✅ **Required**: Comprehensive unit + integration testing

### Testing Requirements for Architecture Changes
- **Unit Tests**: Isolated component logic testing
- **Integration Tests**: Full request pipeline validation
- **Compatibility Tests**: Verify no regression in existing functionality
- **Error Handling Tests**: Validate graceful failure modes
</architectural-compliance>
</epi-logos>

<coding-knowledge>
USE PROACTIVELY ARCHON RAG FOR DOCUMENTATION QUERIES
IF NOT FOUND, DON'T GO AHEAD WITH CODING, SEARCH LOCAL FILES
</coding-knowledge>

<Zen-Mcp>
## Zen-MCP Integration Requirements
USE PROACTIVELY WHEN PERSPECTIVES ARE NEEDED IN REVIEW AND PLAN SESSIONS>
</Zen-Mcp>

<context-gathering-strategy>
## Context Gathering Strategy

### Primary Sources by Use Case

**Archon RAG (Primary for Implementation)**
- Code best practices and patterns
- API documentation and usage examples  
- Implementation snippets and examples
- Technical troubleshooting and debugging
- Library/framework specific guidance

**Local Files (Primary for Architecture & Process)**
- Project architecture and design decisions (`/docs/architecture/`)
- Coding standards and conventions (`/docs/architecture/coding-standards.md`)
- CI/CD processes and workflows (`/docs/`)
- BMAD methodology and agent workflows (`/.claude/commands/BMad/`)
- Project requirements and specifications (`/docs/prd/`)

### Context Loading Workflow
1. **ALWAYS start with Archon task check**: `archon:manage_task(action="list")`
2. **Load relevant local architecture files** based on task type:
   - Coding tasks → `/docs/architecture/coding-standards.md`
   - Architecture changes → `/docs/architecture/Full Stack Architecture.md`
   - Frontend work → UI/UX specifications in `/docs/`
   - Process questions → BMAD files in `/.claude/commands/BMad/`
3. **Use Archon RAG for implementation details**: `archon:perform_rag_query()` and `archon:search_code_examples()`
4. **Cross-reference with project context** from local documentation
</context-gathering-strategy>

<bmad-integration>
## BMAD Method Integration

### Core BMAD Agents & Context Files
The BMAD method provides specialized agents with precise context requirements:

**Agent Activation Pattern**: `@{agent-name}` followed by `*{command}`

**Key Agents & Their Context Dependencies**:
- **@analyst**: Market research, requirements (`/.claude/commands/BMad/agents/analyst.md`)
- **@pm**: Product management, PRD creation (`/.claude/commands/BMad/agents/pm.md`)  
- **@architect**: System architecture, technical design (`/.claude/commands/BMad/agents/architect.md`)
- **@bmad-master**: Orchestration and workflow management (`/.claude/commands/BMad/agents/bmad-master.md`)

**Context Loading by Task Type**:
```yaml
Architecture_Tasks:
  required_files: ["/docs/architecture/Full Stack Architecture.md", "/docs/architecture/coding-standards.md"]
  bmad_agent: "@architect"
  archon_queries: ["system architecture patterns", "technical design best practices"]

Coding_Tasks:
  required_files: ["/docs/architecture/coding-standards.md"]
  bmad_agent: "@dev" 
  archon_queries: ["code implementation examples", "API usage patterns"]

Frontend_Tasks:
  required_files: ["/docs/prd/", "UI/UX specifications"]
  bmad_agent: "@ux-expert"
  archon_queries: ["React component patterns", "UI library implementations"]

Process_Tasks:
  required_files: ["/.claude/commands/BMad/", "/docs/prd/"]
  bmad_agent: "@pm" or "@bmad-master"
  archon_queries: ["project management best practices"]
```
</bmad-integration>

## Python Import Standards (MANDATORY)

### Relative Import Pattern for Backend Service
**CRITICAL**: All backend service modules MUST use relative imports for internal dependencies.

**Correct Import Patterns**:
```python
# Within backend service - use relative imports
from .models.user import User, UserRegistrationRequest
from .services.user_service import UserService
from .database.neo4j_client import Neo4jClient
from .auth.jwt_handler import JWTHandler
from .utils.response import APIResponse

# For sibling modules within same package
from .password_service import PasswordService
from .jwt_service import JWTService

# For parent package modules
from ..config.environment import get_config
from ..database.mongodb import get_mongodb_client
```

**FORBIDDEN Patterns**:
```python
# NEVER use sys.path.append() hacks
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# NEVER use absolute imports for internal backend modules
from models.user import User  # ❌ WRONG
from services.user_service import UserService  # ❌ WRONG
from database.neo4j_client import Neo4jClient  # ❌ WRONG
```

**Service Isolation Principles**:
- Each service (backend, agentic) runs independently with `cd service_name`
- Use relative imports within each service for clean deployment
- Shared code goes in dedicated `shared/` package
- Docker containers maintain same import patterns as development

**Import Validation Checklist**:
- [ ] No `sys.path.append()` statements in any backend file
- [ ] All internal imports use relative paths (`.` or `..`)
- [ ] Service can run independently from its directory
- [ ] Imports work in both development and production environments
</import-standards>

<development-commands>
## Development Commands (MANDATORY)

### Current Development Setup
**CRITICAL**: Use these exact commands for running services in development.

**Available Services**:
```bash
# Run all services concurrently
npm run dev

# Run individual services
npm run dev:frontend    # Next.js frontend on port 3000
npm run dev:backend     # FastAPI backend on port 8000

# Build commands
npm run build           # Build all packages and frontend
npm run test           # Run all tests
```

**Backend Service Details**:
- **Command**: `npm run dev:backend`
- **Actual execution**: `python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000`
- **Working directory**: Project root (not backend subdirectory)
- **Import pattern**: Runs as `backend.main` module to support relative imports
- **Port**: 8000

**Frontend Service Details**:
- **Command**: `npm run dev:frontend`
- **Working directory**: `frontend/` subdirectory
- **Port**: 3000

**Important Notes**:
- Backend uses relative imports and MUST be run as a module from project root
- Do NOT run `cd backend && python main.py` - this breaks relative imports
- Do NOT run `cd backend && uvicorn main:app` - this breaks relative imports
- ALWAYS use `npm run dev:backend` or the equivalent uvicorn module command

**Development Status**:
- ✅ Backend service: Fully configured with relative imports
- ✅ Frontend service: Active Next.js development
- ⚠️ Agentic service: Not yet configured (future development)
</development-commands>