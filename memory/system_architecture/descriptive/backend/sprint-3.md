# Backend — Sprint 3 Feature Deltas

updated_at: 2025-10-10
updated_by: codex

Stories
- 02.02 Neighboring Node Discovery — `getNodeWithRelationships`
- 02.03 Graph Path Traversal — `getPathBetweenCoordinates` with literal hop bounds
- 02.03.1 Semantic-to-Coordinate — `semanticCoordinateDiscovery` via Neo4j vector index
- 02.06 Bimba Node Creation — admin-gated `createBimbaNode`
- 02.25 Embedding Generation — single/bulk regeneration mutations + Gemini embeddings
- 02.26 Relationship-Enriched Embeddings — embedding pipeline reflects relational context

Key Changes
- Identity guardrail enforced (bimbaCoordinate only); removed fallbacks.
- Read-path purity: all queries side-effect free.
- Hop semantics: `maxHops` default/cap + literal bounds in Cypher.
- Vector index on `BimbaNode.embeddings` (1536-d Gemini) for semantic search.

Files Changed/Introduced
- `backend/epi_logos_system/cag/bimba/schema.graphql`
- `backend/epi_logos_system/cag/bimba/resolvers.py`
- `backend/epi_logos_system/cag/bimba/services.py`
- `backend/epi_logos_system/shared/embeddings.py`
- `backend/epi_logos_system/cag/lightrag/gemini_embeddings.py`

Follow-ups
- Implement true `searchCoordinates` + `getSubsystemCoordinates`.
- Integrate Bimba with Wisdom Packet context once 03.01 lands (Sprint 4).

