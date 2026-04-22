import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { RbacService } from '../rbac/rbac.service';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailTool {
  private readonly logger = new Logger(EmailTool.name);
  private resend: Resend;
  private defaultSender: string;

  constructor(
    private readonly rbac: RbacService,
    private readonly config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API'));
    this.defaultSender = 'MavHousing Dev <dev@mavhousing.xyz>';
  }

  private get commsServerUrl(): string {
    return this.config.get<string>('COMMS_SERVER_URL') || 'http://localhost:3000';
  }

  @Tool({
    name: 'send_email',
    description:
      'Send an email to a user via Resend. ADMIN/STAFF only. Can use templates or custom content.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      to: z.string().describe('Recipient email address'),
      template: z.string().optional().describe('Email template name (e.g. welcome, approved, paymentSuccessful). Leave empty for custom email.'),
      subject: z.string().optional().describe('Custom email subject (used if no template)'),
      body: z.string().optional().describe('Custom email body in plain text (used if no template)'),
      firstName: z.string().optional().describe('Recipient first name (used with templates)'),
      context: z.string().optional().describe('Additional context for the template'),
    }),
  })
  async sendEmail({
    senderEmail, to, template, subject, body, firstName, context,
  }: {
    senderEmail: string; to: string; template?: string;
    subject?: string; body?: string; firstName?: string; context?: string;
  }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Only Admins and Staff can send emails.' }] };
    }

    if (template) {
      // Use comms-server template system
      try {
        const response = await fetch(`${this.commsServerUrl}/email/send/${template}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            firstName: firstName || 'Resident',
            context,
          }),
        });

        if (response.ok) {
          return {
            content: [{ type: 'text' as const, text: `✅ Template email "${template}" sent to ${to}` }],
          };
        } else {
          const errText = await response.text();
          return {
            content: [{ type: 'text' as const, text: `⚠️ Failed to send template email: ${errText}` }],
          };
        }
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `⚠️ Could not reach comms-server at ${this.commsServerUrl}. Is it running?` }],
        };
      }
    }

    // Custom email via Resend directly
    if (!subject || !body) {
      return { content: [{ type: 'text' as const, text: 'Please provide both subject and body for custom emails, or specify a template name.' }] };
    }

    try {
      await this.resend.emails.send({
        to,
        from: this.defaultSender,
        subject,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0064B1; padding: 20px; color: white; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🏠 MavHousing</h2>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${body.replace(/\n/g, '<br/>')}
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
            Sent by MavHousing MCP Agent on behalf of ${ctx.fName} ${ctx.lName}
          </p>
        </div>`,
      });

      return { content: [{ type: 'text' as const, text: `✅ Email sent to ${to}` }] };
    } catch (error) {
      return { content: [{ type: 'text' as const, text: `❌ Failed to send email: ${error}` }] };
    }
  }

  @Tool({
    name: 'list_email_templates',
    description: 'List all available email templates from the comms server.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
    }),
  })
  async listEmailTemplates({ senderEmail }: { senderEmail: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    try {
      const response = await fetch(`${this.commsServerUrl}/email/templates`);
      if (response.ok) {
        const templates = await response.json();
        return { content: [{ type: 'text' as const, text: `Available templates:\n${JSON.stringify(templates, null, 2)}` }] };
      }
    } catch (error) {
      // Fallback: list known templates
    }

    const knownTemplates = [
      'welcome', 'submitted', 'incomplete', 'deleted', 'decisionMade',
      'approved', 'rejected', 'roomAssignment', 'announcement',
      'paymentFailed', 'paymentSuccessful',
      'uploadFailed', 'missingDocuments', 'deadlinePassed',
      'leaseAvailable', 'leaseOfferIssued', 'leaseAcceptedWelcome',
      'bulletinPosted',
      'maintenanceOpened', 'maintenanceClosed', 'maintenanceCommentAdded',
      'forgotPassword',
    ];

    return { content: [{ type: 'text' as const, text: `Known templates:\n${JSON.stringify(knownTemplates, null, 2)}` }] };
  }
}
