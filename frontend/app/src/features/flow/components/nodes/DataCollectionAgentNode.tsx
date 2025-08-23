import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Database, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface DataCollectionAgentData {
  schema: Array<{ field: string; type: string; required: boolean }>;
  loopPrompt: string;
}

interface DataCollectionAgentNodeProps extends NodeProps {
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
}

export function DataCollectionAgentNode({ id, data, selected, onDelete, onEdit }: DataCollectionAgentNodeProps) {
  const nodeData = data as unknown as DataCollectionAgentData;
  
  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-[var(--accent-primary)]' : ''} bg-orange-50 border-orange-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Database className="icon text-orange-600" />
            Data Collection Agent
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
          <div className="label text-[var(--text-tertiary)] mb-1">Schema Fields</div>
          <div className="caption text-[var(--text-secondary)]">
            {nodeData.schema && nodeData.schema.length > 0 
              ? `${nodeData.schema.length} fields configured`
              : 'No schema configured'
            }
          </div>
        </div>
        
        <div>
          <div className="label text-[var(--text-tertiary)] mb-1">Loop Prompt</div>
          <div className="caption text-[var(--text-secondary)] line-clamp-2">
            {nodeData.loopPrompt || 'No prompt configured'}
          </div>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-orange-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-orange-600 transition-all duration-200 cursor-crosshair"
        style={{ left: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-orange-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-orange-600 transition-all duration-200 cursor-crosshair"
        style={{ right: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
    </Card>
  );
} 