# Repository Guidelines

## Project Structure & Modules
- `frontend/app/`: Vite + React + TypeScript UI (ESLint, Prettier, Vitest).
- `backend/`: FastAPI service (Uvicorn). Tooling: Ruff, Mypy, Pytest. Tests in `backend/tests/`.
- `api/`: Vercel serverless entry that imports `backend/main.py`.
- `scripts/`: Planning/prompts. Not executed in builds.
- Root configs: `package.json` (workspaces, scripts), `vercel.json`, `.vercelignore`.

## Build, Test, and Dev Commands
- Install all deps: `npm run install:all`
- Frontend dev: `npm run dev:frontend` (served by Vite)
- Backend dev: `npm run dev:backend` (Uvicorn on `:8000`)
- Frontend build: `npm run build:frontend` → `frontend/app/dist`
- Tests: `npm run test:frontend` (Vitest), `npm run test:backend` (Pytest)
- Lint/format (frontend): `npm run lint:frontend`, `npm run format:frontend`

## Coding Style & Naming
- Python: Ruff line length 100; type hints required in backend. Prefer 4‑space indent.
- TypeScript/React: Follow ESLint config in `frontend/app/eslint.config.js`. Avoid `any` where feasible; unused vars starting with `_` are allowed.
- Naming: snake_case for Python, camelCase for TS/JS, PascalCase for React components. Tests: `test_*.py` in backend; `*.test.ts(x)` in frontend.

## Testing Guidelines
- Backend: Pytest; async tests use `pytest-asyncio`. Run: `npm run test:backend`. Add unit tests under `backend/tests/` mirroring module paths.
- Frontend: Vitest + Testing Library. Run: `npm run test:frontend` or `npm --workspace frontend/app run test:coverage` for coverage.
- Aim for meaningful coverage on new/changed code; include edge cases and error paths.

## Commit & PR Guidelines
- Prefer Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`. Example: `fix(api): handle 503 for voice in serverless`.
- PRs must include: purpose/summary, linked issues, testing notes (commands + results), screenshots for UI changes, and any config/env updates.
- Keep diffs focused; update related docs (e.g., `DEPLOYMENT.md`, this guide) when behavior changes.

## Security & Config
- Env files: `backend/.env` (see `backend/.env.example`), `frontend/app/.env` (see example). Never commit secrets.
- CORS/domains: update `backend/core/config.py` for new origins.
- Serverless limits: heavy voice features may return 503 in Vercel; document fallbacks.

## Backend uv Workflow
- Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Install deps (incl. dev): `cd backend && uv sync --extra dev`
- Run API locally: `uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000`
- Run tests and tools: `uv run pytest`, `uv run ruff check .`, `uv run mypy .`
- Update deps: edit `backend/pyproject.toml` (dependencies or `optional-dependencies.dev`) then `uv sync` to refresh `uv.lock`.
- Environment: copy `backend/.env.example` → `backend/.env`, set `DAILY_API_KEY`, `DEBUG`.
