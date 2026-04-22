import { baseLayout } from './base-layout';
import { TemplateContext } from './application.templates';

const defaultPortalUrl = 'https://mavhousing.uta.edu';

function portalLink(portalUrl?: string): string {
  const url = portalUrl || defaultPortalUrl;
  return `<a href="${url}" class="cta-button">Go to Housing Portal</a>`;
}

export function uploadFailed(ctx: TemplateContext) {
  return {
    subject: 'Document Upload Failed',
    html: baseLayout(`
      <h1>Upload Failed</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Your recent document upload <span class="highlight">could not be completed</span>. Please try uploading the document again through the housing portal.</p>
      ${ctx.context ? `<p><strong>Details:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>Accepted formats: PDF, JPG, PNG (max 10 MB). Contact us if the issue persists.</p>
    `),
  };
}

export function missingDocuments(ctx: TemplateContext) {
  return {
    subject: 'Action Required — Additional Information Needed',
    html: baseLayout(`
      <h1>Information Requested</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>Our team has reviewed your application and requires <span class="highlight">additional information</span> before we can proceed. Please log in to the portal and provide the requested details.</p>
      ${ctx.context ? `<p><strong>Required:</strong> ${ctx.context}</p>` : ''}
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>If you have questions, contact Housing Operations at <strong>817-272-2791</strong> or <a href="mailto:blaze@mavhousing.xyz">blaze@mavhousing.xyz</a>.</p>
    `),
  };
}

export function deadlinePassed(ctx: TemplateContext) {
  return {
    subject: 'Housing Application Deadline Has Passed',
    html: baseLayout(`
      <h1>Deadline Passed</h1>
      <p>Hi ${ctx.firstName},</p>
      <p>The housing application deadline has <span class="highlight">passed</span>. Please check the housing portal for information about next steps or late submission options.</p>
      <p>${portalLink(ctx.portalUrl)}</p>
      <hr class="divider" />
      <p>For assistance, contact Housing Operations at <strong>817-272-2791</strong>.</p>
    `),
  };
}
