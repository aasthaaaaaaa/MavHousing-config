import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailReplyService {
  private readonly logger = new Logger(EmailReplyService.name);
  private resend: Resend;
  private defaultSender: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API'));
    this.defaultSender = 'Blaze AI <blaze@mavhousing.xyz>';
  }

  /**
   * Send a formatted reply back to the email sender.
   */
  async replyToSender(to: string, subject: string, content: string): Promise<boolean> {
    try {
      await this.resend.emails.send({
        to,
        from: this.defaultSender,
        subject: `Re: ${subject}`,
        html: this.formatReplyHtml(content, subject),
      });
      this.logger.log(`Reply sent to ${to}: "${subject}"`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send reply to ${to}: ${error}`);
      return false;
    }
  }

  /**
   * Send a professional reply to unregistered senders.
   */
  async sendNotRegistered(to: string, originalSubject: string, displayName: string): Promise<void> {
    await this.replyToSender(
      to,
      originalSubject,
      `<p>Hi ${displayName},</p>
      <p>Thank you for reaching out. I am <strong>Blaze AI</strong>, the intelligent assistant for <strong>MavHousing</strong>, the student housing system at the University of Texas at Arlington.</p>
      <p>Unfortunately, your email address (<strong>${to}</strong>) is not currently registered in our housing system. I am unable to retrieve any account information for this address.</p>
      <p>Here are a few steps that may help:</p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li>If you are a current UTA student or staff member, please email from your <strong>@uta.edu</strong> or <strong>@mavs.uta.edu</strong> address that is linked to your housing account.</li>
        <li>If you are new to MavHousing, please visit our web portal to create an account and submit a housing application.</li>
        <li>If you believe this is an error, please contact the UTA Housing Office for assistance.</li>
      </ul>
      <p>Once your account is set up, feel free to email me and I can help with lease information, rent payments, maintenance requests, and more.</p>
      <p style="margin-top: 20px;">Best regards,<br><strong>Blaze AI</strong><br><span style="color: #6b7280; font-size: 12px;">MavHousing Intelligent Assistant</span></p>`,
    );
  }

  /**
   * Format the reply into a styled HTML email.
   */
  private formatReplyHtml(content: string, subject: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
    </head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0064B1 0%, #004a87 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 600;">Blaze AI</h1>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">MavHousing Intelligent Assistant</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="color: #6b7280; font-size: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
            RE: ${subject} | ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div style="color: #1f2937; font-size: 14px; line-height: 1.6;">
            ${content}
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
            This is an automated response from Blaze AI, the MavHousing Intelligent Assistant.
            <br>For further assistance, contact your housing office.
          </p>
        </div>
      </div>
    </body>
    </html>`;
  }

  /**
   * Format tool results into readable HTML.
   */
  formatToolResults(results: any[]): string {
    return results
      .map((r) => {
        if (typeof r === 'string') {
          try {
            const parsed = JSON.parse(r);
            if (Array.isArray(parsed)) {
              return this.formatArrayAsTable(parsed);
            }
            return this.formatObjectAsCard(parsed);
          } catch {
            return `<p>${r.replace(/\n/g, '<br>')}</p>`;
          }
        }
        if (Array.isArray(r)) {
          return this.formatArrayAsTable(r);
        }
        if (typeof r === 'object') {
          return this.formatObjectAsCard(r);
        }
        return `<p>${String(r)}</p>`;
      })
      .join('<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">');
  }

  private formatObjectAsCard(obj: any): string {
    const entries = Object.entries(obj)
      .filter(([, v]) => v !== null && v !== undefined)
      .map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
        const value = typeof v === 'object' ? JSON.stringify(v) : String(v);
        return `<tr>
          <td style="padding: 6px 12px; font-weight: 600; color: #374151; white-space: nowrap; vertical-align: top;">${label}</td>
          <td style="padding: 6px 12px; color: #4b5563;">${value}</td>
        </tr>`;
      })
      .join('');

    return `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #e5e7eb; border-radius: 8px;">
      ${entries}
    </table>`;
  }

  private formatArrayAsTable(arr: any[]): string {
    if (arr.length === 0) return '<p style="color: #6b7280;">No records found.</p>';

    const headers = Object.keys(arr[0]);
    const headerRow = headers
      .map((h) => {
        const label = h.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
        return `<th style="padding: 8px 12px; background: #0064B1; color: white; text-align: left; font-size: 12px;">${label}</th>`;
      })
      .join('');

    const rows = arr
      .map(
        (item, i) =>
          `<tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            ${headers.map((h) => `<td style="padding: 6px 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6;">${item[h] ?? ''}</td>`).join('')}
          </tr>`,
      )
      .join('');

    return `<div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #e5e7eb;">
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }
}
