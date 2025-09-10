# The Epi-Logos System V0.1 - Gemini Context

This `GEMINI.md` file provides essential context for the Epi-Logos System, a tri-laminar architecture designed for wisdom synthesis. It combines graph databases, vector search, and agentic AI to create a comprehensive knowledge management and wisdom generation platform.

## Project Overview

The Epi-Logos System is a multi-service application with a tri-laminar architecture:

*   **Frontend (Experience Vessel):** A Next.js application responsible for the user interface and experience.
*   **Backend (Deep Engine Room):** FastAPI services written in Python, handling core business logic and data interactions.
*   **Agentic (Nervous System):** A Python layer utilizing Pydantic AI for personas and orchestration of agentic workflows.

The system integrates various databases including Neo4j (graph), MongoDB (document), Redis (cache & events), and Qdrant (vector). It also leverages multiple Large Language Model (LLM) services such as Google Gemini, OpenAI GPT, LangExtract, and Anthropic Claude.

### Six-Subsystem Architecture

The system implements the Bimba coordinate system across all layers:

| Coordinate | Subsystem | Function |
|------------|-----------|----------|
| **#0** | **Anuttara** | Proto-logical processing |
| **#1** | **Paramasiva** | Quaternal Logic engine |
| **#2** | **Parashakti** | Vibrational processing |
| **#3** | **Mahamaya** | Symbolic transcription |
| **#4** | **Nara** | Personal interface |
| **#5** | **Epii** | Synthesis orchestration |

### Database Constellation

*   **Neo4j Aura:** Unified Graph Database (Bimba Namespace, LightRAG Namespace, Graphiti Namespace)
*   **MongoDB Atlas:** User Data (User Profiles, Pratibimba Collections, Authentication)
*   **Redis Cloud:** Performance Layer (Coordinate Caching, Session Management, Event Streaming)
*   **Qdrant:** Vector Intelligence (Document Embeddings, Contextual Retrieval)

## Building and Running

### Prerequisites

Ensure the following are installed:

*   **Node.js** (20+) and **npm** (10+)
*   **Python** (3.13+)
*   **Docker** and **Docker Compose**
*   **Git**

### Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd epi-logos-system
    ```
2.  **Run the setup script:** This script installs Node.js dependencies, creates Python virtual environments, starts infrastructure services (Qdrant), and creates the `.env` file from a template.
    ```bash
    ./scripts/setup-dev-environment.sh
    ```
3.  **Configure environment variables:** Edit the `.env` file with your actual cloud database credentials and API keys.
    ```bash
    nano .env
    ```
    Required: `NEO4J_URI`, `NEO4J_PASSWORD`, `MONGODB_URI`, `REDIS_URL`, `JWT_SECRET`, `OPENAI_API_KEY`.

### Development Commands

*   **Full setup + start (first time or after clean):**
    ```bash
    npm run setup
    ```
*   **Quick start servers (daily development):**
    ```bash
    npm start
    ```
*   **Stop all services:**
    ```bash
    npm stop
    ```
*   **Complete cleanup (if things get messy):**
    ```bash
    npm run clean
    ```
*   **Start all services (development):**
    ```bash
    npm run dev
    ```
*   **Start Frontend only:**
    ```bash
    npm run dev:frontend
    ```
*   **Start Backend only:**
    ```bash
    npm run dev:backend
    ```
*   **Start Agentic layer only:**
    ```bash
    npm run dev:agentic
    ```

### Monitoring Logs

```bash
tail -f logs/backend.log
tail -f logs/agentic.log
tail -f logs/frontend.log
```

## Development Conventions

### Code Quality

*   **JavaScript/TypeScript:** ESLint and Prettier for linting and formatting.
*   **Python:** Black for formatting and Ruff for linting.
*   **Pre-commit hooks:** Automated quality checks are enforced via pre-commit hooks.
*   **Type Safety:** Achieved through TypeScript in the frontend and Pydantic in the Python layers.

### Testing Strategy

The project follows a Test-Driven Development (TDD) approach with comprehensive test coverage, including:

*   **Unit Tests:** For isolated component logic.
*   **Integration Tests:** For cross-layer communication and service interactions.
*   **E2E Tests:** For complete user workflows.
*   **Performance Tests:** To measure response times and identify bottlenecks.
*   **Security Tests:** To identify vulnerabilities.

### VSCode Integration

The project includes VSCode configurations for an optimized development experience, with support for Python interpreters, debugging, testing, linting, and IntelliSense across all layers.

### Project Structure

```
epi-logos-system/
├── packages/                    # Shared workspace packages (shared-types, ui-components)
├── frontend/                   # Next.js application
├── backend/                    # FastAPI backend
├── agentic/                   # Pydantic AI layer
├── tests/                     # Test suites
├── scripts/                   # Utility scripts
└── docs/                      # Documentation
```

### Tailwind CSS v4

**CRITICAL:** This project uses **Tailwind CSS v4** with a CSS-first configuration.
*   **NEVER** use `@tailwind` directives; **ALWAYS** use `@import "tailwindcss"`.
*   **NEVER** configure the theme in `tailwind.config.js`; **ALWAYS** use the `@theme` directive in CSS.
*   **NEVER** add plugins to `tailwind.config.js`; **ALWAYS** use the `@plugin` directive in CSS.
*   Refer to `docs/architecture/tailwind-v4-guide.md` for complete setup and usage details.
