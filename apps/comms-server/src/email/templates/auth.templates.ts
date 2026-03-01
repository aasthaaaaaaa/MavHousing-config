import { TemplateContext } from './application.templates';
import { baseLayout } from './base-layout';

export const forgotPassword = (ctx: TemplateContext) => {
  const html = baseLayout(`
      <h1>Password Reset Verification</h1>
      <p>Hello ${ctx.firstName},</p>
      <p>We received a request to reset your password for your Mav Housing account.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.1em;">Your Verification Code</p>
        <h2 style="font-size: 36px; color: #1f2937; margin: 0; letter-spacing: 0.2em;">${ctx.context}</h2>
      </div>
      <p>This code will expire in <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
      <p>For security, never share this code with anyone. Our staff will never ask for your verification code.</p>
      <hr class="divider" />
      <p>Mav Housing • University of Texas at Arlington</p>
    `);

  return {
    subject: `Your Verification Code: ${ctx.context}`,
    html,
  };
};
