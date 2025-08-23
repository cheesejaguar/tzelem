// API Type Definitions matching backend Pydantic models

import { FlowNode, FlowEdge } from '@/lib/types/flow';

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status?: string;
}

// Generic API error
export interface ApiError {
  code: string;
  message: string;
  detail?: string;
  field?: string;
}

// Flow types matching backend/api/flows.py
export interface FlowData {
  id: string;
  name: string;
  description?: string;
  paradigm: 'Agentic' | 'Sequential';
  nodes: FlowNode[];
  edges: FlowEdge[];
  version: string;
  created?: string;
  updated?: string;
  metadata?: Record<string, any>;
}

export interface FlowCreateResponse {
  flowId: string;
}

// Run types matching backend/api/runs.py
export interface VoiceInfo {
  room: string;
  token?: string;
}

export interface RunStartRequest {
  flowId?: string;
  flow?: FlowData;
}

export interface RunStartResponse {
  runId: string;
  voice: VoiceInfo;
}

export interface RunStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  flowId?: string;
  startedAt?: string;
  completedAt?: string;
  currentNode?: string;
  progress?: number; // 0.0 to 1.0
}

// Voice types matching backend/api/voice.py
export interface RoomResponse {
  room: string;
  join_token: string;
}

export interface ProductivityRoomResponse {
  room: string;
  joinToken: string;
  agentStatus: string;
  features: string[];
}

export interface JSONFlowRoomRequest {
  json_config?: Record<string, any>;
}

export interface JSONFlowRoomResponse {
  room: string;
  joinToken: string;
  agentStatus: string;
  paradigm: string;
  subAgentsCount: number;
}

export interface RoomStatus {
  room_url: string;
  agent_type?: 'productivity' | 'json_flow';
  agent_status: string;
  features?: string[];
  paradigm?: string;
  sub_agents_count?: number;
  configuration?: Record<string, any>;
  productivity_data?: Record<string, any>;
  flow_data?: Record<string, any>;
  message: string;
}

// SSE Event types for real-time updates
export interface SSEEvent {
  type: string;
  timestamp: string;
  [key: string]: any;
}

export interface RunStartedEvent extends SSEEvent {
  type: 'run_started';
  runId: string;
}

export interface NodeStartedEvent extends SSEEvent {
  type: 'node_started';
  nodeId: string;
}

export interface NodeCompletedEvent extends SSEEvent {
  type: 'node_completed';
  nodeId: string;
  result?: any;
}

export interface ProgressEvent extends SSEEvent {
  type: 'progress';
  progress: number;
}

export interface RunCompletedEvent extends SSEEvent {
  type: 'run_completed';
  runId: string;
  status: 'completed' | 'failed';
  result?: any;
}

export interface ErrorEvent extends SSEEvent {
  type: 'error';
  message: string;
  code?: string;
}

export type RunEvent = 
  | RunStartedEvent
  | NodeStartedEvent
  | NodeCompletedEvent
  | ProgressEvent
  | RunCompletedEvent
  | ErrorEvent;

// Pagination support (for future use)
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Filter and sort options (for future use)
export interface FilterOptions {
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}