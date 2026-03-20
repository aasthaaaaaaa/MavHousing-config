import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EMAIL_TEMPLATES } from './templates';

// NOTE : axjh03@gmail.com is hardcoded because FreePlan of ResendAPI only allows sending email to the account from which the API key is generated.
// Will be removed later

@Injectable()
export class EmailService {
  private resend: Resend;
  private defaultSender: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API'));
    this.defaultSender = 'Mav Housing <onboarding@resend.dev>';
  }

  getTemplateNames(): string[] {
    return Object.keys(EMAIL_TEMPLATES);
  }

  async sendTemplateEmail(
    templateName: string,
    to: string,
    firstName: string,
    context?: string,
    portalUrl?: string,
  ): Promise<{ success: boolean; message: string }> {
    const generator = EMAIL_TEMPLATES[templateName];
    if (!generator) {
      throw new BadRequestException(
        `Unknown email template "${templateName}". Available: ${this.getTemplateNames().join(', ')}`,
      );
    }

    const { subject, html } = generator({ firstName, portalUrl, context });

    try {
      await this.resend.emails.send({
        to,
        from: this.defaultSender,
        subject,
        html,
      });

      return {
        success: true,
        message: `Email "${templateName}" sent to ${to}`,
      };
    } catch (e) {
      console.error('Failed to send email:', e);
      return { success: false, message: `Email not sent: ${e.message}` };
    }
  }

  async sendEmailWithAttachment(
    to: string,
    subject: string,
    html: string,
    attachment: { filename: string; content: Buffer },
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.resend.emails.send({
        to,
        from: this.defaultSender,
        subject,
        html,
        attachments: [
          {
            filename: attachment.filename,
            content: attachment.content,
          },
        ],
      });

      return {
        success: true,
        message: `Email sent to ${to} with attachment ${attachment.filename}`,
      };
    } catch (e) {
      console.error('Failed to send email with attachment:', e);
      return { success: false, message: `Email not sent: ${e.message}` };
    }
  }

  async sendTestEmail(): Promise<string> {
    const msg = {
      to: 'axjh03@gmail.com',
      from: this.defaultSender,
      subject: 'Testing Comms Server Email Connection',
      text: 'Delivery of this email means that the email connection works',
      html: '<strong>Test — Comms Server is alive!</strong>',
    };

    try {
      await this.resend.emails.send(msg);
      return 'Mail Sent';
    } catch (e) {
      console.error('Failed to send email:', e);
      return `Mail not sent: ${e.message}`;
    }
  }
}
