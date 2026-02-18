import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio } from 'twilio';
import { SMS_TEMPLATES } from './sms.templates';

@Injectable()
export class SmsService {
  private client: Twilio;
  private fromNumber: string;

  constructor(private config: ConfigService) {
    const sid = this.config.get<string>('TWILIO_SID');
    const token = this.config.get<string>('TWILIO_AUTH_TOKEN');
    this.fromNumber = this.config.get<string>('TWILIO_PH_NUM') || '';
    this.client = new Twilio(sid, token);
  }

  /**
   * Returns all available SMS template names.
   */
  getTemplateNames(): string[] {
    return Object.keys(SMS_TEMPLATES);
  }

  /**
   * Send an SMS using a named template.
   * @param templateName - key from SMS_TEMPLATES
   * @param to - recipient phone number (E.164)
   * @param firstName - for personalization
   * @param portalUrl - optional portal URL override
   */
  async sendTemplateSms(
    templateName: string,
    to: string,
    firstName: string,
    context?: string,
    portalUrl?: string,
  ): Promise<{ success: boolean; message: string; sid?: string }> {
    const generator = SMS_TEMPLATES[templateName];
    if (!generator) {
      throw new BadRequestException(
        `Unknown SMS template "${templateName}". Available: ${this.getTemplateNames().join(', ')}`,
      );
    }

    const body = generator({ firstName, portalUrl, context });

    try {
      const result = await this.client.messages.create({
        to,
        from: this.fromNumber,
        body,
      });
      return { success: true, message: 'SMS sent', sid: result.sid };
    } catch (e) {
      console.error('Failed to send SMS:', e);
      return { success: false, message: `SMS not sent: ${e.message}` };
    }
  }
}
