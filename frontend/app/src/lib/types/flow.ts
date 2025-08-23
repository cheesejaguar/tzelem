// Flow Builder Types - Based on Frontend Mega Prompt v0.1.0

export interface ModelConfig {
  provider: "openai" | "anthropic" | "google" | "local";
  model: string;
  temperature?: number;
  max_tokens?: number;
}

export interface FieldSchema {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  required: boolean;
  description?: string;
}

export interface NodeTypes {
  MasterAgent: {
    id: string;
    type: "MasterAgent";
    data: {
      model: ModelConfig;
      tools: string[];
      systemPrompt: string;
      label: string;
    };
    position: { x: number; y: number };
  };
  ExecutionAgent: {
    id: string;
    type: "ExecutionAgent";
    data: {
      model: ModelConfig;
      capabilities: {
        browser: boolean;
        kernel: boolean;
      };
      policies: {
        askUserOnAmbiguity: boolean;
      };
      url?: string;
      prompt?: string;
      label: string;
    };
    position: { x: number; y: number };
  };
  RoutingAgent: {
    id: string;
    type: "RoutingAgent";
    data: {
      model: ModelConfig;
      classes: string[];
      prompt?: string;
      label: string;
    };
    position: { x: number; y: number };
  };
  DataCollectionAgent: {
    id: string;
    type: "DataCollectionAgent";
    data: {
      schema: FieldSchema[];
      loopPrompt: string;
      label: string;
    };
    position: { x: number; y: number };
  };
  MailAgent: {
    id: string;
    type: "MailAgent";
    data: {
      config: {
        fromName: string;
        subject: string;
      };
      label: string;
    };
    position: { x: number; y: number };
  };
}

export type FlowNode =
  | NodeTypes["MasterAgent"]
  | NodeTypes["ExecutionAgent"]
  | NodeTypes["RoutingAgent"]
  | NodeTypes["DataCollectionAgent"]
  | NodeTypes["MailAgent"];

export type NodeType =
  | "MasterAgent"
  | "ExecutionAgent"
  | "RoutingAgent"
  | "DataCollectionAgent"
  | "MailAgent";

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: "agentic" | "sequential";
  animated?: boolean;
  selected?: boolean;
  data?: {
    condition?: string;
    label?: string;
  };
}

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
    inputs: Record<string, any>;
    pricing: {
      enabled: boolean;
      budgetUSD: number;
    };
  };
}

export interface ValidationError {
  nodeId?: string;
  edgeId?: string;
  message: string;
  severity: "error" | "warning";
}

export interface FlowSnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
  timestamp: number;
}

export interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: string | null;
  selectedEdge: string | null;
  isValid: boolean;
  errors: ValidationError[];
  history: FlowSnapshot[];
  historyIndex: number;
  isDirty: boolean;
}

export type FlowAction =
  | { type: "ADD_NODE"; payload: FlowNode }
  | {
      type: "UPDATE_NODE";
      payload: { id: string; data: Partial<FlowNode["data"]> };
    }
  | {
      type: "UPDATE_NODE_POSITION";
      payload: { id: string; position: { x: number; y: number } };
    }
  | { type: "DELETE_NODE"; payload: string }
  | { type: "ADD_EDGE"; payload: FlowEdge }
  | { type: "UPDATE_EDGE"; payload: { id: string; data: Partial<FlowEdge> } }
  | { type: "DELETE_EDGE"; payload: string }
  | { type: "SELECT_NODE"; payload: string | null }
  | { type: "SELECT_EDGE"; payload: string | null }
  | { type: "SET_NODES"; payload: FlowNode[] }
  | { type: "SET_EDGES"; payload: FlowEdge[] }
  | { type: "VALIDATE_FLOW" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SAVE_SNAPSHOT" }
  | { type: "IMPORT_FLOW"; payload: FlowJSON }
  | { type: "CLEAR_FLOW" };
