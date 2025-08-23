import { type Node, type Edge } from '@xyflow/react';
import { type FlowJSON } from '../types';

export function exportFlow(
  nodes: Node[],
  edges: Edge[],
  name: string = 'Untitled Flow',
  paradigm: 'agentic' | 'sequential' = 'agentic'
): Record<string, unknown> {
  return {
    version: "0.1.0",
    name,
    paradigm,
    secrets: extractSecrets(nodes),
    voice: {
      enabled: false,
      provider: "pipecat",
      roomTTL: 3600,
    },
    nodes: nodes,
    edges: edges.map(edge => ({
      ...edge,
      type: edge.type || 'agentic',
    })),
    run: {
      inputs: {},
      pricing: { enabled: true, budgetUSD: 10 },
    },
  };
}

function extractSecrets(nodes: Node[]): string[] {
  const secrets = new Set<string>();
  
  nodes.forEach(node => {
    // Extract API keys and secrets from node configurations
    const data = node.data as Record<string, unknown>;
    
    // Check for common secret patterns
    if (data.model && typeof data.model === 'string') {
      if (data.model.includes('gpt') || data.model.includes('claude')) {
        secrets.add('OPENAI_API_KEY');
      }
    }
    
    if (node.type === 'mailAgent') {
      secrets.add('SMTP_CONFIG');
    }
    
    if (node.type === 'executionAgent') {
      const capabilities = data.capabilities as Record<string, unknown>;
      if (capabilities?.browser) {
        secrets.add('BROWSER_CONFIG');
      }
    }
  });
  
  return Array.from(secrets);
}

export function downloadFlow(flowData: Record<string, unknown>): void {
  const blob = new Blob([JSON.stringify(flowData, null, 2)], {
    type: 'application/json',
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(flowData.name as string || 'flow').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function importFlow(jsonString: string): FlowJSON {
  try {
    const flowData = JSON.parse(jsonString) as FlowJSON;
    
    // Basic validation
    if (!flowData.version || !flowData.nodes || !flowData.edges) {
      throw new Error('Invalid flow format');
    }
    
    return flowData;
  } catch (error) {
    throw new Error(`Failed to import flow: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 