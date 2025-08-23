import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

// API base URL from environment or default based on current location
const getApiBaseUrl = () => {
  // If explicitly set in environment, use that
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Otherwise, use relative URLs for production/staging (will use same domain)
  // and localhost for development
  if (import.meta.env.DEV) {
    return "http://localhost:8000";
  }

  // In production/staging, use relative URL (same domain)
  return "";
};

const API_BASE_URL = getApiBaseUrl();
const DEBUG_MODE =
  import.meta.env.VITE_ENABLE_DEBUG === "true" || import.meta.env.DEV;

// Voice Room and Flow Run interfaces
export interface VoiceRoomResponse {
  room: string;
  join_token: string;
}

export interface FlowRunRequest {
  flowId?: string;
  flow?: any;
}

export interface FlowRunResponse {
  runId: string;
  voice: {
    room: string;
    token?: string;
  };
}

// Create axios instance with default configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Enable if you need cookies/auth
});

// Request interceptor for adding auth headers and logging
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log request in debug mode
    if (DEBUG_MODE && config.url) {
      console.log(
        `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        config.data
      );
    }

    // Add auth token if available (from localStorage or context)
    const token = localStorage.getItem("auth_token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    if (DEBUG_MODE) {
      console.error("[API Request Error]", error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and logging
api.interceptors.response.use(
  (response) => {
    // Log response in debug mode
    if (DEBUG_MODE) {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    if (DEBUG_MODE) {
      console.error("[API Response Error]", error);
    }

    // Handle different error statuses
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.detail || error.message;

      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login if needed
          localStorage.removeItem("auth_token");
          toast.error("Session expired. Please log in again.");
          // Optionally redirect to login page
          break;
        case 403:
          toast.error("You do not have permission to perform this action.");
          break;
        case 404:
          toast.error("The requested resource was not found.");
          break;
        case 422:
          // Validation error
          toast.error(`Validation error: ${message}`);
          break;
        case 500:
          toast.error(
            "An internal server error occurred. Please try again later."
          );
          break;
        case 503:
          toast.error(
            "Service temporarily unavailable. Please try again later."
          );
          break;
        default:
          toast.error(`Error: ${message}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error("Network error. Please check your connection.");
    } else {
      // Something else happened
      toast.error("An unexpected error occurred.");
    }

    return Promise.reject(error);
  }
);

// Helper function to handle API responses
export function handleApiResponse<T>(promise: Promise<any>): Promise<T> {
  return promise
    .then((response) => response.data)
    .catch((error) => {
      // Re-throw the error after it's been handled by interceptor
      throw error;
    });
}

// Helper function for SSE endpoints
export function createEventSource(endpoint: string): EventSource {
  const baseUrl = API_BASE_URL || window.location.origin;
  const url = `${baseUrl}${endpoint}`;

  if (DEBUG_MODE) {
    console.log(`[SSE Connection] Opening connection to ${url}`);
  }

  const eventSource = new EventSource(url);

  eventSource.onerror = (error) => {
    if (DEBUG_MODE) {
      console.error(`[SSE Error] ${url}`, error);
    }
    toast.error("Lost connection to server. Attempting to reconnect...");
  };

  return eventSource;
}

// Additional interfaces for JSON Flow rooms
export interface JSONFlowRoomResponse {
  room: string;
  joinToken: string;
  agentStatus: string;
  paradigm: string;
  subAgentsCount: number;
}

// Voice/Daily API functions using the axios instance
export const apiClient = {
  async createVoiceRoom(): Promise<VoiceRoomResponse> {
    return handleApiResponse<VoiceRoomResponse>(api.post('/api/voice/rooms'));
  },

  async createJSONFlowRoom(flowConfig?: Record<string, unknown>): Promise<JSONFlowRoomResponse> {
    const requestData = flowConfig ? { json_config: flowConfig } : {};
    return handleApiResponse<JSONFlowRoomResponse>(api.post('/api/voice/json-flow-rooms', requestData));
  },

  async startFlowRun(data: FlowRunRequest): Promise<FlowRunResponse> {
    return handleApiResponse<FlowRunResponse>(api.post('/api/runs', data));
  },
};

// Export the API base URL for components that need it
export const getApiUrl = () => API_BASE_URL || window.location.origin;

// Export configured axios instance
export default api;
