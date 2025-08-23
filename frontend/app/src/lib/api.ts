const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async createVoiceRoom(): Promise<VoiceRoomResponse> {
    return this.request<VoiceRoomResponse>("/api/voice/rooms", {
      method: "POST",
    });
  }

  async startFlowRun(data: FlowRunRequest): Promise<FlowRunResponse> {
    return this.request<FlowRunResponse>("/api/runs", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
