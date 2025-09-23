# Repository Guidelines

## Architecture & Boundaries
- Tri‑laminar services: Frontend (3000), Backend (8000), Agentic (8001). No cross‑layer bypass; communicate via documented APIs.
- Python imports must be absolute from repo root; never use `sys.path` hacks. Start services via npm scripts (module mode).
- Tailwind v4 only (v3 directives are invalid).

## Neo4j/Cypher Guardrails (Bimba Graph)
- Identity: Always use `bimbaCoordinate` in Neo4j. Do not read or write a `coordinate` property in the graph.
- No implicit mutations: Read paths (REST/GraphQL/services/tools) MUST NOT `CREATE`/`MERGE` nodes or relationships.
- Variable‑length patterns: Never parameterize hop bounds. Build Cypher with literal hop numbers selected in Python.
- Path semantics: Use “hops/steps”, not “depth”. Public API takes `maxHops` with a sane default.
- Defaults and caps: Default `maxHops` is 5. Agents may increase/decrease by passing `maxHops`. A safety cap is enforced by the backend and is configurable via env var `BIMBA_MAX_HOPS_CAP` (default 10).
- Anchoring: Anchor start/end nodes by `bimbaCoordinate` equality, never via permissive ORs.

## Service URLs & API Highlights
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000/docs`, `http://localhost:8000/graphql`, `GET /api/v1/status`, `GET /api/v1/nodes/{coordinate}`, health at `/api/health` (plus `/detailed`, `/metrics`).
- Agentic: `http://localhost:8001/docs`, AG‑UI at `POST /api/v1/ag-ui/run`, sessions at `/api/v1/sessions/{id}`, orchestrator at `/api/v1/orchestrator/*`.

## Project Structure & Module Organization
- `backend/` — FastAPI app (`main.py`), domain modules, `pytest` tests.
- `agentic/` — Pydantic‑AI agents and FastAPI service.
- `frontend/` — Next.js + TypeScript UI.
- `shared/`, `scripts/`, `docs/`, `data/`, `memory/` — utilities, tooling, docs, sample data, diagrams.
- Env files: `.env`, `.env.local` (copy from `./.env.example`).

## Build, Test, and Development Commands
- `npm run dev` — run all services concurrently.
- `npm run build` — build workspaces; `npm run test` — Jest + Pytest (+ e2e if present).
- Lint/format: `npm run lint`, `npm run format`, `npm run check`, `npm run fix`.
- Backend: `npm run test:backend`, `npm run lint:backend`, `npm run format:backend`.
- Frontend: `npm run dev:frontend`, `npm run test:frontend`, `npm run lint:frontend`.
- Agentic/MCP: `npm run dev:agentic`, `npm run dev:mcp` (stop with `npm run stop:mcp`).
- Docker: `npm run docker:up` / `docker:down` / `docker:logs`.

## Coding Style & Naming Conventions
- Python: Black (88 cols) + Ruff (`backend/pyproject.toml`), target Python 3.13.
- JS/TS: ESLint (Next config) + Prettier; TypeScript in `frontend/`.
- Indentation: 2 spaces (JS/TS), Black defaults (Python).
- Names: Python `snake_case`; React `PascalCase`; frontend files `kebab-case` under `frontend/src/`.

## Testing & Quality Gates
- Frameworks: Jest (frontend), Pytest (backend), optional Playwright e2e (`tests/e2e`).
- Naming: backend `test_*.py` or `*_test.py`; frontend `*.test.ts(x)`.
- Coverage targets: aim 90%+ unit coverage, 100% passing integration flows.
- Coverage examples: `cd frontend && npm run test:coverage`; `cd backend && python -m pytest --cov`.
- Test locality: backend `backend/tests/unit|integration`, frontend `src/**/__tests__/`.

## Agent‑Specific Instructions
- Orchestrator: `agentic/agents/orchestrator/`; tools in `tools/{bimba,gnostic,episodic}`.
- Run agent service: `npm run dev:agentic`; inspect MCP via `npm run dev:mcp`.

## Commit & Pull Request Guidelines
- Commits: imperative subjects (“Add graph query cache”), link issues (e.g., `#123`).
- PRs: clear description, validation steps, screenshots for UI, and linked issues.
- Gates: CI green, `npm run lint` and `npm run test` must pass; call out config/migrations.

## Context & Diagrams
- Reference architecture and standards in `CLAUDE.md`.
- Consult `memory/diagrams/`, `.context/`, and `docs/architecture/` before design; update diagrams after user‑verified features.

## Working Agreement
- Propose a brief plan before coding and confirm with the user.
- Do not change architecture or folder layout without explicit approval.
- Keep boundaries strict (Frontend ↔ Backend ↔ Agentic via APIs only).
- Ensure lint and tests pass locally before opening PRs.

## Tailwind v4 Utilities: Repo Anti‑Patterns
- Never define pseudo‑selectors in the utility name (e.g., `@utility foo:hover`). This breaks Tailwind v4 parsing and can wipe global styles.
- Always nest pseudos within the utility block:
  - Correct: `@utility foo { &:hover { @apply opacity-90; } }`
  - Incorrect: `@utility foo:hover { @apply opacity-90; }`
- When multiple animations are needed, define a single utility that sets the full `animation:` list. Two utilities that both set `animation:` will override, not merge.
