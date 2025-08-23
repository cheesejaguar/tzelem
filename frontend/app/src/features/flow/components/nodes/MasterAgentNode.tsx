import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Brain, Settings, Trash2, Plus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface MasterAgentData {
  model: string;
  tools: string[];
  systemPrompt: string;
  subagents?: string[];
}

interface MasterAgentNodeProps extends NodeProps {
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
  onAddSubagent?: (nodeId: string) => void;
}

export function MasterAgentNode({ id, data, selected, onDelete, onEdit, onAddSubagent }: MasterAgentNodeProps) {
  const nodeData = data as unknown as MasterAgentData;
  return (
    <Card className={`min-w-[320px] ${selected ? 'ring-2 ring-[var(--accent-primary)]' : ''} bg-blue-50 border-blue-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Brain className="icon text-blue-600" />
            Master Agent
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-white/50"
              onClick={() => onEdit?.(id)}
            >
              <Settings className="h-3 w-3 text-[var(--text-tertiary)]" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-100"
              onClick={() => onDelete?.(id)}
            >
              <Trash2 className="h-3 w-3 text-red-500" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div>
          <div className="label text-[var(--text-tertiary)] mb-1">Model</div>
          <div className="body-small">{nodeData.model}</div>
        </div>
        
        <div>
          <div className="label text-[var(--text-tertiary)] mb-1">Tools</div>
          <div className="flex flex-wrap gap-1">
            {nodeData.tools && nodeData.tools.length > 0 ? (
              nodeData.tools.map((tool: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded text-xs"
                >
                  {tool}
                </span>
              ))
            ) : (
              <span className="caption text-[var(--text-tertiary)]">No tools configured</span>
            )}
          </div>
        </div>
        
        <div>
          <div className="label text-[var(--text-tertiary)] mb-1">System Prompt</div>
          <div className="caption text-[var(--text-secondary)] line-clamp-2">
            {nodeData.systemPrompt}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="label text-[var(--text-tertiary)]">Subagents</div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-blue-100"
              onClick={() => onAddSubagent?.(id)}
            >
              <Plus className="h-3 w-3 text-blue-600" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {nodeData.subagents && nodeData.subagents.length > 0 ? (
              nodeData.subagents.map((subagent: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1"
                >
                  <Users className="h-2 w-2" />
                  {subagent}
                </span>
              ))
            ) : (
              <span className="caption text-[var(--text-tertiary)] flex items-center gap-1">
                <Users className="h-3 w-3" />
                No subagents configured
              </span>
            )}
          </div>
        </div>
      </CardContent>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-blue-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-blue-600 transition-all duration-200 cursor-crosshair"
        style={{ left: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-blue-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-blue-600 transition-all duration-200 cursor-crosshair"
        style={{ right: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
    </Card>
  );
} 