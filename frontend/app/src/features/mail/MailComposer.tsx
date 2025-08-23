import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Send, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Eye
} from 'lucide-react';
import { sendMail, checkMailHealth, validateEmail, formatEmailHtml } from '@/lib/api/mail';
import { MailHealthStatus, MailResponse } from '@/types/api';
import { toast } from 'sonner';

interface MailComposerProps {
  onMailSent?: (response: MailResponse) => void;
  defaultTo?: string;
  defaultSubject?: string;
  defaultFromName?: string;
  className?: string;
}

export function MailComposer({
  onMailSent,
  defaultTo = '',
  defaultSubject = '',
  defaultFromName = 'Tzelem System',
  className = ''
}: MailComposerProps) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [fromName, setFromName] = useState(defaultFromName);
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState<'text' | 'html'>('text');
  const [isSending, setIsSending] = useState(false);
  const [healthStatus, setHealthStatus] = useState<MailHealthStatus | null>(null);
  const [lastResponse, setLastResponse] = useState<MailResponse | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Check mail health on mount
  React.useEffect(() => {
    checkMailHealth().then(setHealthStatus);
  }, []);

  const handleSend = async () => {
    // Validate inputs
    if (!to || !subject || !content) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!validateEmail(to)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    try {
      const response = await sendMail({
        to,
        subject,
        from_name: fromName,
        [contentType]: content
      });

      setLastResponse(response);
      onMailSent?.(response);
      
      // Clear form on success
      if (response.status === 'queued' || response.status === 'sent') {
        setContent('');
        toast.success('Email sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const getPreviewHtml = () => {
    if (contentType === 'html') {
      return content;
    }
    // Convert plain text to HTML for preview
    return formatEmailHtml(subject, content.replace(/\n/g, '<br>'), `Sent by ${fromName}`);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Composer
          </CardTitle>
          {healthStatus && (
            <Badge 
              variant={healthStatus.status === 'healthy' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {healthStatus.status === 'healthy' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mail Service Ready
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {healthStatus.mock_mode ? 'Mock Mode' : 'Service Unavailable'}
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Status Alert */}
        {healthStatus?.status === 'unavailable' && !healthStatus.mock_mode && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Mail service is not configured. Emails cannot be sent.
              {!healthStatus.api_key_configured && ' Please set AGENTMAIL_API_KEY.'}
              {!healthStatus.agentmail_installed && ' Please install the AgentMail library.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Email Fields */}
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fromName">From Name</Label>
            <Input
              id="fromName"
              placeholder="Sender name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>

          {/* Content Tabs */}
          <div className="grid gap-2">
            <Label>Content *</Label>
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as 'text' | 'html')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Plain Text</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <Textarea
                  placeholder="Enter your email content..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
              </TabsContent>
              <TabsContent value="html">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Enter HTML content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* HTML Preview */}
          {showPreview && contentType === 'html' && (
            <div className="border rounded-lg p-4 bg-white">
              <div className="text-xs text-muted-foreground mb-2">Preview:</div>
              <div 
                dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                className="prose prose-sm max-w-none"
              />
            </div>
          )}
        </div>

        {/* Last Response */}
        {lastResponse && (
          <Alert className={lastResponse.status === 'queued' || lastResponse.status === 'sent' ? 'border-green-500' : ''}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Email {lastResponse.status}</div>
              <div className="text-xs text-muted-foreground">{lastResponse.message}</div>
              {lastResponse.messageId && (
                <div className="text-xs text-muted-foreground">ID: {lastResponse.messageId}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkMailHealth().then(setHealthStatus)}
          >
            Check Service Status
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={isSending || !to || !subject || !content || healthStatus?.status === 'unavailable'}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}