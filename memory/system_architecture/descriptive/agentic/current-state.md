# Agentic Architecture — Current State

updated_at: 2025-10-30
updated_by: codex

Overview
- Pydantic-AI multi-agent constellation with AG-UI streaming
- Factory pattern + delegation manager for 6 subsystem agents (#0-#5)
- Prakāśa layered architecture for agent identity/workflow/context
- Bimba tools integrated for coordinate/relationship/path/semantic operations
- MCP servers: bimba-pratibimba, lightrag-gnostic, graphiti-episodic available

Key Locations
- Agent constellation: `agentic/agents/constellation.py`
- Agent factory: `agentic/agents/factory.py`
- Agent router: `agentic/agents/agent_router.py`
- Prakāśa manager: `agentic/agents/prakasa.py`
- Shared tools: `agentic/agents/shared_tools.py`
- MCP servers: `agentic/mcp_servers/*`
- GraphQL client: `agentic/clients/bimba_graphql_client.py`

Capabilities (Sprint 4)
- Multi-agent constellation (6 agents + orchestrator):
  - #0 Anuttara: Proto-logical processing
  - #1 Paramasiva: Quaternal Logic engine
  - #2 Parashakti: Vibrational/MEF analysis
  - #3 Mahamaya: Symbolic transcription
  - #4 Nara: Dialogical interface
  - #5 Epii: Etymology Archaeology + wisdom synthesis
  - Root orchestrator (#5-4): Delegation + general chat
- Prakāśa layered architecture:
  - Layer 1: Identity (5 sublayers including QL Foundation)
  - Layer 2: Workflow (dynamic, conditional)
  - Layer 3: Context (runtime, fresh per request)
- Bimba tool suite coverage:
  - Node retrieval, complete details, relationships, path traversal
  - Semantic coordinate discovery, wisdom packets
  - Admin: node create/update/relationship, embeddings regeneration
- Workflow specification in Neo4j f_workflow_* properties

Recent Updates (2025-10-30)
- **QL Foundation Loading Fix**: All agents now use `compose_identity_layers()` to include Layer 1a (Quaternal Logic cognitive architecture from #1-4) as foundational operating system
- Etymology Archaeology workflow fully operational on Epii agent
- MEF tools registered on Parashakti agent for resonance analysis

Notes
- See `prakasa-agent-invocation-workflow-specification.md` for complete Prakāśa architecture
- 02.27 Protocol-Workflow System (Phase 1) complete in Sprint 3
- LightRAG/Graphiti tools active in EA workflow

