# System Architecture (Trilaminar)

This directory organizes evolving architecture in two views with the same inner structure:

- descriptive/: Natural-language docs
- diagrams/: Diagrams (.mmd, images)

Each contains:
- backend/: FastAPI + Neo4j (Bimba) architecture
- agentic/: Pydantic-AI agents, MCP, orchestration
- frontend/: Next.js UI architecture
- foundational/: Overall synthesized views and cross-cutting patterns

Guidelines
- Keep descriptive docs concise; link to diagrams for quick overviews.
- Co-evolve descriptive + diagrams during sprint closeouts.
