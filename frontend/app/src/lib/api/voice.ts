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
  config?: Record<string, any>
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
 */
export async function joinVoiceRoom(
  roomUrl: string,
  token: string,
  onConnect?: () => void,
  onDisconnect?: () => void,
  onError?: (error: Error) => void
): Promise<any> {
  try {
    // Dynamic import to avoid loading PipeCat until needed
    const { RTVIClient } = await import('@pipecat-ai/client-js');
    
    const client = new RTVIClient({
      baseUrl: roomUrl,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      enableMic: true,
      enableCam: false,
      timeout: 30000,
    });
    
    // Set up event handlers
    client.on('connected', () => {
      console.log('Connected to voice room');
      onConnect?.();
    });
    
    client.on('disconnected', () => {
      console.log('Disconnected from voice room');
      onDisconnect?.();
    });
    
    client.on('error', (error: Error) => {
      console.error('Voice room error:', error);
      onError?.(error);
    });
    
    // Connect to the room
    await client.connect();
    
    return client;
  } catch (error) {
    console.error('Failed to join voice room:', error);
    toast.error('Failed to join voice room');
    throw error;
  }
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