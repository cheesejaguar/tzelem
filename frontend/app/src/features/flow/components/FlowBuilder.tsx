import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type NodeProps,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NodePalette } from './NodePalette';
import { MasterAgentNode } from './nodes/MasterAgentNode';
import { ExecutionAgentNode } from './nodes/ExecutionAgentNode';
import { RoutingAgentNode } from './nodes/RoutingAgentNode';
import { DataCollectionAgentNode } from './nodes/DataCollectionAgentNode';
import { MailAgentNode } from './nodes/MailAgentNode';
import { validateFlow, isFlowValid } from '../utils/validation';
import { exportFlow, downloadFlow } from '../utils/export';
import { type ValidationError } from '../types';



const initialNodes: Node[] = [
  {
    id: 'master-1',
    type: 'masterAgent',
    position: { x: 100, y: 100 },
    data: {
      model: 'gpt-4',
      tools: ['web_search', 'calculator', 'email'],
      systemPrompt: 'You are a master agent that coordinates other agents to complete complex tasks efficiently.',
      subagents: ['Research Assistant', 'Data Processor'],
    },
  },
  {
    id: 'execution-1',
    type: 'executionAgent',
    position: { x: 500, y: 100 },
    data: {
      model: 'gpt-4',
      capabilities: { browser: true, kernel: true },
      policies: { askUserOnAmbiguity: true },
    },
  },
  {
    id: 'routing-1',
    type: 'routingAgent',
    position: { x: 100, y: 300 },
    data: {
      model: 'gpt-4',
      classes: ['support', 'sales', 'technical'],
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'master-1',
    target: 'execution-1',
    type: 'default',
  },
  {
    id: 'e1-3',
    source: 'master-1',
    target: 'routing-1',
    type: 'default',
  },
];

export function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [flowName] = useState('My Workflow');

  // Validate flow whenever nodes or edges change
  useEffect(() => {
    const errors = validateFlow(nodes, edges);
    setValidationErrors(errors);
    }, [nodes, edges]);

  const handleExportFlow = useCallback(() => {
    const flowData = exportFlow(nodes, edges, flowName);
    downloadFlow(flowData);
  }, [nodes, edges, flowName]);

  const handleAddNode = useCallback((type: string) => {
    const position = {
      x: Math.random() * 400 + 100,
      y: Math.random() * 400 + 100,
    };

    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: getDefaultNodeData(type),
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleEditNode = useCallback((nodeId: string) => {
    // TODO: Open node configuration panel
    console.log('Edit node:', nodeId);
  }, []);

  const handleAddSubagent = useCallback((masterNodeId: string) => {
    setNodes((nds) => nds.map(node => {
      if (node.id === masterNodeId && node.type === 'masterAgent') {
        const currentSubagents = (node.data as Record<string, unknown>).subagents as string[] || [];
        return {
          ...node,
          data: {
            ...node.data,
            subagents: [...currentSubagents, `Subagent ${currentSubagents.length + 1}`]
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Create node components with handlers
  const nodeTypes: NodeTypes = {
    masterAgent: (props: NodeProps) => (
      <MasterAgentNode 
        {...props} 
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
        onAddSubagent={handleAddSubagent}
      />
    ),
    executionAgent: (props: NodeProps) => (
      <ExecutionAgentNode 
        {...props} 
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
      />
    ),
    routingAgent: (props: NodeProps) => (
      <RoutingAgentNode 
        {...props} 
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
      />
    ),
    dataCollectionAgent: (props: NodeProps) => (
      <DataCollectionAgentNode 
        {...props} 
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
      />
    ),
    mailAgent: (props: NodeProps) => (
      <MailAgentNode 
        {...props} 
        onDelete={handleDeleteNode}
        onEdit={handleEditNode}
      />
    ),
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedNodes = nodes.filter(node => node.selected);
        selectedNodes.forEach(node => {
          handleDeleteNode(node.id);
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nodes, handleDeleteNode]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = {
        x: event.clientX - 250,
        y: event.clientY - 100,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: getDefaultNodeData(type),
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const getDefaultNodeData = (type: string) => {
    switch (type) {
              case 'masterAgent':
        return {
          model: 'gpt-4',
          tools: ['web_search', 'calculator'],
          systemPrompt: 'You are a master agent that coordinates other agents to complete complex tasks.',
          subagents: [],
        };
      case 'executionAgent':
        return {
          model: 'gpt-4',
          capabilities: { browser: false, kernel: false },
          policies: { askUserOnAmbiguity: true },
        };
      case 'routingAgent':
        return {
          model: 'gpt-4',
          classes: [],
        };
      case 'dataCollectionAgent':
        return {
          schema: [],
          loopPrompt: 'Please provide the required information.',
        };
      case 'mailAgent':
        return {
          config: { fromName: '', subject: '' },
        };
      default:
        return {};
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)]">
      <NodePalette
        selectedNodeType={selectedNodeType}
        onNodeTypeSelect={setSelectedNodeType}
        onAddNode={handleAddNode}
      />

      {/* Flow Canvas */}
      <div className="flex-1 bg-[var(--bg-secondary)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[var(--bg-secondary)]"
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{
            strokeWidth: 3,
            stroke: 'var(--accent-primary)',
          }}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#64748b' },
          }}
        >
          <Background color="var(--border-primary)" gap={20} />
          <Controls className="bg-[var(--bg-elevated)] border border-[var(--border-primary)]" />
          <MiniMap
            className="bg-[var(--bg-elevated)] border border-[var(--border-primary)]"
            nodeColor="var(--accent-primary)"
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Validation Panel */}
      {validationErrors.length > 0 && (
        <div className="absolute bottom-4 right-4 w-80 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg p-4 shadow-lg">
          <h3 className="body-medium font-semibold mb-2">Validation Issues</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className={`p-2 rounded text-sm ${
                  error.type === 'error' 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                }`}
              >
                {error.message}
                {error.nodeId && (
                  <div className="text-xs opacity-70 mt-1">Node: {error.nodeId}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flow Controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => {
            setNodes([]);
            setEdges([]);
          }}
          className="btn-secondary text-sm"
        >
          Clear All
        </button>
        <button
          onClick={handleExportFlow}
          className="btn-primary text-sm"
          disabled={!isFlowValid(validationErrors)}
        >
          Export Flow ({nodes.length} nodes)
        </button>
      </div>

      {/* Flow Stats */}
      <div className="absolute bottom-4 left-4 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg p-3 shadow-lg">
        <div className="text-sm font-semibold mb-1">Flow Statistics</div>
        <div className="space-y-1 text-xs text-[var(--text-secondary)]">
          <div>Nodes: {nodes.length}</div>
          <div>Connections: {edges.length}</div>
          <div>Status: {isFlowValid(validationErrors) ? '✅ Valid' : '❌ Invalid'}</div>
        </div>
      </div>

      {/* Connection Help */}
      <div className="absolute bottom-4 right-4 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-lg p-3 shadow-lg max-w-xs">
        <div className="text-sm font-semibold mb-1">💡 Connection Tips</div>
        <div className="space-y-1 text-xs text-[var(--text-secondary)]">
          <div>• Hover over nodes to see connection handles</div>
          <div>• Drag from ⚫ (output) to ⚫ (input) to connect</div>
          <div>• Handles grow larger when you hover over them</div>
          <div>• Press Delete to remove selected nodes/edges</div>
        </div>
      </div>
    </div>
  );
} 