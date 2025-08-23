# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tzelem is a dynamic multi-agent orchestration platform that builds AI teams to deliver real work with enterprise-grade control. The platform allows users to define objectives with budgets, then assembles specialized agents that coordinate workflows and deliver results with real-time observability, auditability, and spend guardrails.

## Repository Structure

This is a monorepo with the following main directories:

- `frontend/app/` - React frontend application (Vite + TypeScript)
- `backend/` - Backend services (currently minimal)
- `infra/` - Infrastructure configuration
- `scripts/` - Development scripts and documentation

## Frontend Development

The main application is located in `frontend/app/` and uses:

### Tech Stack
- **Framework**: Vite + React 19 + TypeScript
- **UI Components**: ShadCN/UI + Radix UI primitives
- **Styling**: Tailwind CSS
- **Flow Builder**: React Flow (@xyflow/react)
- **Voice**: PipeCat Client JS (@pipecat-ai/client-js)
- **State Management**: Zustand + React Context
- **HTTP Client**: Axios
- **Testing**: Vitest + React Testing Library + Playwright

### Development Commands

Navigate to `frontend/app/` directory first:

```bash
cd frontend/app
```

**Essential commands:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Generate test coverage report
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run preview` - Preview production build

## Core Architecture

The frontend follows a feature-based architecture:

### Key Features
1. **Flow Builder** - Visual workflow designer using React Flow
2. **Run Console** - Real-time execution monitoring with SSE
3. **Voice Interface** - WebRTC integration with PipeCat
4. **Secrets Manager** - Secure credential management

### Project Structure
```
frontend/app/src/
├── components/
│   ├── ui/          # ShadCN base components
│   ├── layout/      # Header, Navigation, Layout
│   └── common/      # Shared components
├── features/
│   ├── flow/        # Flow Builder components
│   ├── run/         # Run Console & Execution
│   ├── voice/       # Voice Interface
│   └── secrets/     # Secrets Management
├── lib/
│   ├── api.ts       # API client & endpoints
│   ├── utils.ts     # Utility functions
│   └── types/       # Global type definitions
├── hooks/           # Global hooks
└── contexts/        # React contexts
```

### Flow Export Schema
Flows are exported as JSON with version 0.1.0 schema supporting:
- Agentic or Sequential paradigms
- Multiple agent types (MasterAgent, ExecutionAgent, RoutingAgent, etc.)
- Real-time voice integration
- Pricing/budget controls

### API Integration
- Base URL configured via `VITE_API_BASE_URL` environment variable
- SSE endpoints for real-time updates (`/api/runs/:id/events`)
- Voice room management for WebRTC connections
- Secrets are handled server-side (frontend only stores labels)

## Design System

The application uses a monochromatic design with:
- **Colors**: White/gray foundation with blue accent (#0066ff)
- **Typography**: Inter font family with proper weights
- **Components**: Built on ShadCN/UI and Radix UI primitives

## Git Workflow

- **Main branch**: `main` (use for PRs)
- **Current branch**: `frontend-dev`
- The repository is clean and ready for development

## Important Notes

- Always run `npm run type-check` and `npm run lint` before committing
- The frontend app contains extensive specifications in `scripts/mega_frontend_prompt.md`
- Backend is currently minimal - focus development on frontend
- Voice features require PipeCat integration and WebRTC
- All secrets must be handled server-side for security