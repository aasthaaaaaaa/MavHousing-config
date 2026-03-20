import { baseLayout } from './base-layout';
import { TemplateContext } from './application.templates';

const defaultPortalUrl = 'https://mavhousing.uta.edu';

function portalLink(portalUrl?: string): string {
  const url = portalUrl || defaultPortalUrl;
  return `<a href="${url}" class="cta-button">View My Requests</a>`;
}

export function maintenanceOpened(ctx: TemplateContext) {
  return {
    subject: 'Maintenance Request Submitted',
    html: baseLayout(`
      <h1>Request Submitted</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your maintenance request has been <span class="highlight">received and is now open</span>. Our team will review it shortly and follow up with next steps.</p>
      ${ctx.context ? `<p><strong>Request:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>For urgent issues, contact Housing Maintenance at <strong>817-272-2791</strong>.</p>
    `),
  };
}

export function maintenanceClosed(ctx: TemplateContext) {
  return {
    subject: 'Maintenance Request Resolved',
    html: baseLayout(`
      <h1>Request Resolved</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your maintenance request has been <span class="highlight">resolved and closed</span>. We hope everything is in order.</p>
      ${ctx.context ? `<p><strong>Resolution:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>If the issue persists, please submit a new request or contact Housing Maintenance at <strong>817-272-2791</strong>.</p>
    `),
  };
}

export function maintenanceCommentAdded(ctx: TemplateContext) {
  return {
    subject: 'New Update on Your Maintenance Request',
    html: baseLayout(`
      <h1>New Comment Added</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>There is a <span class="highlight">new update</span> on your maintenance request. Log in to the portal to view the latest comment from our team.</p>
      ${ctx.context ? `<p><strong>Comment:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
    `),
  };
}
