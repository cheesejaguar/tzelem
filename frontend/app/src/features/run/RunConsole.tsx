import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  RefreshCw, 
  Download, 
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';
import { useSSE } from '@/hooks/useSSE';
import { startRun, getRunStatus, stopRun } from '@/lib/api/runs';
import { useFlow } from '@/contexts/FlowContext';
import { exportFlow } from '@/features/flow/utils/flowExport';
import { RunStatus, RunEvent } from '@/types/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RunConsoleProps {
  className?: string;
  autoStart?: boolean;
}

export function RunConsole({ className, autoStart = false }: RunConsoleProps) {
  const { state: flowState } = useFlow();
  const [runId, setRunId] = useState<string | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // SSE connection for real-time events
  const sseUrl = runId ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/runs/${runId}/events` : null;
  
  const { 
    events, 
    isConnected, 
    isReconnecting, 
    error: sseError,
    clearEvents,
    disconnect
  } = useSSE(sseUrl, {
    onMessage: (event: RunEvent) => {
      // Update run status based on event
      switch (event.type) {
        case 'run_started':
          setRunStatus(prev => prev ? { ...prev, status: 'running' } : null);
          break;
        case 'run_completed':
          setRunStatus(prev => prev ? { 
            ...prev, 
            status: event.status,
            completedAt: event.timestamp 
          } : null);
          break;
        case 'progress':
          setRunStatus(prev => prev ? { ...prev, progress: event.progress } : null);
          break;
        case 'node_started':
          setRunStatus(prev => prev ? { ...prev, currentNode: event.nodeId } : null);
          break;
      }
    },
    onError: (error) => {
      console.error('SSE Error:', error);
    },
    onClose: () => {
      console.log('SSE Connection closed');
    }
  });

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [events]);

  // Start a new run
  const handleStartRun = async () => {
    if (flowState.nodes.length === 0) {
      toast.error('Cannot start run: Flow is empty');
      return;
    }

    setIsStarting(true);
    clearEvents();
    
    try {
      const flowJSON = exportFlow(flowState.nodes, flowState.edges);
      const response = await startRun(undefined, flowJSON);
      
      setRunId(response.runId);
      setRunStatus({
        id: response.runId,
        status: 'pending',
        startedAt: new Date().toISOString(),
        progress: 0,
      });
      
      toast.success('Run started successfully');
    } catch (error) {
      console.error('Failed to start run:', error);
      toast.error('Failed to start run');
    } finally {
      setIsStarting(false);
    }
  };

  // Stop the current run
  const handleStopRun = async () => {
    if (!runId) return;
    
    setIsStopping(true);
    
    try {
      await stopRun(runId);
      disconnect();
      setRunStatus(prev => prev ? { ...prev, status: 'failed' } : null);
      toast.success('Run stopped');
    } catch (error) {
      console.error('Failed to stop run:', error);
      toast.error('Failed to stop run');
    } finally {
      setIsStopping(false);
    }
  };

  // Clear the console
  const handleClear = () => {
    clearEvents();
    setRunId(null);
    setRunStatus(null);
    disconnect();
  };

  // Download logs
  const handleDownloadLogs = () => {
    const logs = events.map(e => `[${e.timestamp}] ${e.type}: ${JSON.stringify(e)}`).join('\n');
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `run-${runId || 'unknown'}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Logs downloaded');
  };

  // Get status badge color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'running': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get event icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'run_started': return <Play className="h-3 w-3" />;
      case 'run_completed': return <CheckCircle className="h-3 w-3" />;
      case 'error': return <XCircle className="h-3 w-3" />;
      case 'progress': return <Activity className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Run Console</CardTitle>
          <div className="flex items-center gap-2">
            {/* Connection status */}
            <Badge variant="outline" className="text-xs">
              <span className={cn(
                "w-2 h-2 rounded-full mr-1",
                isConnected ? "bg-green-500" : "bg-gray-400"
              )} />
              {isConnected ? 'Connected' : isReconnecting ? 'Reconnecting...' : 'Disconnected'}
            </Badge>
            
            {/* Run status */}
            {runStatus && (
              <Badge className={cn("text-xs", getStatusColor(runStatus.status))}>
                {runStatus.status}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            onClick={handleStartRun}
            disabled={isStarting || (runStatus?.status === 'running')}
          >
            <Play className="h-4 w-4 mr-1" />
            Start Run
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStopRun}
            disabled={!runId || isStopping || runStatus?.status !== 'running'}
          >
            <Square className="h-4 w-4 mr-1" />
            Stop
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleClear}
            disabled={events.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadLogs}
            disabled={events.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
        
        {/* Progress bar */}
        {runStatus?.progress !== undefined && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(runStatus.progress * 100)}%</span>
            </div>
            <Progress value={runStatus.progress * 100} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
          {events.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events yet</p>
              <p className="text-xs mt-1">Start a run to see real-time events</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-xs font-mono p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                >
                  {getEventIcon(event.type)}
                  <div className="flex-1 break-all">
                    <span className="text-muted-foreground">
                      [{new Date(event.timestamp).toLocaleTimeString()}]
                    </span>
                    {' '}
                    <span className="font-semibold text-primary">
                      {event.type}
                    </span>
                    {event.type === 'progress' && (
                      <span className="ml-2 text-muted-foreground">
                        {Math.round((event as any).progress * 100)}%
                      </span>
                    )}
                    {event.type === 'node_started' && (
                      <span className="ml-2 text-blue-600">
                        Node: {(event as any).nodeId}
                      </span>
                    )}
                    {event.type === 'error' && (
                      <span className="ml-2 text-red-600">
                        {(event as any).message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}