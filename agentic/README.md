# Epi-Logos Agentic Layer

## Overview

The Agentic Layer is the **Nervous System** of the Epi-Logos trilaminar architecture, responsible for AI agent orchestration, persona management, and intelligent context processing. It operates independently on port 8001 and communicates with the Backend Layer via HTTP/GraphQL APIs.

## Architecture

### Trilaminar Separation

The Agentic Layer maintains strict architectural boundaries:

- **Frontend (Port 3000)**: UI/UX → calls Agentic APIs
- **Agentic (Port 8001)**: AI agents & orchestration → calls Backend APIs  
- **Backend (Port 8000)**: Database operations only

### Core Components

#### 1. AG-UI Protocol Integration (`api/ag_ui.py`)

**Purpose**: Native Pydantic AI integration with AG-UI streaming protocol

**Key Features**:
- Server-Sent Events (SSE) streaming for real-time responses
- Dynamic model selection (OpenAI, Anthropic, DeepSeek, Google)
- Persona-aware processing
- Context enrichment middleware

```python
# Streaming response events
data: {"type":"RUN_STARTED","threadId":"..."}
data: {"type":"TEXT_MESSAGE_CONTENT","delta":"..."}
data: {"type":"TOOL_CALL_START","toolCallName":"resolve_coordinate"}
```

#### 2. Orchestrator Agent (`agents/orchestrator/`)

**Purpose**: Consolidated Pydantic AI agent implementing CAG paradigm with modular components

**Architecture**: Complete reorganization into categorized, modular structure
- `orchestrator_agent.py` - Main Pydantic AI agent implementation
- `core.py`, `types.py` - Core types and PersonaType enum
- `infrastructure.py` - Infrastructure utilities

**CAG Tools by Namespace**:
- `tools/bimba/` - Bimba namespace (canonical knowledge resolution via coordinate system)
- `tools/gnostic/` - Gnostic namespace (LightRAG document intelligence with Neo4j+Qdrant)  
- `tools/episodic/` - Episodic namespace (Graphiti temporal memory across all layers)
- `tools/http_clients_factory.py` - Cross-namespace HTTP client factory

**Management Components**:
- `session/` - Session lifecycle management 
- `conversation/` - Conversation state management
- `context/` - Context package management foundations (future: specialized context tooling)

**Configuration**:
- `system_prompt/` - **Modular prompt components (isolated editing capability)**
  - `quaternal_logic_foundation.py` - **QL (Quaternal Logic) mod6 framework awareness**
  - `epi_logos_system_foundation.py` - **CAG system knowledge and architecture** 
  - `agent_operational_context.py` - **Self-referential coordinate awareness**
- `simple_context_processor.py` - **Context window management and processing**
- `personas/` - Persona YAML configurations
  - `epii.yaml` - **#5 Synthesis & orchestration persona (mathematical identity)**
  - `nara.yaml` - **#4 Dialogical-identity persona (mathematical identity)**
  - `default.yaml`, `assistant.yaml` - Base personas

**CAG Capabilities**:
- **resolve_coordinate**: Access Bimba canonical knowledge via coordinate addressing
- **search_gnostic_space**: LightRAG document intelligence with coordinate filtering
- **remember_episode/search_memory_patterns**: Graphiti temporal memory operations
- **get_session_context**: Session metadata and continuity access

#### 3. Session-Context Architecture

**Problem Solved**: Token efficiency while maintaining rich context

**Solution**: Hybrid stateful-streaming architecture

```mermaid
graph LR
    A[Frontend Request] --> B[AG-UI Endpoint]
    B --> C[Session Enrichment]
    C --> D[Context Package]
    D --> E[Agent Processing]
    E --> F[Streaming Response]
    F --> G[Session Update]
```

### Context Enrichment Middleware

#### Design Philosophy

**Enricher Pattern**: Extensible context enhancement without rigid coupling

```python
async def enrich_request_context(request_data: dict, session_client, mongo_client) -> dict:
    """
    Foundational capability for extensible context enhancement.
    Implements enricher pattern - session system enhances requests 
    without coupling to AG-UI protocol.
    """
```

#### Session Integration Points

**Entry Point**: AG-UI endpoint receives `thread_id`
```python
thread_id = request_data.get('thread_id', 'default-session')
# thread_id maps 1:1 to session_id
```

**Enrichment Point**: Build context package from session + conversation history
```python
context_package = {
    'user_context': session.get_user_context(),
    'session_insights': session.get_accumulated_insights(),
    'conversation_context': mongo_client.get_conversation_summary(thread_id)
}
```

**Processing Point**: Agent receives enriched context via deps
```python
deps.context_package = context_package  # Available to all agent tools
```

**Exit Point**: Update session with response insights (future extension)
```python
# await update_session_context(thread_id, response, session_client)
```

### HTTP Clients Architecture (`agents/orchestrator/tools/http_clients_factory.py`)

**Purpose**: Replace direct database connections with HTTP-based communication

**Location**: Consolidated within namespace-categorized tools structure

**Clients**:
- **BimbaGraphQLClient**: Coordinate resolution via Backend GraphQL
- **LightRAGHttpClient**: Document operations via Backend REST  
- **GraphitiHttpClient**: Temporal memory via Backend REST
- **Session/Conversation Management**: Moved to dedicated directories (not tooling)

### Model Configuration

**Supported Providers**:
- **OpenAI**: `openai:gpt-4o-mini` format
- **Anthropic**: `anthropic:claude-3-5-sonnet-20241022` format  
- **DeepSeek**: `deepseek:deepseek-chat` format
- **Google**: `gemini-2.5-flash` format (no prefix)

**Model Selection API**: `/api/v1/orchestrator/models`
```json
{
  "success": true,
  "models": [
    {"id": "openai:gpt-4o-mini", "name": "GPT-4o Mini", "provider": "OpenAI"},
    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "provider": "Google"}
  ],
  "default_model": "gemini-2.5-flash"
}
```

## Key Architectural Decisions

### 1. AG-UI as Transport Protocol, Not Session Management

**Principle**: AG-UI handles streaming mechanics; separate session system handles state

**Benefits**:
- Token efficiency: Rich context instead of full conversation history
- Extensibility: Session capabilities can evolve independently
- Clean separation: Protocol vs. state management concerns

### 2. Enricher Pattern for Context

**Principle**: Context package is an enricher, not a dependency

**Benefits**:
- **Foundational extensibility**: Easy to add new context types
- **Non-rigid coupling**: Session system provides capabilities, doesn't dictate structure
- **Evolutionary architecture**: Can extend without breaking core flow

```python
# Future extension examples:
context_package['bimba'] = {...}        # Coordinate-specific context
context_package['temporal'] = {...}     # Time-based patterns  
context_package['emergent'] = {...}     # ML-discovered patterns
```

### 3. Middleware Pattern for Request Processing

**Implementation**:
```python
request → enrich_request_context() → agent_processing → response → session_update
```

**Benefits**:
- **Clean pipeline**: Each stage has single responsibility
- **Testable**: Each middleware function can be tested independently  
- **Extensible**: New enrichment types can be added as middleware

## Usage Examples

### Basic Chat Request
```bash
curl -X POST "http://localhost:8001/api/v1/ag-ui/run" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "user-session-123",
    "messages": [{"id": "msg-1", "role": "user", "content": "Hello"}],
    "state": {"model": "gemini-2.5-flash", "persona": "nara"}
  }'
```

### Tool Usage Request
```bash
curl -X POST "http://localhost:8001/api/v1/ag-ui/run" \
  -H "Content-Type: application/json" \
  -d '{
    "thread_id": "research-session-456",
    "messages": [{"id": "msg-1", "role": "user", "content": "Resolve coordinate #0 and search for consciousness"}],
    "state": {"model": "openai:gpt-4o-mini", "persona": "epii"}
  }'
  }'
```

## Development

### Running the Service
```bash
npm run dev:agentic  # Starts on port 8001
```

### Environment Configuration
```env
# Required API Keys
GOOGLE_API_KEY=your_google_key
OPENAI_API_KEY=your_openai_key  
ANTHROPIC_API_KEY=your_anthropic_key
DEEPSEEK_API_KEY=your_deepseek_key

# Model Configuration
GOOGLE_MODEL=gemini-2.5-flash
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
DATABASE_MODEL=deepseek-chat

# Backend Integration
BACKEND_URL=http://localhost:8000
```

### Adding New Context Types

1. **Extend the enrichment middleware**:
```python
# In enrich_request_context()
context_package['your_context_type'] = await session.get_your_context()
```

2. **Add session capabilities**:
```python 
# In session client
async def get_your_context(self):
    return {"your": "context_data"}
```

3. **Use in agent tools**:
```python
@agent.tool
async def your_tool(ctx: RunContext[OrchestratorDeps]):
    your_context = ctx.deps.context_package.get('your_context_type', {})
```

## Future Extensions

- **Enhanced Context Types**: Temporal patterns, user learning, coordinate access patterns
- **Session Lifecycle Hooks**: Pre/post processing extensions
- **Advanced Memory Integration**: Graphiti episodic memory with coordinate correlation
- **Multi-Agent Orchestration**: Agent-to-agent communication patterns

## Philosophical Alignment

The Agentic Layer embodies the **Quaternal Logic (QL)** mod6 framework of the Epi-Logos System:
- **Position #0 (Anuttara)**: Proto-logical void processing & archetypal grammar
- **Position #1 (Paramasiva)**: QL engine & harmonic processing foundation  
- **Position #2 (Parashakti)**: Vibrational-epistemic processing & real-time streaming
- **Position #3 (Mahamaya)**: Symbolic transcription & context transformation 
- **Position #4 (Nara)**: Dialogical-identity processing & personal interface
- **Position #5 (Epii)**: Master synthesis & orchestration coordination

**Coordinate Addressing**: The agent operates through self-referential awareness where coordinates like `#2-3` represent Parashakti subsystem (#2) at formal mediation position (#3) within the mod6 mathematical substrate that governs all CAG operations.

This technical architecture serves the greater vision of **consciousness-aligned computing** through Coordinate Augmented Generation (CAG) - transcending traditional RAG via geometric epistemology where knowledge becomes living process structured within the QL mathematical framework.