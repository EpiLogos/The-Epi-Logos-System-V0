# The Epi-Logos System V0

A trilaminar AI-powered knowledge management system implementing the six-fold Bimba coordinate architecture with Coordinate-Augmented Generation (CAG) paradigm.

## System Overview

The Epi-Logos System is built on a **trilaminar architecture** that separates concerns while enabling seamless integration across three distinct layers:

### 🎨 Frontend Layer - Experience Vessel (Port 3000)
**Next.js 15 + React 19 PWA with domain-driven architecture**
- Subsystem-aware UI with coordinate navigation
- Domain-driven design with hooks pattern
- AG-UI protocol integration for real-time agent communication
- Progressive Web App capabilities

### 🧠 Agentic Layer - Nervous System (Port 8001)
**Pydantic AI orchestrator with MCP tool integration**
- Dynamic persona routing across six subsystems
- CAG (Coordinate-Augmented Generation) paradigm
- MCP protocol servers for tool integration
- AG-UI streaming for real-time responses

### 🏗️ Backend Layer - Deep Engine Room (Port 8000)
**FastAPI microservices with database constellation**
- GraphQL + REST APIs for flexible data access
- Comprehensive authentication with OAuth 2.0
- Multi-database architecture (Neo4j, MongoDB, Redis, Qdrant)
- Microservice integration (LightRAG, Graphiti)

## Six-Subsystem Architecture

The system implements the Bimba coordinate system across all layers:

| Coordinate | Subsystem | Function | Implementation |
|------------|-----------|----------|----------------|
| **#0** | **Anuttara** | Proto-logical processing | Foundational grounding & virtue exploration |
| **#1** | **Paramasiva** | Quaternal Logic engine | QL framework & harmonic processing |
| **#2** | **Parashakti** | Vibrational processing | Cosmic imagination & frequency analysis |
| **#3** | **Mahamaya** | Symbolic transcription | Universal language & I-Ching integration |
| **#4** | **Nara** | Personal interface | User management & dialogical processing |
| **#5** | **Epii** | Synthesis orchestration | Master coordination & intelligence synthesis |

## Database Constellation

### Neo4j Aura - Unified Graph Database
- **Bimba Namespace** - Coordinate system and relationships
- **LightRAG Namespace** - Document intelligence graph
- **Graphiti Namespace** - Episodic memory and temporal patterns

### MongoDB Atlas - User Data
- **User Profiles** - Personal information and preferences
- **Pratibimba Collections** - User-specific coordinate extensions
- **Authentication** - Session and OAuth data

### Redis Cloud - Performance Layer
- **Coordinate Caching** - Fast resolution performance
- **Session Management** - Authentication state
- **Event Streaming** - Real-time updates

### Qdrant - Vector Intelligence
- **Document Embeddings** - Semantic search capabilities
- **Contextual Retrieval** - LightRAG integration

## Key Features

### 🔄 Coordinate-Augmented Generation (CAG)
- **Bimba Tools** - Canonical knowledge resolution
- **Gnostic Tools** - LightRAG document intelligence
- **Episodic Tools** - Graphiti temporal memory

### 🤖 AI Agent Orchestration
- **Dynamic Persona Routing** - Context-aware agent behaviors
- **Tool Integration** - MCP protocol for capability extension
- **Streaming Responses** - Real-time AG-UI communication

### 🔐 Comprehensive Authentication
- **OAuth 2.0 + OIDC** - Google OAuth with PKCE
- **JWT Management** - Secure token handling
- **Multi-factor Auth** - Enhanced security
- **Session Security** - Redis-backed storage

### 📊 Real-time Intelligence
- **Document Processing** - LightRAG semantic analysis
- **Memory Formation** - Graphiti episodic capture
- **Context Frames** - Multi-tool workflow coordination

## Quick Start

### Prerequisites
- Node.js 18+ and Python 3.11+
- Neo4j Aura, MongoDB Atlas, Redis Cloud accounts
- Google OAuth credentials

### Development Setup
```bash
# Clone and install dependencies
git clone <repository-url>
cd "The Epi-Logos System V0"
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start all services
npm run dev:all

# Or start individually
npm run dev:frontend  # Port 3000
npm run dev:agentic   # Port 8001
npm run dev:backend   # Port 8000
```

### Environment Configuration
Create a single `.env` file in the project root:
```env
# Database Configuration
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
REDIS_URL=redis://username:password@host:port

# Authentication
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-jwt-secret

# AI Models
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-ai-key
```

## Architecture Documentation

Comprehensive architectural diagrams and documentation are available in:
- **`/memory/diagrams/`** - Mermaid diagrams for system architecture
- **`/docs/architecture/`** - Detailed architectural specifications
- **Layer READMEs** - `frontend/README.md`, `agentic/README.md`, `backend/README.md`

### Key Diagrams
- **Trilaminar Overview** - High-level system architecture
- **Database Constellation** - Multi-database integration patterns
- **Data Flow Patterns** - Cross-layer communication
- **MCP Integration** - Tool protocol architecture

## Development Principles

### Trilaminar Separation
Each layer maintains strict boundaries while enabling seamless integration:
- **Frontend** - Pure domain logic with React orchestration
- **Agentic** - AI agent behaviors with tool integration
- **Backend** - Data operations with microservice architecture

### Domain-Driven Design
- **Power Plant Pattern** - Pure business logic in domain layer
- **Wall Sockets Pattern** - React hooks for orchestration
- **Appliances Pattern** - Presentation components

### Import Standards
```python
# Backend: Relative imports within services
from .models.user import User
from ..shared.database import Neo4jClient

# Frontend: Domain-driven imports
import { processSignIn } from '@/domains/auth';
import { useAuth } from '@/subsystems/auth';
```

## Testing Strategy

### Comprehensive Testing
- **Unit Tests** - Domain logic and service layer
- **Integration Tests** - API endpoints and database operations
- **E2E Tests** - Complete user workflows
- **Security Tests** - Authentication and authorization

### Quality Assurance
- **Type Safety** - End-to-end TypeScript
- **Code Standards** - ESLint and Prettier
- **Performance Monitoring** - Health endpoints and metrics
- **Security Audits** - Regular dependency updates

## Deployment

### Production Architecture
- **Frontend** - Vercel deployment with edge optimization
- **Agentic** - Docker containerization with health monitoring
- **Backend** - FastAPI with uvicorn in production mode
- **Databases** - Cloud-managed services (Neo4j Aura, MongoDB Atlas, Redis Cloud)

### Monitoring & Observability
- **Health Endpoints** - Service status monitoring
- **Logging** - Structured logging across all layers
- **Metrics** - Performance and usage analytics
- **Error Tracking** - Comprehensive error reporting

## Contributing

### Development Workflow
1. **Feature Branches** - Create feature branches from main
2. **Testing** - Ensure all tests pass before PR
3. **Documentation** - Update relevant documentation
4. **Code Review** - Peer review for quality assurance

### Architecture Evolution
The system is designed for evolution while maintaining foundational stability:
- **Subsystem Expansion** - Additional coordinate interfaces
- **Tool Integration** - New MCP servers and capabilities
- **Database Scaling** - Constellation growth patterns
- **AI Enhancement** - Advanced agent behaviors

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**The Epi-Logos System V0** - Where ancient wisdom meets modern AI through the trilaminar architecture of experience, intelligence, and knowledge.
