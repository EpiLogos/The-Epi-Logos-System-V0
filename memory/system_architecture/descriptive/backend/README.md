# Backend Architecture (Descriptive)

- Boundaries: FastAPI app, GraphQL schema, Neo4j guardrails.
- Identity: bimbaCoordinate only; no implicit mutations in reads.
- Variable-length hops: literal hop counts; enforce maxHops + cap.
