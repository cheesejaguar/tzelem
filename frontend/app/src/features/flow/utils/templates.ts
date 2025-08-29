import { FlowJSON, FlowNode, FlowEdge } from '@/lib/types/flow';

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

function pos(x: number, y: number) { return { x, y }; }

export const emailTriageTemplate: FlowJSON = {
  version: '0.1.0',
  name: 'Email Triage',
  paradigm: 'agentic',
  secrets: [],
  voice: { enabled: false, provider: 'pipecat', roomTTL: 3600 },
  nodes: [
    {
      id: makeId('master'),
      type: 'MasterAgent',
      position: pos(100, 220),
      data: {
        label: 'Master Agent',
        model: { provider: 'openai', model: 'gpt-4o' },
        tools: [],
        systemPrompt: 'You triage incoming requests and delegate email actions.'
      }
    },
    {
      id: makeId('mail'),
      type: 'MailAgent',
      position: pos(420, 220),
      data: {
        label: 'Mail Agent',
        config: { fromName: 'Tzelem', subject: 'Re: Your Request' }
      }
    }
  ] as FlowNode[],
  edges: [
    {
      id: makeId('edge'),
      source: '', // filled at runtime below
      target: '',
      type: 'agentic'
    }
  ] as FlowEdge[],
  run: { inputs: {}, pricing: { enabled: true, budgetUSD: 10 } }
};

export const leadCaptureTemplate: FlowJSON = {
  version: '0.1.0',
  name: 'Lead Capture',
  paradigm: 'sequential',
  secrets: [],
  voice: { enabled: false, provider: 'pipecat', roomTTL: 3600 },
  nodes: [
    {
      id: makeId('router'),
      type: 'RoutingAgent',
      position: pos(100, 200),
      data: {
        label: 'Router',
        model: { provider: 'openai', model: 'gpt-4o' },
        classes: ['collect', 'email']
      }
    },
    {
      id: makeId('collector'),
      type: 'DataCollectionAgent',
      position: pos(420, 120),
      data: {
        label: 'Data Collector',
        loopPrompt: 'Collect the user\'s contact details.',
        schema: [
          { name: 'Full Name', type: 'string', required: true },
          { name: 'Email', type: 'string', required: true }
        ]
      }
    },
    {
      id: makeId('mail'),
      type: 'MailAgent',
      position: pos(420, 300),
      data: {
        label: 'Welcome Email',
        config: { fromName: 'Sales', subject: 'Thanks for your interest' }
      }
    }
  ] as FlowNode[],
  edges: [
    { id: makeId('e1'), source: '', target: '', type: 'sequential' },
    { id: makeId('e2'), source: '', target: '', type: 'sequential' }
  ] as FlowEdge[],
  run: { inputs: {}, pricing: { enabled: true, budgetUSD: 10 } }
};

export const researchEmailTemplate: FlowJSON = {
  version: '0.1.0',
  name: 'Research + Email',
  paradigm: 'agentic',
  secrets: [],
  voice: { enabled: false, provider: 'pipecat', roomTTL: 3600 },
  nodes: [
    {
      id: makeId('master'),
      type: 'MasterAgent',
      position: pos(100, 200),
      data: {
        label: 'Orchestrator',
        model: { provider: 'openai', model: 'gpt-4o' },
        tools: [],
        systemPrompt: 'Research a topic and send a summary via email.'
      }
    },
    {
      id: makeId('exec'),
      type: 'ExecutionAgent',
      position: pos(420, 120),
      data: {
        label: 'Research Agent',
        model: { provider: 'openai', model: 'gpt-4o-mini' },
        capabilities: { browser: true, kernel: false },
        policies: { askUserOnAmbiguity: true },
        url: 'https://www.google.com',
        prompt: 'Find top 3 points and sources.'
      }
    },
    {
      id: makeId('mail'),
      type: 'MailAgent',
      position: pos(420, 280),
      data: {
        label: 'Mailer',
        config: { fromName: 'Research Bot', subject: 'Your Research Summary' }
      }
    }
  ] as FlowNode[],
  edges: [
    { id: makeId('e1'), source: '', target: '', type: 'agentic' },
    { id: makeId('e2'), source: '', target: '', type: 'agentic' }
  ] as FlowEdge[],
  run: { inputs: {}, pricing: { enabled: true, budgetUSD: 10 } }
};

// Normalize IDs in edges to actual node ids after generation
export function materializeTemplate(template: FlowJSON): FlowJSON {
  const t = JSON.parse(JSON.stringify(template)) as FlowJSON;
  const nodes = t.nodes;
  const find = (prefix: string) => nodes.find((n) => n.id.startsWith(prefix))?.id || nodes[0].id;
  t.edges = t.edges.map((e, idx) => {
    const edge = { ...e };
    if (!edge.source) {
      // Heuristics per template naming
      if (t.name === 'Email Triage') edge.source = find('master');
      else if (t.name === 'Lead Capture') edge.source = find('router');
      else edge.source = find('master');
    }
    if (!edge.target) {
      if (t.name === 'Email Triage') edge.target = find('mail');
      else if (t.name === 'Lead Capture') edge.target = idx === 0 ? find('collector') : find('mail');
      else edge.target = idx === 0 ? find('exec') : find('mail');
    }
    edge.id = edge.id || makeId('edge');
    return edge;
  });
  return t;
}

export const templates = [
  { key: 'email-triage', name: 'Email Triage', description: 'Master delegates to Mail Agent', get: () => materializeTemplate(emailTriageTemplate) },
  { key: 'lead-capture', name: 'Lead Capture', description: 'Router → Collector → Email', get: () => materializeTemplate(leadCaptureTemplate) },
  { key: 'research-email', name: 'Research + Email', description: 'Master → Research → Mail', get: () => materializeTemplate(researchEmailTemplate) },
];

