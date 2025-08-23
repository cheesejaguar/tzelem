import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Mail, Settings, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

interface MailAgentData {
  config: { fromName: string; subject: string };
}

interface MailAgentNodeProps extends NodeProps {
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
}

export function MailAgentNode({ id, data, selected, onDelete, onEdit }: MailAgentNodeProps) {
  const nodeData = data as unknown as MailAgentData;
  
  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-[var(--accent-primary)]' : ''} bg-red-50 border-red-200`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Mail className="icon text-red-600" />
            Mail Agent
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
          <div className="label text-[var(--text-tertiary)] mb-1">From Name</div>
          <div className="body-small">{nodeData.config?.fromName || 'Not configured'}</div>
        </div>
        
        <div>
          <div className="label text-[var(--text-tertiary)] mb-1">Subject</div>
          <div className="body-small">{nodeData.config?.subject || 'Not configured'}</div>
        </div>
      </CardContent>
      
      <Handle
        type="target"
        position={Position.Left}
        className="w-5 h-5 bg-red-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-red-600 transition-all duration-200 cursor-crosshair"
        style={{ left: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-5 h-5 bg-red-500 border-3 border-white shadow-lg hover:w-6 hover:h-6 hover:bg-red-600 transition-all duration-200 cursor-crosshair"
        style={{ right: -10, top: '50%', transform: 'translateY(-50%)' }}
      />
    </Card>
  );
} 