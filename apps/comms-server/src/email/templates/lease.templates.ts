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

// ─── 1. Lease Available ──────────────────────────────────────────────────────

export function leaseAvailable(ctx: TemplateContext) {
  return {
    subject: 'Your Housing Lease is Ready',
    html: baseLayout(`
      <h1>Lease Available</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your housing lease agreement is now ready for review. Please log in to the portal to <span class="highlight">review and sign</span> your lease at your earliest convenience.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>If you have questions about the lease terms, contact Apartment &amp; Residence Life at <strong>817-272-2926</strong> or <a href="mailto:livingoncampus@uta.edu">livingoncampus@uta.edu</a>.</p>
    `),
  };
}
