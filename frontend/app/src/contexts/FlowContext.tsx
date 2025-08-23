import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FlowState, FlowAction, FlowNode, FlowEdge, FlowSnapshot, ValidationError } from '@/lib/types/flow';

const initialState: FlowState = {
  nodes: [],
  edges: [],
  selectedNode: null,
  selectedEdge: null,
  isValid: true,
  errors: [],
  history: [],
  historyIndex: -1,
  isDirty: false,
};

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'ADD_NODE':
      return saveSnapshot({
        ...state,
        nodes: [...state.nodes, action.payload],
        isDirty: true,
      });

    case 'UPDATE_NODE':
      return {
        ...state,
        nodes: state.nodes.map(node =>
          node.id === action.payload.id
            ? { ...node, data: { ...node.data, ...action.payload.data } }
            : node
        ),
        isDirty: true,
      };

    case 'DELETE_NODE':
      return saveSnapshot({
        ...state,
        nodes: state.nodes.filter(node => node.id !== action.payload),
        edges: state.edges.filter(edge => 
          edge.source !== action.payload && edge.target !== action.payload
        ),
        selectedNode: state.selectedNode === action.payload ? null : state.selectedNode,
        isDirty: true,
      });

    case 'ADD_EDGE':
      return saveSnapshot({
        ...state,
        edges: [...state.edges, action.payload],
        isDirty: true,
      });

    case 'UPDATE_EDGE':
      return {
        ...state,
        edges: state.edges.map(edge =>
          edge.id === action.payload.id
            ? { ...edge, ...action.payload.data }
            : edge
        ),
        isDirty: true,
      };

    case 'DELETE_EDGE':
      return saveSnapshot({
        ...state,
        edges: state.edges.filter(edge => edge.id !== action.payload),
        selectedEdge: state.selectedEdge === action.payload ? null : state.selectedEdge,
        isDirty: true,
      });

    case 'SELECT_NODE':
      return {
        ...state,
        selectedNode: action.payload,
        selectedEdge: null,
      };

    case 'SELECT_EDGE':
      return {
        ...state,
        selectedEdge: action.payload,
        selectedNode: null,
      };

    case 'SET_NODES':
      return {
        ...state,
        nodes: action.payload,
        isDirty: true,
      };

    case 'SET_EDGES':
      return {
        ...state,
        edges: action.payload,
        isDirty: true,
      };

    case 'VALIDATE_FLOW': {
      const errors = validateFlow(state.nodes, state.edges);
      return {
        ...state,
        errors,
        isValid: errors.length === 0,
      };
    }

    case 'UNDO':
      if (state.historyIndex > 0) {
        const previousSnapshot = state.history[state.historyIndex - 1];
        return {
          ...state,
          nodes: previousSnapshot.nodes,
          edges: previousSnapshot.edges,
          historyIndex: state.historyIndex - 1,
          isDirty: true,
        };
      }
      return state;

    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const nextSnapshot = state.history[state.historyIndex + 1];
        return {
          ...state,
          nodes: nextSnapshot.nodes,
          edges: nextSnapshot.edges,
          historyIndex: state.historyIndex + 1,
          isDirty: true,
        };
      }
      return state;

    case 'SAVE_SNAPSHOT':
      return saveSnapshot(state);

    case 'IMPORT_FLOW': {
      const importedFlow = action.payload;
      return saveSnapshot({
        ...state,
        nodes: importedFlow.nodes,
        edges: importedFlow.edges,
        isDirty: false,
        selectedNode: null,
        selectedEdge: null,
      });
    }

    case 'CLEAR_FLOW':
      return saveSnapshot({
        ...initialState,
        history: [],
        historyIndex: -1,
      });

    default:
      return state;
  }
}

function saveSnapshot(state: FlowState): FlowState {
  const snapshot: FlowSnapshot = {
    nodes: [...state.nodes],
    edges: [...state.edges],
    timestamp: Date.now(),
  };

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);

  // Keep only last 50 snapshots for performance
  if (newHistory.length > 50) {
    newHistory.shift();
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function validateFlow(nodes: FlowNode[], edges: FlowEdge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if there's at least one node
  if (nodes.length === 0) {
    errors.push({
      message: 'Flow must contain at least one agent',
      severity: 'error',
    });
  }

  // Check for nodes without required fields
  nodes.forEach(node => {
    if (!node.data.label || node.data.label.trim().length === 0) {
      errors.push({
        nodeId: node.id,
        message: 'Agent must have a label',
        severity: 'error',
      });
    }

    // Type-specific validations
    switch (node.type) {
      case 'MasterAgent':
        if (!node.data.systemPrompt?.trim()) {
          errors.push({
            nodeId: node.id,
            message: 'Master Agent must have a system prompt',
            severity: 'error',
          });
        }
        if (!node.data.model?.model) {
          errors.push({
            nodeId: node.id,
            message: 'Master Agent must specify a model',
            severity: 'error',
          });
        }
        break;

      case 'ExecutionAgent':
        if (!node.data.model?.model) {
          errors.push({
            nodeId: node.id,
            message: 'Execution Agent must specify a model',
            severity: 'error',
          });
        }
        break;

      case 'RoutingAgent':
        if (!node.data.classes || node.data.classes.length === 0) {
          errors.push({
            nodeId: node.id,
            message: 'Routing Agent must have at least one class',
            severity: 'error',
          });
        }
        if (!node.data.model?.model) {
          errors.push({
            nodeId: node.id,
            message: 'Routing Agent must specify a model',
            severity: 'error',
          });
        }
        break;

      case 'DataCollectionAgent':
        if (!node.data.schema || node.data.schema.length === 0) {
          errors.push({
            nodeId: node.id,
            message: 'Data Collection Agent must have a schema',
            severity: 'error',
          });
        }
        break;

      case 'MailAgent':
        if (!node.data.config?.fromName?.trim()) {
          errors.push({
            nodeId: node.id,
            message: 'Mail Agent must have a from name',
            severity: 'error',
          });
        }
        if (!node.data.config?.subject?.trim()) {
          errors.push({
            nodeId: node.id,
            message: 'Mail Agent must have a subject',
            severity: 'error',
          });
        }
        break;
    }
  });

  // Check for orphaned nodes (no connections)
  if (nodes.length > 1) {
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    nodes.forEach(node => {
      if (!connectedNodes.has(node.id)) {
        errors.push({
          nodeId: node.id,
          message: 'Agent is not connected to the workflow',
          severity: 'warning',
        });
      }
    });
  }

  return errors;
}

interface FlowContextType {
  state: FlowState;
  dispatch: React.Dispatch<FlowAction>;
}

const FlowContext = createContext<FlowContextType | null>(null);

interface FlowProviderProps {
  children: ReactNode;
}

export function FlowProvider({ children }: FlowProviderProps) {
  const [state, dispatch] = useReducer(flowReducer, initialState);

  return (
    <FlowContext.Provider value={{ state, dispatch }}>
      {children}
    </FlowContext.Provider>
  );
}

export function useFlow() {
  const context = useContext(FlowContext);
  if (!context) {
    throw new Error('useFlow must be used within a FlowProvider');
  }
  return context;
}