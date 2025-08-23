import React from 'react';
import { BaseNode, BaseNodeProps } from './BaseNode';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { useFlow } from '@/contexts/FlowContext';

export function MailAgentNode(props: BaseNodeProps) {
  const { state } = useFlow();
  const nodeErrors = state.errors.filter(e => e.nodeId === props.id);
  const hasErrors = nodeErrors.length > 0;

  return (
    <BaseNode
      {...props}
      icon={<Mail className="w-4 h-4" />}
      color="#ef4444"
      hasErrors={hasErrors}
      type="Mail Agent"
    >
      <div className="space-y-2 text-xs">
        {/* From Name */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">From:</span>
          <Badge 
            variant={props.data.config?.fromName?.trim() ? "secondary" : "outline"}
            className="text-xs max-w-[120px] truncate"
            title={props.data.config?.fromName}
          >
            {props.data.config?.fromName?.trim() || 'Required'}
          </Badge>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">Subject:</span>
          <Badge 
            variant={props.data.config?.subject?.trim() ? "secondary" : "outline"}
            className="text-xs max-w-[120px] truncate"
            title={props.data.config?.subject}
          >
            {props.data.config?.subject?.trim() || 'Required'}
          </Badge>
        </div>

        {/* Configuration Status */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">Status:</span>
          <Badge 
            variant={
              props.data.config?.fromName?.trim() && props.data.config?.subject?.trim() 
                ? "default" 
                : "destructive"
            }
            className="text-xs"
          >
            {props.data.config?.fromName?.trim() && props.data.config?.subject?.trim() 
              ? 'Configured' 
              : 'Incomplete'
            }
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