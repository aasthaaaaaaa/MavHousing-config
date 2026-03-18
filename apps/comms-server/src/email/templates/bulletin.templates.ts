/**
 * Bulletin board email templates.
 */

import { baseLayout } from './base-layout';
import { TemplateContext } from './application.templates';

const defaultPortalUrl = 'https://mavhousing.uta.edu';

function portalLink(portalUrl?: string): string {
  const url = portalUrl || defaultPortalUrl;
  return `<a href="${url}" class="cta-button">View Bulletin Board</a>`;
}

// ─── 1. Bulletin Posted ───────────────────────────────────────────────────────

export function bulletinPosted(ctx: TemplateContext) {
  return {
    subject: 'New Post on the Housing Bulletin Board',
    html: baseLayout(`
      <h1>New Bulletin Post</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>${ctx.context
        ? `<span class="highlight">${ctx.context}</span> just posted something on the board — check it out!`
        : 'There is a new post on the Housing Bulletin Board. Log in to view the latest update.'
      }</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>You are receiving this because the post is relevant to your housing assignment. Contact Housing Operations at <a href="mailto:housing@uta.edu">housing@uta.edu</a> for questions.</p>
    `),
  };
}
