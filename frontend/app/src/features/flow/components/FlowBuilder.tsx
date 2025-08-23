import React, { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  Connection,
  ConnectionMode,
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useFlow } from "@/contexts/FlowContext";
import { FlowNode, FlowEdge, NodeType } from "@/lib/types/flow";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { NodePalette } from "./NodePalette";
import { FlowToolbar } from "./FlowToolbar";
import { NodeConfigPanel } from "./NodeConfigPanel";
import { MasterAgentNode } from "../nodes/MasterAgentNode";
import { ExecutionAgentNode } from "../nodes/ExecutionAgentNode";
import { RoutingAgentNode } from "../nodes/RoutingAgentNode";
import { DataCollectionAgentNode } from "../nodes/DataCollectionAgentNode";
import { MailAgentNode } from "../nodes/MailAgentNode";

import { Button } from "@/components/ui/button";
import { AlertCircle, Brain } from "lucide-react";

const nodeTypes = {
  MasterAgent: MasterAgentNode,
  ExecutionAgent: ExecutionAgentNode,
  RoutingAgent: RoutingAgentNode,
  DataCollectionAgent: DataCollectionAgentNode,
  MailAgent: MailAgentNode,
};

const edgeTypes = {};

function FlowBuilderInner() {
  const { state, dispatch } = useFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Local nodes state for smooth dragging
  const [localNodes, setLocalNodes] = React.useState<Node[]>([]);

  // Sync local nodes with global state
  React.useEffect(() => {
    const nodes: Node[] = state.nodes.map((node) => ({
      ...node,
      selected: state.selectedNode === node.id,
    }));
    setLocalNodes(nodes);
  }, [state.nodes, state.selectedNode]);

  const nodes = localNodes;

  const edges: Edge[] = state.edges.map((edge) => ({
    ...edge,
    selected: state.selectedEdge === edge.id,
    animated: edge.type === "agentic",
    style: {
      strokeWidth: edge.selected ? 3 : 2,
      stroke: edge.selected
        ? "#0066ff"
        : edge.type === "agentic"
          ? "#0066ff"
          : "#6b7280",
      strokeDasharray: edge.type === "sequential" ? "5,5" : undefined,
    },
    markerEnd: {
      type: "arrowclosed",
      width: 20,
      height: 20,
      color: edge.selected
        ? "#0066ff"
        : edge.type === "agentic"
          ? "#0066ff"
          : "#6b7280",
    },
  }));

  const onNodesChange = useCallback(
    (changes: any[]) => {
      // Apply changes to local nodes immediately for smooth dragging
      setLocalNodes((nds) => applyNodeChanges(changes, nds));

      // Handle other change types and update global state
      changes.forEach((change: any) => {
        if (change.type === "position" && change.dragging === false) {
          // Update global state when dragging is complete
          if (change.position) {
            dispatch({
              type: "UPDATE_NODE_POSITION",
              payload: {
                id: change.id,
                position: change.position,
              },
            });
          }
        } else if (change.type === "select") {
          dispatch({
            type: "SELECT_NODE",
            payload: change.selected ? change.id : null,
          });
        } else if (change.type === "remove") {
          dispatch({
            type: "DELETE_NODE",
            payload: change.id,
          });
        }
      });
    },
    [dispatch]
  );

  const onEdgesChange = useCallback(
    (changes: any[]) => {
      changes.forEach((change: any) => {
        if (change.type === "select") {
          dispatch({
            type: "SELECT_EDGE",
            payload: change.selected ? change.id : null,
          });
        } else if (change.type === "remove") {
          dispatch({
            type: "DELETE_EDGE",
            payload: change.id,
          });
        }
      });
    },
    [dispatch]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newEdge: FlowEdge = {
          id: `edge-${params.source}-${params.target}`,
          source: params.source,
          target: params.target,
          type: "agentic", // Default to agentic, user can change in UI
        };

        dispatch({
          type: "ADD_EDGE",
          payload: newEdge,
        });
      }
    },
    [dispatch]
  );

  const [isDragOver, setIsDragOver] = React.useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOver(false);

      const nodeType = event.dataTransfer.getData(
        "application/reactflow"
      ) as NodeType;

      if (!nodeType || !reactFlowWrapper.current) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Smart positioning to prevent overlapping
      const finalPosition = { ...position };

      // Check for overlaps and adjust position (use local nodes for accuracy)
      const nodeWidth = 280; // Approximate node width
      const nodeHeight = 200; // Approximate node height
      const padding = 40; // Padding between nodes

      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        const hasOverlap = localNodes.some(
          (existingNode) =>
            Math.abs(existingNode.position.x - finalPosition.x) <
              nodeWidth + padding &&
            Math.abs(existingNode.position.y - finalPosition.y) <
              nodeHeight + padding
        );

        if (!hasOverlap) break;

        // Try different positions
        if (attempts < 10) {
          // First try moving right
          finalPosition.x += nodeWidth + padding;
        } else {
          // Then try moving down and reset x
          finalPosition.x = position.x;
          finalPosition.y += nodeHeight + padding;
        }
        attempts++;
      }

      const newNodeId = `${nodeType.toLowerCase()}-${Date.now()}`;
      const newNode: FlowNode = {
        id: newNodeId,
        type: nodeType,
        position: finalPosition,
        data: createDefaultNodeData(nodeType),
      } as FlowNode;

      dispatch({
        type: "ADD_NODE",
        payload: newNode,
      });
    },
    [screenToFlowPosition, dispatch, localNodes]
  );

  // Validate flow whenever nodes or edges change
  useEffect(() => {
    dispatch({ type: "VALIDATE_FLOW" });
  }, [state.nodes, state.edges, dispatch]);

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* Top Toolbar - Fixed Header */}
      <div className="h-14 flex-shrink-0 border-b border-gray-100 bg-white/95 backdrop-blur-sm z-50">
        <FlowToolbar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Node Palette */}
        <div className="w-72 flex-shrink-0 bg-gray-50/50 border-r border-gray-100 overflow-hidden">
          <NodePalette />
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-white">
          <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              nodesDraggable={true}
              nodesConnectable={true}
              elementsSelectable={true}
              panOnDrag={[1, 2]}
              selectionOnDrag={false}
              selectNodesOnDrag={false}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={false}
              panOnScroll={false}
              preventScrolling={true}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              attributionPosition="bottom-left"
              className={`w-full h-full transition-all duration-300 ${
                isDragOver
                  ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
                  : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
              }`}
              defaultEdgeOptions={{
                style: { strokeWidth: 2, stroke: "#0066ff" },
                type: "smoothstep",
                markerEnd: {
                  type: "arrowclosed",
                  width: 20,
                  height: 20,
                  color: "#0066ff",
                },
              }}
            >
              <Background
                variant={"dots" as any}
                gap={20}
                size={1}
                color="#d1d5db"
                className="opacity-60"
              />
              <Controls
                className="flex flex-col gap-2 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-2"
                showZoom={true}
                showFitView={true}
                showInteractive={false}
              />
              <MiniMap
                className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                nodeColor={(node) => {
                  const nodeData = state.nodes.find((n) => n.id === node.id);
                  const hasErrors =
                    nodeData && state.errors.some((e) => e.nodeId === node.id);
                  const isSelected = nodeData && state.selectedNode === node.id;
                  return hasErrors
                    ? "#ef4444"
                    : isSelected
                      ? "#0066ff"
                      : "#6b7280";
                }}
                nodeStrokeColor="#ffffff"
                nodeStrokeWidth={1}
                maskColor="rgba(255, 255, 255, 0.8)"
                zoomable
                pannable
                position="bottom-right"
              />
            </ReactFlow>

            {/* Status Panel - Only show if there are critical errors */}
            {!state.isValid && state.errors.length > 3 && (
              <div className="absolute bottom-4 right-4 bg-white border border-orange-200 rounded-lg shadow-sm p-3 max-w-[280px] z-10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-700">
                    {state.errors.length} issues to resolve
                  </span>
                </div>
                <p className="text-xs text-orange-600">
                  Fix errors to enable workflow execution
                </p>
              </div>
            )}

            {/* Selection Toolbar */}
            {(state.selectedNode || state.selectedEdge) && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg border border-gray-200 shadow-lg p-2 flex items-center gap-1 z-20">
                {state.selectedNode && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const node = state.nodes.find(
                          (n) => n.id === state.selectedNode
                        );
                        if (node) {
                          dispatch({
                            type: "ADD_NODE",
                            payload: {
                              id: `${node.type.toLowerCase()}-${Date.now()}`,
                              type: node.type,
                              position: {
                                x: node.position.x + 50,
                                y: node.position.y + 50,
                              },
                              data: {
                                ...node.data,
                                label: node.data.label + " Copy",
                              },
                            } as FlowNode,
                          });
                        }
                      }}
                      className="h-8 px-3 text-xs text-gray-600 hover:text-gray-900"
                    >
                      Duplicate
                    </Button>
                    <div className="w-px h-4 bg-gray-200" />
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (state.selectedNode) {
                      dispatch({
                        type: "DELETE_NODE",
                        payload: state.selectedNode,
                      });
                    } else if (state.selectedEdge) {
                      dispatch({
                        type: "DELETE_EDGE",
                        payload: state.selectedEdge,
                      });
                    }
                  }}
                  className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete
                </Button>
                <div className="w-px h-4 bg-gray-200" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    dispatch({ type: "SELECT_NODE", payload: null });
                    dispatch({ type: "SELECT_EDGE", payload: null });
                  }}
                  className="h-8 px-3 text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            )}

            {/* Empty State */}
            {state.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Start Building Your Workflow
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Drag agents from the left panel to create your workflow.
                    Connect them together to build powerful agent
                    orchestrations.
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 text-left">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      Quick Start:
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                        <span>Start with a Master Agent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                        <span>Add Execution Agents for tasks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full" />
                        <span>Connect agents with edges</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Node Configuration */}
        {state.selectedNode && (
          <div className="w-96 flex-shrink-0">
            <NodeConfigPanel />
          </div>
        )}
      </div>
    </div>
  );
}

function createDefaultNodeData(nodeType: NodeType): FlowNode["data"] {
  switch (nodeType) {
    case "MasterAgent":
      return {
        label: "Master Agent",
        model: { provider: "openai", model: "gpt-4" },
        tools: [],
        systemPrompt: "",
      };
    case "ExecutionAgent":
      return {
        label: "Execution Agent",
        model: { provider: "openai", model: "gpt-4" },
        capabilities: { browser: false, kernel: false },
        policies: { askUserOnAmbiguity: true },
        url: "",
        prompt: "",
      };
    case "RoutingAgent":
      return {
        label: "Routing Agent",
        model: { provider: "openai", model: "gpt-4" },
        classes: [],
      };
    case "DataCollectionAgent":
      return {
        label: "Data Collection Agent",
        schema: [],
        loopPrompt: "",
      };
    case "MailAgent":
      return {
        label: "Mail Agent",
        config: { fromName: "", subject: "" },
      };
    default:
      throw new Error(`Unknown node type: ${nodeType}`);
  }
}

export function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner />
    </ReactFlowProvider>
  );
}
