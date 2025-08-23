import { Brain, Cpu, GitBranch, Database, Mail, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

interface NodePaletteProps {
  selectedNodeType: string | null;
  onNodeTypeSelect: (type: string | null) => void;
  onAddNode: (type: string) => void;
}

const nodeTypes = [
  {
    type: 'masterAgent',
    label: 'Master Agent',
    icon: Brain,
    description: 'Coordinates other agents and manages the overall workflow',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    borderColor: 'border-blue-200',
  },
  {
    type: 'executionAgent',
    label: 'Execution Agent',
    icon: Cpu,
    description: 'Executes code and performs computational tasks',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    borderColor: 'border-green-200',
  },
  {
    type: 'routingAgent',
    label: 'Routing Agent',
    icon: GitBranch,
    description: 'Routes requests based on classification',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    borderColor: 'border-purple-200',
  },
  {
    type: 'dataCollectionAgent',
    label: 'Data Collection Agent',
    icon: Database,
    description: 'Collects and validates user input data',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    borderColor: 'border-orange-200',
  },
  {
    type: 'mailAgent',
    label: 'Mail Agent',
    icon: Mail,
    description: 'Sends emails and manages communication',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    borderColor: 'border-red-200',
  },
];

export function NodePalette({ selectedNodeType, onNodeTypeSelect, onAddNode }: NodePaletteProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    onNodeTypeSelect(nodeType);
  };

  const handleAddNode = (nodeType: string) => {
    onAddNode(nodeType);
    onNodeTypeSelect(nodeType);
  };

  return (
    <div className="w-80 bg-[var(--bg-primary)] border-r border-[var(--border-primary)] p-6 overflow-y-auto">
      <div className="mb-6">
        <h2 className="display-small mb-2">Node Palette</h2>
        <p className="body-small text-[var(--text-secondary)]">
          Drag nodes to canvas or click the + button to add them
        </p>
      </div>

      <div className="space-y-3">
        {nodeTypes.map((node) => {
          const Icon = node.icon;
          const isSelected = selectedNodeType === node.type;

          return (
            <Card
              key={node.type}
              className={`cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md border ${
                isSelected 
                  ? `ring-2 ring-[var(--accent-primary)] ${node.borderColor}` 
                  : `${node.borderColor} hover:${node.borderColor}`
              } ${node.bgColor}`}
              draggable
              onDragStart={(event: React.DragEvent) => onDragStart(event, node.type)}
              onClick={() => onNodeTypeSelect(isSelected ? null : node.type)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-3">
                    <Icon className={`icon ${node.color}`} />
                    {node.label}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-white/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddNode(node.type);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <p className="caption text-[var(--text-tertiary)]">
                  {node.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-[var(--bg-secondary)] rounded-lg">
        <h3 className="body-medium font-semibold mb-2">Quick Tips</h3>
        <ul className="caption text-[var(--text-secondary)] space-y-1">
          <li>• Drag nodes to the canvas</li>
          <li>• Click + to add nodes quickly</li>
          <li>• Connect nodes by dragging from handles</li>
          <li>• Click nodes to configure them</li>
          <li>• Press Delete to remove selected nodes</li>
        </ul>
      </div>
    </div>
  );
} 