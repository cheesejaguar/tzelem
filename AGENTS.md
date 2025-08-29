# Repository Guidelines

## Project Structure & Module Organization
- `frontend/app/`: Vite + React + TypeScript UI. Tests under `frontend/app` with `*.test.ts(x)`. Build outputs to `frontend/app/dist`.
- `backend/`: FastAPI service. Tests in `backend/tests/` (Pytest). Configuration in `backend/core/`.
- `api/`: Vercel serverless entry that imports `backend/main.py`.
- `scripts/`: Planning/prompts; not executed in builds.
- Root configs: `package.json` (workspaces, scripts), `vercel.json`, `.vercelignore`.

## Build, Test, and Development Commands
- Install all deps: `npm run install:all`.
- Frontend dev server: `npm run dev:frontend` (Vite).
- Backend dev server: `npm run dev:backend` (Uvicorn on `:8000`).
- Frontend build: `npm run build:frontend` → outputs to `frontend/app/dist`.
- Tests: `npm run test:frontend` (Vitest), `npm run test:backend` (Pytest).
- Lint/format (frontend): `npm run lint:frontend`, `npm run format:frontend`.

## Coding Style & Naming Conventions
- Python: 4‑space indent; Ruff line length 100; type hints required. Tooling: Ruff, Mypy, Pytest.
- TypeScript/React: Follow `frontend/app/eslint.config.js`; avoid `any` where feasible; unused vars prefixed with `_` allowed.
- Naming: snake_case (Python), camelCase (TS/JS), PascalCase (React components).
- Tests: `backend/tests/test_*.py`; frontend tests `*.test.ts(x)` colocated with code.

## Testing Guidelines
- Frameworks: Pytest (backend), Vitest + Testing Library (frontend).
- Async backend tests: use `pytest-asyncio`.
- Run: `npm run test:backend`, `npm run test:frontend`. Frontend coverage: `npm --workspace frontend/app run test:coverage`.
- Aim for meaningful coverage on new/changed code; include edge cases and error paths.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat:`, `fix:`, `chore:`). Example: `fix(api): handle 503 for voice in serverless`.
- PRs include: purpose/summary, linked issues, testing notes (commands + results), screenshots for UI changes, and any config/env updates. Keep diffs focused; update docs when behavior changes.

## Security & Configuration Tips
- Never commit secrets. Env files: `backend/.env` (see `.env.example`), `frontend/app/.env` (see example).
- CORS/domains: update `backend/core/config.py` for new origins.
- Vercel/serverless: heavy voice features may return 503; document fallbacks.

## Backend uv Workflow
- Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`.
- Install deps: `cd backend && uv sync --extra dev`.
- Run API: `uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`.
- Tools: `uv run pytest`, `uv run ruff check .`, `uv run mypy .`.
- Update deps: edit `backend/pyproject.toml` then `uv sync`. Create `backend/.env` from example and set `DAILY_API_KEY`, `DEBUG`.

