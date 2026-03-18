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
    subject: 'Payment Confirmed',
    html: baseLayout(`
      <h1>Payment Confirmed</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your housing payment has been <span class="highlight">processed successfully</span>. A record of this transaction is available in your housing portal.</p>
      ${ctx.context ? `<p><strong>Details:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Thank you for your payment. If you have any concerns, contact Housing Operations at <a href="mailto:housing@uta.edu">housing@uta.edu</a>.</p>
    `),
  };
}
