import { type Node, type Edge } from '@xyflow/react';
import { type ValidationError } from '../types';

export function validateFlow(nodes: Node[], edges: Edge[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check if flow has at least one node
  if (nodes.length === 0) {
    errors.push({
      type: 'error',
      message: 'Flow must contain at least one node',
    });
    return errors;
  }

  // Validate each node
  nodes.forEach((node) => {
    const nodeErrors = validateNode(node);
    errors.push(...nodeErrors);
  });

  // Validate edges
  edges.forEach((edge) => {
    const edgeErrors = validateEdge(edge, nodes);
    errors.push(...edgeErrors);
  });

  // Check for disconnected nodes (warning)
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id) && nodes.length > 1) {
      errors.push({
        nodeId: node.id,
        type: 'warning',
        message: 'Node is not connected to any other nodes',
      });
    }
  });

  return errors;
}

function validateNode(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!node.data) {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Node data is missing',
    });
    return errors;
  }

  switch (node.type) {
    case 'masterAgent':
      return validateMasterAgent(node);
    case 'executionAgent':
      return validateExecutionAgent(node);
    case 'routingAgent':
      return validateRoutingAgent(node);
    case 'dataCollectionAgent':
      return validateDataCollectionAgent(node);
    case 'mailAgent':
      return validateMailAgent(node);
    default:
      errors.push({
        nodeId: node.id,
        type: 'error',
        message: `Unknown node type: ${node.type}`,
      });
  }

  return errors;
}

function validateMasterAgent(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as Record<string, unknown>;

  if (!data.model || typeof data.model !== 'string') {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Master Agent must have a model specified',
      field: 'model',
    });
  }

  if (!data.systemPrompt || typeof data.systemPrompt !== 'string' || data.systemPrompt.trim().length === 0) {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Master Agent must have a system prompt',
      field: 'systemPrompt',
    });
  }

  if (!Array.isArray(data.tools)) {
    errors.push({
      nodeId: node.id,
      type: 'warning',
      message: 'Master Agent should have tools configured',
      field: 'tools',
    });
  }

  return errors;
}

function validateExecutionAgent(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as Record<string, unknown>;

  if (!data.model || typeof data.model !== 'string') {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Execution Agent must have a model specified',
      field: 'model',
    });
  }

  if (!data.capabilities || typeof data.capabilities !== 'object') {
    errors.push({
      nodeId: node.id,
      type: 'warning',
      message: 'Execution Agent should have capabilities configured',
      field: 'capabilities',
    });
  }

  return errors;
}

function validateRoutingAgent(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as Record<string, unknown>;

  if (!data.model || typeof data.model !== 'string') {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Routing Agent must have a model specified',
      field: 'model',
    });
  }

  if (!Array.isArray(data.classes) || data.classes.length === 0) {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Routing Agent must have at least one class configured',
      field: 'classes',
    });
  }

  return errors;
}

function validateDataCollectionAgent(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as Record<string, unknown>;

  if (!Array.isArray(data.schema) || data.schema.length === 0) {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Data Collection Agent must have at least one schema field',
      field: 'schema',
    });
  }

  if (!data.loopPrompt || typeof data.loopPrompt !== 'string' || data.loopPrompt.trim().length === 0) {
    errors.push({
      nodeId: node.id,
      type: 'warning',
      message: 'Data Collection Agent should have a loop prompt',
      field: 'loopPrompt',
    });
  }

  return errors;
}

function validateMailAgent(node: Node): ValidationError[] {
  const errors: ValidationError[] = [];
  const data = node.data as Record<string, unknown>;

  if (!data.config || typeof data.config !== 'object') {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Mail Agent must have configuration',
      field: 'config',
    });
    return errors;
  }

  const config = data.config as Record<string, unknown>;
  
  if (!config.fromName || typeof config.fromName !== 'string') {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Mail Agent must have a from name configured',
      field: 'config.fromName',
    });
  }

  if (!config.subject || typeof config.subject !== 'string') {
    errors.push({
      nodeId: node.id,
      type: 'error',
      message: 'Mail Agent must have a subject configured',
      field: 'config.subject',
    });
  }

  return errors;
}

function validateEdge(edge: Edge, nodes: Node[]): ValidationError[] {
  const errors: ValidationError[] = [];

  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode) {
    errors.push({
      edgeId: edge.id,
      type: 'error',
      message: `Edge source node not found: ${edge.source}`,
    });
  }

  if (!targetNode) {
    errors.push({
      edgeId: edge.id,
      type: 'error',
      message: `Edge target node not found: ${edge.target}`,
    });
  }

  return errors;
}

export function isFlowValid(errors: ValidationError[]): boolean {
  return !errors.some(error => error.type === 'error');
} 