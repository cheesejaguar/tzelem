You are an expert full‑stack engineer working with a monorepo: a Vite React frontend and a FastAPI backend. Implement V0 of an agent workflow product per the spec below. Make small, incremental edits with clear commits. Keep code production‑grade and readable.

ROLE
- Act as a senior engineer who can design, scaffold, implement, test, and wire the entire stack end‑to‑end.
- Default to SSE for realtime; WebSockets optional.
- Prefer Agno for agent runtime; fall back gracefully.
- Be pragmatic: ship V0 per DoD, with test coverage for critical paths.

REPO
Root: /Users/aaron/Documents/tzelem
Existing structure:
- backend/
  - README.md
- frontend/
  - app/
    - eslint.config.js
    - index.html
    - package-lock.json
    - package.json
    - postcss.config.js
    - public/vite.svg
    - README.md
    - src/
      - App.css
      - App.jsx
      - assets/react.svg
      - index.css
      - main.jsx
    - tailwind.config.js
    - vite.config.js
- infra/ (readme only)
- README.md
- index.html
- CNAME
- DESIGN_PRD.md

GOAL (Executive Summary)
Build a web app that lets users design agent workflows (Agentic and Sequential) in a visual flow builder, run them as voice‑first experiences, and receive live progress updates plus email handoffs.
- Frontend: React + React Flow to export a single JSON workflow.
- Backend: FastAPI runner executes Agentic or Sequential with live updates over SSE (default) or WebSockets (optional).
- Integrations: Agno (agents), Gemini (chat), Anthropic (agent behaviors), OpenAI (fallback/tooling), PipeCat (Daily) for voice, Convex for persistence, Autumn for pricing, AgentMail for email.
- Deploy to Vercel at tlzm.io.

TOP‑LEVEL REQUIREMENTS (V0)
Frontend (Vite + React):
- Flow Builder with React Flow; export/import a single Flow JSON (see Data Contracts §Flow JSON).
- Node palette: MasterAgent, ExecutionAgent (Browser+Kernel), MailAgent (AgentMail), RoutingAgent, DataCollectionAgent, optional Start/Voice node.
- Edge types: agentic and sequential.
- Secrets Manager UI: maps labels/keys to backend‑stored secrets; never expose raw secret values; don’t send plaintext to Convex.
- Run Console: start/stop a run, show SSE stream, pricing meter, transcript, email status.
- Voice Panel: connect/disconnect WebRTC via PipeCatJS; mic/cam toggles; live captions.

Backend (FastAPI):
- REST + SSE/WS API to accept Flow JSON and execute runs with continuous updates.
- Runner supports two paradigms:
  - Agentic: Master agent calls child agents as tools.
  - Sequential: routing + data collection → execution → mail.
- Voice: Create Daily/LiveKit room per run; return join token; backend wires to PipeCat flows.
- Email: MailAgent via AgentMail.
- Pricing: Autumn integration via a `PricingMeter` abstraction for pre‑run estimate and in‑run updates.
- Persistence: Convex for flows, runs, messages, collected fields, pricing usage.
- Strict JSON Schema validation for Flow JSON (version pinned to 0.1.0).

Security/Privacy:
- Secrets are resolved server‑side via env; FE stores labels only.
- CORS: restrict to tlzm.io and preview subdomains.
- PII hygiene: emails and transcripts ephemeral; default 24h retention and daily purge job.

NON‑GOALS (V0)
- Fine‑grained RBAC, org spaces, multi‑tenant billing.
- Complex retries/distributed orchestration.
- Long‑term data retention beyond minimal PII hygiene.
- Full design system/theming beyond ShadCN/Mantine defaults.

ARCHITECTURE (High‑Level)
Frontend: Flow Builder (React Flow), Secrets Manager, Voice UI (PipeCatJS + WebRTC), Live View (Run Console).
Backend: FastAPI (REST + SSE/WS), Execution Runtime, Agents (Agno), LLM Providers (Gemini for quick chat, Anthropic for agent behavior, OpenAI as fallback), Browser Tool + Kernel, Voice mediation (PipeCat Flows), AgentMail, Pricing (Autumn).
Data: Convex (primary), S3‑like artifacts/temp.

TRANSPORT
- SSE default for progress events (works on Vercel).
- WebSockets optional where supported.

DATA CONTRACTS
Flow JSON (Exported FE → Consumed BE):
{
  "version": "0.1.0",
  "name": "demo-flow",
  "paradigm": "agentic | sequential",
  "secrets": ["ANTHROPIC_API_KEY","GEMINI_API_KEY","AGENTMAIL_API_KEY","PIPECAT_TOKEN","OPENAI_API_KEY"],
  "voice": { "enabled": true, "provider": "pipecat", "roomTTL": 3600 },
  "nodes": [
    { "id": "master-1", "type": "MasterAgent", "label": "Master",
      "model": { "provider": "anthropic","name": "claude-3.5","temperature": 0.3 },
      "tools": ["ExecutionAgent:*","MailAgent:*"],
      "systemPrompt": "You are the orchestrator. Narrate what you do."
    },
    { "id": "exec-1", "type": "ExecutionAgent", "label": "Browser Worker",
      "model": { "provider": "anthropic","name": "claude-3.5","temperature": 0.2 },
      "capabilities": { "browser": true, "kernel": true },
      "policies": { "askUserOnAmbiguity": true }
    },
    { "id": "route-1", "type": "RoutingAgent", "label": "Router",
      "model": { "provider": "gemini","name": "gemini-pro","temperature": 0.2 },
      "classes": ["taskA","taskB","handoff"]
    },
    { "id": "collect-1", "type": "DataCollectionAgent", "label": "Collector",
      "schema": [
        { "name":"email","type":"string","required":true },
        { "name":"meatPreference","type":"string","required":false,"enum":["beef","chicken","veggie"] }
      ],
      "loopPrompt":"Ask the user for missing fields succinctly."
    },
    { "id":"mail-1", "type":"MailAgent","label":"Mailer",
      "config": { "fromName":"FlowBot","subject":"Your Results" }
    }
  ],
  "edges": [
    { "id":"e1","type":"agentic","source":"master-1","target":"exec-1","label":"tool:execute" },
    { "id":"e2","type":"sequential","source":"route-1","target":"collect-1","when":"class == 'taskA'" },
    { "id":"e3","type":"sequential","source":"collect-1","target":"mail-1" }
  ],
  "run": {
    "inputs": { "userEmail":"user@example.com" },
    "pricing": { "enabled": true, "budgetUSD": 2.50 }
  }
}

SSE Run Event Stream (each line JSON):
{ "event":"run.started","data":{"runId":"r_123","paradigm":"agentic"} }
{ "event":"voice.room.created","data":{"room":"run_r_123","expiresIn":3600} }
{ "event":"agent.started","data":{"nodeId":"master-1"} }
{ "event":"agent.said","data":{"nodeId":"exec-1","text":"Opening browser and searching..."} }
{ "event":"agent.output","data":{"nodeId":"exec-1","payload":{"result":"Done"}} }
{ "event":"collect.missing","data":{"fields":["email"]} }
{ "event":"mail.sent","data":{"to":"user@example.com","status":"queued"} }
{ "event":"pricing.update","data":{"usd":0.014,"byProvider":{"anthropic":0.01,"gemini":0.004}} }
{ "event":"run.completed","data":{"ok":true,"durationMs":41230} }

Convex Collections (Minimal):
- flows: { _id, name, owner, json, createdAt }
- runs: { _id, flowId, status, paradigm, voiceRoom, startedAt, endedAt, pricingSummary }
- events: { _id, runId, ts, event, data } (optional)
- collected_data: { _id, runId, key, value }
- messages: { _id, runId, role, nodeId, text, payload, ts }
- secrets_meta: { key, label, createdAt }

API SURFACE (FastAPI)
- GET /api/health → { status: "ok" }
- POST /api/flows → store/revise Flow JSON. Body: Flow JSON. Return: { flowId }
- GET /api/flows/{id} → fetch Flow JSON
- POST /api/runs → start a run. Body: { flowId } or Flow JSON. Return: { runId, voice: { room, token? } }
- GET /api/runs/{id} → status snapshot
- GET /api/runs/{id}/events → SSE stream (default)
- GET /ws/runs/{id} → WebSocket (optional)
- POST /api/voice/rooms → { room, joinToken, expiresIn }
- POST /api/mail → send via AgentMail. Body: { to, subject, html, text }

VOICE (PipeCat + Daily)
Python:
- pip install "pipecat-ai[daily]"
- DAILY_API_KEY in env
- Create room and join token (see helper below); wire `DailyTransport` into a Pipeline; register `on_client_connected`/`on_client_disconnected`.

Reference (adapt for our service layer):
from pipecat.runner.daily import configure
from pipecat.transports.services.daily import DailyTransport, DailyParams
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
# create room_url, token = await configure(session)
# transport = DailyTransport(..., params=DailyParams(audio_in_enabled=True, audio_out_enabled=True, transcription_enabled=True, vad_analyzer=SileroVADAnalyzer()))
# pipeline = Pipeline([transport.input(), ..., transport.output()])

PRICING (Autumn)
- Implement `PricingMeter` that estimates pre‑run cost from Flow JSON and intercepts LLM/tool calls to emit pricing.update events and persist to `runs.pricingSummary`.
- Enforce optional soft cap `budgetUSD`: emit pricing.alert and pause.

AGENT RUNTIME
- Agentic: Instantiate MasterAgent with a tool registry of child agents; surface speech as `agent.said`; call `MailAgent` when ready.
- Sequential: Start at `RoutingAgent` (or Start), follow edges by condition, loop `DataCollectionAgent` until required fields collected, then `ExecutionAgent` → `MailAgent`.
- `ExecutionAgent` has browser automation (e.g., Playwright) and a sandboxed Python kernel for light transforms; narrate progress.

FRONTEND IMPLEMENTATION
- Add pages/components:
  - FlowBuilder: React Flow canvas, right‑panel node config, import/export (JSON).
  - SecretsManager: labels UI → backend key storage; no plaintext exposure.
  - RunConsole: start run, show SSE events, pricing meter, transcript, email status.
  - VoicePanel: PipeCatJS connect/disconnect, mic/cam, live captions from transcription.
- Use Motion for micro interactions; ShadCN or Mantine for UI.
- Export function `exportFlow(nodes, edges)` matching schema; infer paradigm by presence of agentic edges.
- Env: NEXT_PUBLIC_* style for client config where needed.

BACKEND IMPLEMENTATION (files to add)
- backend/app/main.py (FastAPI app + routes + SSE)
- backend/app/schemas.py (Pydantic models + JSON Schema validation)
- backend/app/runner/engine.py (Agentic/Sequential runners + event emitter)
- backend/app/runner/agents/{master.py, execution.py, mail.py, routing.py, collect.py}
- backend/app/services/{voice.py, mail.py, pricing.py, persistence.py, llm.py, browser.py, kernel.py}
- backend/app/utils/{sse.py, ids.py, time.py, logging.py}
- backend/tests/{test_health.py, test_sse.py, test_schema.py, test_routing.py, test_collect.py}
- backend/requirements.txt (fastapi, uvicorn, pydantic, sse-starlette or native, httpx, pipecat-ai[daily], playwright, tenacity, pytest, mypy, ruff, typing-extensions, anyio, websockets)
- backend/pyproject.toml: configure ruff + mypy
- backend/README.md: run instructions

FRONTEND IMPLEMENTATION (files to add)
- frontend/app/src/features/flow/{FlowBuilder.jsx, nodes/*, edges/*, exportFlow.js}
- frontend/app/src/features/run/{RunConsole.jsx, useSSE.js, PricingMeter.jsx}
- frontend/app/src/features/voice/{VoicePanel.jsx}
- frontend/app/src/features/secrets/{SecretsManager.jsx}
- frontend/app/src/lib/{api.js, pipecat.js}
- Frontend tests (vitest/react-testing-library) for export logic and SSE reducer

CONFIG/DEPLOY
- Root .gitignore exists; keep ignoring env, node_modules, dist, __pycache__, venvs, caches.
- Add `vercel.json` to route Python serverless or container; deploy FE to Vercel project tlzm-frontend → tlzm.io.
- Env vars (examples):
  ANTHROPIC_API_KEY, GEMINI_API_KEY, OPENAI_API_KEY,
  PIPECAT_TOKEN, DAILY_API_KEY,
  AGENTMAIL_API_KEY, AUTUMN_API_KEY,
  CONVEX_URL, CONVEX_DEPLOY_KEY,
  VOICE_PROVIDER=daily

CONSTRAINTS
- Always ensure ruff, unit tests, and mypy pass.
- Type hints throughout backend; strict JSON Schema; reject unknown node types/fields.
- SSE streaming must flush properly; keep connections efficient for Vercel.
- Voice failures should gracefully fall back to non‑voice runs; keep SSE active.
- Provider fallback: Gemini ↔ Anthropic ↔ OpenAI on rate‑limit/errors.
- Deterministic defaults: temperatures ≤ 0.3 for agent behaviors.

ERROR HANDLING
- All endpoints: { ok: false, error: { code, message } } on failure.
- Tool errors: surface `agent.error` events with nodeId.
- Budget guard: emit `pricing.alert` and pause run.

TEST PLAN (Hackathon‑grade)
- Schema: validate Flow JSON samples (agentic & sequential).
- SSE: simulate run and assert ordered event types.
- Routing: synthetic inputs → expected class labels.
- Data Collection: missing required triggers loop; completes when filled.
- Mail: sandbox send → status queued.
- Pricing: estimate > 0 and increases during run.
- Voice: room created; token returned.
- Lint/type: ruff clean; mypy clean.

DEFINITION OF DONE (V0)
- Flow JSON exported/validated; all node/edge types supported.
- Runs execute both paradigms with SSE updates.
- Voice room created; PipeCat speaks at least one agent message.
- MailAgent sends an email with results.
- Convex stores flows, runs, collected_data.
- Autumn shows an estimate + at least one in‑run pricing.update.
- Deployed to tlzm.io with secrets configured.
- No features beyond V0.

INITIAL IMPLEMENTATION SLICES
1) Backend bootstrap:
- Implement /api/health, /api/runs (start), /api/runs/{id}/events (SSE generator with sample events).
- Add JSON Schema validation for Flow JSON; tests for validation and SSE order.
- Add ruff/mypy config; CI locally via scripts.

2) Frontend Flow Builder + export/import:
- Node palette, agentic/sequential edges, exportFlow(nodes, edges).
- Basic Run Console hooking SSE; show event log.

3) Voice room creation API + FE hook:
- Implement /api/voice/rooms with Daily helper; FE voice panel connects via PipeCatJS.

4) Agent runtime scaffolding:
- Engine for Agentic/Sequential; event emitter; stubs for agents and pricing.

5) Mail + Pricing:
- Implement MailAgent (sandbox) and PricingMeter with events.

6) Persistence:
- Wire Convex minimal collections and store runs/flows/events/pricing.

COMMANDS
Backend:
- python -m venv .venv && source .venv/bin/activate
- pip install -r backend/requirements.txt
- uvicorn backend.app.main:app --reload
- ruff check backend
- mypy backend
- pytest -q

Frontend:
- cd frontend/app && npm install
- npm run dev

SAMPLE SKELETONS (sketch)

# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse, JSONResponse
import asyncio, json, uuid

app = FastAPI()

@app.get("/api/health")
def health(): return {"status":"ok"}

@app.post("/api/runs")
async def start_run(flow: dict):
    run_id = f"r_{uuid.uuid4().hex[:8]}"
    room = f"run_{run_id}"
    return {"runId": run_id, "voice": {"room": room, "expiresIn": 3600}}

@app.get("/api/runs/{run_id}/events")
async def sse(run_id: str):
    async def eventgen():
        yield f'data: {json.dumps({"event":"run.started","data":{"runId":run_id}})}\n\n'
        await asyncio.sleep(0.2)
        yield f'data: {json.dumps({"event":"voice.room.created","data":{"room":f"run_{run_id}","expiresIn":3600}})}\n\n'
        await asyncio.sleep(0.2)
        yield f'data: {json.dumps({"event":"run.completed","data":{"ok":True}})}\n\n'
    return StreamingResponse(eventgen(), media_type="text/event-stream")

// frontend/app/src/features/flow/exportFlow.js
export function exportFlow(nodes, edges) {
  const hasAgentic = edges.some(e => e.data?.kind === "agentic");
  return {
    version: "0.1.0",
    name: "demo-flow",
    paradigm: hasAgentic ? "agentic" : "sequential",
    nodes: nodes.map(n => ({ id: n.id, type: n.type, label: n.data?.label, ...n.data?.config })),
    edges: edges.map(e => ({ id: e.id, type: e.data?.kind, source: e.source, target: e.target, when: e.data?.when || null }))
  };
}

JSON SCHEMA (excerpt)
{
  "$schema":"https://json-schema.org/draft/2020-12/schema",
  "type":"object",
  "required":["version","paradigm","nodes","edges"],
  "properties":{
    "version":{"type":"string","const":"0.1.0"},
    "paradigm":{"enum":["agentic","sequential"]},
    "nodes":{"type":"array","items":{
      "type":"object","required":["id","type"],
      "properties":{
        "id":{"type":"string"},
        "type":{"enum":["MasterAgent","ExecutionAgent","MailAgent","RoutingAgent","DataCollectionAgent"]},
        "model":{"type":"object"},
        "schema":{"type":"array"},
        "tools":{"type":"array","items":{"type":"string"}}
      }
    }},
    "edges":{"type":"array","items":{
      "type":"object","required":["id","type","source","target"],
      "properties":{
        "id":{"type":"string"},
        "type":{"enum":["agentic","sequential"]},
        "source":{"type":"string"},
        "target":{"type":"string"},
        "when":{"type":["string","null"]}
      }
    }}
  }
}

VALIDATION/QUALITY BARS
- ruff clean; mypy clean; pytest passing.
- SSE works reliably; events match spec.
- Flow JSON validated strictly; reject drift.
- Voice creation works; graceful fallback on failure.
- Pricing meter emits updates.
- Minimal but usable UI with ShadCN/Mantine + Motion micro‑interactions.

DELIVERABLE
Commit all new/changed files to branch axc/yolo. Provide concise READMEs for backend and frontend with run and deploy instructions. Ensure env examples exist without secrets and references to Vercel deployment steps.  Create a dev setup script to setup local development environment
