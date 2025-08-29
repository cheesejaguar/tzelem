import api, { handleApiResponse, createEventSource } from '@/lib/api';
import { FlowJSON } from '@/lib/types/flow';
import { 
  RunStartRequest, 
  RunStartResponse, 
  RunStatus,
  RunEvent 
} from '@/types/api';
import { toast } from 'sonner';

/**
 * Start a new run with either a flow ID or full flow JSON
 */
export async function startRun(
  flowId?: string, 
  flow?: FlowJSON
): Promise<RunStartResponse> {
  try {
    if (!flowId && !flow) {
      throw new Error('Either flowId or flow must be provided');
    }

    const request: RunStartRequest = {};
    
    if (flowId) {
      request.flowId = flowId;
    }
    
    if (flow) {
      // Convert FlowJSON to backend format if needed
      request.flow = {
        id: flow.name.toLowerCase().replace(/\s+/g, '-'),
        name: flow.name,
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
    }

    const response = await handleApiResponse<RunStartResponse>(
      api.post('/api/runs', request)
    );
    
    toast.success('Run started successfully');
    return response;
  } catch (error) {
    console.error('Failed to start run:', error);
    toast.error('Failed to start run');
    throw error;
  }
}

/**
 * Get the current status of a run
 */
export async function getRunStatus(runId: string): Promise<RunStatus> {
  try {
    const response = await handleApiResponse<RunStatus>(
      api.get(`/api/runs/${runId}`)
    );
    return response;
  } catch (error) {
    console.error(`Failed to get run status for ${runId}:`, error);
    throw error;
  }
}

/**
 * Stop a running execution (if backend supports it)
 */
export async function stopRun(runId: string): Promise<void> {
  try {
    await handleApiResponse<void>(
      api.post(`/api/runs/${runId}/stop`)
    );
    toast.success('Run stopped successfully');
  } catch (error) {
    // If backend doesn't support /stop yet, treat as local stop
    const status = (error as any)?.response?.status;
    if (status === 404) {
      console.warn(`Stop endpoint not available; soft-stopping run ${runId}`);
      toast.info('Stop not supported yet; disconnected locally.');
      return;
    }
    console.error(`Failed to stop run ${runId}:`, error);
    toast.error('Failed to stop run');
    throw error;
  }
}

/**
 * Stream run events via Server-Sent Events
 */
export function streamRunEvents(
  runId: string,
  onEvent: (event: RunEvent) => void,
  onError?: (error: Event) => void,
  onOpen?: () => void
): EventSource {
  const eventSource = createEventSource(`/api/runs/${runId}/events`);
  
  // Handle connection open
  eventSource.onopen = () => {
    console.log(`SSE connection opened for run ${runId}`);
    onOpen?.();
  };
  
  // Handle incoming messages
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as RunEvent;
      onEvent(data);
    } catch (error) {
      console.error('Failed to parse SSE event:', error);
    }
  };
  
  // Handle errors
  eventSource.onerror = (error) => {
    console.error(`SSE error for run ${runId}:`, error);
    onError?.(error);
  };
  
  return eventSource;
}

/**
 * Poll run status at regular intervals (alternative to SSE)
 */
export function pollRunStatus(
  runId: string,
  onUpdate: (status: RunStatus) => void,
  interval: number = 2000
): { stop: () => void } {
  let stopped = false;
  let timeoutId: NodeJS.Timeout;
  
  const poll = async () => {
    if (stopped) return;
    
    try {
      const status = await getRunStatus(runId);
      onUpdate(status);
      
      // Stop polling if run is completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        stopped = true;
        return;
      }
      
      // Schedule next poll
      timeoutId = setTimeout(poll, interval);
    } catch (error) {
      console.error('Failed to poll run status:', error);
      // Continue polling even on error
      if (!stopped) {
        timeoutId = setTimeout(poll, interval);
      }
    }
  };
  
  // Start polling
  poll();
  
  // Return stop function
  return {
    stop: () => {
      stopped = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    },
  };
}

/**
 * Get run history (if backend supports it)
 */
export async function getRunHistory(
  limit: number = 10,
  offset: number = 0
): Promise<RunStatus[]> {
  try {
    const response = await handleApiResponse<RunStatus[]>(
      api.get('/api/runs', {
        params: { limit, offset },
      })
    );
    return response;
  } catch (error) {
    console.error('Failed to get run history:', error);
    throw error;
  }
}

/**
 * Get run logs (if backend supports it)
 */
export async function getRunLogs(runId: string): Promise<string[]> {
  try {
    const response = await handleApiResponse<string[]>(
      api.get(`/api/runs/${runId}/logs`)
    );
    return response;
  } catch (error) {
    console.error(`Failed to get logs for run ${runId}:`, error);
    throw error;
  }
}
