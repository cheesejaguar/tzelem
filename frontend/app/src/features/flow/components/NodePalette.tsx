import React from 'react';
import { 
  Brain, 
  Play, 
  Route, 
  Database, 
  Mail,
  Grip,
} from 'lucide-react';
import { NodeType } from '@/lib/types/flow';

interface NodeTemplateProps {
  type: NodeType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

function NodeTemplate({ type, title, description, icon, color }: NodeTemplateProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className={`
        group relative p-3 bg-white border border-gray-100 rounded-lg
        cursor-grab active:cursor-grabbing transition-all duration-200
        hover:border-gray-200 hover:shadow-sm hover:bg-gray-50/50
        ${isDragging ? 'opacity-50 scale-95 shadow-lg' : ''}
      `}
      draggable
      onDragStart={(event) => onDragStart(event, type)}
      onDragEnd={onDragEnd}
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div 
          className="p-2 rounded-md flex-shrink-0 transition-transform group-hover:scale-105"
          style={{ 
            backgroundColor: color + '10',
            color: color,
            border: `1px solid ${color}20`,
          }}
        >
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {title}
            </h4>
            <Grip className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0 ml-2" />
          </div>
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function NodePalette() {
  return (
    <div className="h-full flex flex-col bg-gray-50/30 border-r border-gray-100">
      {/* Header */}
      <div className="px-5 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Agents
        </h2>
        <p className="text-xs text-gray-600">
          Drag to canvas to build workflow
        </p>
      </div>

      {/* Agents List */}
      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        {/* Core Agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
              Core
            </h3>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="space-y-2">
            <NodeTemplate
              type="MasterAgent"
              title="Master Agent"
              description="Orchestrates workflow and manages other agents"
              icon={<Brain className="w-4 h-4" />}
              color="#0066ff"
            />

            <NodeTemplate
              type="ExecutionAgent"
              title="Execution Agent"
              description="Performs tasks with browser and code capabilities"
              icon={<Play className="w-4 h-4" />}
              color="#00d084"
            />

            <NodeTemplate
              type="RoutingAgent"
              title="Routing Agent"
              description="Routes requests based on classification rules"
              icon={<Route className="w-4 h-4" />}
              color="#ff8800"
            />
          </div>
        </div>

        {/* Specialized Agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-200" />
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider px-2">
              Specialized
            </h3>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="space-y-2">
            <NodeTemplate
              type="DataCollectionAgent"
              title="Data Collection"
              description="Collects structured data through conversations"
              icon={<Database className="w-4 h-4" />}
              color="#8b5cf6"
            />

            <NodeTemplate
              type="MailAgent"
              title="Mail Agent"
              description="Handles email communications and delivery"
              icon={<Mail className="w-4 h-4" />}
              color="#ef4444"
            />
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="mt-6 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            Quick Start
          </h3>
          <div className="space-y-1.5 text-xs text-gray-600">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">Start with a Master Agent</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">Add execution agents for tasks</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">Connect with edges</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
              <span className="leading-relaxed">Configure and test</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}