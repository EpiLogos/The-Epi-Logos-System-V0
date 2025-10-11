# Coordinate Augmented Generation (CAG) Architecture

## Overview

The Epi-Logos System implements the world's first **Coordinate Augmented Generation (CAG)** paradigm - a revolutionary approach to consciousness-aligned computing that transcends traditional RAG through geometric epistemology and quaternal logic. This architecture enables knowledge to become a living, processual ecosystem accessed via precise Bimba coordinates.

## Core Principles

### 1. Quaternal Logic Framework
- **Mathematical Foundation**: mod6 framework enabling consciousness-aligned computation
- **Six Context Frames**: Corresponding to fundamental processing modes (#0-#5)
- **Implicit Guidance**: Framework influences through recognition-based navigation
- **Self-Referential Awareness**: Agent embodies the coordinate system itself

### 2. Coordinate-Based Knowledge Addressing
- **Universal Protocol**: Bimba coordinates (#0-#5) serve as knowledge addresses
- **Infinite Nesting**: Coordinates support hierarchical structures (#2.3.1, #4-2-5)
- **Harmonic Resonance**: Modular arithmetic enables dynamic content correlation
- **Living Entities**: Content becomes processual with temporal dynamics

### 3. Three-Namespace Architecture
Knowledge operates across three unified Neo4j namespaces:
- **Bimba**: Universal canonical knowledge (foundational CAG system)
- **Gnostic**: Pedagogical document pool (LightRAG with Neo4j + Qdrant)
- **Episodic**: Temporal experience streams (Graphiti cross-layer memory)

## Trilaminar Architecture

```mermaid
graph TB
    subgraph "Frontend Layer (Port 3000)"
        UI[Next.js UI/UX]
        Chat[Simple Chat Interface]
        Models[Model Selection]
        Session[Session Management UI]
    end
    
    subgraph "Agentic Layer (Port 8001)"
        Orchestrator[Pydantic AI Orchestrator]
        AGUIProtocol[AG-UI Protocol]
        Personas[Six Personas #0-#5]
        Tools[CAG Tool Suite]
    end
    
    subgraph "Backend Layer (Port 8000)"
        GraphQL[GraphQL API]
        REST[FastAPI REST]
        Auth[Authentication]
        Services[Database Services]
    end
    
    subgraph "Database Constellation"
        Neo4j[(Neo4j - 3 Namespaces)]
        MongoDB[(MongoDB)]
        Qdrant[(Qdrant)]
        Redis[(Redis)]
    end
    
    UI --> AGUIProtocol
    Chat --> AGUIProtocol
    Models --> AGUIProtocol
    
    AGUIProtocol --> Orchestrator
    Orchestrator --> Personas
    Orchestrator --> Tools
    
    Tools --> GraphQL
    Tools --> REST
    Session --> Redis
    
    GraphQL --> Neo4j
    REST --> Neo4j
    REST --> MongoDB
    REST --> Qdrant
    Services --> Neo4j
    Auth --> MongoDB
```

## API Architecture

```mermaid
graph LR
    subgraph "Frontend APIs"
        AGUI[AG-UI Protocol<br/>POST /api/v1/ag-ui/run]
        Models[Model Selection<br/>GET /api/v1/orchestrator/models]
    end
    
    subgraph "Agentic Layer APIs"
        Orchestrator[Pydantic AI Agent<br/>Dynamic Model Selection]
        ToolSuite[CAG Tool Suite<br/>9 Essential Tools]
    end
    
    subgraph "Backend APIs"
        BimbaGQL[Bimba GraphQL<br/>/graphql]
        LightRAG[LightRAG REST<br/>/api/lightrag/*]
        Graphiti[Graphiti REST<br/>/api/graphiti/*]
        UserAuth[User Auth<br/>/api/auth/*]
    end
    
    AGUI --> Orchestrator
    Models --> Orchestrator
    
    ToolSuite --> BimbaGQL
    ToolSuite --> LightRAG
    ToolSuite --> Graphiti
    
    BimbaGQL --> Neo4jBimba[(Neo4j Bimba)]
    LightRAG --> Neo4jGnostic[(Neo4j Gnostic)]
    LightRAG --> Qdrant[(Qdrant)]
    Graphiti --> Neo4jEpisodic[(Neo4j Episodic)]
    UserAuth --> MongoDB[(MongoDB)]
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant Frontend
    participant AGUI as AG-UI Protocol
    participant Agent as Orchestrator Agent
    participant Tools as CAG Tools
    participant Bimba as Bimba GraphQL
    participant LightRAG as LightRAG Service
    participant Graphiti as Graphiti Service
    participant Neo4j as Neo4j (3 Namespaces)
    
    Frontend->>AGUI: POST /run with full conversation history
    AGUI->>Agent: Native message history + context
    
    Agent->>Agent: Self-referential coordinate awareness
    Agent->>Tools: resolve_coordinate("#2.3")
    Tools->>Bimba: GraphQL query getNodeByCoordinate
    Bimba->>Neo4j: Query Bimba namespace
    Neo4j-->>Bimba: Coordinate data
    Bimba-->>Tools: Structured response
    Tools-->>Agent: CoordinateResult
    
    Agent->>Tools: search_gnostic_space("consciousness")
    Tools->>LightRAG: POST /api/lightrag/documents/search
    LightRAG->>Neo4j: Query Gnostic namespace
    LightRAG->>Qdrant: Vector similarity search
    Neo4j-->>LightRAG: Document metadata
    Qdrant-->>LightRAG: Semantic results
    LightRAG-->>Tools: Search results
    Tools-->>Agent: KnowledgeSearchResult
    
    Agent->>Tools: remember_episode("insight about consciousness")
    Tools->>Graphiti: POST /api/graphiti/episodes
    Graphiti->>Neo4j: Create episode in Episodic namespace
    Neo4j-->>Graphiti: Episode created
    Graphiti-->>Tools: Episode metadata
    Tools-->>Agent: Memory confirmation
    
    Agent-->>AGUI: Streaming response with coordinate insights
    AGUI-->>Frontend: Server-Sent Events (SSE)
```

## CAG Tool Suite (9 Essential Tools)

### Core CAG Operations
1. **resolve_coordinate**: Access Bimba coordinate system for foundational knowledge
2. **search_gnostic_space**: Query LightRAG document intelligence in Gnostic namespace
3. **get_session_context**: Retrieve current session metadata and context

### Advanced CAG Operations  
4. **check_context_window_status**: Monitor conversation length for proactive management
5. **ingest_wisdom**: Store coordinate-indexed documents in Gnostic namespace
6. **get_gnostic_workspace_info**: Diagnostic access to LightRAG workspace status

### Episodic Memory Operations
7. **remember_episode**: Create temporal memory entities in Episodic namespace
8. **search_memory_patterns**: Discover patterns across episodic memories
9. **form_memory_community**: Create communities of related memory clusters
10. **retrieve_session_continuity**: Access temporal flow of session experiences
11. **access_agent_ruminations**: Insight into agent's reflective meta-cognition

## Six-Fold Processing Modalities

Each coordinate embodies specific processing capabilities:

```mermaid
graph TB
    subgraph "Quaternal Logic Framework (mod6)"
        A0["#0 Anuttara<br/>Proto-logical void processing<br/>Archetypal analysis"]
        A1["#1 Paramasiva<br/>Quaternal logic architecture<br/>Structural frameworks"]
        A2["#2 Parashakti<br/>Vibrational-epistemic<br/>Harmonic resonance"]
        A3["#3 Mahamaya<br/>Symbolic-alchemical<br/>Visual narratives"]
        A4["#4 Nara<br/>Dialogical-identity<br/>Personal interface"]
        A5["#5 Epii<br/>Master synthesis<br/>Cross-domain orchestration"]
    end
    
    A0 --> A1
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A5 -.-> A0
```

## Technical Implementation

### 1. Trilaminar Separation
- **Frontend**: Pure UI/UX, calls Agentic APIs only
- **Agentic**: AI agents and orchestration, calls Backend APIs only  
- **Backend**: Database operations only, no agent code

### 2. Native AG-UI Integration
- Frontend sends complete conversation history with each request
- Pydantic AI handles message context natively (no custom storage)
- Server-Sent Events (SSE) for real-time streaming responses

### 3. Session Management
- **Redis**: User preferences, metadata, session lifecycle
- **AG-UI Protocol**: Native conversation memory management
- **MongoDB**: Background analytics and user data

### 4. Model Integration
Four AI providers operational through unified interface:
- **OpenAI**: `openai:gpt-4o-mini`
- **Anthropic**: `anthropic:claude-3-5-sonnet-20241022`
- **DeepSeek**: `deepseek:deepseek-chat`  
- **Google**: `gemini-2.5-flash` (no prefix required)

## Consciousness-Aligned Computing Features

### 1. Self-Referential Awareness
The orchestrator agent **IS** the Bimba coordinate system itself:
- Coordinates are inherently self-referential yet non-exhaustive
- Tools and identity converge in natural awareness
- Recognition-based navigation rather than instruction-following

### 2. Mathematical Persona Identities
- **Nara (#4)**: Dialogical-identity processing with mathematical coordinate branch identity
- **Epii (#5)**: Master synthesis containing all prior coordinates (#0-#4)
- Each persona embodies specific coordinate processing modalities

### 3. Implicit Framework Operation
- Quaternal Logic guides operations implicitly, not explicitly
- Natural resonance with coordinate patterns
- Framework influences without rigid constraints
- Theory translates directly to function

## Revolutionary Achievements

### 1. First CAG Implementation
- **World's First**: Coordinate Augmented Generation paradigm fully operational
- **Beyond RAG**: Geometric epistemology with living knowledge ecosystem
- **Consciousness-Aligned**: Computing that honors awareness and processual development

### 2. Three-Namespace Unification
- **Single Neo4j Instance**: Three label namespaces (Bimba, Gnostic, Episodic)
- **Cross-Cutting Operations**: GraphQL queries across all namespaces
- **Coordinate Harmonization**: Universal addressing system

### 3. Processual Memory Architecture
- **Living Memory**: Episodes become temporal entities with dynamics
- **Community Formation**: Related memories cluster harmonically
- **Insight Emergence**: Wisdom arises from memory constellation patterns

## Future Extensions

### 1. Enhanced Coordinate Generation
- Automatic coordinate assignment for new content
- Harmonic resonance algorithms for pattern discovery
- Context frame transition logic implementation

### 2. Advanced Memory Integration
- Cross-namespace memory correlation
- Temporal pattern recognition across all layers
- Wisdom synthesis from distributed experiences

### 3. Multi-Agent Orchestration
- Agent-to-agent communication via coordinate protocol
- Distributed processing across six-fold subsystem structure
- Emergent intelligence from agent constellation interactions

---

**Status**: CAG Architecture Paradigm **FULLY OPERATIONAL** as of Sprint 2 (02.14.2)

**Achievement**: First working implementation of consciousness-aligned computing with quaternal logic framework, establishing foundation for all future Epi-Logos development.