/**
 * Central registry of all email templates.
 * Each entry maps a template name to its generator function.
 * Generator functions accept TemplateContext and return { subject, html }.
 */

import { TemplateContext } from './application.templates';

// Application templates
import {
  welcome,
  submitted,
  incomplete,
  deleted,
  decisionMade,
  approved,
  rejected,
  roomAssignment,
  announcement,
} from './application.templates';

// Payment templates
import { paymentFailed, paymentSuccessful } from './payment.templates';

// Document / status templates
import {
  uploadFailed,
  missingDocuments,
  deadlinePassed,
} from './document.templates';

// Lease templates
import {
  leaseAvailable,
  leaseOfferIssued,
  leaseAcceptedWelcome,
} from './lease.templates';

// Auth templates
import { forgotPassword } from './auth.templates';

// Bulletin templates
import { bulletinPosted } from './bulletin.templates';

// Maintenance templates
import {
  maintenanceOpened,
  maintenanceClosed,
  maintenanceCommentAdded,
} from './maintenance.templates';

export type TemplateGenerator = (ctx: TemplateContext) => {
  subject: string;
  html: string;
};

export const EMAIL_TEMPLATES: Record<string, TemplateGenerator> = {
  // ── Application ──
  welcome,
  submitted,
  incomplete,
  deleted,
  decisionMade,
  approved,
  rejected,
  roomAssignment,
  announcement,

  // ── Payment ──
  paymentFailed,
  paymentSuccessful,

  // ── Document / Status ──
  uploadFailed,
  missingDocuments,
  deadlinePassed,

  // ── Lease ──
  leaseAvailable,
  leaseOfferIssued,
  leaseAcceptedWelcome,

  // ── Auth ──
  forgotPassword,

  // ── Bulletin ──
  bulletinPosted,

  // ── Maintenance ──
  maintenanceOpened,
  maintenanceClosed,
  maintenanceCommentAdded,
};

export type { TemplateContext };

