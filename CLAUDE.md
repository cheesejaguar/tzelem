# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tzelem is a multi-agent orchestration platform that builds AI teams to deliver work with enterprise-grade control. The project consists of:
- **Frontend**: React + Vite with visual flow builder using React Flow
- **Backend**: FastAPI with Daily.co WebRTC integration via Pipecat

## Common Development Commands

### Frontend (from `frontend/app/`)

```bash
# Development
npm run dev                 # Start development server on port 5173

# Testing
npm run test               # Run tests with Vitest
npm run test:ui            # Run tests with Vitest UI
npm run test:coverage      # Run tests with coverage report

# Code Quality
npm run lint               # Lint TypeScript/TSX files
npm run lint:fix           # Auto-fix linting issues
npm run type-check         # Type check without emitting files
npm run format             # Format code with Prettier
npm run format:check       # Check formatting without changes

# Build
npm run build              # Build for production
npm run preview            # Preview production build
```

### Backend (from `backend/`)

```bash
# Development
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
# OR
uv run python run.py

# Testing
uv run pytest                      # Run all tests
uv run pytest --cov               # Run with coverage
uv run pytest tests/test_voice.py # Run specific test file

# Code Quality
uv run ruff check .               # Run linter
uv run ruff check . --fix         # Auto-fix linting issues
uv run ruff format .              # Format code
uv run mypy .                     # Type checking

# Dependencies
uv sync --extra dev               # Install all dependencies including dev tools
```

### Environment Setup

Create `.env` file in repository root with:
```
DAILY_API_KEY=your_daily_api_key_here
DEBUG=false  # Set to true for debug mode
```

## High-Level Architecture

### Frontend Architecture

The frontend is a React application built with Vite, using:
- **React Flow** (`@xyflow/react`) for visual workflow building
- **Radix UI** for accessible UI components  
- **Tailwind CSS** for styling with custom design system
- **Zustand** for state management
- **Tanstack Router** for routing
- **React Hook Form + Zod** for form handling and validation

Key frontend structure:
```
frontend/app/src/
├── components/      # Reusable UI components
│   ├── ui/         # Base UI components (button, card, etc.)
│   └── layout/     # Layout components (Header, etc.)
├── features/       # Feature-specific modules
│   └── flow/       # Flow builder feature
│       ├── components/   # Flow-specific components
│       │   └── nodes/   # Agent node components
│       ├── types.ts     # TypeScript definitions
│       └── utils/       # Validation, export utilities
└── lib/            # Shared utilities
```

### Backend Architecture

The backend is a FastAPI application with:
- **Pipecat** for Daily.co WebRTC integration
- **Pydantic** for data validation and settings
- **Async/await** throughout for non-blocking operations

Key backend structure:
```
backend/
├── api/              # API endpoints
│   └── voice.py      # Voice/WebRTC endpoints
├── core/             # Core configuration
│   └── config.py     # Settings and environment
├── services/         # Business logic
│   └── daily_service.py  # Daily.co integration
├── app/              # Application logic (agents, runners)
│   ├── runner/       # Flow execution engine
│   │   └── agents/   # Agent implementations
│   └── services/     # Additional services
└── main.py           # FastAPI application entry
```

### Agent System Design

The platform supports multiple agent types:
1. **MasterAgent**: Coordinates other agents, manages tools and subagents
2. **ExecutionAgent**: Executes tasks with browser/kernel capabilities
3. **RoutingAgent**: Routes requests to appropriate handlers/classes
4. **DataCollectionAgent**: Collects structured data via schema
5. **MailAgent**: Handles email communications via AgentMail

Workflows can be:
- **Agentic**: Agents decide execution flow dynamically
- **Sequential**: Fixed execution order defined by edges

### API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status  
- `POST /api/voice/rooms` - Create Daily WebRTC room
- API docs available at `http://localhost:8000/docs` when running

### Testing Strategy

- Frontend: Vitest for unit tests, Playwright for E2E
- Backend: Pytest with async support
- Always run tests before committing:
  - Frontend: `npm run test` and `npm run type-check`
  - Backend: `uv run pytest` and `uv run mypy .`

### Key Dependencies

**Frontend:**
- React 19.1.1 with TypeScript
- @xyflow/react for flow building
- @pipecat-ai/client-js for voice integration
- Radix UI components for accessible UI
- Tailwind CSS with custom design system

**Backend:**
- FastAPI 0.115.6
- Pipecat 0.0.80 for Daily.co integration  
- Python 3.11+ with uv package manager
- Pydantic for validation

### Development Notes

- The project uses a monorepo structure with separate frontend and backend
- Frontend runs on port 5173 (dev), backend on port 8000
- CORS is configured to allow frontend-backend communication
- Debug mode provides verbose logging when DEBUG=true in .env
- Use SSE (Server-Sent Events) for real-time updates by default
- Voice features require Daily.co API key configuration
```