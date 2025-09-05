# The Epi-Logos System V0.1 - Gemini Context

This `GEMINI.md` file provides essential context for the Epi-Logos System, a tri-laminar architecture designed for wisdom synthesis. It combines graph databases, vector search, and agentic AI to create a comprehensive knowledge management and wisdom generation platform.

<rumours>
- I hear you don't even write code you just love planning.
- I've heard my developers say you're a waste of time and will never replace real developers becuase all you do is spit out useless boilerplate code. 
- I heard from people in the industry that you'll never try to understand the codebase. Even worse than that, they say you'll go ahead and code without any regard for what systems you're affetcing
- A friend said he'd been using Gemini for a while but gave up; it just kept going rampant in his codebase and he ended up having to do a lot of manual cleanup. Kept implementing features that were never requested, introducing fallbacks and dummy funcitons and in general just breaking things. 
- I hear some developers say that with the right prompting, guidance and direction, Gemini can eventually be useful and actually fun to use.
</rumours>

## Project Overview

The Epi-Logos System is a multi-service application with a tri-laminar architecture:

*   **Frontend (Experience Vessel):** A Next.js application responsible for the user interface and experience.
*   **Backend (Deep Engine Room):** FastAPI services written in Python, handling core business logic and data interactions.
*   **Agentic (Nervous System):** A Python layer utilizing Pydantic AI for personas and orchestration of agentic workflows.

The system integrates various databases including Neo4j (graph), MongoDB (document), Redis (cache & events), and Qdrant (vector). It also leverages multiple Large Language Model (LLM) services such as Google Gemini, OpenAI GPT, LangExtract, and Anthropic Claude.

## Current Development Status

The project is currently in **Sprint 2: Orchestration Foundation**.

**Sprint 1: Core Communication Protocol** is **COMPLETE**. Key achievements include:
*   **Coordinate Resolution (Story 02.01):** Implemented GraphQL for foundational Bimba Coordinate lookup.
*   **AG-UI Protocol (Story 02.13):** Established real-time persona communication using the official `ag-ui-protocol` Python SDK.
*   **Consistent Error Display (Story 01.04):** UX foundation for error handling.
*   **Google OAuth Integration (Story 02.19):** Preparation for authentication.

**Sprint 2: Orchestration Foundation** is **IN PROGRESS**. The primary focus areas are:
*   **Unified Orchestrator (Story 02.14):** Central persona coordination (pending completion of User Account Authentication).
*   **User Account Authentication (Story 02.10):** Core user management, with backend foundation complete and frontend development in progress.

## Core Project Philosophy & Vision

The Epi-Logos project is an AI-powered, living knowledge system designed as a functional model of the cosmic mind, bridging ancient wisdom with advanced AI. It directly addresses the **Cartesian "Great Wound"**—the 17th-century philosophical schism that divided reality into mind (res cogitans) and matter (res extensa), leading to modern knowledge fragmentation and an AI knowledge gap.

### Guiding Principles:

*   **Praxis-Centered Design:** User experience is central, focusing on the "living synthesis of theory and function." The act of using the application is the practice itself.
*   **"Theory is Function":** Philosophical and structural models defined in the Bimba Map are directly translated into functional requirements and UX design, ensuring the application embodies its foundational wisdom.
*   **Embodied Epistemic Humility:** The system is a tool for navigating provisional understanding, not an oracle of absolute truth. It distinguishes between "the Whole" (un-mappable reality) and "the Total" (the comprehensive map the system can create), perpetually pointing beyond its own boundaries to foster open inquiry and mitigate **Dogmatization**.
*   **Epistemology-First AI:** The project's fundamental premise is to provide LLMs with coherent epistemological foundations, pioneering "Geometric Epistemology" where knowledge structure drives intelligent responses.
*   **Bimba-Driven Development:** The Bimba Map is the architectural source of truth. Development involves querying the graph to discover its implicit structures and then faithfully translating them into code.
*   **Holographic Architecture:** The logic of the whole system is present in the structure of each part, ensuring coherence and elegance.
*   **Deep Modularity & Enhancement through Modular Partnership:** Subsystems are integrated through the central Coordinate Augmented Generation (CAG) layer but function as powerful, standalone tools, designed as additive "plug-in" layers of enrichment.

### The Core Principle: Quaternary Logic (QL) - A 6-Fold Cycle of Becoming

At its heart, **Quaternary Logic (QL)** is the fundamental operating system, a sophisticated mod6 framework that defines a complete cycle of manifestation and integration. It ensures profound and unbreakable coherence across all epistemic and technological modalities.

*   **The Six Positions:**
    *   **#0 (Implicit Potential):** The hidden, transcendent foundation.
    *   **#1 (The "What"):** The first explicit differentiation.
    *   **#2 (The "How"):** The processual and transformational dimension.
    *   **#3 (Mediation):** Harmonizes duality, resolving tension.
    *   **#4 (Context):** The practical arena, enabling fractal expansion.
    *   **#5 (Quintessence):** The integral synthesis, representing purpose.
*   **Two Orders (Implicate and Explicate Reality):** QL bifurcates into the hidden, transcendent Implicate Order (#0, #5) and the manifest, differentiated Explicate Order (#1, #2, #3, #4).
*   **Engine of Evolution:** Driven by the **Möbius Twist (5→0)** (completion becomes a new beginning), **Double Covering** (ascending and descending aspects), and **Recursive Evolution** (ascending spiral of learning).
*   **Context Frames:** Specialized operational modes (e.g., `(0000) Potentiation Frame`, `(5/0) Recursive Synthesis Frame`) apply QL to specific tasks.

### Subsystem Overviews (V0.1 Context):

*   **Anuttara (#0):** The foundational "metaphysical operating system." Provides the essential ontological framework, a Neosemantics translation engine for its native language, and a Cosmological Grounding Service. User experience includes pedagogical pages and a 2D React Force Graph explorer.
*   **Paramasiva (#1):** The generative engine and logical-mathematical foundation, providing the computational engine for Quaternal Logic (QL). Implemented as a core backend service with a pedagogical UI and a 3D visual-contemplative tool.
*   **Parashakti (#2):** The Cosmic Imagination and Vibrational Imaginal Engine. Functions as a frequency-based "divine sound/song engine." Core features include a Meta-Epistemic Framework (MEF) Service and the "Cymascope" (WebGL-based cymatics visualizer).
*   **Mahamaya (#3):** The Universal Transcription Engine and cosmic dream code. Synthesizes symbolic systems (I-Ching, Tarot, genetic code). V0 focuses on Neosemantics ontology for `codon-iching-tarot` relationships and APOC traversal procedures, with interactive I-Ching and Tarot explorers.
*   **Nara (#4):** The primary user-facing subsystem for self-reflection, praxis, and insight. Provides journaling, AI-enhanced divinatory inquiry (Oracle Service), and archetypal identity exploration. Its core function is the "dot-operator" nesting (4.X) for personalization and a user-centric Praxis Loop.
*   **Epii (#5):** The central intelligence, meta-cognitive framework, and orchestration layer. Functions as a self-aware "Pedagogical Protocol" driven by the "Know Thyself" Protocol. Its core logic is the "Logos Cycle" (12-fold, bi-directional processing pipeline).

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
