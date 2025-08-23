import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { GitBranch, AlertCircle, ArrowRight } from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';
import { BaseNodeProps } from './BaseNode';

export function RoutingAgentNode(props: BaseNodeProps) {
  const { state } = useFlow();
  const nodeErrors = state.errors.filter(e => e.nodeId === props.id);
  const hasErrors = nodeErrors.length > 0;
  const classes = props.data.classes || [];
  const model = props.data.model;
  const prompt = props.data.prompt;

  // Calculate positions for multiple output handles with better spacing
  const getOutputHandlePosition = (index: number, total: number) => {
    if (total <= 1) {
      return { top: '50%' };
    }
    
    // Ensure minimum spacing between handles
    const minSpacing = 30;
    const maxSpacing = 50;
    const availableHeight = 160; // pixels available for handles
    
    const spacing = Math.min(maxSpacing, Math.max(minSpacing, availableHeight / Math.max(total - 1, 1)));
    
    // Calculate starting position to center the handles
    const totalHeight = (total - 1) * spacing;
    const startOffset = (availableHeight - totalHeight) / 2;
    
    const yPixels = startOffset + (index * spacing) + 80; // 80px offset from top
    
    return {
      top: `${yPixels}px`
    };
  };

  return (
    <div 
      className="relative group"
      role="article"
      aria-labelledby={`node-title-${props.id}`}
      aria-describedby={hasErrors ? `node-errors-${props.id}` : undefined}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        isConnectable={props.isConnectable !== false}
        className="group w-7 h-7 !bg-[var(--accent-primary)] !border-3 !border-white hover:!bg-blue-700 hover:scale-110 transition-all duration-200 shadow-lg cursor-crosshair relative"
        style={{ 
          left: -14, 
          top: '50%', 
          transform: 'translateY(-50%)', 
          zIndex: 30, 
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
        }}
        aria-label="Input connection point"
      >
        {/* Inner highlight */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
        {/* Magnetic ring effect */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
      </Handle>

      {/* Node Card */}
      <div 
        className={`
          min-w-[300px] max-w-[380px] bg-white rounded-lg border transition-all duration-200
          ${props.selected 
            ? 'border-purple-600 shadow-lg ring-2 ring-purple-600/20 scale-[1.02]' 
            : hasErrors
              ? 'border-red-300 bg-red-50/50 shadow-sm'
              : 'border-purple-200 hover:border-purple-300 hover:shadow-md hover:scale-[1.01] bg-gradient-to-br from-purple-50 to-indigo-50'
          }
        `}
        tabIndex={0}
        role="button"
        aria-pressed={props.selected}
        aria-invalid={hasErrors}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className={`p-2.5 rounded-lg flex-shrink-0 ${
                hasErrors ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-700'
              }`}
            >
              {hasErrors ? <AlertCircle className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                id={`node-title-${props.id}`}
                className={`
                  font-semibold text-sm truncate mb-1
                  ${hasErrors ? 'text-red-700' : 'text-gray-900'}
                `}
              >
                {props.data.label}
              </h3>
              <div className={`
                text-xs px-2 py-1 rounded-full inline-flex items-center gap-1
                ${hasErrors 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-purple-100/80 text-purple-700'
                }
              `}>
                {hasErrors && <AlertCircle className="w-3 h-3" />}
                Routes based on classification
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={`space-y-3 ${hasErrors ? 'opacity-75' : ''}`}>
            {/* Model Info */}
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="text-xs text-gray-600 mb-1 font-medium">Model</div>
              <div className="text-sm font-mono">
                {typeof model === 'object' ? model?.model || 'gpt-4' : model || 'gpt-4'}
              </div>
            </div>

            {/* Prompt Preview */}
            {prompt && (
              <div className="bg-blue-50 rounded-lg p-2">
                <div className="text-xs text-blue-700 mb-1 font-medium">Routing Logic</div>
                <div className="text-xs text-blue-800 line-clamp-2">
                  {prompt.length > 60 ? `${prompt.substring(0, 60)}...` : prompt}
                </div>
              </div>
            )}

            {/* Classes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-600 font-medium">Output Routes ({classes.length})</span>
                <Badge variant="secondary" className="text-xs">
                  {classes.length} classes
                </Badge>
              </div>
              
              {classes.length > 0 ? (
                <div className="space-y-1">
                  {classes.slice(0, 4).map((className: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 bg-white px-2 py-1 rounded border text-xs group hover:bg-purple-50">
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 text-xs px-1.5 py-0.5">
                        {i + 1}
                      </Badge>
                      <span className="flex-1 truncate" title={className}>
                        {className || `Class ${i + 1}`}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-purple-600" />
                    </div>
                  ))}
                  {classes.length > 4 && (
                    <div className="text-xs text-gray-500 text-center py-1">
                      +{classes.length - 4} more classes
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded border-2 border-dashed border-gray-200 text-center">
                  No classes configured
                  <div className="text-xs text-gray-400 mt-1">Add classes to enable routing</div>
                </div>
              )}
            </div>

            {/* Errors */}
            {hasErrors && (
              <div id={`node-errors-${props.id}`} className="pt-2 border-t border-red-200 bg-red-50 -mx-4 -mb-4 px-4 pb-4 rounded-b-lg">
                {nodeErrors.slice(0, 2).map((error, i) => (
                  <div key={i} className="text-red-700 text-xs flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {error.message}
                  </div>
                ))}
                {nodeErrors.length > 2 && (
                  <div className="text-red-700 text-xs">
                    +{nodeErrors.length - 2} more issues
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
              isConnectable={props.isConnectable !== false}
              className="group w-7 h-7 !bg-[var(--accent-primary)] !border-3 !border-white hover:!bg-blue-700 hover:scale-110 transition-all duration-200 shadow-lg cursor-crosshair relative"
              style={{ 
                right: -14, 
                ...position,
                transform: 'translateY(-50%)',
                zIndex: 30,
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
              }}
              aria-label={`Output for class: ${cls || `Class ${index + 1}`}`}
            >
              {/* Inner highlight */}
              <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              {/* Magnetic ring effect */}
              <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 pointer-events-none" />
            </Handle>
          );
        })
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          id="output-default"
          isConnectable={false}
          className="w-7 h-7 !bg-[var(--text-tertiary)] !border-3 !border-white cursor-not-allowed opacity-50"
          style={{ 
            right: -14, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}
          aria-label="No classes configured - cannot connect"
        />
      )}
      
      {/* Class labels next to handles - only show for multiple classes */}
      {classes.length > 1 && classes.map((cls: string, index: number) => {
        const position = getOutputHandlePosition(index, classes.length);
        return (
          <div
            key={`label-${index}`}
            className="absolute text-xs bg-white text-purple-800 px-2 py-0.5 rounded-md shadow-sm border border-purple-200/80 pointer-events-none whitespace-nowrap font-medium"
            style={{
              right: '24px',
              ...position,
              transform: 'translateY(-50%)',
              zIndex: 15
            }}
          >
            {cls.length > 12 ? `${cls.substring(0, 12)}...` : cls || `Class ${index + 1}`}
          </div>
        );
      })}
    </div>
  );
}