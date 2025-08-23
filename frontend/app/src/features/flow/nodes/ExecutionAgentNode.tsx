import React from 'react';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { Play, Globe, Terminal } from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

export function ExecutionAgentNode(props: BaseNodeProps) {
  const { state } = useFlow();
  const nodeErrors = state.errors.filter(e => e.nodeId === props.id);
  const hasErrors = nodeErrors.length > 0;

  return (
    <BaseNode
      {...props}
      icon={<Play className="w-4 h-4" />}
      color="var(--success)"
      hasErrors={hasErrors}
      type="Execution Agent"
    >
      <div className="space-y-3 text-xs">
        {/* Model */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Model:</span>
          <span className="text-gray-700 font-medium">
            {props.data.model?.model || 'gpt-4'}
          </span>
        </div>

        {/* Capabilities */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            props.data.capabilities?.browser ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Globe className="w-3 h-3" />
            Browser
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            props.data.capabilities?.kernel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            <Terminal className="w-3 h-3" />
            Kernel
          </div>
        </div>

        {/* URL */}
        {props.data.url && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">URL:</span>
            <span className="text-gray-700 text-xs truncate max-w-32">
              {props.data.url}
            </span>
          </div>
        )}

        {/* Prompt indicator */}
        {props.data.prompt && (
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Prompt:</span>
            <span className="text-gray-700 text-xs">
              Configured ✓
            </span>
          </div>
        )}
      </div>
    </BaseNode>
  );
}