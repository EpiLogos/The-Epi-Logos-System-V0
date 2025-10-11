# Backend Architecture — Current State

updated_at: 2025-10-10
updated_by: codex

Overview
- FastAPI app exposes REST and GraphQL; Bimba (Neo4j) is the focus for Sprint 3.
- GraphQL schema implements comprehensive Bimba node queries and admin mutations.
- Neo4j enforces identity via `bimbaCoordinate`; vector index on `BimbaNode.embeddings` powers semantic search.

Key Locations
- GraphQL schema: `backend/epi_logos_system/cag/bimba/schema.graphql`
- Resolvers: `backend/epi_logos_system/cag/bimba/resolvers.py`
- Services: `backend/epi_logos_system/cag/bimba/services.py`
- Embeddings: `backend/epi_logos_system/shared/embeddings.py`, `backend/epi_logos_system/cag/lightrag/gemini_embeddings.py`
- Admin mutations: in resolvers and services (regenerate single/bulk)

Capabilities (Sprint 3)
- Coordinate retrieval:
  - `getNodeByCoordinate`, `getNodeDetailsComplete`, `getNodeByCoordinateExtended`
  - `lexicalCoordinateSearch` (substring over properties)
  - `getNodeWithRelationships` (single-hop type/direction/properties)
  - `directChildren(bimbaCoordinate)`
- Path traversal:
  - `getPathBetweenCoordinates(start,end,maxHops)` — literal hop bounds, default 5, cap 10
- Semantic coordinate discovery:
  - `semanticCoordinateDiscovery(queryText,maxResults,alpha)` via Neo4j vector index
- Admin operations:
  - `createBimbaNode`, `updateBimbaNode`, `createBimbaRelationship`
  - `regenerateNodeEmbedding`, `regenerateAllEmbeddings(batchSize,force)`

Guardrails
- Identity: `bimbaCoordinate` only; strict equality anchoring for start/end nodes.
- Read-path purity: Queries perform no `CREATE`/`MERGE`.
- Variable-length hops: build literal bounds in Cypher; no parameterized bounds.
- API semantics: `maxHops` with default and safety cap (`BIMBA_MAX_HOPS_CAP`).

Performance & Defaults
- Hop defaults: 5; cap: 10 (configurable via env).
- Embedding dimension: 1536 (Gemini).
- Batch regeneration: deterministic pagination with optional hash skip.

Open Items
- `searchCoordinates`, `getSubsystemCoordinates` are placeholders.
- Document intelligence flows (LightRAG/Qdrant) are planned for Sprint 4.

