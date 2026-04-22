import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Resend } from 'resend';
import { AgentService } from '../agent/agent.service';

/**
 * Webhook controller for receiving inbound emails from Resend.
 *
 * IMPORTANT: Resend webhooks only contain metadata (from, to, subject, email_id).
 * The actual email body and attachments must be fetched separately via the
 * Resend "Received Emails" API using the email_id.
 */
@ApiTags('Webhook')
@Controller('webhook')
export class EmailWebhookController {
  private readonly logger = new Logger(EmailWebhookController.name);
  private readonly resend: Resend;

  constructor(
    private readonly agentService: AgentService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API'));
  }

  /**
   * Resend inbound email webhook handler.
   * Resend POSTs inbound email events to this endpoint.
   */
  @Post('resend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend inbound email webhook — receives incoming emails' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Event type from Resend (email.received)' },
        data: {
          type: 'object',
          properties: {
            email_id: { type: 'string', description: 'Email ID to fetch content' },
            from: { type: 'string', description: 'Sender email' },
            to: { type: 'array', items: { type: 'string' } },
            subject: { type: 'string' },
          },
        },
      },
    },
  })
  async handleResendWebhook(@Body() body: any) {
    this.logger.log(`📨 Resend webhook received: type=${JSON.stringify(body?.type || 'unknown')}`);

    // Only process email.received events
    if (body?.type && body.type !== 'email.received') {
      this.logger.log(`🔕 Ignoring event type: ${body.type}`);
      return { received: true, processed: false, reason: `Ignored event type: ${body.type}` };
    }

    const eventData = body?.data || body;
    const emailId = eventData?.email_id;
    const senderEmail = this.extractEmail(eventData?.from);
    const senderName = this.extractDisplayName(eventData?.from);
    const subject = eventData?.subject || 'MavHousing Query';

    if (!senderEmail) {
      this.logger.warn('⚠️ Webhook received but no sender email found');
      return { received: true, processed: false, reason: 'No sender email' };
    }

    this.logger.log(`📬 Inbound email from: ${senderEmail} | Subject: "${subject}" | ID: ${emailId || 'N/A'}`);

    // Fetch the actual email body from Resend API
    let messageBody = '';

    if (emailId) {
      // Resend webhooks don't include the body — fetch it via API
      messageBody = await this.fetchEmailBody(emailId);
    }

    // Fallback: check if the body was included directly (e.g. from curl testing)
    if (!messageBody) {
      messageBody = eventData?.text || eventData?.body || this.stripHtml(eventData?.html) || '';
    }

    if (!messageBody.trim()) {
      this.logger.warn(`⚠️ Email from ${senderEmail} has empty body — sending help text`);
      // Still process it — the agent will return help text for empty messages
      messageBody = 'help';
    }

    this.logger.log(`💬 Message body: "${messageBody.substring(0, 150)}..."`);

    // Process the request asynchronously (don't block the webhook response)
    this.agentService
      .processRequest(senderEmail, messageBody, subject, senderName || undefined)
      .then(() => this.logger.log(`✅ Successfully processed email from ${senderEmail}`))
      .catch((err) => this.logger.error(`❌ Failed to process email from ${senderEmail}: ${err}`));

    return {
      received: true,
      processed: true,
      from: senderEmail,
      subject,
    };
  }

  /**
   * Fetch the email body from Resend's Received Emails API.
   * Webhooks only contain metadata — the body must be fetched separately.
   */
  private async fetchEmailBody(emailId: string): Promise<string> {
    try {
      this.logger.log(`🔍 Fetching email content for ID: ${emailId}`);

      // Use the Resend API to get the full email content
      const response = await fetch(
        `https://api.resend.com/emails/${emailId}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('RESEND_API')}`,
          },
        },
      );

      if (!response.ok) {
        this.logger.warn(`⚠️ Resend API returned ${response.status} for email ${emailId}`);
        return '';
      }

      const emailData = await response.json() as any;

      // Prefer plain text, fall back to stripped HTML
      const text = emailData?.text || this.stripHtml(emailData?.html) || emailData?.body || '';
      this.logger.log(`📄 Fetched email body (${text.length} chars)`);
      return text;
    } catch (error) {
      this.logger.error(`❌ Failed to fetch email body for ${emailId}: ${error}`);
      return '';
    }
  }

  /**
   * Extract a clean email address from formats like "Name <email@domain.com>"
   */
  private extractEmail(from?: string): string | null {
    if (!from) return null;

    // Handle "Display Name <email@example.com>" format
    const match = from.match(/<([^>]+)>/);
    if (match) return match[1].toLowerCase().trim();

    // Handle plain "email@example.com" format
    if (from.includes('@')) return from.toLowerCase().trim();

    return null;
  }

  /**
   * Extract the display name from formats like "John Doe <email@domain.com>"
   * Returns null if only an email address is provided.
   */
  private extractDisplayName(from?: string): string | null {
    if (!from) return null;

    // Handle "Display Name <email@example.com>" format
    const match = from.match(/^(.+?)\s*<[^>]+>$/);
    if (match) {
      const name = match[1].replace(/["']/g, '').trim();
      return name || null;
    }

    // No display name — just a bare email
    return null;
  }

  /**
   * Strip HTML tags for plain text extraction.
   */
  private stripHtml(html?: string): string {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
