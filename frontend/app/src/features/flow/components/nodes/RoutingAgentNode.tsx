import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitBranch, Settings, Trash2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';

interface RoutingAgentData {
  model: any;
  classes: string[];
  prompt?: string;
  label: string;
}

interface RoutingAgentNodeProps extends NodeProps {
  onDelete?: (nodeId: string) => void;
  onEdit?: (nodeId: string) => void;
}

export function RoutingAgentNode({ id, data, selected, onDelete, onEdit }: RoutingAgentNodeProps) {
  const nodeData = data as unknown as RoutingAgentData;
  const classes = nodeData.classes || [];
  
  // Calculate positions for multiple output handles
  const getOutputHandlePosition = (index: number, total: number) => {
    if (total <= 1) {
      return { top: '50%', transform: 'translateY(-50%)' };
    }
    
    const spacing = Math.min(60, 200 / Math.max(total - 1, 1));
    const startY = 50 - (spacing * (total - 1)) / 2;
    const y = startY + (spacing * index);
    
    return {
      top: `${Math.max(20, Math.min(80, y))}%`,
      transform: 'translateY(-50%)'
    };
  };
  
  return (
    <div className="relative">
      <Card className={`min-w-[320px] max-w-[400px] ${
        selected ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-md'
      } bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 hover:shadow-lg transition-all duration-200`}>
        <CardHeader className="pb-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-t-lg">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-600 rounded-lg">
                <GitBranch className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">{nodeData.label}</div>
                <div className="text-xs text-gray-600 font-normal">Routes based on classification</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-white/70 rounded-md"
                onClick={() => onEdit?.(id)}
              >
                <Settings className="h-3.5 w-3.5 text-gray-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-red-100 rounded-md"
                onClick={() => onDelete?.(id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1.5">Model</div>
              <div className="text-sm bg-white px-2 py-1 rounded border text-gray-800">
                {typeof nodeData.model === 'object' ? nodeData.model.model || 'gpt-4' : nodeData.model || 'gpt-4'}
              </div>
            </div>
            
            {nodeData.prompt && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1.5">Routing Logic</div>
                <div className="text-xs bg-white p-2 rounded border text-gray-700 line-clamp-2">
                  {nodeData.prompt.length > 80 ? `${nodeData.prompt.substring(0, 80)}...` : nodeData.prompt}
                </div>
              </div>
            )}
            
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Output Classes ({classes.length})</div>
              <div className="space-y-2">
                {classes.length > 0 ? (
                  <div className="grid gap-1.5">
                    {classes.map((cls: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 bg-white px-2 py-1.5 rounded border group hover:bg-purple-50 transition-colors">
                        <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800 border-purple-200">
                          {index + 1}
                        </Badge>
                        <span className="text-sm text-gray-800 flex-1 truncate" title={cls}>
                          {cls || `Class ${index + 1}`}
                        </span>
                        <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-purple-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded border-2 border-dashed border-gray-200 text-center">
                    No classes configured
                    <div className="text-xs text-gray-400 mt-1">Add classes to enable routing</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="w-4 h-4 bg-purple-600 border-2 border-white shadow-lg hover:w-5 hover:h-5 hover:bg-purple-700 transition-all duration-200 cursor-crosshair"
        style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
      />
      
      {/* Dynamic Output Handles for each class */}
      {classes.length > 0 ? (
        classes.map((cls: string, index: number) => {
          const position = getOutputHandlePosition(index, classes.length);
          return (
            <Handle
              key={`output-${index}`}
              type="source"
              position={Position.Right}
              id={`output-${index}`}
              className="w-4 h-4 bg-purple-600 border-2 border-white shadow-lg hover:w-5 hover:h-5 hover:bg-purple-700 transition-all duration-200 cursor-crosshair"
              style={{ 
                right: -8, 
                ...position,
                zIndex: 10
              }}
            />
          );
        })
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="output-default"
          className="w-4 h-4 bg-gray-400 border-2 border-white shadow-lg transition-all duration-200"
          style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
        />
      )}
      
      {/* Class labels next to handles */}
      {classes.length > 1 && classes.map((cls: string, index: number) => {
        const position = getOutputHandlePosition(index, classes.length);
        return (
          <div
            key={`label-${index}`}
            className="absolute right-2 text-xs bg-white px-2 py-0.5 rounded shadow border text-gray-700 pointer-events-none whitespace-nowrap"
            style={{
              ...position,
              transform: 'translateY(-50%)',
              zIndex: 5
            }}
          >
            {cls || `Class ${index + 1}`}
          </div>
        );
      })}
    </div>
  );
} 