/**
 * Payment-related email templates.
 */

import { baseLayout } from './base-layout';
import { TemplateContext } from './application.templates';

const defaultPortalUrl = 'https://mavhousing.uta.edu';

function portalLink(portalUrl?: string): string {
  const url = portalUrl || defaultPortalUrl;
  return `<a href="${url}" class="cta-button">Go to Housing Portal</a>`;
}

// ─── 1. Payment Failed ──────────────────────────────────────────────────────

export function paymentFailed(ctx: TemplateContext) {
  return {
    subject: 'Payment Failed — Action Required',
    html: baseLayout(`
      <h1>Payment Failed</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your recent housing payment <span class="highlight">could not be processed</span>. Please log in to the housing portal and retry your payment to avoid any disruption.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>If you continue to experience issues, contact Housing Operations at <strong>817-272-2791</strong>.</p>
    `),
  };
}

// ─── 2. Payment Successful ───────────────────────────────────────────────────

export function paymentSuccessful(ctx: TemplateContext) {
  return {
    subject: 'Payment Received Successfully',
    html: baseLayout(`
      <h1>Payment Received</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your housing payment has been <span class="highlight">received successfully</span>. A receipt is available in your housing portal.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Thank you for your timely payment!</p>
    `),
  };
}
