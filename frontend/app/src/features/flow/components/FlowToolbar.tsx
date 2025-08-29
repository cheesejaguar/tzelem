import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Upload,
  Play,
  Undo,
  Redo,
  Trash2,
  PhoneOff,
} from "lucide-react";
import { useFlow } from "@/contexts/FlowContext";
import { exportFlow, importFlow } from "../utils/flowExport";
import { DailyCallFrame } from "@/components/DailyCallFrame";
import { apiClient } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { templates } from "@/features/flow/utils/templates";
import { FlowNode } from "@/lib/types/flow";

interface VoiceInfo {
  room: string;
  token?: string;
}

export function FlowToolbar({ onToggleConsole, isConsoleOpen, onRunStarted }: { onToggleConsole?: () => void; isConsoleOpen?: boolean; onRunStarted?: (runId: string) => void }) {
  const { state, dispatch } = useFlow();
  const [isCallActive, setIsCallActive] = useState(false);
  const [voiceInfo, setVoiceInfo] = useState<VoiceInfo | null>(null);
  const [isStartingRun, setIsStartingRun] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Simple DAG-based auto layout (layered by indegree)
  const autoLayout = () => {
    const nodes = [...state.nodes];
    const edges = [...state.edges];
    const indeg: Record<string, number> = {};
    const layer: Record<string, number> = {};
    nodes.forEach(n => { indeg[n.id] = 0; layer[n.id] = 0; });
    edges.forEach(e => { if (indeg[e.target] !== undefined) indeg[e.target] += 1; });
    const queue = nodes.filter(n => indeg[n.id] === 0).map(n => n.id);
    while (queue.length) {
      const id = queue.shift()!;
      const out = edges.filter(e => e.source === id).map(e => e.target);
      out.forEach(t => {
        layer[t] = Math.max(layer[t] || 0, (layer[id] || 0) + 1);
        indeg[t] -= 1;
        if (indeg[t] === 0) queue.push(t);
      });
    }
    // Group by layer
    const groups: Record<number, FlowNode[]> = {};
    nodes.forEach(n => {
      const l = layer[n.id] || 0;
      if (!groups[l]) groups[l] = [];
      groups[l].push(n);
    });
    // Assign positions
    const colWidth = 360;
    const rowHeight = 220;
    const paddingX = 80;
    const paddingY = 80;
    const newNodes: FlowNode[] = nodes.map(n => ({ ...n }));
    Object.keys(groups).forEach((k) => {
      const l = Number(k);
      const col = groups[l];
      col.forEach((n, i) => {
        const idx = newNodes.findIndex(nn => nn.id === n.id);
        newNodes[idx] = {
          ...newNodes[idx],
          position: {
            x: paddingX + l * colWidth,
            y: paddingY + i * rowHeight,
          },
        };
      });
    });
    dispatch({ type: "SET_NODES", payload: newNodes });
  };

  const handleExport = () => {
    try {
      const flowJSON = exportFlow(state.nodes, state.edges);
      const blob = new Blob([JSON.stringify(flowJSON, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${flowJSON.name || "workflow"}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string);
            const flowJSON = importFlow(json);
            dispatch({ type: "IMPORT_FLOW", payload: flowJSON });
          } catch (error) {
            console.error("Import failed:", error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClear = () => {
    if (
      confirm(
        "Are you sure you want to clear the entire workflow? This action cannot be undone."
      )
    ) {
      dispatch({ type: "CLEAR_FLOW" });
    }
  };

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleRedo = () => {
    dispatch({ type: "REDO" });
  };

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  const handleRunWorkflow = async () => {
    try {
      setIsStartingRun(true);

      // Export the flow data to pass to the voice agent
      const flowData = exportFlow(state.nodes, state.edges);

      // Create a JSON flow room with voice agent (includes the flow configuration)
      const voiceData = await apiClient.createJSONFlowRoom(flowData as unknown as Record<string, unknown>);

      // Also start the workflow run (for tracking/logging)
      const run = await apiClient.startFlowRun({ flow: flowData });

      // Set up the voice call with the created room
      setVoiceInfo({
        room: voiceData.room,
        token: voiceData.joinToken, // Note: JSONFlowRoomResponse uses joinToken (camelCase)
      });
      setIsCallActive(true);
      // Notify parent so console can attach to this run
      if (onRunStarted && run?.runId) onRunStarted(run.runId);
    } catch (error) {
      console.error("Failed to run workflow:", error);
      alert(
        "Failed to start workflow. Please check your connection and try again."
      );
    } finally {
      setIsStartingRun(false);
    }
  };

  const handleLeaveCall = () => {
    setIsCallActive(false);
    setVoiceInfo(null);
  };

  return (
    <div className="h-14 flex items-center justify-between px-6 bg-white/95 backdrop-blur-sm">
      {/* Left Section - Logo and Project Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-bold">T</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-gray-900">
              Tzelem Flow Builder
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{state.nodes.length} nodes</span>
              <span>•</span>
              <span>{state.edges.length} edges</span>
              {!state.isValid && state.errors.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 font-medium">
                    {state.errors.length} issues
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* History Controls */}
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo}
            className="h-9 px-3 disabled:opacity-40"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            className="h-9 px-3 disabled:opacity-40"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* Console Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleConsole}
          className="h-9 px-3 text-foreground"
        >
          {isConsoleOpen ? 'Hide Console' : 'Show Console'}
        </Button>

        {/* Auto Layout */}
        <Button
          variant="outline"
          size="sm"
          onClick={autoLayout}
          className="h-9 px-3 text-foreground"
        >
          Auto Layout
        </Button>

        {/* File Operations */}
        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-3 text-foreground"
              data-template-trigger
            >
              New from template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select a starter template</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    const tpl = t.get();
                    dispatch({ type: "IMPORT_FLOW", payload: tpl });
                    setTemplatesOpen(false);
                  }}
                  className="text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium text-gray-900">{t.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{t.description}</div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleImport}
          className="h-9 px-3 text-foreground"
          data-import-trigger
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={state.nodes.length === 0}
          className="h-9 px-3 disabled:opacity-40 text-foreground"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          disabled={state.nodes.length === 0}
          className="h-9 px-3 disabled:opacity-40 text-foreground"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Primary Action */}
        {!isCallActive ? (
          <Button
            className="h-9 px-6 font-medium shadow-sm ml-3"
            size="sm"
            disabled={
              !state.isValid || state.nodes.length === 0 || isStartingRun
            }
            onClick={handleRunWorkflow}
          >
            <Play className="w-4 h-4 mr-2" />
            {isStartingRun ? "Starting..." : "Run Workflow"}
          </Button>
        ) : (
          <Button
            variant="destructive"
            className="h-9 px-6 font-medium shadow-sm ml-3"
            size="sm"
            onClick={handleLeaveCall}
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        )}
      </div>

      {/* Daily Call Frame */}
      {voiceInfo && (
        <DailyCallFrame
          roomUrl={voiceInfo.room}
          token={voiceInfo.token}
          onLeave={handleLeaveCall}
          isVisible={isCallActive}
        />
      )}
    </div>
  );
}
