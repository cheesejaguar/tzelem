import api, { handleApiResponse } from '@/lib/api';
import { 
  RoomResponse, 
  ProductivityRoomResponse,
  JSONFlowRoomRequest,
  JSONFlowRoomResponse,
  RoomStatus 
} from '@/types/api';
import { toast } from 'sonner';

/**
 * Create a basic voice room
 */
export async function createVoiceRoom(): Promise<RoomResponse> {
  try {
    const response = await handleApiResponse<RoomResponse>(
      api.post('/api/voice/rooms')
    );
    
    toast.success('Voice room created successfully');
    return response;
  } catch (error) {
    console.error('Failed to create voice room:', error);
    toast.error('Failed to create voice room');
    throw error;
  }
}

/**
 * Create a productivity assistant voice room
 */
export async function createProductivityRoom(): Promise<ProductivityRoomResponse> {
  try {
    const response = await handleApiResponse<ProductivityRoomResponse>(
      api.post('/api/voice/productivity-rooms')
    );
    
    toast.success('Productivity assistant room created');
    return response;
  } catch (error) {
    console.error('Failed to create productivity room:', error);
    toast.error('Failed to create productivity room');
    throw error;
  }
}

/**
 * Create a JSON flow voice room with optional configuration
 */
export async function createJSONFlowRoom(
  config?: Record<string, unknown>
): Promise<JSONFlowRoomResponse> {
  try {
    const request: JSONFlowRoomRequest = {};
    if (config) {
      request.json_config = config;
    }
    
    const response = await handleApiResponse<JSONFlowRoomResponse>(
      api.post('/api/voice/json-flow-rooms', request)
    );
    
    toast.success('JSON flow room created');
    return response;
  } catch (error) {
    console.error('Failed to create JSON flow room:', error);
    toast.error('Failed to create JSON flow room');
    throw error;
  }
}

/**
 * Get the status of a voice room and its agent
 */
export async function getRoomStatus(roomUrl: string): Promise<RoomStatus> {
  try {
    // URL encode the room URL for the path parameter
    const encodedUrl = encodeURIComponent(roomUrl);
    
    const response = await handleApiResponse<RoomStatus>(
      api.get(`/api/voice/rooms/${encodedUrl}/status`)
    );
    
    return response;
  } catch (error) {
    console.error(`Failed to get room status for ${roomUrl}:`, error);
    throw error;
  }
}

/**
 * Clean up a voice room and stop its agent
 */
export async function cleanupRoom(roomUrl: string): Promise<void> {
  try {
    // URL encode the room URL for the path parameter
    const encodedUrl = encodeURIComponent(roomUrl);
    
    await handleApiResponse<void>(
      api.delete(`/api/voice/rooms/${encodedUrl}`)
    );
    
    toast.success('Room cleaned up successfully');
  } catch (error) {
    console.error(`Failed to cleanup room ${roomUrl}:`, error);
    toast.error('Failed to cleanup room');
    throw error;
  }
}

/**
 * Join a voice room using PipeCat client
 * This is a helper function that doesn't call the backend directly
 * but helps set up the PipeCat client connection
 * 
 * NOTE: This requires additional setup with a Transport implementation
 * and is provided as a placeholder for future integration
 */
export async function joinVoiceRoom(
  roomUrl: string,
  token: string,
  onConnect?: () => void,
  onDisconnect?: () => void,
  _onError?: (error: Error) => void
): Promise<unknown> {
  // TODO: Implement PipeCat client integration
  // This requires setting up a proper Transport (e.g., DailyTransport)
  // and configuring the client with the appropriate options
  
  console.log('Voice room integration not yet implemented');
  console.log('Room URL:', roomUrl);
  console.log('Token:', token);
  
  toast.info('Voice room integration coming soon');
  
  // Return a mock client object for now
  return {
    connect: async () => {
      console.log('Mock connect called');
      onConnect?.();
    },
    disconnect: async () => {
      console.log('Mock disconnect called');
      onDisconnect?.();
    },
    on: (event: string, _handler: (...args: unknown[]) => void) => {
      console.log(`Mock event handler registered for ${event}`);
    },
  };
}

/**
 * Poll room status at regular intervals
 */
export function pollRoomStatus(
  roomUrl: string,
  onUpdate: (status: RoomStatus) => void,
  interval: number = 3000
): { stop: () => void } {
  let stopped = false;
  let timeoutId: NodeJS.Timeout;
  
  const poll = async () => {
    if (stopped) return;
    
    try {
      const status = await getRoomStatus(roomUrl);
      onUpdate(status);
      
      // Schedule next poll
      timeoutId = setTimeout(poll, interval);
    } catch (error) {
      console.error('Failed to poll room status:', error);
      // Continue polling even on error
      if (!stopped) {
        timeoutId = setTimeout(poll, interval * 2); // Back off on error
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
 * Helper to check if voice features are enabled
 */
export function isVoiceEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_VOICE === 'true';
}