import React, { useCallback, useEffect, useRef } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useFlow } from '@/contexts/FlowContext';
import { FlowNode, FlowEdge, NodeType } from '@/lib/types/flow';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { NodePalette } from './NodePalette';
import { FlowToolbar } from './FlowToolbar';
import { NodeConfigPanel } from './NodeConfigPanel';
import { MasterAgentNode } from '../nodes/MasterAgentNode';
import { ExecutionAgentNode } from '../nodes/ExecutionAgentNode';
import { RoutingAgentNode } from '../nodes/RoutingAgentNode';
import { DataCollectionAgentNode } from '../nodes/DataCollectionAgentNode';
import { MailAgentNode } from '../nodes/MailAgentNode';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Brain } from 'lucide-react';

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

  // Convert our types to ReactFlow types
  const nodes: Node[] = state.nodes.map(node => ({
    ...node,
    selected: state.selectedNode === node.id,
  }));

  const edges: Edge[] = state.edges.map(edge => ({
    ...edge,
    selected: state.selectedEdge === edge.id,
    animated: edge.type === 'sequential',
    style: {
      strokeWidth: 2,
      stroke: edge.type === 'agentic' ? 'var(--accent-primary)' : 'var(--text-secondary)',
    },
  }));

  const onNodesChange = useCallback((changes: any[]) => {
    // Handle node position changes
    changes.forEach((change: any) => {
      if (change.type === 'position' && change.dragging === false) {
        const node = state.nodes.find(n => n.id === change.id);
        if (node) {
          dispatch({
            type: 'UPDATE_NODE',
            payload: {
              id: change.id,
              data: {
                ...node.data,
              },
            },
          });
        }
      } else if (change.type === 'select') {
        dispatch({
          type: 'SELECT_NODE',
          payload: change.selected ? change.id : null,
        });
      } else if (change.type === 'remove') {
        dispatch({
          type: 'DELETE_NODE',
          payload: change.id,
        });
      }
    });
  }, [state.nodes, dispatch]);

  const onEdgesChange = useCallback((changes: any[]) => {
    changes.forEach((change: any) => {
      if (change.type === 'select') {
        dispatch({
          type: 'SELECT_EDGE',
          payload: change.selected ? change.id : null,
        });
      } else if (change.type === 'remove') {
        dispatch({
          type: 'DELETE_EDGE',
          payload: change.id,
        });
      }
    });
  }, [dispatch]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      const newEdge: FlowEdge = {
        id: `edge-${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: 'agentic', // Default to agentic, user can change in UI
      };

      dispatch({
        type: 'ADD_EDGE',
        payload: newEdge,
      });
    }
  }, [dispatch]);

  const [isDragOver, setIsDragOver] = React.useState(false);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
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

      const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
      
      if (!nodeType || !reactFlowWrapper.current) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Smart positioning to prevent overlapping
      let finalPosition = { ...position };
      
      // Check for overlaps and adjust position
      const nodeWidth = 280; // Approximate node width
      const nodeHeight = 200; // Approximate node height
      const padding = 40; // Padding between nodes
      
      let attempts = 0;
      const maxAttempts = 20;
      
      while (attempts < maxAttempts) {
        const hasOverlap = state.nodes.some(existingNode => 
          Math.abs(existingNode.position.x - finalPosition.x) < nodeWidth + padding &&
          Math.abs(existingNode.position.y - finalPosition.y) < nodeHeight + padding
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
        type: 'ADD_NODE',
        payload: newNode,
      });
    },
    [screenToFlowPosition, dispatch, state.nodes]
  );

  // Validate flow whenever nodes or edges change
  useEffect(() => {
    dispatch({ type: 'VALIDATE_FLOW' });
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
          <div 
            className="w-full h-full" 
            ref={reactFlowWrapper}
          >
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
            fitView
            attributionPosition="bottom-left"
            className={`w-full h-full transition-all duration-300 ${
              isDragOver 
                ? 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50' 
                : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
            }`}
            defaultEdgeOptions={{
              style: { strokeWidth: 2, stroke: '#6b7280' },
              type: 'smoothstep',
            }}
          >
            <Background 
              variant={'dots' as any}
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
              className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg overflow-hidden"
              nodeColor={(node) => {
                const nodeData = state.nodes.find(n => n.id === node.id);
                const hasErrors = nodeData && state.errors.some(e => e.nodeId === node.id);
                return hasErrors ? '#ef4444' : '#3b82f6';
              }}
              nodeStrokeColor="#ffffff"
              nodeStrokeWidth={2}
              maskColor="rgba(255, 255, 255, 0.9)"
              zoomable
              pannable
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

          {/* Empty State */}
          {state.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 bg-black rounded-2xl flex items-center justify-center">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Start Building Your Workflow
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Drag agents from the left panel to create your workflow. Connect them together to build powerful agent orchestrations.
                </p>
                <div className="bg-gray-100 rounded-lg p-4 text-left">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Quick Start:</h4>
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

function createDefaultNodeData(nodeType: NodeType): FlowNode['data'] {
  switch (nodeType) {
    case 'MasterAgent':
      return {
        label: 'Master Agent',
        model: { provider: 'openai', model: 'gpt-4' },
        tools: [],
        systemPrompt: '',
      };
    case 'ExecutionAgent':
      return {
        label: 'Execution Agent',
        model: { provider: 'openai', model: 'gpt-4' },
        capabilities: { browser: false, kernel: false },
        policies: { askUserOnAmbiguity: true },
        url: '',
        prompt: '',
      };
    case 'RoutingAgent':
      return {
        label: 'Routing Agent',
        model: { provider: 'openai', model: 'gpt-4' },
        classes: [],
      };
    case 'DataCollectionAgent':
      return {
        label: 'Data Collection Agent',
        schema: [],
        loopPrompt: '',
      };
    case 'MailAgent':
      return {
        label: 'Mail Agent',
        config: { fromName: '', subject: '' },
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