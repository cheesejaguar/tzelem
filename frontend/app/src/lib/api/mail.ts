import api, { handleApiResponse } from '@/lib/api';
import { MailRequest, MailResponse, MailHealthStatus } from '@/types/api';
import { toast } from 'sonner';

/**
 * Send an email via the backend mail service
 */
export async function sendMail(request: MailRequest): Promise<MailResponse> {
  try {
    const response = await handleApiResponse<MailResponse>(
      api.post('/api/mail', request)
    );
    
    // Show appropriate toast based on status
    if (response.status === 'queued' || response.status === 'sent') {
      toast.success('Email sent successfully');
    } else if (response.status === 'mocked') {
      toast.info('Email mocked (development mode)');
    }
    
    return response;
  } catch (error: any) {
    // Handle specific error cases
    if (error?.response?.status === 503) {
      toast.error('Mail service unavailable. Please configure AgentMail.');
    } else if (error?.response?.status === 400) {
      toast.error('Invalid email data. Please check your input.');
    } else {
      toast.error('Failed to send email');
    }
    throw error;
  }
}

/**
 * Check the health status of the mail service
 */
export async function checkMailHealth(): Promise<MailHealthStatus> {
  try {
    const response = await handleApiResponse<MailHealthStatus>(
      api.get('/api/mail/health')
    );
    return response;
  } catch (error) {
    console.error('Failed to check mail health:', error);
    // Return a default unavailable status on error
    return {
      status: 'unavailable',
      agentmail_installed: false,
      api_key_configured: false,
      message: 'Unable to check mail service status',
      mock_mode: false
    };
  }
}

/**
 * Send a simple text email
 */
export async function sendTextMail(
  to: string,
  subject: string,
  text: string,
  fromName?: string
): Promise<MailResponse> {
  return sendMail({
    to,
    subject,
    text,
    from_name: fromName
  });
}

/**
 * Send an HTML email
 */
export async function sendHtmlMail(
  to: string,
  subject: string,
  html: string,
  fromName?: string
): Promise<MailResponse> {
  return sendMail({
    to,
    subject,
    html,
    from_name: fromName
  });
}

/**
 * Send a templated email for common use cases
 */
export async function sendTemplatedMail(
  to: string,
  template: 'welcome' | 'notification' | 'report' | 'alert',
  data: Record<string, any>
): Promise<MailResponse> {
  const templates = {
    welcome: {
      subject: `Welcome to Tzelem, ${data.name || 'User'}!`,
      html: `
        <h2>Welcome to Tzelem</h2>
        <p>Hi ${data.name || 'there'},</p>
        <p>We're excited to have you on board! Tzelem is your platform for building and orchestrating AI agent teams.</p>
        <p>Get started by:</p>
        <ul>
          <li>Creating your first flow</li>
          <li>Adding agents to your workflow</li>
          <li>Running your first orchestration</li>
        </ul>
        <p>Best regards,<br>The Tzelem Team</p>
      `
    },
    notification: {
      subject: data.subject || 'Notification from Tzelem',
      html: `
        <h3>${data.title || 'Notification'}</h3>
        <p>${data.message || 'You have a new notification.'}</p>
        ${data.link ? `<p><a href="${data.link}">View Details</a></p>` : ''}
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated notification from Tzelem.</p>
      `
    },
    report: {
      subject: `Flow Execution Report: ${data.flowName || 'Unknown Flow'}`,
      html: `
        <h2>Flow Execution Report</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Flow Name:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.flowName || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Status:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.status || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Duration:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.duration || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Nodes Executed:</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.nodesExecuted || 0}</td>
          </tr>
        </table>
        ${data.details ? `<h3>Details</h3><pre>${data.details}</pre>` : ''}
      `
    },
    alert: {
      subject: `⚠️ Alert: ${data.alertType || 'System Alert'}`,
      html: `
        <div style="border: 2px solid #ff6b6b; padding: 16px; border-radius: 8px;">
          <h2 style="color: #ff6b6b;">⚠️ Alert</h2>
          <p><strong>Type:</strong> ${data.alertType || 'System Alert'}</p>
          <p><strong>Severity:</strong> ${data.severity || 'Medium'}</p>
          <p><strong>Message:</strong></p>
          <p>${data.message || 'An alert has been triggered.'}</p>
          ${data.action ? `<p><strong>Recommended Action:</strong> ${data.action}</p>` : ''}
          <p style="color: #666; font-size: 12px;">Alert generated at ${new Date().toISOString()}</p>
        </div>
      `
    }
  };

  const templateData = templates[template];
  if (!templateData) {
    throw new Error(`Unknown email template: ${template}`);
  }

  return sendMail({
    to,
    subject: templateData.subject,
    html: templateData.html,
    from_name: data.fromName || 'Tzelem System'
  });
}

/**
 * Send an email from a MailAgent node during flow execution
 */
export async function sendNodeExecutionMail(
  nodeId: string,
  nodeConfig: {
    fromName: string;
    subject: string;
  },
  to: string,
  content: string,
  isHtml: boolean = false
): Promise<MailResponse> {
  try {
    const request: MailRequest = {
      to,
      subject: nodeConfig.subject,
      from_name: nodeConfig.fromName
    };

    if (isHtml) {
      request.html = content;
    } else {
      request.text = content;
    }

    const response = await sendMail(request);
    
    // Log for debugging
    console.log(`[MailAgent ${nodeId}] Email sent:`, {
      to,
      subject: nodeConfig.subject,
      status: response.status,
      messageId: response.messageId
    });
    
    return response;
  } catch (error) {
    console.error(`[MailAgent ${nodeId}] Failed to send email:`, error);
    throw error;
  }
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format email content with basic styling
 */
export function formatEmailHtml(
  title: string,
  content: string,
  footer?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #0066ff; border-bottom: 2px solid #0066ff; padding-bottom: 10px; }
          .content { margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <div class="content">${content}</div>
          ${footer ? `<div class="footer">${footer}</div>` : ''}
        </div>
      </body>
    </html>
  `;
}