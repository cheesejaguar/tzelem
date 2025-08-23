import React from 'react';
import { useFlow } from '@/contexts/FlowContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Badge component will be used for type-specific badges when needed
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, X } from 'lucide-react';
import { FlowNode, ModelConfig } from '@/lib/types/flow';

export function NodeConfigPanel() {
  const { state, dispatch } = useFlow();
  
  const selectedNode = state.nodes.find(n => n.id === state.selectedNode);
  
  if (!selectedNode) {
    return null;
  }

  const updateNodeData = (updates: Partial<FlowNode['data']>) => {
    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        id: selectedNode.id,
        data: updates,
      },
    });
  };

  const deleteNode = () => {
    if (confirm('Are you sure you want to delete this agent?')) {
      dispatch({
        type: 'DELETE_NODE',
        payload: selectedNode.id,
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50/30 border-l border-gray-100">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {selectedNode.data.label}
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              {selectedNode.type.replace(/([A-Z])/g, ' $1').trim()}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={deleteNode}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Basic Settings */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Basic Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="label" className="text-xs font-medium text-gray-600">Agent Label</Label>
              <Input
                id="label"
                value={selectedNode.data.label || ''}
                onChange={(e) => updateNodeData({ label: e.target.value })}
                placeholder="Enter agent name"
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Type-specific Configuration */}
        {renderTypeSpecificConfig(selectedNode, updateNodeData)}

        {/* Position Info */}
        <Card className="border-gray-100 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-600">X: {Math.round(selectedNode.position.x)}</Label>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Y: {Math.round(selectedNode.position.y)}</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function renderTypeSpecificConfig(
  node: FlowNode, 
  updateData: (updates: Partial<FlowNode['data']>) => void
) {
  switch (node.type) {
    case 'MasterAgent':
      return (
        <>
          <ModelConfigSection 
            model={node.data.model}
            onUpdate={(model) => updateData({ model })}
          />
          
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700">System Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={node.data.systemPrompt || ''}
                onChange={(e) => updateData({ systemPrompt: e.target.value })}
                placeholder="Enter system prompt for the master agent..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>

          <ToolsConfigSection
            tools={node.data.tools || []}
            onUpdate={(tools) => updateData({ tools })}
          />
        </>
      );

    case 'ExecutionAgent':
      return (
        <>
          <ModelConfigSection 
            model={node.data.model}
            onUpdate={(model) => updateData({ model })}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Capabilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Browser Access</Label>
                <Switch
                  checked={node.data.capabilities?.browser || false}
                  onCheckedChange={(browser) => 
                    updateData({ 
                      capabilities: { 
                        ...node.data.capabilities, 
                        browser 
                      } 
                    })
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Code Execution</Label>
                <Switch
                  checked={node.data.capabilities?.kernel || false}
                  onCheckedChange={(kernel) => 
                    updateData({ 
                      capabilities: { 
                        ...node.data.capabilities, 
                        kernel 
                      } 
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="execution-url">URL (optional)</Label>
                <Input
                  id="execution-url"
                  type="url"
                  placeholder="https://example.com"
                  value={node.data.url || ''}
                  onChange={(e) => updateData({ url: e.target.value })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">URL for the execution agent to access</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="execution-prompt">Prompt (optional)</Label>
                <Textarea
                  id="execution-prompt"
                  placeholder="Enter specific instructions for this execution agent..."
                  value={node.data.prompt || ''}
                  onChange={(e) => updateData({ prompt: e.target.value })}
                  className="w-full min-h-[100px]"
                  rows={4}
                />
                <p className="text-xs text-gray-500">Specific instructions for this execution agent</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Policies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Ask User on Ambiguity</Label>
                <Switch
                  checked={node.data.policies?.askUserOnAmbiguity ?? true}
                  onCheckedChange={(askUserOnAmbiguity) => 
                    updateData({ 
                      policies: { 
                        ...node.data.policies, 
                        askUserOnAmbiguity 
                      } 
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </>
      );

    case 'RoutingAgent':
      return (
        <>
          <ModelConfigSection 
            model={node.data.model}
            onUpdate={(model) => updateData({ model })}
          />
          
          <ClassesConfigSection
            classes={node.data.classes || []}
            onUpdate={(classes) => updateData({ classes })}
          />
        </>
      );

    case 'DataCollectionAgent':
      return (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Loop Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={node.data.loopPrompt || ''}
                onChange={(e) => updateData({ loopPrompt: e.target.value })}
                placeholder="Enter prompt for data collection loop..."
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          <SchemaConfigSection
            schema={node.data.schema || []}
            onUpdate={(schema) => updateData({ schema })}
          />
        </>
      );

    case 'MailAgent':
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Email Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={node.data.config?.fromName || ''}
                onChange={(e) => 
                  updateData({ 
                    config: { 
                      ...node.data.config, 
                      fromName: e.target.value 
                    } 
                  })
                }
                placeholder="e.g., Tzelem Assistant"
              />
            </div>
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={node.data.config?.subject || ''}
                onChange={(e) => 
                  updateData({ 
                    config: { 
                      ...node.data.config, 
                      subject: e.target.value 
                    } 
                  })
                }
                placeholder="e.g., Your workflow results"
              />
            </div>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}

function ModelConfigSection({ 
  model, 
  onUpdate 
}: { 
  model?: ModelConfig; 
  onUpdate: (model: ModelConfig) => void;
}) {
  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-700">Model Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="provider" className="text-xs font-medium text-gray-600">Provider</Label>
          <Select
            value={model?.provider || 'openai'}
            onValueChange={(provider) => 
              onUpdate({ ...model, provider: provider as 'openai' | 'anthropic' | 'google' | 'local' })
            }
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="local">Local</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="model" className="text-xs font-medium text-gray-600">Model</Label>
          <Input
            id="model"
            value={model?.model || ''}
            onChange={(e) => onUpdate({ ...model, model: e.target.value, provider: model?.provider || 'openai' })}
            placeholder="e.g., gpt-4, claude-3-sonnet"
            className="mt-1.5"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ToolsConfigSection({ 
  tools, 
  onUpdate 
}: { 
  tools: string[]; 
  onUpdate: (tools: string[]) => void;
}) {
  const addTool = () => {
    onUpdate([...tools, '']);
  };

  const updateTool = (index: number, value: string) => {
    const newTools = [...tools];
    newTools[index] = value;
    onUpdate(newTools);
  };

  const removeTool = (index: number) => {
    onUpdate(tools.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Tools
          <Button size="sm" variant="outline" onClick={addTool}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tools.map((tool, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={tool}
              onChange={(e) => updateTool(index, e.target.value)}
              placeholder="Tool name"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeTool(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {tools.length === 0 && (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
            No tools configured
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ClassesConfigSection({ 
  classes, 
  onUpdate 
}: { 
  classes: string[]; 
  onUpdate: (classes: string[]) => void;
}) {
  const addClass = () => {
    onUpdate([...classes, '']);
  };

  const updateClass = (index: number, value: string) => {
    const newClasses = [...classes];
    newClasses[index] = value;
    onUpdate(newClasses);
  };

  const removeClass = (index: number) => {
    onUpdate(classes.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Classification Classes
          <Button size="sm" variant="outline" onClick={addClass}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {classes.map((className, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={className}
              onChange={(e) => updateClass(index, e.target.value)}
              placeholder="Class name"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeClass(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
            No classes defined
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SchemaConfigSection({ 
  schema, 
  onUpdate 
}: { 
  schema: any[]; 
  onUpdate: (schema: any[]) => void;
}) {
  const addField = () => {
    onUpdate([...schema, { name: '', type: 'string', required: false }]);
  };

  const updateField = (index: number, updates: any) => {
    const newSchema = [...schema];
    newSchema[index] = { ...newSchema[index], ...updates };
    onUpdate(newSchema);
  };

  const removeField = (index: number) => {
    onUpdate(schema.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Data Schema
          <Button size="sm" variant="outline" onClick={addField}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schema.map((field, index) => (
          <div key={index} className="space-y-2 p-3 border border-[var(--border-primary)] rounded-lg">
            <div className="flex items-center justify-between">
              <Input
                value={field.name}
                onChange={(e) => updateField(index, { name: e.target.value })}
                placeholder="Field name"
                className="flex-1 mr-2"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeField(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Select
                value={field.type}
                onValueChange={(type) => updateField(index, { type })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(required) => updateField(index, { required })}
                />
                <Label>Required</Label>
              </div>
            </div>
          </div>
        ))}
        {schema.length === 0 && (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-4">
            No fields defined
          </p>
        )}
      </CardContent>
    </Card>
  );
}