import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { AgentService } from '../agent/agent.service';

/**
 * Webhook controller for receiving inbound emails from Resend.
 * Also serves as a generic POST endpoint for testing.
 */
@ApiTags('Webhook')
@Controller('webhook')
export class EmailWebhookController {
  private readonly logger = new Logger(EmailWebhookController.name);

  constructor(private readonly agentService: AgentService) {}

  /**
   * Resend inbound email webhook handler.
   * Resend POSTs inbound emails to this endpoint.
   */
  @Post('resend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend inbound email webhook — receives incoming emails' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Event type from Resend' },
        data: {
          type: 'object',
          properties: {
            from: { type: 'string', description: 'Sender email' },
            to: { type: 'array', items: { type: 'string' } },
            subject: { type: 'string' },
            text: { type: 'string', description: 'Plain text body' },
            html: { type: 'string', description: 'HTML body' },
          },
        },
      },
    },
  })
  async handleResendWebhook(@Body() body: any) {
    this.logger.log(`📨 Resend webhook received: ${JSON.stringify(body?.type || 'unknown')}`);

    // Resend sends different event types — we care about "email.received" or inbound
    const eventData = body?.data || body;
    const senderEmail = eventData?.from || eventData?.sender?.email;
    const subject = eventData?.subject || 'MavHousing Query';
    const messageBody = eventData?.text || eventData?.body || this.stripHtml(eventData?.html) || '';

    if (!senderEmail) {
      this.logger.warn('Webhook received but no sender email found');
      return { received: true, processed: false, reason: 'No sender email' };
    }

    if (!messageBody.trim()) {
      this.logger.warn(`Webhook from ${senderEmail} but empty body`);
      return { received: true, processed: false, reason: 'Empty message body' };
    }

    // Process the request asynchronously
    this.agentService
      .processRequest(senderEmail, messageBody, subject)
      .catch((err) => this.logger.error(`Failed to process webhook from ${senderEmail}: ${err}`));

    return {
      received: true,
      processed: true,
      from: senderEmail,
      subject,
    };
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
