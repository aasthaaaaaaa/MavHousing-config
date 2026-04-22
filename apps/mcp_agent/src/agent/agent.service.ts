import { Injectable, Logger } from '@nestjs/common';
import { RbacService, RbacContext } from '../rbac/rbac.service';
import { EmailReplyService } from '../email/email-reply.service';
import { GeminiService } from './gemini.service';
import { DatabaseTool } from '../tools/database.tool';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly rbac: RbacService,
    private readonly emailReply: EmailReplyService,
    private readonly gemini: GeminiService,
    private readonly dbTool: DatabaseTool,
  ) {}

  /**
   * Main entry point: process a natural language request.
   * 1. Identify sender via RBAC
   * 2. Use Gemini to plan database queries based on full schema knowledge
   * 3. Execute queries via DatabaseTool
   * 4. Use Gemini to compose a natural reply
   * 5. Send the reply via email
   */
  async processRequest(senderEmail: string, message: string, subject?: string, senderName?: string): Promise<string> {
    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`Processing request from: ${senderName || 'Unknown'} <${senderEmail}>`);
    this.logger.log(`Subject: ${subject || 'N/A'}`);
    this.logger.log(`Message: ${message.substring(0, 200)}...`);
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

    // 2. Use Gemini to plan queries against the full database schema
    this.logger.log(`Planning queries with Gemini...`);
    const queryPlans = await this.gemini.planQueries(message, ctx.role, ctx.fName, ctx.userId);

    this.logger.log(`Gemini planned ${queryPlans.length} query operation(s)`);

    // 3. Execute each query and collect results
    const queryResults: Array<{ description: string; data: string }> = [];

    for (const plan of queryPlans) {
      this.logger.log(`Executing: ${plan.operation} - ${plan.description}`);
      try {
        // Apply RBAC filters for STUDENT role
        if (ctx.role === 'STUDENT') {
          this.applyStudentFilter(plan.params, ctx.userId);
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
          data: JSON.stringify(result.data ?? result, null, 2),
        });
      } catch (error) {
        this.logger.error(`Query "${plan.description}" failed: ${error}`);
        queryResults.push({
          description: plan.description,
          data: `Error: ${error}`,
        });
      }
    }

    // 4. Use Gemini to compose a natural reply
    this.logger.log(`Composing reply with Gemini...`);
    const blazeReply = await this.gemini.composeReply(
      ctx.fName,
      ctx.role,
      message,
      queryResults,
    );

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
  private applyStudentFilter(params: Record<string, any>, userId: number): void {
    if (!params.where) {
      params.where = {};
    }

    const model = (params.model || '').toLowerCase();

    // Direct user-linked models
    if (['lease', 'application', 'user'].includes(model)) {
      params.where.userId = userId;
    }

    // Payment is linked through lease
    if (model === 'payment') {
      params.where.lease = { ...params.where.lease, userId };
    }

    // MaintenanceRequest is linked through createdByUserId
    if (model === 'maintenancerequest') {
      params.where.createdByUserId = userId;
    }

    // Occupant is linked through userId
    if (model === 'occupant') {
      params.where.userId = userId;
    }
  }
}
