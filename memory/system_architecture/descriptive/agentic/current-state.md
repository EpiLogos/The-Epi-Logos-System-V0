# Agentic Architecture — Current State

updated_at: 2025-10-10
updated_by: codex

Overview
- Pydantic-AI orchestrator with AG-UI streaming; persona routing and tool execution.
- Bimba tools integrated for coordinate/relationship/path/semantic operations.
- MCP servers: bimba-pratibimba, lightrag-gnostic, graphiti-episodic available.

Key Locations
- Orchestrator tools: `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py`
- MCP servers: `agentic/mcp_servers/*`
- GraphQL client: `agentic/clients/bimba_graphql_client.py`

Capabilities (Sprint 3)
- Bimba tool suite coverage:
  - Node retrieval, complete details, relationships, path traversal
  - Semantic coordinate discovery
  - Admin: node create/update/relationship, embeddings regeneration
- Persona routing present; multi-agent 02.27 Phase 1 is in progress (workflow discovery patterns).

Notes
- 02.27 Protocol-Workflow System (Phase 1) added to Sprint 3; Phase 2–3 planned in Sprint 4–5.
- LightRAG/Graphiti tools are present; deeper engagement planned in Sprint 4.

