import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cpu, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface ExecutionAgentData {
  model: string;
  capabilities: { browser: boolean; kernel: boolean };
  policies: { askUserOnAmbiguity: boolean };
}

interface ExecutionAgentNodeProps extends NodeProps {
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
}

export function ExecutionAgentNode({ id, data, selected, onDelete, onEdit }: ExecutionAgentNodeProps) {
  const nodeData = data as unknown as ExecutionAgentData;
  
  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-[var(--accent-primary)]' : ''} bg-green-50 border-green-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Cpu className="icon text-green-600" />
            Execution Agent
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
          <div className="body-small">{nodeData.model || 'gpt-4'}</div>
        </div>
        
        <div>
          <div className="label text-[var(--text-tertiary)] mb-1">Capabilities</div>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs ${
              nodeData.capabilities?.browser 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              Browser
            </span>
            <span className={`px-2 py-1 rounded text-xs ${
              nodeData.capabilities?.kernel 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-500'
            }`}>
              Kernel
            </span>
          </div>
        </div>
        
        <div>
          <div className="label text-[var(--text-tertiary)] mb-1">Policies</div>
          <div className="caption text-[var(--text-secondary)]">
            Ask on ambiguity: {nodeData.policies?.askUserOnAmbiguity ? 'Yes' : 'No'}
          </div>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-green-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-green-600 transition-all duration-200 cursor-crosshair"
        style={{ left: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-green-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-green-600 transition-all duration-200 cursor-crosshair"
        style={{ right: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
    </Card>
  );
} 