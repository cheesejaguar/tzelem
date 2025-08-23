# Tzelem Frontend Mega Prompt

**Production-Ready Agent Workflow Builder Frontend**

## Executive Summary

Build a premium React frontend for designing and executing agent workflows with real-time voice interaction, live progress monitoring, and seamless email handoffs. The application should feel like a professional enterprise tool with Apple-level polish and Vercel-quality execution.

---

## Architecture Overview

### Tech Stack

- **Framework**: Vite + React 19 + TypeScript
- **UI Components**: ShadCN/UI + Radix UI primitives
- **Styling**: Tailwind CSS + CSS Custom Properties
- **Flow Builder**: React Flow (@xyflow/react)
- **Voice**: PipeCat Client JS + WebRTC
- **State Management**: React Context + useReducer
- **HTTP Client**: Axios with interceptors
- **Animations**: Motion (Framer Motion successor)
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

### Project Structure

```
frontend/app/src/
├── components/
│   ├── ui/                    # ShadCN base components
│   ├── layout/                # Header, Navigation, Layout
│   └── common/                # Shared components
├── features/
│   ├── flow/                  # Flow Builder
│   │   ├── components/
│   │   │   ├── FlowBuilder.tsx
│   │   │   ├── NodePalette.tsx
│   │   │   ├── FlowCanvas.tsx
│   │   │   └── nodes/         # Node type components
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types.ts
│   ├── run/                   # Run Console & Execution
│   │   ├── components/
│   │   │   ├── RunConsole.tsx
│   │   │   ├── EventStream.tsx
│   │   │   ├── PricingMeter.tsx
│   │   │   └── Transcript.tsx
│   │   ├── hooks/
│   │   │   ├── useSSE.ts
│   │   │   └── useRunState.ts
│   │   └── types.ts
│   ├── voice/                 # Voice Interface
│   │   ├── components/
│   │   │   ├── VoicePanel.tsx
│   │   │   ├── AudioControls.tsx
│   │   │   └── LiveCaptions.tsx
│   │   ├── hooks/
│   │   │   └── usePipecat.ts
│   │   └── types.ts
│   └── secrets/               # Secrets Management
│       ├── components/
│       │   ├── SecretsManager.tsx
│       │   └── SecretForm.tsx
│       └── hooks/
├── lib/
│   ├── api.ts                 # API client & endpoints
│   ├── utils.ts               # Utility functions
│   ├── constants.ts           # App constants
│   ├── validation.ts          # Schema validation
│   └── types/                 # Global type definitions
├── hooks/                     # Global hooks
├── contexts/                  # React contexts
└── styles/                    # Global styles
```

---

## Core Features & Requirements

### 1. Flow Builder (React Flow)

#### Node Types & Specifications

```typescript
interface NodeTypes {
  MasterAgent: {
    model: ModelConfig;
    tools: string[];
    systemPrompt: string;
  };
  ExecutionAgent: {
    model: ModelConfig;
    capabilities: { browser: boolean; kernel: boolean };
    policies: { askUserOnAmbiguity: boolean };
  };
  RoutingAgent: {
    model: ModelConfig;
    classes: string[];
  };
  DataCollectionAgent: {
    schema: FieldSchema[];
    loopPrompt: string;
  };
  MailAgent: {
    config: { fromName: string; subject: string };
  };
}
```

#### Edge Types

- **Agentic**: Tool-based connections between agents
- **Sequential**: Linear workflow connections with conditions

#### Flow Export Schema (v0.1.0)

```typescript
interface FlowJSON {
  version: "0.1.0";
  name: string;
  paradigm: "agentic" | "sequential";
  secrets: string[];
  voice: {
    enabled: boolean;
    provider: "pipecat";
    roomTTL: number;
  };
  nodes: FlowNode[];
  edges: FlowEdge[];
  run: {
    inputs: Record<string, any>;
    pricing: { enabled: boolean; budgetUSD: number };
  };
}
```

#### Implementation Requirements

- **Drag & Drop**: Intuitive node placement from palette
- **Real-time Validation**: Live schema validation with error highlighting
- **Auto-layout**: Smart edge routing and node positioning
- **Undo/Redo**: Full history management
- **Zoom & Pan**: Smooth canvas navigation
- **Minimap**: Overview for large flows
- **Export/Import**: JSON serialization with version control

### 2. Run Console & Live Monitoring

#### SSE Event Stream Integration

```typescript
interface SSEEvents {
  "run.started": { runId: string; paradigm: string };
  "voice.room.created": { room: string; expiresIn: number };
  "agent.started": { nodeId: string };
  "agent.said": { nodeId: string; text: string };
  "agent.output": { nodeId: string; payload: any };
  "collect.missing": { fields: string[] };
  "mail.sent": { to: string; status: string };
  "pricing.update": { usd: number; byProvider: Record<string, number> };
  "run.completed": { ok: boolean; durationMs: number };
}
```

#### Console Features

- **Live Event Log**: Real-time streaming with filtering
- **Visual Flow State**: Highlight active nodes during execution
- **Pricing Meter**: Live cost tracking with budget alerts
- **Transcript View**: Conversation history with timestamps
- **Email Status**: Delivery tracking and status updates
- **Run Controls**: Start, stop, pause, resume functionality

### 3. Voice Interface (PipeCat Integration)

#### WebRTC Connection Management

```typescript
interface VoiceConfig {
  room: string;
  token: string;
  expiresIn: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
  transcriptionEnabled: boolean;
}
```

#### Voice Panel Features

- **Connection Status**: Visual indicators for WebRTC state
- **Audio Controls**: Mic mute/unmute, volume control
- **Video Controls**: Camera on/off, video preview
- **Live Captions**: Real-time transcription display
- **Voice Activity**: Visual feedback for speaking detection
- **Room Management**: Join/leave room functionality

### 4. Secrets Manager

#### Security Requirements

- **Label-Only Storage**: Never expose raw secret values in frontend
- **Backend Resolution**: All secrets resolved server-side
- **Encrypted Transit**: HTTPS-only communication
- **No Plaintext**: Zero plaintext secret handling in client

#### UI Features

- **Secret Labels**: User-friendly names for API keys
- **Status Indicators**: Valid/invalid/missing secret states
- **Bulk Management**: Import/export secret configurations
- **Validation**: Real-time validation of secret formats

---

## Design System Integration

### Color Palette (Following Design PRD)

```css
:root {
  /* Monochromatic Foundation */
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-tertiary: #f5f5f5;
  --text-primary: #1a1a1a;
  --text-secondary: #525252;
  --text-tertiary: #737373;

  /* Accent Colors */
  --accent-primary: #0066ff;
  --success: #00d084;
  --warning: #ff8800;
  --error: #ff4444;

  /* Borders & Interactions */
  --border-primary: #e5e5e5;
  --hover-overlay: rgba(0, 0, 0, 0.05);
  --focus-ring: rgba(26, 26, 26, 0.2);
}
```

### Typography System

```css
/* Inter font family with proper weights */
.display-large {
  font: 900 clamp(48px, 8vw, 80px) / 1.02 Inter;
}
.display-medium {
  font: 700 clamp(32px, 5vw, 48px) / 1.1 Inter;
}
.body-large {
  font: 400 18px/1.6 Inter;
}
.body-medium {
  font: 400 16px/1.5 Inter;
}
.button-text {
  font: 600 14px/1 Inter;
}
.label {
  font: 600 12px/1 Inter;
  text-transform: uppercase;
}
```

### Component Specifications

#### Buttons

```tsx
// Primary Action Button
<Button variant="primary" size="md" className="btn-primary">
  Start Run
</Button>

// Secondary Button
<Button variant="secondary" size="md" className="btn-secondary">
  Export Flow
</Button>
```

#### Cards

```tsx
// Flow Node Card
<Card className="node-card">
  <CardHeader>
    <CardTitle>Master Agent</CardTitle>
  </CardHeader>
  <CardContent>{/* Node configuration */}</CardContent>
</Card>
```

---

## API Integration

### Endpoint Specifications

```typescript
interface APIEndpoints {
  // Flow Management
  "POST /api/flows": (flow: FlowJSON) => { flowId: string };
  "GET /api/flows/:id": () => FlowJSON;

  // Run Management
  "POST /api/runs": (payload: { flowId: string } | FlowJSON) => {
    runId: string;
    voice?: { room: string; token: string };
  };
  "GET /api/runs/:id": () => RunStatus;
  "GET /api/runs/:id/events": () => EventSource; // SSE

  // Voice
  "POST /api/voice/rooms": () => {
    room: string;
    joinToken: string;
    expiresIn: number;
  };

  // Mail
  "POST /api/mail": (payload: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => { status: string };
}
```

### HTTP Client Configuration

```typescript
// lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle auth errors
      localStorage.removeItem("auth_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## State Management

### Flow State Context

```typescript
interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: string | null;
  isValid: boolean;
  errors: ValidationError[];
  history: FlowSnapshot[];
  historyIndex: number;
}

const FlowContext = createContext<{
  state: FlowState;
  dispatch: Dispatch<FlowAction>;
}>({} as any);
```

### Run State Management

```typescript
interface RunState {
  runId: string | null;
  status: "idle" | "starting" | "running" | "completed" | "error";
  events: SSEEvent[];
  pricing: PricingData;
  voice: VoiceState;
  transcript: TranscriptEntry[];
}
```

---

## Real-time Features

### SSE Implementation

```typescript
// hooks/useSSE.ts
export function useSSE(runId: string | null) {
  const [events, setEvents] = useState<SSEEvent[]>([]);
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`/api/runs/${runId}/events`);

    eventSource.onopen = () => setConnectionState("connected");
    eventSource.onerror = () => setConnectionState("disconnected");

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents((prev) => [...prev, data]);
    };

    return () => {
      eventSource.close();
      setConnectionState("disconnected");
    };
  }, [runId]);

  return { events, connectionState };
}
```

### WebRTC Voice Integration

```typescript
// hooks/usePipecat.ts
export function usePipecat() {
  const [client, setClient] = useState<PipecatClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);

  const connect = async (config: VoiceConfig) => {
    const pipecatClient = new PipecatClient({
      room: config.room,
      token: config.token,
      enableAudio: config.audioEnabled,
      enableVideo: config.videoEnabled,
    });

    await pipecatClient.connect();
    setClient(pipecatClient);
    setIsConnected(true);
  };

  const disconnect = async () => {
    if (client) {
      await client.disconnect();
      setClient(null);
      setIsConnected(false);
    }
  };

  return {
    client,
    isConnected,
    audioEnabled,
    videoEnabled,
    connect,
    disconnect,
    toggleAudio: () => setAudioEnabled(!audioEnabled),
    toggleVideo: () => setVideoEnabled(!videoEnabled),
  };
}
```

---

## Performance Optimization

### Code Splitting

```typescript
// Lazy load feature components
const FlowBuilder = lazy(
  () => import("./features/flow/components/FlowBuilder")
);
const RunConsole = lazy(() => import("./features/run/components/RunConsole"));
const VoicePanel = lazy(() => import("./features/voice/components/VoicePanel"));
const SecretsManager = lazy(
  () => import("./features/secrets/components/SecretsManager")
);
```

### Bundle Optimization

- **Tree Shaking**: Remove unused React Flow nodes
- **Dynamic Imports**: Load voice features only when needed
- **Asset Optimization**: Compress SVG icons and images
- **CSS Purging**: Remove unused Tailwind classes

### Memory Management

- **Event Cleanup**: Proper SSE and WebRTC cleanup
- **State Optimization**: Memoize expensive computations
- **Render Optimization**: React.memo for stable components

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// Flow export functionality
describe("exportFlow", () => {
  it("should export valid Flow JSON", () => {
    const nodes = [mockMasterAgent, mockExecutionAgent];
    const edges = [mockAgenticEdge];

    const result = exportFlow(nodes, edges);

    expect(result.version).toBe("0.1.0");
    expect(result.paradigm).toBe("agentic");
    expect(validateFlowSchema(result)).toBe(true);
  });
});

// SSE hook testing
describe("useSSE", () => {
  it("should handle connection lifecycle", () => {
    const { result } = renderHook(() => useSSE("test-run-id"));

    expect(result.current.connectionState).toBe("connecting");
    // Mock SSE events and test state updates
  });
});
```

### Integration Tests

- **Flow Builder**: Complete flow creation and export
- **Run Console**: SSE event handling and UI updates
- **Voice Panel**: WebRTC connection and controls
- **API Integration**: Error handling and retry logic

### E2E Tests (Playwright)

- **Complete Workflow**: Create flow → Start run → Monitor progress
- **Voice Integration**: Connect → Speak → Receive response
- **Error Scenarios**: Network failures, invalid flows, auth errors

---

## Accessibility & UX

### WCAG 2.1 AA Compliance

- **Keyboard Navigation**: Full keyboard support for all features
- **Screen Reader**: Proper ARIA labels and semantic markup
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Focus Management**: Clear focus indicators and logical tab order
- **Motion Respect**: Honor `prefers-reduced-motion`

### User Experience Enhancements

- **Loading States**: Skeleton screens and progress indicators
- **Error Recovery**: Clear error messages with recovery actions
- **Offline Support**: Graceful degradation when offline
- **Responsive Design**: Mobile-first, touch-friendly interface

---

## Environment Configuration

### Environment Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://api.tlzm.io
VITE_WS_BASE_URL=wss://api.tlzm.io

# Voice Configuration
VITE_PIPECAT_ENABLED=true
VITE_VOICE_PROVIDER=daily

# Feature Flags
VITE_ENABLE_VOICE=true
VITE_ENABLE_PRICING=true
VITE_DEBUG_MODE=false

# Analytics (optional)
VITE_ANALYTICS_ID=
```

### Build Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          flow: ["@xyflow/react"],
          voice: ["@pipecat-ai/client-js"],
        },
      },
    },
  },
});
```

---

## Deployment & Production

### Vercel Configuration

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "VITE_API_BASE_URL": "@api-base-url",
    "VITE_PIPECAT_ENABLED": "@pipecat-enabled"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}
```

### Security Headers

- **CSP**: Content Security Policy for XSS protection
- **HSTS**: HTTP Strict Transport Security
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

- [ ] Project setup with Vite + React + TypeScript
- [ ] Design system implementation (colors, typography, components)
- [ ] Basic routing and layout structure
- [ ] API client configuration
- [ ] Flow Builder skeleton with React Flow

### Phase 2: Core Features (Week 2)

- [ ] Complete Flow Builder with all node types
- [ ] Flow export/import functionality
- [ ] JSON schema validation
- [ ] Basic Run Console with mock data
- [ ] Secrets Manager UI

### Phase 3: Real-time Integration (Week 3)

- [ ] SSE integration for live updates
- [ ] Run Console with real backend integration
- [ ] Pricing meter and live cost tracking
- [ ] Voice panel UI (without WebRTC)
- [ ] Error handling and loading states

### Phase 4: Voice & Polish (Week 4)

- [ ] PipeCat WebRTC integration
- [ ] Live captions and voice controls
- [ ] Complete testing suite
- [ ] Performance optimization
- [ ] Accessibility audit and fixes
- [ ] Production deployment

---

## Quality Gates

### Code Quality

- [ ] TypeScript strict mode enabled
- [ ] ESLint + Prettier configuration
- [ ] 90%+ test coverage for critical paths
- [ ] Zero console errors in production build
- [ ] Lighthouse score 90+ (Performance, Accessibility, Best Practices)

### User Experience

- [ ] Sub-3s initial load time
- [ ] Smooth 60fps animations
- [ ] Responsive design (320px to 2560px)
- [ ] Keyboard navigation for all features
- [ ] Screen reader compatibility

### Production Readiness

- [ ] Error boundaries for graceful failures
- [ ] Comprehensive error logging
- [ ] Performance monitoring integration
- [ ] Security headers and CSP
- [ ] CDN optimization for assets

---

## Success Metrics

### Technical Metrics

- **Bundle Size**: < 500KB gzipped
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Error Rate**: < 0.1%
- **Uptime**: 99.9%

### User Experience Metrics

- **Flow Creation Time**: < 2 minutes for simple flows
- **Run Start Time**: < 5 seconds from click to execution
- **Voice Connection Time**: < 3 seconds to establish WebRTC
- **User Satisfaction**: 4.5+ stars (if user feedback implemented)

---

**Remember**: This is a production-grade application that should feel premium, reliable, and effortlessly simple. Every interaction should be smooth, every error should be helpful, and every feature should serve the user's workflow goals.
