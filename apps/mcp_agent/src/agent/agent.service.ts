import { Injectable, Logger } from '@nestjs/common';
import { RbacService, RbacContext } from '../rbac/rbac.service';
import { EmailReplyService } from '../email/email-reply.service';
import { PrismaService } from '@common/prisma/prisma.service';

// Import all tools
import { UserTool } from '../tools/user.tool';
import { LeaseTool } from '../tools/lease.tool';
import { PaymentTool } from '../tools/payment.tool';
import { MaintenanceTool } from '../tools/maintenance.tool';
import { ApplicationTool } from '../tools/application.tool';
import { HousingTool } from '../tools/housing.tool';
import { ReportsTool } from '../tools/reports.tool';
import { EmailTool } from '../tools/email.tool';

interface IntentResult {
  tool: string;
  params: Record<string, any>;
  description: string;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    private readonly rbac: RbacService,
    private readonly emailReply: EmailReplyService,
    private readonly prisma: PrismaService,
    private readonly userTool: UserTool,
    private readonly leaseTool: LeaseTool,
    private readonly paymentTool: PaymentTool,
    private readonly maintenanceTool: MaintenanceTool,
    private readonly applicationTool: ApplicationTool,
    private readonly housingTool: HousingTool,
    private readonly reportsTool: ReportsTool,
    private readonly emailTool: EmailTool,
  ) {}

  /**
   * Main entry point: process a natural language request.
   * 1. Identify sender via RBAC
   * 2. Parse intent from message
   * 3. Execute appropriate tool(s)
   * 4. Format and send reply
   */
  async processRequest(senderEmail: string, message: string, subject?: string): Promise<string> {
    this.logger.log(`\n${'='.repeat(60)}`);
    this.logger.log(`📨 Processing request from: ${senderEmail}`);
    this.logger.log(`📝 Subject: ${subject || 'N/A'}`);
    this.logger.log(`💬 Message: ${message.substring(0, 200)}...`);
    this.logger.log('='.repeat(60));

    // 1. Identify the sender
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      await this.emailReply.sendAccessDenied(senderEmail, subject || 'MavHousing Query');
      return 'Access Denied: Sender not registered.';
    }

    this.logger.log(`✅ Identified: ${ctx.fName} ${ctx.lName} (${ctx.role})`);

    // 2. Parse intent from the message
    const intents = this.parseIntent(message, ctx);

    if (intents.length === 0) {
      const helpText = this.getHelpText(ctx);
      await this.emailReply.replyToSender(senderEmail, subject || 'MavHousing Query', helpText);
      return helpText;
    }

    // 3. Execute tool(s) and collect results
    const results: string[] = [];

    for (const intent of intents) {
      this.logger.log(`🔧 Executing tool: ${intent.tool} — ${intent.description}`);
      try {
        const toolResult = await this.executeTool(intent.tool, {
          ...intent.params,
          senderEmail,
        });
        results.push(toolResult);
      } catch (error) {
        this.logger.error(`Tool ${intent.tool} failed: ${error}`);
        results.push(`<p style="color: #DC2626;">⚠️ Error executing "${intent.description}": ${error}</p>`);
      }
    }

    // 4. Format and send reply
    const greeting = `<p>Hi ${ctx.fName},</p>`;
    const intro = `<p>Here's what I found for your request:</p>`;
    const body = greeting + intro + results.join('\n<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">\n');

    await this.emailReply.replyToSender(senderEmail, subject || 'MavHousing Query', body);

    return body;
  }

  /**
   * Parse natural language message into tool intents using keyword matching.
   */
  private parseIntent(message: string, ctx: RbacContext): IntentResult[] {
    const msg = message.toLowerCase().trim();
    const intents: IntentResult[] = [];

    // Extract potential netId mentions (pattern: 3-4 letters + 2-3 digits)
    const netIdMatch = msg.match(/\b([a-z]{2,5}\d{2,4})\b/);
    const mentionedNetId = netIdMatch ? netIdMatch[1] : undefined;

    // ========== LEASE related ==========
    if (this.matches(msg, ['lease', 'my lease', 'lease info', 'lease details', 'lease status', 'my room', 'my unit', 'where do i live', 'my housing', 'my assignment'])) {
      if (this.matches(msg, ['all leases', 'every lease', 'list leases', 'all lease'])) {
        intents.push({ tool: 'get_all_leases', params: {}, description: 'All leases' });
      } else {
        intents.push({
          tool: 'get_lease_info',
          params: mentionedNetId ? { netId: mentionedNetId } : {},
          description: mentionedNetId ? `Lease for ${mentionedNetId}` : 'Your lease info',
        });
      }
    }

    // ========== PAYMENT related ==========
    if (this.matches(msg, ['payment', 'rent', 'pay', 'bill', 'balance', 'due', 'owe', 'financial', 'money', 'fee', 'charge'])) {
      if (this.matches(msg, ['history', 'past', 'previous', 'transaction', 'record'])) {
        intents.push({
          tool: 'get_payment_history',
          params: mentionedNetId ? { netId: mentionedNetId } : {},
          description: 'Payment history',
        });
      } else if (this.matches(msg, ['stats', 'statistics', 'aggregate', 'overall', 'collection rate', 'total collected'])) {
        intents.push({ tool: 'get_payment_stats', params: {}, description: 'Payment statistics' });
      } else {
        intents.push({
          tool: 'get_payment_summary',
          params: mentionedNetId ? { netId: mentionedNetId } : {},
          description: 'Payment summary',
        });
      }
    }

    // ========== MAINTENANCE related ==========
    if (this.matches(msg, ['maintenance', 'repair', 'fix', 'broken', 'plumbing', 'hvac', 'electrical', 'internet', 'appliance'])) {
      // Extract request ID if mentioned
      const reqIdMatch = msg.match(/request\s*#?\s*(\d+)|#(\d+)|id\s*(\d+)/);
      const requestId = reqIdMatch ? parseInt(reqIdMatch[1] || reqIdMatch[2] || reqIdMatch[3]) : undefined;

      if (requestId) {
        intents.push({
          tool: 'get_maintenance_details',
          params: { requestId },
          description: `Maintenance request #${requestId}`,
        });
      } else {
        const status = this.extractMaintenanceStatus(msg);
        const category = this.extractMaintenanceCategory(msg);
        intents.push({
          tool: 'get_maintenance_requests',
          params: { ...(status && { status }), ...(category && { category }) },
          description: 'Maintenance requests',
        });
      }
    }

    // ========== APPLICATION related ==========
    if (this.matches(msg, ['application', 'apply', 'applied', 'submission', 'housing application'])) {
      const appIdMatch = msg.match(/application\s*#?\s*(\d+)|app\s*#?\s*(\d+)/);
      const appId = appIdMatch ? parseInt(appIdMatch[1] || appIdMatch[2]) : undefined;

      if (appId) {
        intents.push({
          tool: 'get_application_details',
          params: { appId },
          description: `Application #${appId}`,
        });
      } else {
        const status = this.extractApplicationStatus(msg);
        intents.push({
          tool: 'get_applications',
          params: status ? { status } : {},
          description: 'Applications',
        });
      }
    }

    // ========== HOUSING / PROPERTY related ==========
    if (this.matches(msg, ['property', 'properties', 'building', 'buildings', 'residence hall', 'apartment'])) {
      if (this.matches(msg, ['hierarchy', 'tree', 'structure', 'layout', 'who lives'])) {
        intents.push({ tool: 'get_property_hierarchy', params: {}, description: 'Property hierarchy' });
      } else {
        intents.push({ tool: 'get_properties', params: {}, description: 'Properties list' });
      }
    }

    if (this.matches(msg, ['availability', 'available', 'vacancy', 'vacant', 'open', 'occupancy rate'])) {
      intents.push({ tool: 'get_availability', params: {}, description: 'Availability info' });
    }

    if (this.matches(msg, ['occupancy', 'who is assigned', 'resident list', 'roster'])) {
      intents.push({ tool: 'get_occupancy', params: {}, description: 'Occupancy data' });
    }

    // ========== USER related ==========
    if (this.matches(msg, ['user', 'profile', 'who am i', 'my info', 'my account', 'my profile', 'student info', 'look up user', 'find user'])) {
      if (this.matches(msg, ['all users', 'list users', 'every user', 'user list'])) {
        intents.push({ tool: 'list_users', params: {}, description: 'User list' });
      } else {
        intents.push({
          tool: 'lookup_user',
          params: mentionedNetId ? { netId: mentionedNetId } : {},
          description: mentionedNetId ? `User lookup: ${mentionedNetId}` : 'Your profile',
        });
      }
    }

    // ========== REPORT related ==========
    if (this.matches(msg, ['report', 'generate report', 'pdf', 'export'])) {
      if (this.matches(msg, ['what reports', 'available reports', 'types', 'list reports'])) {
        intents.push({ tool: 'get_report_types', params: {}, description: 'Available report types' });
      } else {
        const reportType = this.extractReportType(msg);
        intents.push({
          tool: 'generate_report',
          params: {
            reportType,
            ...(mentionedNetId && { netId: mentionedNetId }),
          },
          description: `Generate ${reportType} report`,
        });
      }
    }

    // ========== EMAIL related ==========
    if (this.matches(msg, ['email template', 'send email', 'templates available', 'what emails'])) {
      intents.push({ tool: 'list_email_templates', params: {}, description: 'Email templates' });
    }

    // If no specific intent matched, try broad matching
    if (intents.length === 0) {
      // Check if they're asking about themselves
      if (this.matches(msg, ['me', 'my', 'mine', 'i ', 'am i', 'do i'])) {
        intents.push({ tool: 'lookup_user', params: {}, description: 'Your profile' });
        if (this.matches(msg, ['owe', 'paid', 'due'])) {
          intents.push({ tool: 'get_payment_summary', params: {}, description: 'Your payment status' });
        }
      }
    }

    return intents;
  }

  /**
   * Execute a specific tool by name.
   */
  private async executeTool(toolName: string, params: Record<string, any>): Promise<string> {
    const toolMap: Record<string, () => Promise<any>> = {
      lookup_user: () => this.userTool.lookupUser(params as any),
      list_users: () => this.userTool.listUsers(params as any),
      get_lease_info: () => this.leaseTool.getLeaseInfo(params as any),
      get_all_leases: () => this.leaseTool.getAllLeases(params as any),
      get_occupancy: () => this.leaseTool.getOccupancy(params as any),
      get_payment_summary: () => this.paymentTool.getPaymentSummary(params as any),
      get_payment_history: () => this.paymentTool.getPaymentHistory(params as any),
      get_payment_stats: () => this.paymentTool.getPaymentStats(params as any),
      check_rent_status: () => this.paymentTool.checkRentStatus(params as any),
      get_maintenance_requests: () => this.maintenanceTool.getMaintenanceRequests(params as any),
      get_maintenance_details: () => this.maintenanceTool.getMaintenanceDetails(params as any),
      get_applications: () => this.applicationTool.getApplications(params as any),
      get_application_details: () => this.applicationTool.getApplicationDetails(params as any),
      get_properties: () => this.housingTool.getProperties(params as any),
      get_availability: () => this.housingTool.getAvailability(params as any),
      get_property_hierarchy: () => this.housingTool.getPropertyHierarchy(params as any),
      generate_report: () => this.reportsTool.generateReport(params as any),
      get_report_types: () => this.reportsTool.getReportTypes(params as any),
      send_email: () => this.emailTool.sendEmail(params as any),
      list_email_templates: () => this.emailTool.listEmailTemplates(params as any),
    };

    const toolFn = toolMap[toolName];
    if (!toolFn) {
      return `<p>Unknown tool: ${toolName}</p>`;
    }

    const result = await toolFn();

    // Extract text content from MCP tool response format
    if (result?.content) {
      const texts = result.content.map((c: any) => c.text || JSON.stringify(c)).join('\n');

      // Try to format JSON as HTML tables/cards
      try {
        const jsonMatch = texts.match(/^(?:Found \d+ \w+\(s\):?\n?)?(\[[\s\S]*\]|\{[\s\S]*\})/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          return this.emailReply.formatToolResults([parsed]);
        }
      } catch {
        // Fall through to plain text
      }

      return `<div style="background: #f9fafb; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; overflow-x: auto; white-space: pre-wrap;">${texts}</div>`;
    }

    return `<pre>${JSON.stringify(result, null, 2)}</pre>`;
  }

  /**
   * Generate help text based on user role.
   */
  private getHelpText(ctx: RbacContext): string {
    const studentCommands = `
      <h3 style="color: #0064B1;">📋 What you can ask me:</h3>
      <ul>
        <li><strong>"What's my lease info?"</strong> — View your lease details</li>
        <li><strong>"Am I paid up?"</strong> — Check your rent payment status</li>
        <li><strong>"Show my payment history"</strong> — View past payments</li>
        <li><strong>"My maintenance requests"</strong> — View maintenance requests you've submitted</li>
        <li><strong>"What's my application status?"</strong> — Check housing application status</li>
        <li><strong>"Show available properties"</strong> — View housing options</li>
        <li><strong>"Who am I?"</strong> — View your profile</li>
      </ul>`;

    const staffCommands = `
      <h3 style="color: #0064B1;">🔧 Staff Commands:</h3>
      <ul>
        <li><strong>"Show all leases"</strong> — View all leases on your property</li>
        <li><strong>"Payment summary for abc1234"</strong> — Check a student's payments</li>
        <li><strong>"Maintenance requests"</strong> — View maintenance for your property</li>
        <li><strong>"Show applications"</strong> — Review housing applications</li>
        <li><strong>"Occupancy report"</strong> — Current occupancy data</li>
        <li><strong>"Property hierarchy"</strong> — Full property structure</li>
        <li><strong>"List email templates"</strong> — Available email templates</li>
      </ul>`;

    const adminCommands = `
      <h3 style="color: #DC2626;">👑 Admin Commands:</h3>
      <ul>
        <li><strong>"Generate finance report"</strong> — Generate finance PDF</li>
        <li><strong>"Generate lease report"</strong> — Generate lease ledger PDF</li>
        <li><strong>"Payment stats"</strong> — Aggregate payment statistics</li>
        <li><strong>"List all users"</strong> — All registered users</li>
        <li>All Staff and Student commands also available</li>
      </ul>`;

    let help = `<p>Hi ${ctx.fName}! I'm the MavHousing Agent. I didn't quite understand your request. Here's what I can help with:</p>`;
    help += studentCommands;
    if (ctx.role === 'STAFF' || ctx.role === 'ADMIN') help += staffCommands;
    if (ctx.role === 'ADMIN') help += adminCommands;
    help += `<p style="color: #6b7280; font-size: 12px; margin-top: 16px;">Just reply with your question and I'll find the answer! Include a NetID like "abc1234" to look up a specific student.</p>`;

    return help;
  }

  // ========== HELPER METHODS ==========

  private matches(msg: string, keywords: string[]): boolean {
    return keywords.some((kw) => msg.includes(kw));
  }

  private extractMaintenanceStatus(msg: string): string | undefined {
    if (msg.includes('open')) return 'OPEN';
    if (msg.includes('in progress') || msg.includes('in-progress')) return 'IN_PROGRESS';
    if (msg.includes('resolved')) return 'RESOLVED';
    if (msg.includes('closed')) return 'CLOSED';
    return undefined;
  }

  private extractMaintenanceCategory(msg: string): string | undefined {
    if (msg.includes('plumbing')) return 'PLUMBING';
    if (msg.includes('hvac') || msg.includes('heating') || msg.includes('cooling') || msg.includes('air')) return 'HVAC';
    if (msg.includes('electrical') || msg.includes('power') || msg.includes('outlet')) return 'ELECTRICAL';
    if (msg.includes('internet') || msg.includes('wifi') || msg.includes('wi-fi') || msg.includes('network')) return 'INTERNET';
    if (msg.includes('appliance') || msg.includes('washer') || msg.includes('dryer') || msg.includes('oven') || msg.includes('fridge')) return 'APPLIANCE';
    if (msg.includes('structural') || msg.includes('wall') || msg.includes('door') || msg.includes('window')) return 'STRUCTURAL';
    return undefined;
  }

  private extractApplicationStatus(msg: string): string | undefined {
    if (msg.includes('draft')) return 'DRAFT';
    if (msg.includes('submitted')) return 'SUBMITTED';
    if (msg.includes('under review') || msg.includes('reviewing')) return 'UNDER_REVIEW';
    if (msg.includes('approved')) return 'APPROVED';
    if (msg.includes('rejected') || msg.includes('denied')) return 'REJECTED';
    if (msg.includes('cancelled') || msg.includes('canceled')) return 'CANCELLED';
    return undefined;
  }

  private extractReportType(msg: string): string {
    if (msg.includes('finance') || msg.includes('financial') || msg.includes('payment')) return 'finance';
    if (msg.includes('lease')) return 'lease';
    if (msg.includes('occupancy') || msg.includes('vacancy')) return 'occupancy';
    return 'property'; // default
  }
}
