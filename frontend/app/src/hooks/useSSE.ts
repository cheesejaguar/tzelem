import { useEffect, useRef, useState, useCallback } from 'react';
import { RunEvent } from '@/types/api';
import { toast } from 'sonner';

export interface UseSSEOptions {
  onMessage?: (event: RunEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export interface UseSSEReturn {
  isConnected: boolean;
  isReconnecting: boolean;
  error: Error | null;
  reconnect: () => void;
  disconnect: () => void;
  events: RunEvent[];
  clearEvents: () => void;
}

/**
 * Custom hook for managing Server-Sent Events connections
 */
export function useSSE(
  url: string | null,
  options: UseSSEOptions = {}
): UseSSEReturn {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnect = true,
    reconnectDelay = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const urlRef = useRef(url);

  // Update URL ref when it changes
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  /**
   * Clear stored events
   */
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  /**
   * Disconnect from SSE
   */
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[SSE] Disconnecting...');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setIsReconnecting(false);
    reconnectAttemptsRef.current = 0;
  }, []);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!urlRef.current) {
      return;
    }

    // Disconnect any existing connection
    disconnect();

    try {
      console.log(`[SSE] Connecting to ${urlRef.current}...`);
      // Construct full URL if needed
      const fullUrl = urlRef.current.startsWith('http') 
        ? urlRef.current 
        : `${window.location.origin}${urlRef.current}`;
      const eventSource = new EventSource(fullUrl);
      eventSourceRef.current = eventSource;

      // Handle connection open
      eventSource.onopen = () => {
        console.log('[SSE] Connection opened');
        setIsConnected(true);
        setIsReconnecting(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as RunEvent;
          console.log('[SSE] Message received:', data);
          
          // Store event in history
          setEvents(prev => [...prev, data]);
          
          // Call message handler
          onMessage?.(data);
          
          // Handle specific event types
          switch (data.type) {
            case 'error':
              toast.error(`Error: ${data.message}`);
              break;
            case 'run_completed':
              if (data.status === 'completed') {
                toast.success('Run completed successfully');
              } else {
                toast.error('Run failed');
              }
              break;
          }
        } catch (err) {
          console.error('[SSE] Failed to parse message:', err);
        }
      };

      // Handle errors
      eventSource.onerror = (event) => {
        console.error('[SSE] Connection error:', event);
        setError(new Error('SSE connection error'));
        onError?.(event);

        // Handle reconnection
        if (eventSource.readyState === EventSource.CLOSED) {
          setIsConnected(false);
          eventSource.close();
          eventSourceRef.current = null;
          
          // Attempt reconnection if enabled
          if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            setIsReconnecting(true);
            
            console.log(
              `[SSE] Reconnecting in ${reconnectDelay}ms... ` +
              `(Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
            );
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, reconnectDelay);
          } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error('[SSE] Max reconnection attempts reached');
            toast.error('Connection lost. Please refresh the page.');
            onClose?.();
          }
        }
      };
    } catch (err) {
      console.error('[SSE] Failed to create EventSource:', err);
      setError(err as Error);
    }
  }, [disconnect, onOpen, onMessage, onError, onClose, reconnect, reconnectDelay, maxReconnectAttempts]);

  /**
   * Manual reconnect function
   */
  const reconnectManual = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Connect when URL is provided
  useEffect(() => {
    if (url) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [url]); // Only reconnect when URL changes

  return {
    isConnected,
    isReconnecting,
    error,
    reconnect: reconnectManual,
    disconnect,
    events,
    clearEvents,
  };
}

/**
 * Simplified hook for basic SSE usage
 */
export function useSimpleSSE(url: string | null): {
  events: RunEvent[];
  isConnected: boolean;
  error: Error | null;
} {
  const { events, isConnected, error } = useSSE(url);
  return { events, isConnected, error };
}