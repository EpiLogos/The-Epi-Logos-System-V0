# The Epi-Logos System V0.1

A tri-laminar architecture for wisdom synthesis, combining graph databases, vector search, and agentic AI to create a comprehensive knowledge management and wisdom generation platform.

## 🏗️ Architecture Overview

The Epi-Logos System follows a **tri-laminar architecture** pattern:

- **Frontend (Experience Vessel)**: Next.js application with subsystem views
- **Backend (Deep Engine Room)**: FastAPI services with six subsystems
- **Agentic (Nervous System)**: Pydantic AI personas and orchestration

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and npm 10+
- **Python** 3.13+
- **Docker** and Docker Compose
- **Git** for version control

### ⚠️ CRITICAL: Tailwind CSS v4
This project uses **Tailwind CSS v4** with CSS-first configuration. See `docs/architecture/tailwind-v4-guide.md` for complete setup guide.

**Key Points for Developers:**
- Use `@import "tailwindcss"` NOT `@tailwind` directives
- Theme config in CSS `@theme` block, NOT JavaScript
- See `frontend/src/app/globals.css` for current configuration

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd epi-logos-system
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup-dev-environment.sh
   ```
   This will:
   - Install Node.js dependencies
   - Create Python virtual environments for backend and agentic layers
   - Start infrastructure services (Qdrant)
   - Create .env file from template

3. **Configure environment variables**
   ```bash
   # Edit .env with your actual cloud database credentials
   nano .env
   ```
   Required: NEO4J_URI, NEO4J_PASSWORD, MONGODB_URI, REDIS_URL, JWT_SECRET, OPENAI_API_KEY

4. **Start development environment**
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

### **🎯 Development Commands**

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run setup` | Full setup + start | First time or after clean |
| `npm start` | Quick start servers | Daily development |
| `npm stop` | Stop all services | End of work session |
| `npm run clean` | Complete cleanup | When things break |

```bash
# 📊 Monitor logs in real-time
tail -f logs/backend.log
tail -f logs/agentic.log
tail -f logs/frontend.log

# 🔍 Check what's running
lsof -i :3000,8000,8001,6333
```

### **🧠 LLM Services Included**

Your agentic layer comes pre-configured with:

- **Google Gemini**: Latest Gemini 2.5 Flash/Pro models
- **OpenAI GPT**: Including Realtime API support
- **LangExtract**: Google's structured information extraction library
- **Anthropic Claude**: For additional AI capabilities

Just add your API keys to `.env` and you're ready to go!

## 📁 Project Structure

```
epi-logos-system/
├── packages/                    # Shared workspace packages
│   ├── shared-types/           # TypeScript type definitions
│   └── ui-components/          # React component library
├── frontend/                   # Next.js application
│   └── src/subsystems/        # Six subsystem views
├── backend/                    # FastAPI backend
│   ├── subsystems/            # Six backend subsystems
│   ├── database/              # Database clients
│   ├── config/                # Configuration management
│   └── auth/                  # Authentication & security
├── agentic/                   # Pydantic AI layer
│   ├── subsystems/            # Six persona implementations
│   ├── orchestrator/          # Workflow coordination
│   └── tools/                 # Agentic tools
├── tests/                     # Test suites
├── scripts/                   # Utility scripts
└── docs/                      # Documentation
```

## 🗄️ Database Architecture

### Unified Graph Database (Neo4j Aura)
- **Bimba Map**: Core knowledge graph with coordinate-based nodes
- **LightRAG**: Document entities and relationships
- **Graphiti**: Episodic memory and temporal communities
- **Label-based namespacing** for service isolation

### Document Database (MongoDB Atlas)
- **User profiles** and authentication data
- **Personal Pratibimba** documents and journals
- **Flexible schema** for evolving user data

### Cache & Events (Redis Cloud)
- **Wisdom Packet caching** with TTL management
- **JWT session management**
- **Event streaming** with Redis Streams
- **Real-time pub/sub** communication

### Vector Database (Qdrant Local)
- **Semantic search** for wisdom synthesis
- **RAG capabilities** with LightRAG integration
- **Multi-collection** vector storage
- **Hybrid search** combining similarity and metadata

## 🔧 Development

### Development Architecture

The Epi-Logos System uses a **hybrid development approach**:

- **Local Python Development**: Backend and agentic layers run in virtual environments
- **Docker Infrastructure**: Only databases and infrastructure services
- **Node.js Frontend**: Runs locally with hot reload

This approach provides:
- ✅ Fast Python debugging with VSCode
- ✅ Hot reload for all layers
- ✅ Isolated dependencies per layer
- ✅ Cloud database integration
- ✅ Local vector database (Qdrant)

### Virtual Environment Structure
```
backend/.venv/          # Backend Python dependencies
agentic/.venv/          # Agentic Python dependencies
node_modules/           # Frontend Node.js dependencies
```

### Available Scripts

```bash
# Development
npm run dev                    # Start all services
npm run dev:frontend          # Frontend only
npm run dev:backend           # Backend only
npm run dev:agentic           # Agentic layer only

# Testing
npm run test                  # Run all tests
npm run test:structure        # Project structure tests
npm run test:frontend         # Frontend tests
npm run test:backend          # Backend tests

# Code Quality
npm run lint                  # Lint all code
npm run format                # Format all code
npm run type-check            # TypeScript type checking

# Docker
npm run docker:build          # Build all images
npm run docker:up             # Start services
npm run docker:down           # Stop services

# Utilities
npm run clean                 # Clean build artifacts
npm run setup                 # Initial setup
```

### Testing Strategy

The project uses **Test-Driven Development (TDD)** with comprehensive test coverage:

- **Structure Tests**: Validate tri-laminar architecture
- **Database Tests**: Connection and operation validation
- **Security Tests**: Authentication and configuration
- **Integration Tests**: Cross-layer communication
- **E2E Tests**: Complete user workflows

### VSCode Integration

The project includes VSCode configuration for optimal development:

- **Python Interpreters**: Automatically detects venv for each layer
- **Debugging**: Launch configurations for all services
- **Testing**: Integrated test runners
- **Linting**: Real-time code quality feedback
- **IntelliSense**: Full autocomplete across layers

**Recommended VSCode Extensions:**
- Python
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Docker
- GitLens

### Code Quality

- **ESLint** + **Prettier** for TypeScript/React
- **Black** + **Ruff** for Python
- **Pre-commit hooks** for automated quality checks
- **Type safety** with TypeScript and Pydantic

## 🔐 Security

### Authentication
- **JWT tokens** with refresh token support
- **OAuth integration** (Google, GitHub)
- **Session management** with Redis
- **API key management** with rotation support

### Data Protection
- **Environment variable validation**
- **Sensitive data masking** in logs
- **Encryption at rest** for cloud databases
- **HTTPS enforcement** in production

## 🚢 Deployment

### Development
```bash
docker-compose up -d
```

### Production
- **GitHub Actions** CI/CD pipeline
- **Docker multi-stage builds** for optimization
- **Security scanning** with Trivy
- **Automated testing** on all PRs

## 🧪 LLM Services Usage

The agentic layer includes `llm_services.py` with ready-to-use functions:

```python
# Structured data extraction with LangExtract
examples = [{
    "text": "John Smith is 30 years old and works as a doctor.",
    "extractions": [
        {"class": "person", "text": "John Smith", "attributes": {"age": "30", "profession": "doctor"}}
    ]
}]

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

## 📚 Documentation

- **Architecture**: `/docs/architecture/`
- **API Documentation**: Available at `/docs` when running
- **Stories**: Development stories in `/docs/stories/`
- **Coding Standards**: `/docs/architecture/coding-standards.md`

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Follow** the coding standards
4. **Write tests** for new functionality
5. **Submit** a pull request

### Development Workflow

1. **Check** current task status
2. **Write tests** first (TDD approach)
3. **Implement** functionality
4. **Verify** all tests pass
5. **Update** documentation

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for Claude AI assistance
- **Neo4j** for graph database technology
- **Qdrant** for vector search capabilities
- **FastAPI** and **Next.js** communities

---

**The Epi-Logos System V0.1** - Synthesizing wisdom through tri-laminar architecture 🧠✨
