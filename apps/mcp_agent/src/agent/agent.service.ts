import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RbacService, RbacContext } from '../rbac/rbac.service';
import { EmailReplyService } from '../email/email-reply.service';
import { GeminiService } from './gemini.service';
import { DatabaseTool } from '../tools/database.tool';

type QueryOperation = 'query' | 'findOne' | 'count' | 'aggregate' | 'groupBy';

type QueryPlan = {
  operation: QueryOperation;
  description: string;
  params: Record<string, any>;
};

type QueryResult = {
  description: string;
  data: string;
  rawData: any;
};

type KeywordIntent = {
  asksLease: boolean;
  asksRent: boolean;
  asksPayment: boolean;
  asksDue: boolean;
  asksApplication: boolean;
  asksMaintenance: boolean;
  asksOpenTickets: boolean;
  asksAvailability: boolean;
  asksAdminReport: boolean;
};

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly rbac: RbacService,
    private readonly emailReply: EmailReplyService,
    private readonly gemini: GeminiService,
    private readonly dbTool: DatabaseTool,
  ) {}

  private get internalApiUrl(): string {
    return this.config.get<string>('INTERNAL_API_URL') || 'http://localhost:3009';
  }

  /**
   * Main entry point: process a natural language request.
   * 1. Identify sender via RBAC
   * 2. Use Gemini to plan database queries based on full schema knowledge
   * 3. Execute queries via DatabaseTool
   * 4. Use Gemini to compose a natural reply
   * 5. Send the reply via email
   */
  async processRequest(senderEmail: string, message: string, subject?: string, senderName?: string): Promise<string> {
    const requestText = this.buildRequestText(message, subject);

    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`Processing request from: ${senderName || 'Unknown'} <${senderEmail}>`);
    this.logger.log(`Subject: ${subject || 'N/A'}`);
    this.logger.log(`Message: ${message.substring(0, 200)}...`);
    this.logger.log(`Request text: ${requestText.substring(0, 200)}...`);
    this.logger.log('='.repeat(60));

    // 1. Identify the sender
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      this.logger.warn(`Access denied for: ${senderEmail}`);
      const displayName = senderName || senderEmail.split('@')[0];
      await this.emailReply.sendNotRegistered(senderEmail, subject || 'MavHousing Query', displayName);
      return 'Not registered: Friendly reply sent.';
    }

    this.logger.log(`Identified: ${ctx.fName} ${ctx.lName} (${ctx.role})`);

    const intent = this.detectIntent(requestText, ctx.role);
    const shouldTriggerAdminReport = this.isAdminSender(ctx, senderName);
    const shouldForceAdminReportIntent =
      ctx.role === 'ADMIN' &&
      (intent.asksAdminReport || this.isGenericAdminGreeting(requestText, intent));
    const effectiveIntent: KeywordIntent = shouldForceAdminReportIntent
      ? { ...intent, asksAdminReport: true }
      : intent;
    const forceKeywordRouting = effectiveIntent.asksAdminReport;
    let usedKeywordRouting = false;

    // 2. Use Gemini to plan queries against the full database schema
    let queryPlans: QueryPlan[] = [];

    if (!forceKeywordRouting) {
      this.logger.log(`Planning queries with Gemini...`);
      queryPlans = await this.gemini.planQueries(
        requestText,
        ctx.role,
        ctx.fName,
        ctx.userId,
      );
    }

    if (forceKeywordRouting || queryPlans.length === 0) {
      const keywordPlans = this.buildKeywordQueryPlans(effectiveIntent, ctx);
      if (keywordPlans.length > 0) {
        queryPlans = keywordPlans;
        usedKeywordRouting = true;
        this.logger.log(
          `Using keyword routing with ${queryPlans.length} query operation(s).`,
        );
      }
    }

    this.logger.log(`Gemini planned ${queryPlans.length} query operation(s)`);

    // 3. Execute each query and collect results
    const queryResults: QueryResult[] = [];

    for (const plan of queryPlans) {
      this.logger.log(`Executing: ${plan.operation} - ${plan.description}`);
      try {
        // Apply RBAC filters for STUDENT role
        if (ctx.role === 'STUDENT') {
          this.applyStudentFilter(plan.params, ctx.userId, ctx.email);
        }

        let result: any;

        switch (plan.operation) {
          case 'query':
            result = await this.dbTool.query(plan.params as any);
            break;
          case 'findOne':
            result = await this.dbTool.findOne(plan.params as any);
            break;
          case 'count':
            result = await this.dbTool.count(plan.params as any);
            break;
          case 'aggregate':
            result = await this.dbTool.aggregate(plan.params as any);
            break;
          case 'groupBy':
            result = await this.dbTool.groupBy(plan.params as any);
            break;
          default:
            result = { success: false, data: `Unknown operation: ${plan.operation}` };
        }

        queryResults.push({
          description: plan.description,
          data: this.safeJsonStringify(result.data ?? result),
          rawData: result.data ?? result.count ?? result,
        });
      } catch (error) {
        this.logger.error(`Query "${plan.description}" failed: ${error}`);
        queryResults.push({
          description: plan.description,
          data: `Error: ${error}`,
          rawData: null,
        });
      }
    }

    if (
      ctx.role === 'STUDENT' &&
      (
        effectiveIntent.asksLease ||
        effectiveIntent.asksRent ||
        effectiveIntent.asksDue ||
        effectiveIntent.asksPayment ||
        effectiveIntent.asksApplication ||
        effectiveIntent.asksMaintenance ||
        effectiveIntent.asksOpenTickets
      )
    ) {
      await this.recoverStudentResultsByEmail(ctx, queryResults);
    }

    let reportTriggerStatus: string | undefined;
    if (shouldTriggerAdminReport) {
      reportTriggerStatus = await this.triggerAdminReportJob(
        senderEmail,
        requestText,
      );
    }

    // 4. Use Gemini to compose a natural reply
    let blazeReply: string;
    if (usedKeywordRouting || this.gemini.isInFallbackMode()) {
      this.logger.log(`Composing reply with keyword fallback...`);
      blazeReply = this.composeKeywordReply(
        ctx,
        requestText,
        effectiveIntent,
        queryResults,
        reportTriggerStatus,
      );
    } else {
      this.logger.log(`Composing reply with Gemini...`);
      blazeReply = await this.gemini.composeReply(
        ctx.fName,
        ctx.role,
        requestText,
        queryResults.map((r) => ({ description: r.description, data: r.data })),
      );

    }

    if (reportTriggerStatus) {
      blazeReply = this.appendReportQueueStatus(blazeReply, reportTriggerStatus);
    }

    // 5. Send the email reply
    await this.emailReply.replyToSender(
      senderEmail,
      subject || 'MavHousing Query',
      blazeReply,
    );

    this.logger.log(`Reply sent to ${senderEmail}`);
    return blazeReply;
  }

  /**
   * Enforce RBAC: ensure STUDENT queries are always scoped to their own userId.
   * This is a safety net on top of what Gemini generates.
   */
  private applyStudentFilter(
    params: Record<string, any>,
    userId: number,
    userEmail: string,
  ): void {
    const existingWhere = params.where || {};
    const model = (params.model || '').toLowerCase();

    // Lease visibility includes primary lease holder and listed occupants.
    if (model === 'lease') {
      params.where = {
        AND: [
          existingWhere,
          {
            OR: [
              { userId },
              { user: { email: userEmail } },
              { occupants: { some: { userId } } },
              { occupants: { some: { user: { email: userEmail } } } },
            ],
          },
        ],
      };
      return;
    }

    // Payment visibility follows lease ownership/occupancy.
    if (model === 'payment') {
      params.where = {
        AND: [
          existingWhere,
          {
            lease: {
              OR: [
                { userId },
                { user: { email: userEmail } },
                { occupants: { some: { userId } } },
                { occupants: { some: { user: { email: userEmail } } } },
              ],
            },
          },
        ],
      };
      return;
    }

    // Direct user-linked models
    if (model === 'application') {
      params.where = {
        AND: [
          existingWhere,
          {
            OR: [{ userId }, { user: { email: userEmail } }],
          },
        ],
      };
      return;
    }

    if (model === 'user') {
      params.where = {
        AND: [
          existingWhere,
          {
            OR: [{ userId }, { email: userEmail }],
          },
        ],
      };
      return;
    }

    if (model === 'occupant') {
      params.where = {
        AND: [existingWhere, { userId }],
      };
      return;
    }

    // MaintenanceRequest is linked through createdByUserId
    if (model === 'maintenancerequest') {
      params.where = {
        AND: [existingWhere, { createdByUserId: userId }],
      };
      return;
    }

    params.where = existingWhere;
  }

  private async recoverStudentResultsByEmail(
    ctx: RbacContext,
    queryResults: QueryResult[],
  ): Promise<void> {
    const leaseResult = queryResults.find((r) => r.description === 'Lease details');
    const paymentResult = queryResults.find(
      (r) => r.description === 'Recent payment activity',
    );

    const needsLeaseRecovery =
      !!leaseResult && (!Array.isArray(leaseResult.rawData) || leaseResult.rawData.length === 0);
    const needsPaymentRecovery =
      !!paymentResult &&
      (!Array.isArray(paymentResult.rawData) || paymentResult.rawData.length === 0);

    if (!needsLeaseRecovery && !needsPaymentRecovery) {
      return;
    }

    this.logger.warn(
      `Primary student query returned empty for ${ctx.email}, running sender-email recovery queries.`,
    );

    if (needsLeaseRecovery) {
      const leaseRecovery = await this.dbTool.query({
        model: 'lease',
        where: {
          OR: [
            { user: { email: ctx.email } },
            { occupants: { some: { user: { email: ctx.email } } } },
          ],
        },
        include: {
          unit: { include: { property: true } },
          room: true,
          bed: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: 3,
      });

      if (leaseRecovery.success && Array.isArray(leaseRecovery.data) && leaseRecovery.data.length > 0 && leaseResult) {
        leaseResult.rawData = leaseRecovery.data;
        leaseResult.data = this.safeJsonStringify(leaseRecovery.data);
      }
    }

    if (needsPaymentRecovery) {
      const paymentRecovery = await this.dbTool.query({
        model: 'payment',
        where: {
          lease: {
            OR: [
              { user: { email: ctx.email } },
              { occupants: { some: { user: { email: ctx.email } } } },
            ],
          },
        },
        orderBy: { transactionDate: 'desc' },
        take: 5,
      });

      if (paymentRecovery.success && Array.isArray(paymentRecovery.data) && paymentRecovery.data.length > 0 && paymentResult) {
        paymentResult.rawData = paymentRecovery.data;
        paymentResult.data = this.safeJsonStringify(paymentRecovery.data);
      }
    }
  }

  private safeJsonStringify(value: unknown): string {
    return JSON.stringify(
      value,
      (_, currentValue) =>
        typeof currentValue === 'bigint'
          ? currentValue.toString()
          : currentValue,
      2,
    );
  }

  private detectIntent(message: string, role: string): KeywordIntent {
    const text = message.toLowerCase();
    const asksLease = /(lease|contract|unit|room|bed assignment|lease status)/i.test(text);
    const asksRent = /(rent|balance|billing|bill)/i.test(text);
    const asksPayment = /(payment|paid|transaction)/i.test(text);
    const asksDue = /(due|deadline|when.*due|next payment)/i.test(text);
    const asksApplication = /(application|app status|application status|applicat\w*)/i.test(text);
    const asksMaintenance = /(maintenance|repair|ticket|issue|work order)/i.test(text);
    const asksOpenTickets = /(open ticket|open tickets|pending ticket|pending tickets|unresolved)/i.test(text);
    const asksAvailability = /(availability|available housing|vacancy|vacant|open bed|open unit)/i.test(text);
    const asksReport = /(report|summary|dashboard|metrics|analytics)/i.test(text);

    return {
      asksLease,
      asksRent,
      asksPayment,
      asksDue,
      asksApplication,
      asksMaintenance,
      asksOpenTickets,
      asksAvailability,
      asksAdminReport: role === 'ADMIN' && asksReport,
    };
  }

  private isGenericAdminGreeting(
    requestText: string,
    intent: KeywordIntent,
  ): boolean {
    const hasSpecificIntent =
      intent.asksLease ||
      intent.asksRent ||
      intent.asksPayment ||
      intent.asksDue ||
      intent.asksApplication ||
      intent.asksMaintenance ||
      intent.asksOpenTickets ||
      intent.asksAvailability ||
      intent.asksAdminReport;

    if (hasSpecificIntent) {
      return false;
    }

    const text = requestText.toLowerCase();
    const looksLikeGreeting = /(hi|hello|hey|good morning|good afternoon|good evening)/i.test(
      text,
    );
    const mentionsAdmin = /\badmin\b/i.test(text);

    return looksLikeGreeting && mentionsAdmin;
  }

  private isAdminSender(ctx: RbacContext, senderName?: string): boolean {
    if (ctx.role === 'ADMIN') {
      return true;
    }

    const senderText = `${senderName || ''} ${ctx.fName || ''} ${ctx.lName || ''}`.toLowerCase();
    return /\badmin\b/i.test(senderText);
  }

  private buildKeywordQueryPlans(intent: KeywordIntent, ctx: RbacContext): QueryPlan[] {
    const plans: QueryPlan[] = [];

    if (intent.asksAdminReport) {
      plans.push(
        {
          operation: 'groupBy',
          description: 'Admin report: users by role',
          params: { model: 'user', by: ['role'], _count: true, orderBy: { role: 'asc' } },
        },
        {
          operation: 'count',
          description: 'Admin report: active leases',
          params: { model: 'lease', where: { status: 'ACTIVE' } },
        },
        {
          operation: 'aggregate',
          description: 'Admin report: total successful payments',
          params: { model: 'payment', where: { isSuccessful: true }, _sum: { amountPaid: true }, _count: true },
        },
        {
          operation: 'groupBy',
          description: 'Admin report: maintenance by status',
          params: { model: 'maintenancerequest', by: ['status'], _count: true, orderBy: { status: 'asc' } },
        },
      );
      return plans;
    }

    if (intent.asksLease || intent.asksRent || intent.asksDue || intent.asksPayment) {
      plans.push({
        operation: 'query',
        description: 'Lease details',
        params: {
          model: 'lease',
          where: {
            OR: [
              { userId: ctx.userId },
              { user: { email: ctx.email } },
              { occupants: { some: { userId: ctx.userId } } },
              { occupants: { some: { user: { email: ctx.email } } } },
            ],
          },
          include: {
            unit: { include: { property: true } },
            room: true,
            bed: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 3,
        },
      });
    }

    if (intent.asksRent || intent.asksPayment || intent.asksDue) {
      plans.push({
        operation: 'query',
        description: 'Recent payment activity',
        params: {
          model: 'payment',
          where: {
            lease: {
              OR: [
                { userId: ctx.userId },
                { user: { email: ctx.email } },
                { occupants: { some: { userId: ctx.userId } } },
                { occupants: { some: { user: { email: ctx.email } } } },
              ],
            },
          },
          orderBy: { transactionDate: 'desc' },
          take: 5,
        },
      });
    }

    if (intent.asksApplication) {
      plans.push({
        operation: 'query',
        description: 'Application status',
        params: {
          model: 'application',
          where: {
            OR: [{ userId: ctx.userId }, { user: { email: ctx.email } }],
          },
          include: {
            preferredProperty: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        },
      });
    }

    if (intent.asksMaintenance || intent.asksOpenTickets) {
      const statusWhere = intent.asksOpenTickets
        ? { status: { in: ['OPEN', 'IN_PROGRESS'] } }
        : {};
      plans.push({
        operation: 'query',
        description: intent.asksOpenTickets
          ? 'Open maintenance tickets'
          : 'Maintenance tickets',
        params: {
          model: 'maintenancerequest',
          where: {
            AND: [
              {
                OR: [
                  { createdByUserId: ctx.userId },
                  { createdBy: { email: ctx.email } },
                ],
              },
              statusWhere,
            ],
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        },
      });
    }

    if (intent.asksAvailability) {
      plans.push({
        operation: 'query',
        description: 'Housing availability overview',
        params: {
          model: 'property',
          include: {
            units: {
              include: {
                leases: {
                  where: { status: 'ACTIVE' },
                  select: { leaseId: true },
                },
              },
            },
          },
          take: 10,
        },
      });
    }

    return plans;
  }

  private composeKeywordReply(
    ctx: RbacContext,
    message: string,
    intent: KeywordIntent,
    queryResults: QueryResult[],
    reportTriggerStatus?: string,
  ): string {
    if (intent.asksAdminReport) {
      return this.composeAdminReportEmail(
        ctx.fName,
        queryResults,
        reportTriggerStatus,
      );
    }

    const leaseRows = this.findResult(queryResults, 'Lease details');
    const paymentRows = this.findResult(queryResults, 'Recent payment activity');
    const applicationRows = this.findResult(queryResults, 'Application status');
    const maintenanceRows =
      this.findResult(queryResults, 'Open maintenance tickets') ||
      this.findResult(queryResults, 'Maintenance tickets');
    const availabilityRows = this.findResult(
      queryResults,
      'Housing availability overview',
    );
    const parts: string[] = [];

    parts.push(`<p>Hi ${ctx.fName},</p>`);
    parts.push(
      `<p>Thanks for your email. I reviewed your housing account and pulled the details below.</p>`,
    );

    if (intent.asksLease) {
      if (Array.isArray(leaseRows) && leaseRows.length > 0) {
        const leaseItems = leaseRows
          .map((lease: any) => {
            const propertyName = lease?.unit?.property?.name || 'Not assigned';
            const unit = lease?.unit?.unitNumber ? `Unit ${lease.unit.unitNumber}` : 'Unit not assigned';
            const room = lease?.room?.roomLetter ? `Room ${lease.room.roomLetter}` : 'Room not assigned';
            const bed = lease?.bed?.bedLetter ? `Bed ${lease.bed.bedLetter}` : 'Bed not assigned';
            return `<li><strong>Lease #${lease.leaseId ?? 'N/A'}</strong>, ${lease.status ?? 'Unknown status'}, ${propertyName}, ${unit}, ${room}, ${bed}, start ${this.formatDate(lease.startDate)}, end ${this.formatDate(lease.endDate)}</li>`;
          })
          .join('');
        parts.push(`<p><strong>Lease details</strong></p><ul style="padding-left:20px;line-height:1.7;">${leaseItems}</ul>`);
      } else {
        parts.push('<p><strong>Lease details</strong>: I could not find an active lease record for your account.</p>');
      }
    }

    if (intent.asksRent || intent.asksDue) {
      if (Array.isArray(leaseRows) && leaseRows.length > 0) {
        const dueLines = leaseRows
          .map((lease: any) => `<li>Lease #${lease.leaseId ?? 'N/A'}: total due ${this.formatMoney(lease.totalDue)}, current monthly due ${this.formatMoney(lease.dueThisMonth)}.</li>`)
          .join('');
        parts.push(`<p><strong>Rent and due details</strong></p><ul style="padding-left:20px;line-height:1.7;">${dueLines}</ul>`);
        parts.push('<p>I do not see an explicit due date field in the current lease record, so I can share balances but not an exact due day from this dataset.</p>');
      } else if (Array.isArray(paymentRows) && paymentRows.length > 0) {
        const paymentLines = paymentRows
          .map((payment: any) => `<li>${this.formatDate(payment.transactionDate)}: ${this.formatMoney(payment.amountPaid)} via ${payment.method ?? 'Unknown method'}, ${payment.isSuccessful ? 'successful' : 'not successful'}.</li>`)
          .join('');
        parts.push('<p><strong>Rent and due details</strong>: I could not find an active lease billing row, but I did find recent payment records for your email account.</p>');
        parts.push(`<ul style="padding-left:20px;line-height:1.7;">${paymentLines}</ul>`);
      } else {
        parts.push('<p><strong>Rent and due details</strong>: I could not locate lease billing records for your account.</p>');
      }
    }

    if (intent.asksPayment) {
      if (Array.isArray(paymentRows) && paymentRows.length > 0) {
        const paymentLines = paymentRows
          .map((payment: any) => `<li>${this.formatDate(payment.transactionDate)}: ${this.formatMoney(payment.amountPaid)} via ${payment.method ?? 'Unknown method'}, ${payment.isSuccessful ? 'successful' : 'not successful'}.</li>`)
          .join('');
        parts.push(`<p><strong>Recent payment activity</strong></p><ul style="padding-left:20px;line-height:1.7;">${paymentLines}</ul>`);
      } else {
        parts.push('<p><strong>Recent payment activity</strong>: No recent payment records were found.</p>');
      }
    }

    if (intent.asksApplication) {
      if (Array.isArray(applicationRows) && applicationRows.length > 0) {
        const appLines = applicationRows
          .map((application: any) => {
            const property =
              application?.preferredProperty?.name || 'No preferred property';
            return `<li>Application #${application.appId ?? 'N/A'} for term ${application.term ?? 'N/A'} is currently <strong>${application.status ?? 'UNKNOWN'}</strong>, preferred property: ${property}.</li>`;
          })
          .join('');
        parts.push(
          `<p><strong>Application status</strong></p><ul style="padding-left:20px;line-height:1.7;">${appLines}</ul>`,
        );
      } else {
        parts.push(
          '<p><strong>Application status</strong>: I could not find an application record for your account.</p>',
        );
      }
    }

    if (intent.asksMaintenance || intent.asksOpenTickets) {
      if (Array.isArray(maintenanceRows) && maintenanceRows.length > 0) {
        const ticketLines = maintenanceRows
          .map((ticket: any) => `<li>Ticket #${ticket.requestId ?? 'N/A'}: ${ticket.category ?? 'GENERAL'} at ${ticket.location || 'N/A'}, status <strong>${ticket.status ?? 'UNKNOWN'}</strong>, priority ${ticket.priority ?? 'N/A'}, created ${this.formatDate(ticket.createdAt)}.</li>`)
          .join('');
        parts.push(
          `<p><strong>${intent.asksOpenTickets ? 'Open tickets' : 'Maintenance tickets'}</strong></p><ul style="padding-left:20px;line-height:1.7;">${ticketLines}</ul>`,
        );
      } else {
        parts.push(
          `<p><strong>${intent.asksOpenTickets ? 'Open tickets' : 'Maintenance tickets'}</strong>: I could not find matching maintenance requests for your account.</p>`,
        );
      }
    }

    if (intent.asksAvailability) {
      if (Array.isArray(availabilityRows) && availabilityRows.length > 0) {
        const availabilityLines = availabilityRows
          .map((property: any) => {
            const totalUnits = Array.isArray(property.units)
              ? property.units.length
              : 0;
            const activeLeaseCount = Array.isArray(property.units)
              ? property.units.reduce(
                  (sum: number, unit: any) =>
                    sum + (Array.isArray(unit.leases) ? unit.leases.length : 0),
                  0,
                )
              : 0;
            return `<li>${property.name ?? 'Unknown property'}: ${totalUnits} units, ${activeLeaseCount} active unit-level leases recorded.</li>`;
          })
          .join('');
        parts.push(
          `<p><strong>Housing availability overview</strong></p><ul style="padding-left:20px;line-height:1.7;">${availabilityLines}</ul>`,
        );
      } else {
        parts.push(
          '<p><strong>Housing availability overview</strong>: No availability data was found right now.</p>',
        );
      }
    }

    if (
      !intent.asksLease &&
      !intent.asksRent &&
      !intent.asksDue &&
      !intent.asksPayment &&
      !intent.asksApplication &&
      !intent.asksMaintenance &&
      !intent.asksOpenTickets &&
      !intent.asksAvailability
    ) {
      parts.push(
        `<p>I can help with lease details, rent balances, payment history, maintenance requests, and housing availability. If you tell me which one you want, I can send the exact details.</p>`,
      );
    }

    parts.push(
      `<p>If you want, I can also send this as a shorter summary or as a detailed breakdown.</p>`,
    );
    parts.push('<p>Best regards,<br>Blaze AI</p>');

    return parts.join('');
  }

  private composeAdminReportEmail(
    userName: string,
    queryResults: QueryResult[],
    reportTriggerStatus?: string,
  ): string {
    const usersByRole = this.findResult(queryResults, 'Admin report: users by role');
    const activeLeases = this.findResult(queryResults, 'Admin report: active leases');
    const paymentSummary = this.findResult(
      queryResults,
      'Admin report: total successful payments',
    );
    const maintenanceByStatus = this.findResult(
      queryResults,
      'Admin report: maintenance by status',
    );

    const roleLines = Array.isArray(usersByRole)
      ? usersByRole
          .map((row: any) => `<li>${row.role ?? 'UNKNOWN'}: ${row._count?._all ?? 0}</li>`)
          .join('')
      : '<li>No role data available.</li>';

    const maintenanceLines = Array.isArray(maintenanceByStatus)
      ? maintenanceByStatus
          .map((row: any) => `<li>${row.status ?? 'UNKNOWN'}: ${row._count?._all ?? 0}</li>`)
          .join('')
      : '<li>No maintenance status data available.</li>';

    const activeLeaseCount =
      typeof activeLeases === 'number'
        ? activeLeases
        : Number(activeLeases?.count ?? 0);

    const paymentTotal = paymentSummary?._sum?.amountPaid;
    const paymentCount = paymentSummary?._count?._all ?? 0;

    return [
      `<p>Hi ${userName},</p>`,
      '<p>Here is your requested MavHousing admin report.</p>',
      reportTriggerStatus
        ? `<p><strong>Report queue status</strong>: ${reportTriggerStatus}</p>`
        : '',
      '<p><strong>Portfolio snapshot</strong></p>',
      `<ul style="padding-left:20px;line-height:1.7;"><li>Active leases: ${activeLeaseCount}</li><li>Total successful payments recorded: ${paymentCount}</li><li>Total successful payment amount: ${this.formatMoney(paymentTotal)}</li></ul>`,
      '<p><strong>Users by role</strong></p>',
      `<ul style="padding-left:20px;line-height:1.7;">${roleLines}</ul>`,
      '<p><strong>Maintenance requests by status</strong></p>',
      `<ul style="padding-left:20px;line-height:1.7;">${maintenanceLines}</ul>`,
      '<p>If you want, I can send a property-level report next.</p>',
      '<p>Best regards,<br>Blaze AI</p>',
    ].join('');
  }

  private detectRequestedReportType(
    requestText: string,
  ): 'property' | 'lease' | 'finance' | 'occupancy' {
    const text = requestText.toLowerCase();
    if (/(finance|financial|payment|revenue|money)/i.test(text)) {
      return 'finance';
    }
    if (/(lease|ledger|contract)/i.test(text)) {
      return 'lease';
    }
    if (/(property|resident roster|roster)/i.test(text)) {
      return 'property';
    }
    return 'occupancy';
  }

  private appendReportQueueStatus(replyHtml: string, status: string): string {
    const statusLine = `<p><strong>Report queue status</strong>: ${status}</p>`;

    if (replyHtml.includes('</p>Best regards,<br>Blaze AI</p>')) {
      return replyHtml.replace(
        '</p>Best regards,<br>Blaze AI</p>',
        `${statusLine}<p>Best regards,<br>Blaze AI</p>`,
      );
    }

    return `${replyHtml}${statusLine}`;
  }

  private async triggerAdminReportJob(
    senderEmail: string,
    requestText: string,
  ): Promise<string> {
    const queueTargets: Array<{
      reportType: 'property' | 'lease' | 'finance' | 'occupancy';
      queueName: string;
      payload: Record<string, any>;
    }> = [
      {
        reportType: 'property',
        queueName: 'property-reports',
        payload: {},
      },
      {
        reportType: 'lease',
        queueName: 'lease-reports',
        payload: {},
      },
      {
        reportType: 'finance',
        queueName: 'finance-reports',
        payload: this.buildFinanceReportPayload(requestText),
      },
      {
        reportType: 'occupancy',
        queueName: 'occupancy-report',
        payload: {},
      },
    ];

    const statusLines: string[] = [];

    for (const target of queueTargets) {
      try {
        const response = await fetch(
          `${this.internalApiUrl}/queues/api/queues/${target.queueName}/add`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `email-admin-${target.reportType}-${Date.now()}`,
              data: target.payload,
            }),
          },
        );

        if (response.ok) {
          this.logger.log(
            `Admin report queued from email ${senderEmail}: ${target.reportType} (${target.queueName}).`,
          );
          statusLines.push(
            `Queued ${target.reportType} report (${target.queueName}).`,
          );
        } else {
          this.logger.warn(
            `Failed to queue ${target.reportType} report for ${senderEmail}. Queue API status: ${response.status}.`,
          );
          statusLines.push(
            `Failed ${target.reportType} (${target.queueName}): HTTP ${response.status}.`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error while queueing ${target.reportType} report for ${senderEmail}: ${error}`,
        );
        statusLines.push(
          `Failed ${target.reportType} (${target.queueName}): internal API unreachable.`,
        );
      }
    }

    return statusLines.join(' ');
  }

  private buildFinanceReportPayload(requestText: string): Record<string, any> {
    const payload: Record<string, any> = {};
    const netIdMatch = requestText.match(/\b[a-z]{2,6}\d{2,6}\b/i);

    if (netIdMatch) {
      payload.netId = netIdMatch[0].toLowerCase();
    }
    if (/sort\s+by\s+person|by\s+person/i.test(requestText)) {
      payload.sortBy = 'person';
    }
    if (/sort\s+by\s+date|by\s+date/i.test(requestText)) {
      payload.sortBy = 'date';
    }

    return payload;
  }

  private findResult(queryResults: QueryResult[], description: string): any {
    return queryResults.find((result) => result.description === description)?.rawData;
  }

  private formatMoney(value: unknown): string {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return '$0.00';
    }
    return `$${numeric.toFixed(2)}`;
  }

  private formatDate(value: unknown): string {
    if (!value) {
      return 'N/A';
    }
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private buildRequestText(message: string, subject?: string): string {
    const cleanMessage = (message || '').trim();
    const cleanSubject = (subject || '').trim();

    return [cleanSubject, cleanMessage].filter(Boolean).join(' | ');
  }
}
