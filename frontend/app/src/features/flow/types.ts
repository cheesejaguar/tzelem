import { type Node, type Edge } from '@xyflow/react';

export interface FlowJSON {
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
    inputs: Record<string, unknown>;
    pricing: { enabled: boolean; budgetUSD: number };
  };
}

export interface FlowNode extends Omit<Node, 'data'> {
  type: 'masterAgent' | 'executionAgent' | 'routingAgent' | 'dataCollectionAgent' | 'mailAgent';
  data: MasterAgentData | ExecutionAgentData | RoutingAgentData | DataCollectionAgentData | MailAgentData;
}

export interface FlowEdge extends Edge {
  type?: 'agentic' | 'sequential';
}

export interface MasterAgentData {
  model: string;
  tools: string[];
  systemPrompt: string;
}

export interface ExecutionAgentData {
  model: string;
  capabilities: { browser: boolean; kernel: boolean };
  policies: { askUserOnAmbiguity: boolean };
}

export interface RoutingAgentData {
  model: string;
  classes: string[];
}

export interface DataCollectionAgentData {
  schema: FieldSchema[];
  loopPrompt: string;
}

export interface FieldSchema {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'url';
  required: boolean;
  description?: string;
}

export interface MailAgentData {
  config: { fromName: string; subject: string };
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  type: 'error' | 'warning';
  message: string;
  field?: string;
}

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  selectedNode: string | null;
  isValid: boolean;
  errors: ValidationError[];
  name: string;
  paradigm: 'agentic' | 'sequential';
} 