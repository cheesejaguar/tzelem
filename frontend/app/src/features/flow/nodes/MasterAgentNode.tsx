import React from 'react';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { Brain } from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

export function MasterAgentNode(props: BaseNodeProps) {
  const { state } = useFlow();
  const nodeErrors = state.errors.filter(e => e.nodeId === props.id);
  const hasErrors = nodeErrors.length > 0;

  return (
    <BaseNode
      {...props}
      icon={<Brain className="w-4 h-4" />}
      color="var(--accent-primary)"
      hasErrors={hasErrors}
      type="Master Agent"
    >
      <div className="space-y-3 text-xs">
        {/* Model */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Model:</span>
          <span className="text-gray-700 font-medium">
            {props.data.model?.model || 'gpt-4'}
          </span>
        </div>

        {/* Tools */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Tools:</span>
          <span className="text-gray-700">
            {props.data.tools?.length || 0} configured
          </span>
        </div>

        {/* System Prompt */}
        <div className="flex items-center justify-between">
          <span className="text-gray-500">System Prompt:</span>
          <span className={`text-xs ${
            props.data.systemPrompt?.trim() 
              ? 'text-green-700' 
              : 'text-orange-600'
          }`}>
            {props.data.systemPrompt?.trim() ? 'Configured ✓' : 'Required'}
          </span>
        </div>
      </div>
    </BaseNode>
  );
}