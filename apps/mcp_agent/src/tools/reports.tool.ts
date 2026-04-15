import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { RbacService } from '../rbac/rbac.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReportsTool {
  private readonly logger = new Logger(ReportsTool.name);

  constructor(
    private readonly rbac: RbacService,
    private readonly config: ConfigService,
  ) {}

  private get internalApiUrl(): string {
    return this.config.get<string>('INTERNAL_API_URL') || 'http://localhost:3009';
  }

  @Tool({
    name: 'generate_report',
    description:
      'Trigger generation of an admin report (sent to admin email as PDF). ADMIN only. Types: property, lease, finance, occupancy.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      reportType: z.enum(['property', 'lease', 'finance', 'occupancy']).describe('Type of report to generate'),
      netId: z.string().optional().describe('For finance reports: specific student netId'),
      sortBy: z.string().optional().describe('For finance reports: "person" or "date"'),
    }),
  })
  async generateReport({
    senderEmail, reportType, netId, sortBy,
  }: { senderEmail: string; reportType: string; netId?: string; sortBy?: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx || !this.rbac.isAdmin(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Only Admins can generate reports.' }] };
    }

    const queueMap: Record<string, string> = {
      property: 'property-reports',
      lease: 'lease-reports',
      finance: 'finance-reports',
      occupancy: 'occupancy-report',
    };

    const queueName = queueMap[reportType];
    if (!queueName) {
      return { content: [{ type: 'text' as const, text: `Unknown report type: ${reportType}. Available: property, lease, finance, occupancy.` }] };
    }

    // Try to trigger the report via the internal-api's BullMQ Bull Board API
    // Since we can't directly access BullMQ from this service, we'll call internal-api
    try {
      const jobData: any = {};
      if (reportType === 'finance') {
        if (netId) jobData.netId = netId;
        if (sortBy) jobData.sortBy = sortBy;
      }
      if (reportType === 'occupancy') {
        jobData.type = 'AUTOMATED';
      }

      // Call internal-api's Bull Board to add a job
      const response = await fetch(`${this.internalApiUrl}/queues/api/queues/${queueName}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `mcp-agent-${Date.now()}`, data: jobData }),
      });

      if (response.ok) {
        return {
          content: [{
            type: 'text' as const,
            text: `✅ Report queued successfully!\n\nType: ${reportType}\nQueue: ${queueName}\nThe generated PDF will be emailed to the admin address.${netId ? `\nTarget student: ${netId}` : ''}`,
          }],
        };
      } else {
        // If Bull Board API isn't accessible, inform the user
        return {
          content: [{
            type: 'text' as const,
            text: `⚠️ Report generation requested but couldn't reach the job queue. Ensure internal-api is running on ${this.internalApiUrl}.\n\nReport type: ${reportType}\nTo trigger manually: Go to ${this.internalApiUrl}/queues and add a job to "${queueName}" with data: ${JSON.stringify(jobData)}`,
          }],
        };
      }
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: `⚠️ Could not connect to internal-api at ${this.internalApiUrl}. Make sure it's running.\n\nReport type: ${reportType}`,
        }],
      };
    }
  }

  @Tool({
    name: 'get_report_types',
    description: 'List all available report types and their descriptions.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
    }),
  })
  async getReportTypes({ senderEmail }: { senderEmail: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const reports = [
      {
        type: 'property',
        name: 'Property Roster Report',
        description: 'Generates a roster of all assigned residents per property as PDF.',
        queue: 'property-reports',
        access: 'ADMIN only',
      },
      {
        type: 'lease',
        name: 'Lease Ledger Report',
        description: 'Master landscape ledger of all leases as PDF.',
        queue: 'lease-reports',
        access: 'ADMIN only',
      },
      {
        type: 'finance',
        name: 'Financial Summary Report',
        description: 'Payment summary and student audits as PDF. Optional: filter by netId, sort by person/date.',
        queue: 'finance-reports',
        access: 'ADMIN only',
        parameters: 'netId (optional), sortBy: "person" | "date" (optional)',
      },
      {
        type: 'occupancy',
        name: 'Occupancy Report',
        description: 'Monthly occupancy & vacancy percentages as PDF.',
        queue: 'occupancy-report',
        access: 'ADMIN only',
      },
    ];

    return { content: [{ type: 'text' as const, text: JSON.stringify(reports, null, 2) }] };
  }
}
