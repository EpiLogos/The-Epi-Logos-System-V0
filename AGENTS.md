# Repository Guidelines

## Project Structure & Module Organization
- `backend/` — FastAPI services, domain modules, and `pytest` tests.
- `agentic/` — Agent services (FastAPI) and supporting logic.
- `frontend/` — Next.js (TypeScript) app and UI assets.
- `shared/`, `scripts/`, `docs/`, `data/`, `memory/` — shared utilities, dev scripts, documentation, sample data, and design notes.
- Env files: `.env`, `.env.local` (copy `./.env.example` if needed).

## Build, Test, and Development Commands
- `npm run dev` — run frontend, backend, and agentic services concurrently.
- `npm run build` — build all workspaces (frontend + packages).
- `npm run test` — run frontend Jest, backend `pytest`, and e2e (if present).
- `npm run lint` / `npm run format` — lint/format across JS/TS and Python.
- Backend only: `npm run test:backend` (pytest), `npm run lint:backend` (ruff), `npm run format:backend` (black+ruff).
- Frontend only: `npm run dev:frontend`, `npm run test:frontend`, `npm run lint:frontend`.
- Docker: `npm run docker:up` / `docker:down` / `docker:logs`.

## Coding Style & Naming Conventions
- Python: Black (line length 88), Ruff rules as per `backend/pyproject.toml`; Python 3.13 targeted.
- JS/TS: ESLint (Next.js config) + Prettier; TypeScript in `frontend/`.
- Indentation: 2 spaces (JS/TS) and Black defaults (Python).
- Naming: `snake_case` for Python modules/functions, `PascalCase` React components, `kebab-case` files in `frontend/src/`.

## Testing Guidelines
- Frameworks: Jest (frontend), Pytest (backend), optional Playwright e2e (`tests/e2e`).
- Naming: Backend `test_*.py` or `*_test.py`; Frontend `*.test.ts(x)`.
- Run with coverage: `cd frontend && npm run test:coverage`, `cd backend && python -m pytest --cov`.
- Prefer unit tests near modules (backend `backend/tests/unit/...`, frontend `src/**/__tests__/`).

## Commit & Pull Request Guidelines
- Commits: concise imperative subject (“Add graph query cache”), context in body, reference issues (e.g., `#123`).
- Group related changes; avoid noisy formatting-only diffs in feature commits.
- PRs: clear description, screenshots for UI changes, steps to validate, linked issues, and checklists.
- Ensure `npm run lint` and `npm run test` pass; include migration/config notes if applicable.

## Security & Configuration Tips
- Do not commit secrets. Use `.env.local` for machine-specific values.
- Validate settings with `npm run setup:python` and `npm run start:full`.
- For Neo4j/Redis or external services, prefer Docker Compose profiles in `docker-compose*.yml`.
