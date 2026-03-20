import { TemplateContext } from './application.templates';

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

import { paymentFailed, paymentSuccessful } from './payment.templates';

import {
  uploadFailed,
  missingDocuments,
  deadlinePassed,
} from './document.templates';

import {
  leaseAvailable,
  leaseOfferIssued,
  leaseAcceptedWelcome,
} from './lease.templates';

import { forgotPassword } from './auth.templates';

import { bulletinPosted } from './bulletin.templates';

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
  welcome,
  submitted,
  incomplete,
  deleted,
  decisionMade,
  approved,
  rejected,
  roomAssignment,
  announcement,

  paymentFailed,
  paymentSuccessful,

  uploadFailed,
  missingDocuments,
  deadlinePassed,

  leaseAvailable,
  leaseOfferIssued,
  leaseAcceptedWelcome,

  forgotPassword,

  bulletinPosted,

  maintenanceOpened,
  maintenanceClosed,
  maintenanceCommentAdded,
};

export type { TemplateContext };