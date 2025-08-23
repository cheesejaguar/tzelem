import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertCircle } from 'lucide-react';

export interface BaseNodeProps {
  id: string;
  data: {
    label: string;
    [key: string]: any;
  };
  selected?: boolean;
  isConnectable?: boolean;
  type: string;
}

interface BaseNodeComponentProps extends BaseNodeProps {
  icon: React.ReactNode;
  color: string;
  children?: React.ReactNode;
  hasErrors?: boolean;
}

export function BaseNode({ 
  data, 
  selected, 
  isConnectable = true, 
  icon, 
  color, 
  children, 
  hasErrors = false,
  type,
  id
}: BaseNodeComponentProps) {
  return (
    <div 
      className="relative group"
      role="article"
      aria-labelledby={`node-title-${id}`}
      aria-describedby={hasErrors ? `node-errors-${id}` : undefined}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="group w-6 h-6 !bg-[var(--accent-primary)] !border-3 !border-white hover:!bg-blue-700 hover:scale-110 transition-all duration-200 shadow-lg cursor-crosshair relative"
        style={{
          left: -12,
          zIndex: 30,
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
        }}
        aria-label="Input connection point"
      >
        {/* Inner highlight */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      </Handle>

      {/* Node Card */}
      <div 
        className={`
          min-w-[240px] max-w-[320px] bg-white rounded-lg border transition-all duration-200
          ${selected 
            ? 'border-blue-600 shadow-lg ring-2 ring-blue-600/20 scale-[1.02]' 
            : hasErrors
              ? 'border-red-300 bg-red-50/50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
          }
        `}
        tabIndex={0}
        role="button"
        aria-pressed={selected}
        aria-invalid={hasErrors}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="p-2.5 rounded-lg flex-shrink-0"
              style={{ 
                backgroundColor: hasErrors ? '#fef2f2' : color + '15',
                color: hasErrors ? '#ef4444' : color,
              }}
            >
              {hasErrors ? <AlertCircle className="w-4 h-4" /> : icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                id={`node-title-${id}`}
                className={`
                  font-medium text-sm truncate mb-1
                  ${hasErrors ? 'text-red-700' : 'text-gray-900'}
                `}
              >
                {data.label}
              </h3>
              <div className={`
                text-xs px-2 py-1 rounded-full inline-flex items-center gap-1
                ${hasErrors 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {hasErrors && <AlertCircle className="w-3 h-3" />}
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className={hasErrors ? 'opacity-75' : ''}>
            {children}
          </div>
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="group w-6 h-6 !bg-[var(--accent-primary)] !border-3 !border-white hover:!bg-blue-700 hover:scale-110 transition-all duration-200 shadow-lg cursor-crosshair relative"
        style={{
          right: -12,
          zIndex: 30,
          borderRadius: '50%',
          boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)'
        }}
        aria-label="Output connection point"
      >
        {/* Inner highlight */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
      </Handle>
    </div>
  );
}