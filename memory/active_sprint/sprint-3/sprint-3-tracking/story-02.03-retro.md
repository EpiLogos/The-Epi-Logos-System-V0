# Story 02.03 – Graph Path Traversal (Retrospective / Learnings)

Date: 2025-09-14

Status: Basic path traversal working (initial verification complete)

Scope: GraphQL `getPathBetweenCoordinates` for Bimba graph traversal, Agentic tool usage, and Neo4j query correctness.

## What we changed
- Canonical identity: Use `bimbaCoordinate` exclusively in Neo4j. Removed all fallbacks to a `coordinate` property.
- Read purity: Eliminated silent node creation in read paths (removed base-coordinate auto‑create logic).
- API semantics: Replaced `maxDepth` with `maxHops` (hops/steps language). Agents can set; backend enforces a safety cap via env.
- Cypher correctness: Use literal hop bounds in `shortestPath` (no parameterized variable‑length bounds). Anchor start/end with exact `bimbaCoordinate` matches.
- Relationship typing: Return type/direction/properties from Cypher; stop inferring in Python.
- Schema cleanup: Removed `nodeType` from GraphQL/types and code paths.
- Indexing: Added uniqueness on `BimbaNode(bimbaCoordinate)` and a full‑text index across `[name, description, coreNature, operationalEssence]` for future semantic search.

## Why these changes were necessary
- Parameterized bounds in variable‑length paths are not supported by the planner; led to “no path found” despite adjacency.
- Ambiguous identity (mixing `coordinate`/`bimbaCoordinate`) caused node collisions and empty results.
- Silent `CREATE` during reads introduced hidden state and misdiagnosed failures.
- “Depth” naming was unclear; “hops/steps” matches Cypher semantics and our usage better.

## Guardrails codified
- Only `bimbaCoordinate` for identity; no ORs over multiple properties.
- No implicit mutations in read paths.
- Never parameterize variable‑length hop bounds; build literal queries per request.
- Prefer `maxHops`; enforce safety cap via `BIMBA_MAX_HOPS_CAP` (default 10). Default via `BIMBA_MAX_HOPS_DEFAULT` (default 5).

## Open items / Next steps
- Validate path traversal end‑to‑end with sample data (directed/undirected cases).
- Add tests covering: reachable path, unreachable within N hops, invalid hop requests (under 1 / over cap), and identity mismatch.
- Confirm constraint materialization in Neo4j `:schema` after running `scripts/init-databases.py`.
- Consider Neo4j 5 `SHORTEST` operator follow‑up once base is stable.

## Success snapshot (2025-09-15)
- GraphQL success: `getPathBetweenCoordinates(startCoordinate: "#4.1", endCoordinate: "#4.2", maxHops: 3)` returned a non-null `GraphPath` with correct `pathLength` and alternating `PathNode`/`PathRelationship` components.
- Agentic MCP success: `get_path_between_coordinates` tool invoked with `{ startCoordinate: "#4.1", endCoordinate: "#4.2", maxHops: 3 }` produced a formatted path summary without errors.
- Directionality: Relationship directions align with startNode() comparison logic returned from Cypher.
- Stability: Removing parameterized bounds eliminated prior “no path found” false negatives.

## References
- Code: `backend/epi_logos_system/cag/bimba/{schema.graphql,resolvers.py,services.py}`
- Agentic: `agentic/agents/orchestrator/tools/bimba/http_bimba_tools.py`, `agentic/mcp_servers/bimba_pratibimba_server.py`
- Init: `scripts/init-databases.py`
