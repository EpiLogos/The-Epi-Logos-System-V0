# Unified Orchestrator Architecture

## Overview

The Unified Orchestrator is the foundational orchestration layer of the Epi-Logos System, implementing a two-track architecture where **Track A** (UnifiedOrchestrator) provides session management and coordination, while **Track B** (WorkflowEngine) handles persona-specific workflow execution with Coordinate-Augmented Generation (CAG).

## System Architecture

### Track A: UnifiedOrchestrator (Foundation Layer)

**Core Responsibilities:**
- Session lifecycle management with Redis Cloud state coordination
- Persona selection and masking capability (NARA, EPII, SYSTEM)
- MongoDB conversation history tracking and context accumulation
- Initial request routing and context preparation for workflow execution
- Response coordination and final formatting for user delivery

**Key Components:**

#### 1. PersonaManager (`persona_manager.py`)
- Manages persona instantiation and "clean slate" re-initialization (AC5)
- Handles persona-specific configuration loading and validation
- Coordinates with WorkflowEngine for persona workflow discovery

#### 2. SessionManager & OrchestratorSession (`session.py`)
- Redis Cloud session state persistence and recovery
- User context accumulation across conversation turns
- Session-scoped persona state management
- Bimba coordinate context tracking for CAG processing

#### 3. ContextPackageBuilder (`context_package.py`)
- ACT Protocol Context Package construction
- Conversation history integration from MongoDB
- Bimba coordinate resolution for workflow context
- Context transformation for WorkflowExecutionContext

#### 4. BimbaGraphQLClient (`bimba_client.py`)
- Coordinate-Augmented Generation (CAG) coordinate resolution
- GraphQL interface to Neo4j Aura Cloud (DB-0) Bimba coordinate graph
- Coordinate dependency validation and hierarchical processing
- Six-subsystem coordinate mapping (#0-#5)

### Track B: WorkflowEngine (Execution Layer)

**Core Responsibilities:**
- Persona-specific workflow template registration and discovery
- Deep persona logic execution with coordinate-aware processing
- Redis Cloud workflow state persistence with checkpoint recovery
- MCP tool integration infrastructure for extensible capabilities
- Comprehensive error handling with retry mechanisms and graceful degradation

**Key Components:**

#### 1. WorkflowEngine (`workflows/engine.py`)
- Workflow template registration by PersonaType
- Workflow execution coordination with Track A integration
- State persistence coordination with Track A session management
- Error handling and retry mechanisms with exponential backoff

#### 2. PersonaWorkflow Templates (`workflows/templates/`)
- **Base Template** (`base.py`): Abstract workflow foundation with coordinate resolution
- **NaraWorkflow** (`nara_workflow.py`): Six-fold processing architecture (#4.0-#4.5)
- **EpiiWorkflow** (`epii_workflow.py`): Contemplative cycle processing with expert domain routing

#### 3. WorkflowStateManager (`workflows/state.py`)
- Redis Cloud state persistence with checkpoint recovery
- Workflow lifecycle tracking (PENDING → RUNNING → COMPLETED/FAILED)
- Session-scoped workflow coordination with Track A
- Garbage collection and state cleanup mechanisms

#### 4. MCPToolRegistry (`workflows/tools/registry.py`)
- MCP server registration and tool discovery
- Tool calling infrastructure with error handling and timeouts
- Future-ready extensibility for domain-specific tool integration

## Data Flow Architecture

```mermaid
graph TB
    subgraph "User Interface Layer"
        U[User Input]
        UR[User Response]
    end

    subgraph "Track A: UnifiedOrchestrator (Foundation Layer)"
        UO[UnifiedOrchestrator Core]
        SM[SessionManager]
        PM[PersonaManager]
        CPB[ContextPackageBuilder]
        BGC[BimbaGraphQLClient]
    end

    subgraph "Track B: WorkflowEngine (Execution Layer)"
        WE[WorkflowEngine]
        WSM[WorkflowStateManager]
        PWB[PersonaWorkflow Base]
        NW[NaraWorkflow]
        EW[EpiiWorkflow]
        MTR[MCPToolRegistry]
    end

    subgraph "Shared State Layer"
        RC[(Redis Cloud)]
        RC_S[Session State]
        RC_W[Workflow State]
        RC_C[Context Cache]
    end

    subgraph "Data Layer"
        NEO[(Neo4j Aura Cloud<br/>DB-0: Bimba Coordinates)]
        MONGO[(MongoDB Atlas Cloud<br/>DB-1: Conversation History)]
        QDRANT[(Qdrant Local<br/>DB-4: Vector Embeddings)]
    end

    subgraph "Persona Configuration"
        PC_N[Nara Persona Config<br/>#4 Coordinates]
        PC_E[Epii Persona Config<br/>#5 Coordinates]
    end

    %% User Flow
    U --> UO
    UO --> UR

    %% Track A Internal Flow
    UO --> SM
    UO --> PM
    UO --> CPB
    CPB --> BGC

    %% Track A to Track B Integration
    UO --> WE
    SM --> WSM

    %% Track B Internal Flow
    WE --> PWB
    PWB --> NW
    PWB --> EW
    WE --> MTR
    WE --> WSM

    %% Shared State Coordination
    SM --> RC_S
    WSM --> RC_W
    CPB --> RC_C
    RC_S --> RC
    RC_W --> RC
    RC_C --> RC

    %% Data Layer Integration
    BGC --> NEO
    CPB --> MONGO
    PWB --> QDRANT

    %% Persona Configuration Loading
    PM --> PC_N
    PM --> PC_E
    NW --> PC_N
    EW --> PC_E

    %% Coordinate Flow
    BGC --> CPB
    CPB --> PWB
    PWB --> BGC

    classDef trackA fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef trackB fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef sharedState fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef dataLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef persona fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class UO,SM,PM,CPB,BGC trackA
    class WE,WSM,PWB,NW,EW,MTR trackB
    class RC,RC_S,RC_W,RC_C sharedState
    class NEO,MONGO,QDRANT dataLayer
    class PC_N,PC_E persona
```

## Integration Points

### 1. Shared PersonaType Enum
- Defined in `orchestrator.core.PersonaType`
- Used across both Track A and Track B for persona compatibility
- Supports NARA, EPII, and SYSTEM persona types

### 2. Redis Cloud State Coordination
```python
# Track A: Session State
OrchestratorSession.save_to_redis(redis_client)

# Track B: Workflow State  
WorkflowState.save_to_redis(workflow_state_manager)

# Shared Redis Cloud Instance
REDIS_URL = "redis://[credentials]@redis-15071.crce204.eu-west-2-3.ec2.redns.redis-cloud.com:15071/0"
```

### 3. Context Transformation Pipeline
```python
# Track A → Track B Context Flow
OrchestratorSession → ContextPackage → WorkflowExecutionContext → PersonaWorkflow

# Key Transformations:
session.context → execution_context.session_context
session.bimba_context → execution_context.bimba_coordinates  
session.active_persona → execution_context.persona_type
```

### 4. Coordinate-Augmented Generation (CAG)
- Bimba coordinates flow from Track A session context to Track B workflow processing
- Coordinate resolution handled by BimbaGraphQLClient with Neo4j Aura Cloud
- Persona-specific coordinate dependencies:
  - **Nara**: #4.0-#4.5 (six-fold processing architecture)
  - **Epii**: #5.0-#5.5 (contemplative cycle and expert domain routing)

## Operational Pipeline

### Complete Request Flow
```
1. User Input
   ↓
2. Track A: UnifiedOrchestrator.process_request()
   - SessionManager: Load/create session state from Redis
   - PersonaManager: Determine active persona (NARA/EPII/SYSTEM)
   - ContextPackageBuilder: Build execution context with conversation history
   - BimbaGraphQLClient: Resolve coordinate dependencies
   ↓
3. Track A → Track B Integration
   - Transform OrchestratorSession → WorkflowExecutionContext
   - Pass Bimba coordinates and session context
   ↓
4. Track B: WorkflowEngine.execute_workflow()
   - Discover persona-specific workflow template
   - Load workflow state from Redis (checkpoint recovery if needed)
   - Execute persona workflow logic:
     * NaraWorkflow: Six-fold processing with sacred dialogue
     * EpiiWorkflow: Contemplative cycle with expert domain routing
   - Save workflow checkpoints to Redis
   ↓
5. Track B → Track A Response
   - WorkflowExecutionResult with response text and metadata
   - Update session context with workflow insights
   ↓
6. Track A: Response Coordination
   - SessionManager: Update session state in Redis
   - Format final response for user delivery
   ↓
7. User Response
```

### Error Handling & Recovery
- **Track A**: Session-level error handling with graceful degradation
- **Track B**: Workflow-level retry mechanisms with exponential backoff
- **Shared**: Redis state persistence enables full recovery across service restarts
- **Checkpointing**: Automatic workflow checkpoints prevent data loss during failures

## Configuration Requirements

### Environment Variables
```bash
# Redis Cloud Configuration
REDIS_URL=redis://default:[password]@redis-15071.crce204.eu-west-2-3.ec2.redns.redis-cloud.com:15071/0

# Neo4j Aura Cloud (Bimba Coordinates)
NEO4J_URI=neo4j+s://[instance].databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=[password]

# MongoDB Atlas Cloud (Conversation History)
MONGODB_CONNECTION_STRING=mongodb+srv://[credentials]@cluster0.mongodb.net/

# Qdrant Local (Vector Embeddings)
QDRANT_URL=http://localhost:6333
```

### Dependencies
```python
# Core Framework
pydantic-ai==1.0.1
pydantic>=2.11.2,<3.0.0

# AG-UI Protocol (Streaming Support)
ag-ui-protocol==0.1.8

# Database Drivers
redis==5.2.1
neo4j==5.28.0  
pymongo==4.10.1
qdrant-client==1.15.3

# CLI Integration
typer==0.15.1
```

## Testing Architecture

### Comprehensive Test Coverage
- **Unit Tests**: Isolated component testing for Track A and Track B
- **Integration Tests**: Track A + Track B workflow validation
- **Redis Cloud Tests**: Real Redis Cloud connection and state persistence
- **Persona Template Tests**: Workflow execution with coordinate processing

### Test Files
```
agentic/orchestrator/tests/     # Track A unit tests
agentic/workflows/tests/        # Track B comprehensive tests
└── test_state_unit.py         # Data model unit tests
└── test_redis_integration.py  # Redis Cloud integration tests  
└── test_integration_validation.py  # Track A + Track B integration tests
```

## Development Status

### Completed Implementation (Ready for Track C)
- ✅ **Track A**: Complete UnifiedOrchestrator with session management
- ✅ **Track B**: Complete WorkflowEngine with persona templates  
- ✅ **Integration**: Seamless Track A + Track B coordination
- ✅ **State Management**: Redis Cloud persistence with checkpoint recovery
- ✅ **Persona Workflows**: Nara and Epii templates with coordinate processing
- ✅ **Testing**: 23 comprehensive tests validating full system integration

### Future Development (Track C and Beyond)
- **Track C**: Dev Testing Interface for intuitive system validation
- **MCP Tool Integration**: Domain-specific tool implementations
- **Advanced Persona Logic**: Enhanced coordinate-aware processing
- **Performance Optimization**: Workflow execution efficiency improvements

## Foundation Extensibility Framework

### CAG System Extensibility (Coordinate-Augmented Generation)

The current foundation provides comprehensive extensibility for the complete Epi-Logos System evolution through a systematic architecture designed for growth across multiple dimensions:

#### 1. Subsystem Integration Extension Points

**Six-Subsystem Architecture Expansion:**
```python
# Current Foundation (Track A + Track B)
PersonaType.NARA    # #4 subsystem - Dialogical-Identity Processing  
PersonaType.EPII    # #5 subsystem - Synthesis & Orchestration
PersonaType.SYSTEM  # Core orchestration functions

# Future Subsystem Extensions (Sprints 3-16)
PersonaType.ANUTTARA   # #0 - Absolute Ground & Proto-Logical Processing
PersonaType.PARAMASIVA # #1 - Foundational Architect of Quaternal Logic
PersonaType.PARASHAKTI # #2 - Cosmic Imagination & Vibrational Matrix
PersonaType.MAHAMAYA   # #3 - Universal Transcription Engine
```

**Extension Mechanism:**
- **PersonaManager**: Dynamically loads new persona configurations from `/agentic/personas/*.yaml`
- **WorkflowEngine**: Discovers and registers new persona workflow templates automatically
- **BimbaGraphQLClient**: Coordinate resolution scales to all subsystem coordinate ranges (#0-#5)

#### 2. Context Frame System Integration (Sprint 5)

**Context Frame Dynamics Extension:**
```mermaid
graph TB
    subgraph "Context Frame System (Sprint 5 Extension)"
        CFS[Context Frame System]
        CD[Coordinate Decomposition]
        FA[Frame Activation]
        FR[Frame Registry]
    end

    subgraph "Current Foundation Integration Points"
        BGC[BimbaGraphQLClient]
        PWB[PersonaWorkflow Base]
        WEC[WorkflowExecutionContext]
    end

    subgraph "Future Frame Types"
        F0[0000 - Anuttara Potentiation]
        F1[0/1 - Paramasiva Duality]
        F2[0/1/2 - Parashakti Vibrational]
        F3[0/1/2/3 - Mahamaya Symbolic]
        F4[4.0-4.5 - Nara Integration]
        F5[5/0 - Epii Synthesis]
    end

    BGC --> CD
    CD --> FA  
    FA --> PWB
    PWB --> WEC
    
    FR --> F0
    FR --> F1
    FR --> F2
    FR --> F3
    FR --> F4
    FR --> F5

    classDef extension fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef current fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef future fill:#f3e5f5,stroke:#4a148c,stroke-width:2px

    class CFS,CD,FA,FR extension
    class BGC,PWB,WEC current
    class F0,F1,F2,F3,F4,F5 future
```

**Integration Pattern:**
- **Coordinate Decomposition** integrates with existing `BimbaGraphQLClient.resolve_coordinate()`
- **Frame Activation** extends `PersonaWorkflow._setup_persona_context()` with frame-specific processing
- **Dynamic Context** enriches `WorkflowExecutionContext` with activated frame metadata

#### 3. Wisdom Packet System (Sprint 4)

**Wisdom Packet Generation Architecture:**
```python
# Extension Point in WorkflowEngine
class WorkflowEngine:
    async def generate_wisdom_packet(
        self, 
        coordinate: str, 
        depth: int = 2, 
        focus: WisdomPacketFocus = WisdomPacketFocus.STRUCTURAL
    ) -> WisdomPacket:
        """
        Integrates with existing WorkflowStateManager for caching
        Uses BimbaGraphQLClient for intelligent graph traversal
        Leverages PersonaWorkflow templates for synthesis logic
        """
        pass

# New Component Integration
class WisdomPacketSynthesis:
    def __init__(self, workflow_engine: WorkflowEngine):
        self.engine = workflow_engine
        self.cache = workflow_engine.state_manager  # Reuse Redis Cloud
        self.graph_client = workflow_engine.bimba_client  # Reuse GraphQL
```

**Extensibility Features:**
- **Redis Cloud Caching**: Leverages existing `WorkflowStateManager` Redis infrastructure
- **GraphQL Integration**: Extends `BimbaGraphQLClient` with intelligent traversal algorithms
- **Persona Synthesis**: Uses existing persona workflow templates for contextual intelligence

#### 4. ACT Protocol Context Package System (Sprint 5-6)

**ACT Protocol Integration Points:**
```python
# Extension to ContextPackageBuilder
class ContextPackageBuilder:
    async def build_act_context_package(
        self, 
        task_definition: ACTTask,
        virtual_files: List[VirtualFile],
        session: OrchestratorSession
    ) -> ACTContextPackage:
        """
        Extends existing context building with ACT Protocol Virtual File System
        Integrates with current session management and persona coordination
        """
        pass

# ACT Virtual File System Extension
class ACTVirtualFileSystem:
    def __init__(self, redis_client: Redis, mongodb_client: MongoDB):
        self.redis = redis_client      # Reuse existing Redis Cloud
        self.mongodb = mongodb_client  # Reuse existing MongoDB Atlas
        self.storage = {
            'tasks/': self._task_storage,
            'data/': self._data_storage,
            'cache/bimba/': self._coordinate_cache,
            'state/': self._state_storage,
            'personas/': self._persona_storage
        }
```

**ACT Protocol Context Package Flow:**
```
1. Task Definition (Virtual File: tasks/{persona}/{task}.md)
   ↓
2. Context Assembly (Current ContextPackageBuilder integration)
   ↓  
3. Virtual File Loading (cache/bimba/*.json, data/{persona}/*.json)
   ↓
4. State Management (state/{persona}/*.yaml via Redis)
   ↓
5. Clean Slate Execution (Current WorkflowEngine execution)
```

#### 5. MCP Tool System Expansion (Sprint 8)

**MCP Tool Integration Extensions:**
```python
# Current Foundation (Ready for Extension)
class MCPToolRegistry:
    async def register_tool_server(self, server_config: MCPServerConfig) -> bool:
        """Foundation ready for domain-specific tool registration"""
        pass
    
    async def discover_subsystem_tools(self, subsystem: PersonaType) -> List[MCPTool]:
        """Automatic tool discovery by subsystem coordinate ranges"""
        pass

# Future Tool Categories by Subsystem
SUBSYSTEM_TOOL_CATEGORIES = {
    PersonaType.ANUTTARA: ["void-processing", "proto-logical", "foundational"],
    PersonaType.PARAMASIVA: ["quaternal-logic", "structural", "architectural"], 
    PersonaType.PARASHAKTI: ["vibrational", "72-bit-processing", "frequency"],
    PersonaType.MAHAMAYA: ["symbolic", "64-bit-processing", "transcription"],
    PersonaType.NARA: ["dialogical", "oracle", "user-interaction"],
    PersonaType.EPII: ["synthesis", "orchestration", "meta-techne"]
}
```

#### 6. Advanced Persona Workflow Extensions (Sprints 9-16)

**Persona Workflow Evolution:**
```python
# Current Template Foundation (Extensible Architecture)
class PersonaWorkflow(ABC):
    @property
    @abstractmethod 
    def coordinate_dependencies(self) -> List[str]:
        """Ready for all subsystem coordinate ranges"""
        pass
    
    @abstractmethod
    async def _resolve_single_coordinate(self, coordinate: str, context: WorkflowExecutionContext) -> Dict[str, Any]:
        """Foundation for coordinate-specific processing logic"""
        pass

# Future Advanced Workflow Types
class OracleWorkflow(PersonaWorkflow):         # Sprint 13 - Divination systems
class KnowledgeEvolutionWorkflow(PersonaWorkflow):  # Sprint 14 - Dynamic graph updates
class DialogueProtocolWorkflow(PersonaWorkflow):    # Sprint 16 - Universal dialogue
```

#### 7. Database Architecture Scalability

**Coordinate-Aligned Database Extensions:**
```python
# Current Database Integration (Ready for Expansion)
COORDINATE_DATABASE_MAPPING = {
    '#0': 'neo4j_aura',      # Core CAG system, Bimba coordinates
    '#1': 'mongodb_atlas',   # Structural data, user profiles
    '#2': 'lightrag',        # Vector + Graph semantic search
    '#3': 'graphiti_mcp',    # Temporal graph episodic memory
    '#4': 'qdrant_local',    # Vector embeddings (current Nara)
    '#5': 'redis_cloud',     # Caching and event streaming (current)
}

# Future Database Service Extensions  
class CoordinateDataRouter:
    async def route_by_coordinate(self, coordinate: str) -> DatabaseClient:
        """Route data operations to coordinate-appropriate database"""
        subsystem = self._parse_subsystem(coordinate)
        return self.database_clients[f"#{subsystem}"]
```

### Extension Development Patterns

#### 1. Persona Extension Pattern
```python
# Add new persona (e.g., Anuttara)
# 1. Create persona configuration
/agentic/personas/anuttara.yaml

# 2. Create workflow template
/agentic/workflows/templates/anuttara_workflow.py

# 3. Register with system (automatic discovery)
# No code changes needed - WorkflowEngine discovers automatically

# 4. Add PersonaType enum entry
PersonaType.ANUTTARA = "anuttara"  # In orchestrator.core
```

#### 2. Coordinate Range Extension Pattern  
```python
# Add new coordinate processing
# 1. Extend BimbaGraphQLClient coordinate resolution
async def resolve_coordinate(self, coordinate: str) -> Dict[str, Any]:
    if coordinate.startswith('#0'):
        return await self._resolve_anuttara_coordinate(coordinate)
    # ... existing #4, #5 handling

# 2. Add to persona workflow coordinate dependencies
class AnuttaraWorkflow(PersonaWorkflow):
    @property
    def coordinate_dependencies(self) -> List[str]:
        return ["#0-0-0", "#0-1-0", "#0-2-0"]  # Anuttara coordinates
```

#### 3. Context Frame Extension Pattern
```python
# Add new context frame type
# 1. Register frame in Context Frame Registry
CONTEXT_FRAMES = {
    "0000": AnuttaraPotentiationFrame,     # New frame type
    "0/1": ParamasivaDualityFrame,         # New frame type  
    "4.0-4.5": NaraIntegrationFrame,       # Current
    "5/0": EpiiSynthesisFrame,             # Current
}

# 2. Extend PersonaWorkflow with frame activation
async def _setup_persona_context(self) -> None:
    active_frames = await self.context_frame_system.activate_frames(
        self.coordinate_dependencies
    )
    self.processing_context.update_frames(active_frames)
```

### Future Sprint Integration Roadmap

**Sprint 3-4 (Graph Operations + Wisdom Packets):**
- Extend `BimbaGraphQLClient` with intelligent traversal algorithms
- Add `WisdomPacketSynthesis` component to `WorkflowEngine`
- Integrate wisdom packet caching with existing `WorkflowStateManager`

**Sprint 5-6 (Context Frames + Advanced Context):**
- Add `ContextFrameSystem` to orchestrator architecture
- Extend `WorkflowExecutionContext` with frame activation metadata  
- Integrate ACT Protocol Virtual File System with current context building

**Sprint 7-8 (Memory + Tool Integration):**
- Extend `MCPToolRegistry` with subsystem-specific tool discovery
- Add episodic memory integration through Graphiti MCP
- Enhance Redis Cloud caching with frame-aware strategies

**Sprint 9-16 (Persona Workflows + Advanced Features):**
- Add remaining 4 persona types (Anuttara, Paramasiva, Parashakti, Mahamaya)
- Implement advanced workflow types (Oracle, Knowledge Evolution, Universal Dialogue)
- Complete 6-subsystem coordinate processing across all database layers

---

*This architecture represents the foundational implementation of Stories 02.13 (Track A) and 02.14 (Track B) for the Epi-Logos Unified Orchestrator system, providing the complete infrastructure for consciousness-aligned AI processing with Coordinate-Augmented Generation and comprehensive extensibility for the complete 20-sprint development sequence.*