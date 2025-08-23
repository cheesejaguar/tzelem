import React from 'react';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

export function DataCollectionAgentNode(props: BaseNodeProps) {
  const { state } = useFlow();
  const nodeErrors = state.errors.filter(e => e.nodeId === props.id);
  const hasErrors = nodeErrors.length > 0;

  return (
    <BaseNode
      {...props}
      icon={<Database className="w-4 h-4" />}
      color="#8b5cf6"
      hasErrors={hasErrors}
      type="Data Collection Agent"
    >
      <div className="space-y-2 text-xs">
        {/* Schema Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">Schema:</span>
            <Badge variant="secondary" className="text-xs">
              {props.data.schema?.length || 0} fields
            </Badge>
          </div>
          
          {props.data.schema?.length > 0 && (
            <div className="space-y-1">
              {props.data.schema.slice(0, 3).map((field: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {field.name}
                  </Badge>
                  <span className="text-[var(--text-tertiary)] text-xs">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-[var(--error)] text-xs">*</span>
                  )}
                </div>
              ))}
              {props.data.schema.length > 3 && (
                <div className="text-[var(--text-tertiary)] text-xs">
                  +{props.data.schema.length - 3} more fields
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loop Prompt Status */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">Loop prompt:</span>
          <Badge 
            variant={props.data.loopPrompt?.trim() ? "secondary" : "outline"}
            className="text-xs"
          >
            {props.data.loopPrompt?.trim() ? 'Configured' : 'Optional'}
          </Badge>
        </div>

        {/* Errors */}
        {hasErrors && (
          <div className="pt-2 border-t border-[var(--border-secondary)]">
            {nodeErrors.slice(0, 2).map((error, i) => (
              <div key={i} className="text-[var(--error)] text-xs">
                • {error.message}
              </div>
            ))}
            {nodeErrors.length > 2 && (
              <div className="text-[var(--error)] text-xs">
                +{nodeErrors.length - 2} more issues
              </div>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}