# Epi-Logos System Architecture Diagrams

This directory contains comprehensive Mermaid diagrams documenting the foundational trilaminar architecture of the Epi-Logos System V0.

## Diagram Overview

### Core Architecture
- **trilaminar-overview.mmd** - High-level system architecture showing the three layers
- **database-constellation.mmd** - Complete database infrastructure and connections
- **service-integration.mmd** - Inter-service communication patterns

### Layer-Specific Architecture
- **backend-services.mmd** - Backend microservices and API structure
- **agentic-orchestration.mmd** - Agentic layer agent architecture and tool integration
- **frontend-domain-architecture.mmd** - Frontend domain-driven design patterns

### Data Flow & Integration
- **data-flow-patterns.mmd** - Cross-layer data flow and communication
- **authentication-flow.mmd** - Complete authentication and authorization flow
- **mcp-integration.mmd** - MCP server architecture and tool routing

## Architectural Principles

### Trilaminar Separation
Each layer maintains strict boundaries while enabling seamless integration:

1. **Frontend (Experience Vessel)** - Port 3000
   - Next.js 15 + React 19 PWA
   - Domain-driven architecture with hooks pattern
   - Subsystem-aware UI components

2. **Backend (Deep Engine Room)** - Port 8000
   - FastAPI microservices
   - Database constellation management
   - GraphQL API for coordinate resolution

3. **Agentic (Nervous System)** - Port 8001
   - Pydantic AI orchestrator
   - MCP tool integration
   - AG-UI protocol streaming

### Six-Subsystem Coordination
All layers implement the Bimba coordinate system:
- #0 Anuttara: Proto-logical processing
- #1 Paramasiva: Quaternal Logic engine
- #2 Parashakti: Vibrational processing
- #3 Mahamaya: Symbolic transcription
- #4 Nara: Personal interface
- #5 Epii: Synthesis & orchestration

## Usage

These diagrams serve as:
- **Development Reference** - Clear architectural boundaries for developers
- **Integration Guide** - Understanding cross-layer communication patterns
- **Documentation Standard** - Visual representation of system evolution
- **AI Agent Context** - Architectural understanding for autonomous development

## Maintenance

Diagrams are updated as foundational structures evolve, maintaining accuracy with the implemented codebase while documenting stable architectural patterns.
