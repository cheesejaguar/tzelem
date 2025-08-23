import api, { handleApiResponse } from '@/lib/api';
import { FlowJSON } from '@/lib/types/flow';
import { FlowData, FlowCreateResponse } from '@/types/api';
import { toast } from 'sonner';

/**
 * Create or update a flow in the backend
 */
export async function createOrUpdateFlow(flow: FlowJSON): Promise<FlowCreateResponse> {
  try {
    // Convert FlowJSON to backend FlowData format
    const flowData: FlowData = {
      id: flow.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: flow.name,
      description: `Flow with ${flow.nodes.length} nodes in ${flow.paradigm} paradigm`,
      paradigm: flow.paradigm === 'agentic' ? 'Agentic' : 'Sequential',
      nodes: flow.nodes,
      edges: flow.edges,
      version: flow.version,
      metadata: {
        secrets: flow.secrets,
        voice: flow.voice,
        run: flow.run,
      },
    };

    const response = await handleApiResponse<FlowCreateResponse>(
      api.post('/api/flows', flowData)
    );
    
    toast.success('Flow saved successfully');
    return response;
  } catch (error) {
    console.error('Failed to save flow:', error);
    throw error;
  }
}

/**
 * Get a specific flow by ID
 */
export async function getFlow(flowId: string): Promise<FlowData> {
  try {
    const response = await handleApiResponse<FlowData>(
      api.get(`/api/flows/${flowId}`)
    );
    return response;
  } catch (error) {
    console.error(`Failed to get flow ${flowId}:`, error);
    throw error;
  }
}

/**
 * List all flows
 */
export async function listFlows(): Promise<FlowData[]> {
  try {
    const response = await handleApiResponse<FlowData[]>(
      api.get('/api/flows')
    );
    return response;
  } catch (error) {
    console.error('Failed to list flows:', error);
    throw error;
  }
}

/**
 * Delete a flow by ID (if backend supports it)
 */
export async function deleteFlow(flowId: string): Promise<void> {
  try {
    await handleApiResponse<void>(
      api.delete(`/api/flows/${flowId}`)
    );
    toast.success('Flow deleted successfully');
  } catch (error) {
    console.error(`Failed to delete flow ${flowId}:`, error);
    throw error;
  }
}

/**
 * Convert backend FlowData to frontend FlowJSON format
 */
export function convertFlowDataToJSON(flowData: FlowData): FlowJSON {
  const metadata = flowData.metadata || {};
  
  return {
    version: '0.1.0',
    name: flowData.name,
    paradigm: flowData.paradigm === 'Agentic' ? 'agentic' : 'sequential',
    secrets: metadata.secrets || [],
    voice: metadata.voice || {
      enabled: false,
      provider: 'pipecat',
      roomTTL: 3600,
    },
    nodes: flowData.nodes,
    edges: flowData.edges,
    run: metadata.run || {
      inputs: {},
      pricing: {
        enabled: true,
        budgetUSD: 10,
      },
    },
  };
}

/**
 * Import a flow from a JSON file
 */
export async function importFlowFromFile(file: File): Promise<FlowJSON> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        
        // Validate the JSON structure
        if (!json.version || !json.nodes || !json.edges) {
          throw new Error('Invalid flow file format');
        }
        
        toast.success('Flow imported successfully');
        resolve(json as FlowJSON);
      } catch (error) {
        toast.error('Failed to import flow: Invalid file format');
        reject(error);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Export a flow to a JSON file for download
 */
export function exportFlowToFile(flow: FlowJSON): void {
  const jsonString = JSON.stringify(flow, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${flow.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  toast.success('Flow exported successfully');
}