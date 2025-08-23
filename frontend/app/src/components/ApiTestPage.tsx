import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { listFlows, createOrUpdateFlow } from '@/lib/api/flows';
import { createVoiceRoom } from '@/lib/api/voice';
import { startRun } from '@/lib/api/runs';
import { checkMailHealth, sendTextMail, sendTemplatedMail } from '@/lib/api/mail';
import { FlowJSON } from '@/lib/types/flow';

export function ApiTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testHealthCheck = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '');
      const response = await fetch(`${apiUrl}/health`);
      const data = await response.json();
      addResult(`✅ Health check passed: ${JSON.stringify(data)}`);
      toast.success('Health check passed');
    } catch (error) {
      addResult(`❌ Health check failed: ${error}`);
      toast.error('Health check failed');
    }
  };

  const testListFlows = async () => {
    try {
      const flows = await listFlows();
      addResult(`✅ Listed ${flows.length} flows`);
      toast.success(`Found ${flows.length} flows`);
    } catch (error) {
      addResult(`❌ List flows failed: ${error}`);
      toast.error('Failed to list flows');
    }
  };

  const testCreateFlow = async () => {
    try {
      const testFlow: FlowJSON = {
        version: '0.1.0',
        name: 'Test Flow',
        paradigm: 'agentic',
        secrets: [],
        voice: {
          enabled: false,
          provider: 'pipecat',
          roomTTL: 3600,
        },
        nodes: [
          {
            id: 'node-1',
            type: 'MasterAgent',
            data: {
              model: {
                provider: 'openai',
                model: 'gpt-4',
              },
              tools: [],
              systemPrompt: 'Test prompt',
              label: 'Test Master',
            },
            position: { x: 100, y: 100 },
          },
        ],
        edges: [],
        run: {
          inputs: {},
          pricing: {
            enabled: true,
            budgetUSD: 10,
          },
        },
      };

      const response = await createOrUpdateFlow(testFlow);
      addResult(`✅ Created flow with ID: ${response.flowId}`);
      toast.success('Flow created successfully');
    } catch (error) {
      addResult(`❌ Create flow failed: ${error}`);
      toast.error('Failed to create flow');
    }
  };

  const testCreateVoiceRoom = async () => {
    try {
      const response = await createVoiceRoom();
      addResult(`✅ Created voice room: ${response.room}`);
      toast.success('Voice room created');
    } catch (error) {
      addResult(`❌ Create voice room failed: ${error}`);
      toast.error('Failed to create voice room');
    }
  };

  const testStartRun = async () => {
    try {
      const testFlow: FlowJSON = {
        version: '0.1.0',
        name: 'Test Run Flow',
        paradigm: 'sequential',
        secrets: [],
        voice: {
          enabled: false,
          provider: 'pipecat',
          roomTTL: 3600,
        },
        nodes: [],
        edges: [],
        run: {
          inputs: {},
          pricing: {
            enabled: true,
            budgetUSD: 5,
          },
        },
      };

      const response = await startRun(undefined, testFlow);
      addResult(`✅ Started run with ID: ${response.runId}`);
      toast.success('Run started');
    } catch (error) {
      addResult(`❌ Start run failed: ${error}`);
      toast.error('Failed to start run');
    }
  };

  const testMailHealth = async () => {
    try {
      const health = await checkMailHealth();
      const statusEmoji = health.status === 'healthy' ? '✅' : '⚠️';
      addResult(`${statusEmoji} Mail health: ${health.status} - ${health.message}`);
      if (health.mock_mode) {
        addResult(`  📝 Running in mock mode`);
      }
      if (!health.api_key_configured) {
        addResult(`  ❌ API key not configured`);
      }
      if (!health.agentmail_installed) {
        addResult(`  ❌ AgentMail not installed`);
      }
      toast[health.status === 'healthy' ? 'success' : 'warning']('Mail health check completed');
    } catch (error) {
      addResult(`❌ Mail health check failed: ${error}`);
      toast.error('Mail health check failed');
    }
  };

  const testSendTextMail = async () => {
    try {
      const response = await sendTextMail(
        'test@example.com',
        'Test Email from Tzelem',
        'This is a test email sent from the Tzelem API test page.\n\nIf you receive this, the mail service is working correctly!',
        'Tzelem Test Suite'
      );
      addResult(`✅ Text email ${response.status}: ${response.message}`);
      if (response.messageId) {
        addResult(`  📧 Message ID: ${response.messageId}`);
      }
      toast.success(`Email ${response.status}`);
    } catch (error) {
      addResult(`❌ Send text email failed: ${error}`);
      toast.error('Failed to send text email');
    }
  };

  const testSendTemplatedMail = async () => {
    try {
      const response = await sendTemplatedMail(
        'test@example.com',
        'welcome',
        {
          name: 'Test User',
          fromName: 'Tzelem Team'
        }
      );
      addResult(`✅ Templated email ${response.status}: ${response.message}`);
      if (response.messageId) {
        addResult(`  📧 Message ID: ${response.messageId}`);
      }
      toast.success('Welcome email sent');
    } catch (error) {
      addResult(`❌ Send templated email failed: ${error}`);
      toast.error('Failed to send templated email');
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults([]);
    
    await testHealthCheck();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testListFlows();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testCreateFlow();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testCreateVoiceRoom();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testStartRun();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testMailHealth();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testSendTextMail();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testSendTemplatedMail();
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Integration Test</CardTitle>
          <Badge variant="outline">
            {import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testHealthCheck} disabled={isLoading} size="sm">
            Test Health
          </Button>
          <Button onClick={testListFlows} disabled={isLoading} size="sm">
            Test List Flows
          </Button>
          <Button onClick={testCreateFlow} disabled={isLoading} size="sm">
            Test Create Flow
          </Button>
          <Button onClick={testCreateVoiceRoom} disabled={isLoading} size="sm">
            Test Voice Room
          </Button>
          <Button onClick={testStartRun} disabled={isLoading} size="sm">
            Test Start Run
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button onClick={testMailHealth} disabled={isLoading} size="sm">
            Mail Health
          </Button>
          <Button onClick={testSendTextMail} disabled={isLoading} size="sm">
            Send Text Email
          </Button>
          <Button onClick={testSendTemplatedMail} disabled={isLoading} size="sm">
            Send Template
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button onClick={runAllTests} disabled={isLoading} variant="default">
            Run All Tests
          </Button>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Test Results:</h3>
          <div className="bg-muted rounded-lg p-3 font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <span className="text-muted-foreground">No tests run yet</span>
            ) : (
              results.map((result, index) => (
                <div key={index}>{result}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}