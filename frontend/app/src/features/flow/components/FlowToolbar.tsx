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

interface VoiceInfo {
  room: string;
  token?: string;
}

export function FlowToolbar() {
  const { state, dispatch } = useFlow();
  const [isCallActive, setIsCallActive] = useState(false);
  const [voiceInfo, setVoiceInfo] = useState<VoiceInfo | null>(null);
  const [isStartingRun, setIsStartingRun] = useState(false);

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
      await apiClient.startFlowRun({ flow: flowData });

      // Set up the voice call with the created room
      setVoiceInfo({
        room: voiceData.room,
        token: voiceData.joinToken, // Note: JSONFlowRoomResponse uses joinToken (camelCase)
      });
      setIsCallActive(true);
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
            className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo}
            className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* File Operations */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImport}
          className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Upload className="w-4 h-4 mr-2" />
          Import
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={state.nodes.length === 0}
          className="h-9 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-40"
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
          className="h-9 px-3 text-gray-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Primary Action */}
        {!isCallActive ? (
          <Button
            className="h-9 bg-blue-600 text-white hover:bg-blue-700 px-6 font-medium shadow-sm ml-3"
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
            className="h-9 bg-red-600 text-white hover:bg-red-700 px-6 font-medium shadow-sm ml-3"
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
