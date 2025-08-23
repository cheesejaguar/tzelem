import React from 'react';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { Badge } from '@/components/ui/badge';
import { Route } from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

export function RoutingAgentNode(props: BaseNodeProps) {
  const { state } = useFlow();
  const nodeErrors = state.errors.filter(e => e.nodeId === props.id);
  const hasErrors = nodeErrors.length > 0;

  return (
    <BaseNode
      {...props}
      icon={<Route className="w-4 h-4" />}
      color="var(--warning)"
      hasErrors={hasErrors}
      type="Routing Agent"
    >
      <div className="space-y-2 text-xs">
        {/* Model Info */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">Model:</span>
          <Badge variant="secondary" className="text-xs">
            {props.data.model?.model || 'Not configured'}
          </Badge>
        </div>

        {/* Classes */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)]">Classes:</span>
            <Badge variant="secondary" className="text-xs">
              {props.data.classes?.length || 0} defined
            </Badge>
          </div>
          
          {props.data.classes?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {props.data.classes.slice(0, 3).map((className: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {className}
                </Badge>
              ))}
              {props.data.classes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{props.data.classes.length - 3} more
                </Badge>
              )}
            </div>
          )}
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