/**
 * SMS templates for all notification types.
 * Each function receives context and returns plain text message string.
 */

export interface SmsContext {
  firstName: string;
  portalUrl?: string;
  context?: string;
}

const portal = 'mavhousing.uta.edu';

export type SmsGenerator = (ctx: SmsContext) => string;

export const SMS_TEMPLATES: Record<string, SmsGenerator> = {
  // ── Application ──
  welcome: (ctx) =>
    `Mav Housing: Welcome ${ctx.firstName}! Your account is ready. Log in to start your application: ${ctx.portalUrl || portal}`,

  submitted: (ctx) =>
    `Mav Housing: Hi ${ctx.firstName}, your housing application was submitted successfully.`,

  incomplete: (ctx) =>
    `Mav Housing: Reminder — your housing application is incomplete. Please finish before the deadline: ${ctx.portalUrl || portal}`,

  deleted: (ctx) =>
    `Mav Housing: Hi ${ctx.firstName}, your housing application was deleted.${ctx.context ? ' ' + ctx.context : ''} Contact Housing at 817-272-2791 if this was a mistake.`,

  decisionMade: (ctx) =>
    `Mav Housing: A decision has been made on your housing application. Check the portal: ${ctx.portalUrl || portal}`,

  approved: (ctx) =>
    `Mav Housing: Congrats ${ctx.firstName}! Your housing application is approved. View room details: ${ctx.portalUrl || portal}`,

  rejected: (ctx) =>
    `Mav Housing: Hi ${ctx.firstName}, your housing application was not approved.${ctx.context ? ' Reason: ' + ctx.context : ' Check your email for details.'}`,

  roomAssignment: (ctx) =>
    `Mav Housing: Your room assignment is ready. Log in to view details: ${ctx.portalUrl || portal}`,

  announcement: (ctx) =>
    `Mav Housing: Hi ${ctx.firstName}, ${ctx.context || 'please check your email/portal for an important housing announcement.'}`,

  // ── Payment ──
  paymentFailed: (ctx) =>
    `Mav Housing: Payment failed. Please retry in the housing portal: ${ctx.portalUrl || portal}`,

  paymentSuccessful: (ctx) =>
    `Mav Housing: Payment received successfully. Receipt available in portal: ${ctx.portalUrl || portal}`,

  // ── Document / Status ──
  uploadFailed: (ctx) =>
    `Mav Housing: Document upload failed. Please re-upload in the portal: ${ctx.portalUrl || portal}`,

  missingDocuments: (ctx) =>
    `Mav Housing: Hi ${ctx.firstName}, your application is missing documents.${ctx.context ? ' Missing: ' + ctx.context : ''} Upload ASAP: ${ctx.portalUrl || portal}`,

  deadlinePassed: (ctx) =>
    `Mav Housing: Housing deadline has passed. Check portal for next steps: ${ctx.portalUrl || portal}`,

  // ── Lease ──
  leaseAvailable: (ctx) =>
    `Mav Housing: Your housing lease is ready. Please review & sign in the portal: ${ctx.portalUrl || portal}`,
};
