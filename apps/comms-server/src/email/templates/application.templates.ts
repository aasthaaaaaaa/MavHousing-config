/**
 * Application-related email templates.
 * Each function receives context and returns { subject, html } for the email body (inner content only).
 */

import { baseLayout } from './base-layout';

export interface TemplateContext {
  firstName: string;
  portalUrl?: string;
  context?: string;
}

const defaultPortalUrl = 'https://mavhousing.uta.edu';

function portalLink(portalUrl?: string): string {
  const url = portalUrl || defaultPortalUrl;
  return `<a href="${url}" class="cta-button">Go to Housing Portal</a>`;
}

// ─── 1. Welcome ──────────────────────────────────────────────────────────────

export function welcome(ctx: TemplateContext) {
  return {
    subject: 'Welcome to Mav Housing!',
    html: baseLayout(`
      <h1>Welcome, ${ctx.firstName}!</h1>
      <p>Your Mav Housing account is ready. You can now log in to start your housing application.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>If you have any questions, contact Housing Operations at <strong>817-272-2791</strong> or <a href="mailto:housing@uta.edu">housing@uta.edu</a>.</p>
    `),
  };
}

// ─── 2. Application Submitted ────────────────────────────────────────────────

export function submitted(ctx: TemplateContext) {
  return {
    subject: 'Application Submitted Successfully',
    html: baseLayout(`
      <h1>Application Submitted</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your housing application has been <span class="highlight">submitted successfully</span>. We'll review it and notify you once a decision is made.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Keep an eye on your email and the housing portal for updates.</p>
    `),
  };
}

// ─── 3. Application Incomplete ───────────────────────────────────────────────

export function incomplete(ctx: TemplateContext) {
  return {
    subject: 'Reminder: Complete Your Housing Application',
    html: baseLayout(`
      <h1>Application Incomplete</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your housing application is <span class="highlight">incomplete</span>. Please finish and submit it before the deadline to secure your housing.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Need help? Contact us at <a href="mailto:housing@uta.edu">housing@uta.edu</a>.</p>
    `),
  };
}

// ─── 4. Application Deleted ──────────────────────────────────────────────────

export function deleted(ctx: TemplateContext) {
  return {
    subject: 'Your Housing Application Was Deleted',
    html: baseLayout(`
      <h1>Application Deleted</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your housing application has been <span class="highlight">deleted</span>. If this was a mistake or you did not request this, please contact Housing Operations immediately.</p>
      ${ctx.context ? `<p><strong>Details:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Housing Operations: <strong>817-272-2791</strong> · <a href="mailto:housing@uta.edu">housing@uta.edu</a></p>
    `),
  };
}

// ─── 5. Decision Made ────────────────────────────────────────────────────────

export function decisionMade(ctx: TemplateContext) {
  return {
    subject: 'Decision Made on Your Housing Application',
    html: baseLayout(`
      <h1>Decision Made</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>A decision has been made on your housing application. Please log in to the housing portal to view the details.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
    `),
  };
}

// ─── 6. Application Approved ─────────────────────────────────────────────────

export function approved(ctx: TemplateContext) {
  return {
    subject: 'Congratulations! Your Application is Approved',
    html: baseLayout(`
      <h1>🎉 Application Approved!</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Congratulations! Your housing application has been <span class="highlight">approved</span>. Log in to view your room assignment details and next steps.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Welcome to on-campus living at UTA!</p>
    `),
  };
}

// ─── 7. Application Rejected ─────────────────────────────────────────────────

export function rejected(ctx: TemplateContext) {
  return {
    subject: 'Housing Application Update',
    html: baseLayout(`
      <h1>Application Update</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>We regret to inform you that your housing application was <span class="highlight">not approved</span> at this time.</p>
      ${ctx.context ? `<p><strong>Reason:</strong> ${ctx.context}</p>` : '<p>Please check your email for more details about this decision.</p>'}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>If you have questions, contact Housing Operations at <strong>817-272-2791</strong>.</p>
    `),
  };
}

// ─── 8. Room Assignment ──────────────────────────────────────────────────────

export function roomAssignment(ctx: TemplateContext) {
  return {
    subject: 'Your Room Assignment is Ready',
    html: baseLayout(`
      <h1>Room Assignment Ready</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your room assignment is now available. Log in to the housing portal to view your room details, move-in instructions, and other important information.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
    `),
  };
}

// ─── 9. Announcement ─────────────────────────────────────────────────────────

export function announcement(ctx: TemplateContext) {
  return {
    subject: 'Important Housing Announcement',
    html: baseLayout(`
      <h1>Housing Update</h1>
      <p>Hi ${ctx.firstName},</p>
      ${ctx.context ? `<p>${ctx.context}</p>` : '<p>There is an important announcement from UTA Housing. Please check your housing portal or email for full details.</p>'}
      <p>${portalLink(ctx.portalUrl)}</p>
    `),
  };
}
