# Feature Review — Story 02.03.1: Semantic‑to‑Coordinate Resolution (Implemented)

## Overview
We delivered semantic‑to‑coordinate retrieval for Bimba with production embeddings, hybrid search, and MCP/Agentic integration. Natural language queries now resolve to ranked Bimba coordinates using Gemini vector embeddings and Neo4j vector index, combined with BM25 full‑text for precision.

## What We Built
- Provider‑backed embeddings: Gemini `gemini-embedding-001`, 1536‑dim vectors, normalized
- Neo4j vector index: `bimba_embeddings_idx` on `BimbaNode.embeddings` (cosine, 1536)
- Full property coverage: nested dicts/arrays serialized (excludes only embedding/metadata keys); priority weighting for `name`, `symbol`, `coreNature`, `operationalEssence`, `function`, `architecturalFunction`
- Hybrid retrieval: BM25 full‑text + vector union + weighted rerank (alpha=0.6)
- Task‑type alignment: `retrieval_document` for nodes; `retrieval_query` for queries
- Admin operations: single‑node and bulk regeneration (bulk supports `force` to bypass hash skip); deterministic batching
- MCP/Agentic: tools and clients wired; `bimbaCoordinate` parameter; admin enabled via `.env` (X‑MCP‑Admin‑Secret)

## Development Narrative
1. Initial semantic path used a local deterministic embedding stub for testability; quality was insufficient for production. We replaced it with the real Gemini provider.
2. Early bulk regeneration skipped most nodes (hash‑based skip, nondeterministic SKIP/LIMIT). We added a `force` flag and ORDER BY pagination; also published a per‑node regen script with backpressure.
3. Admin ergonomics via MCP were cumbersome with manual exports. We added `.env` auto‑load and a localhost admin secret header to simplify testing while keeping guardrails.
4. Precision issues (e.g., “adam and eve”, “sunyata”) highlighted two gaps: nested properties were excluded and retrieval was vector‑only. We:
   - Included nested structures/arrays in serialization and prioritized key fields
   - Implemented hybrid BM25 + vector union + rerank
   - Switched to Gemini retrieval task types (document vs query)
5. Corrected model naming to `gemini-embedding-001` and synchronized all dims to 1536 across Backend, MCP, and LightRAG/Qdrant configs.

## Hurdles and Gotchas
- Env parsing: numeric vars must be pure integers (e.g., `EMBEDDINGS_DIM=1536`) — no inline comments
- Long‑running bulk jobs time out in MCP (single HTTP call). Use forced per‑node script with concurrency or run bulk via a client with extended timeouts
- Neo4j vector index dimension must match embedding dimension; recreate index on dim changes
- Admin gating: ensure `.env` secret is present for both Backend and MCP; localhost restriction applies by design

## Learnings
- One‑vector‑per‑node requires hybridization for proper‑noun precision; BM25+vector rerank balances exactness and semantics
- Task‑type alignment (retrieval_document vs retrieval_query) materially improves ranking
- Prioritizing key fields in serialization nudges embeddings to respect conceptual identity without schema overfit

## Validation
- Coverage: `MATCH (n:BimbaNode) WHERE size(n.embeddings)=1536 RETURN count(n)`
- Index: `CALL db.indexes() WHERE name='bimba_embeddings_idx'`
- Precision smoke tests: hybrid queries for exact terms rank target nodes higher; semantic paraphrases remain covered

## Next Steps
- Optional: expose alpha as a tunable param; add field‑weighting configuration
- Consider multi‑vector per node for advanced reranking (field‑specific vectors)
- Add health endpoint surfacing current provider/model/dim for operational visibility

