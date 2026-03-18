/**
 * Lease / contract email templates.
 */

import { baseLayout } from './base-layout';
import { TemplateContext } from './application.templates';

const defaultPortalUrl = 'https://mavhousing.uta.edu';

function portalLink(portalUrl?: string): string {
  const url = portalUrl || defaultPortalUrl;
  return `<a href="${url}" class="cta-button">Go to Housing Portal</a>`;
}

// ─── 1. Lease Available (legacy alias) ───────────────────────────────────────

export function leaseAvailable(ctx: TemplateContext) {
  return leaseOfferIssued(ctx);
}

// ─── 2. Lease Offer Issued ────────────────────────────────────────────────────

export function leaseOfferIssued(ctx: TemplateContext) {
  return {
    subject: 'Your Housing Lease Offer is Ready',
    html: baseLayout(`
      <h1>Lease Offer Issued</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>A housing lease offer has been issued and is now awaiting your signature. Please log in to the portal to <span class="highlight">review and sign</span> your agreement.</p>
      ${ctx.context ? `<p><strong>Details:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Questions about your lease? Contact Apartment &amp; Residence Life at <strong>817-272-2926</strong> or <a href="mailto:livingoncampus@uta.edu">livingoncampus@uta.edu</a>.</p>
    `),
  };
}

// ─── 3. Lease Accepted — Welcome ─────────────────────────────────────────────

export function leaseAcceptedWelcome(ctx: TemplateContext) {
  return {
    subject: 'Welcome to UTA Housing — Lease Confirmed!',
    html: baseLayout(`
      <h1>Welcome to UTA Housing! 🎉</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your lease has been <span class="highlight">signed and confirmed</span>. We're excited to have you as part of the UTA Housing community!</p>
      ${ctx.context ? `<p><strong>Lease Details:</strong></p><p>${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>For move-in information or questions, contact Apartment &amp; Residence Life at <strong>817-272-2926</strong> or <a href="mailto:livingoncampus@uta.edu">livingoncampus@uta.edu</a>.</p>
    `),
  };
}
