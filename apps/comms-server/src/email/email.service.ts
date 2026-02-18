import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { EMAIL_TEMPLATES } from './templates';

@Injectable()
export class EmailService {
  private resend: Resend;
  private defaultSender: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API'));
    this.defaultSender = 'Mav Housing <onboarding@resend.dev>';
  }

  /**
   * Returns all available email template names.
   */
  getTemplateNames(): string[] {
    return Object.keys(EMAIL_TEMPLATES);
  }

  /**
   * Send an email using a named template.
   * @param templateName - key from EMAIL_TEMPLATES (e.g. 'welcome', 'paymentFailed')
   * @param to - recipient email
   * @param firstName - for personalization
   * @param portalUrl - optional portal URL override
   */
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

  /**
   * Quick test email — kept for debugging/health-check purposes.
   */
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
