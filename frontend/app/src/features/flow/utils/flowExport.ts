import { FlowJSON, FlowNode, FlowEdge } from '@/lib/types/flow';

export function exportFlow(nodes: FlowNode[], edges: FlowEdge[]): FlowJSON {
  // Generate flow name from master agent or timestamp
  const masterAgent = nodes.find(n => n.type === 'MasterAgent');
  const flowName = masterAgent?.data.label || `workflow-${new Date().toISOString().split('T')[0]}`;

  // Determine paradigm based on edge types
  const hasAgenticEdges = edges.some(e => e.type === 'agentic');
  const hasSequentialEdges = edges.some(e => e.type === 'sequential');
  
  let paradigm: 'agentic' | 'sequential' = 'agentic';
  if (hasSequentialEdges && !hasAgenticEdges) {
    paradigm = 'sequential';
  }

  // Extract secrets used across agents (placeholder - would need actual secret analysis)
  const secrets: string[] = [];

  return {
    version: "0.1.0",
    name: flowName,
    paradigm,
    secrets,
    voice: {
      enabled: true, // Enable voice for workflow runs
      provider: "pipecat",
      roomTTL: 3600, // 1 hour default
    },
    nodes,
    edges,
    run: {
      inputs: {}, // Would be populated by user configuration
      pricing: {
        enabled: true,
        budgetUSD: 10, // Default $10 budget
      },
    },
  };
}

export function importFlow(json: any): FlowJSON {
  // Validate the imported JSON structure
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid flow file: not a valid JSON object');
  }

  if (!json.version || json.version !== '0.1.0') {
    throw new Error('Unsupported flow version. Expected version 0.1.0');
  }

  if (!Array.isArray(json.nodes)) {
    throw new Error('Invalid flow file: nodes must be an array');
  }

  if (!Array.isArray(json.edges)) {
    throw new Error('Invalid flow file: edges must be an array');
  }

  // Validate node structure
  for (const node of json.nodes) {
    if (!node.id || !node.type || !node.data || !node.position) {
      throw new Error(`Invalid node structure: ${node.id || 'unknown'}`);
    }

    const validNodeTypes = ['MasterAgent', 'ExecutionAgent', 'RoutingAgent', 'DataCollectionAgent', 'MailAgent'];
    if (!validNodeTypes.includes(node.type)) {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }

  // Validate edge structure
  for (const edge of json.edges) {
    if (!edge.id || !edge.source || !edge.target || !edge.type) {
      throw new Error(`Invalid edge structure: ${edge.id || 'unknown'}`);
    }

    const validEdgeTypes = ['agentic', 'sequential'];
    if (!validEdgeTypes.includes(edge.type)) {
      throw new Error(`Invalid edge type: ${edge.type}`);
    }
  }

  // Return validated flow
  return {
    version: json.version,
    name: json.name || 'Imported Workflow',
    paradigm: json.paradigm || 'agentic',
    secrets: json.secrets || [],
    voice: {
      enabled: json.voice?.enabled || false,
      provider: json.voice?.provider || 'pipecat',
      roomTTL: json.voice?.roomTTL || 3600,
    },
    nodes: json.nodes,
    edges: json.edges,
    run: {
      inputs: json.run?.inputs || {},
      pricing: {
        enabled: json.run?.pricing?.enabled ?? true,
        budgetUSD: json.run?.pricing?.budgetUSD || 10,
      },
    },
  };
}

export function generateFlowId(): string {
  return `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function validateFlowJSON(json: FlowJSON): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Check version
    if (json.version !== '0.1.0') {
      errors.push('Unsupported flow version');
    }

    // Check required fields
    if (!json.name || json.name.trim().length === 0) {
      errors.push('Flow name is required');
    }

    if (!json.paradigm || !['agentic', 'sequential'].includes(json.paradigm)) {
      errors.push('Invalid paradigm. Must be "agentic" or "sequential"');
    }

    // Validate nodes
    if (!Array.isArray(json.nodes) || json.nodes.length === 0) {
      errors.push('Flow must contain at least one node');
    }

    // Validate edges reference existing nodes
    if (Array.isArray(json.edges)) {
      const nodeIds = new Set(json.nodes.map(n => n.id));
      for (const edge of json.edges) {
        if (!nodeIds.has(edge.source)) {
          errors.push(`Edge references non-existent source node: ${edge.source}`);
        }
        if (!nodeIds.has(edge.target)) {
          errors.push(`Edge references non-existent target node: ${edge.target}`);
        }
      }
    }

    // Validate pricing
    if (json.run?.pricing?.enabled && 
        (typeof json.run.pricing.budgetUSD !== 'number' || json.run.pricing.budgetUSD <= 0)) {
      errors.push('Budget must be a positive number when pricing is enabled');
    }

  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}