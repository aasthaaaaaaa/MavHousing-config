import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PrismaService } from '@common/prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class MaintenanceTool {
  private readonly logger = new Logger(MaintenanceTool.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  @Tool({
    name: 'get_maintenance_requests',
    description:
      'Get maintenance requests. STUDENT: own requests only. STAFF: requests for assigned property. ADMIN: all requests.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      status: z.string().optional().describe('Filter by status: OPEN, IN_PROGRESS, RESOLVED, CLOSED'),
      category: z.string().optional().describe('Filter by category: PLUMBING, HVAC, ELECTRICAL, INTERNET, APPLIANCE, STRUCTURAL, OTHER'),
      limit: z.number().optional().default(25).describe('Max results'),
    }),
  })
  async getMaintenanceRequests({
    senderEmail, status, category, limit,
  }: { senderEmail: string; status?: string; category?: string; limit?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const whereClause: any = this.rbac.getMaintenanceFilter(ctx);
    if (status) whereClause.status = status.toUpperCase();
    if (category) whereClause.category = category.toUpperCase();

    const requests = await this.prisma.maintenanceRequest.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { netId: true, fName: true, lName: true, email: true } },
        assignedStaff: { select: { userId: true, fName: true, lName: true } },
        lease: {
          include: {
            unit: { include: { property: true } },
            room: true,
          },
        },
      },
      take: limit || 25,
      orderBy: { createdAt: 'desc' },
    });

    const result = requests.map((r) => ({
      requestId: r.requestId,
      category: r.category,
      priority: r.priority,
      status: r.status,
      description: r.description,
      location: r.location,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      resolutionReason: r.resolutionReason,
      createdBy: `${r.createdBy.fName} ${r.createdBy.lName} (${r.createdBy.netId})`,
      assignedStaff: r.assignedStaff
        ? `${r.assignedStaff.fName} ${r.assignedStaff.lName}`
        : 'Unassigned',
      property: r.lease?.unit?.property?.name || 'N/A',
      unit: r.lease?.unit?.unitNumber || 'N/A',
    }));

    return {
      content: [{
        type: 'text' as const,
        text: `${result.length} maintenance request(s):\n${JSON.stringify(result, null, 2)}`,
      }],
    };
  }

  @Tool({
    name: 'get_maintenance_details',
    description: 'Get detailed info about a specific maintenance request including comments. RBAC checked.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      requestId: z.number().describe('The maintenance request ID'),
    }),
  })
  async getMaintenanceDetails({ senderEmail, requestId }: { senderEmail: string; requestId: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { requestId },
      include: {
        createdBy: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
        assignedStaff: { select: { userId: true, fName: true, lName: true } },
        lease: { include: { unit: { include: { property: true } } } },
        comments: {
          include: { user: { select: { fName: true, lName: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      return { content: [{ type: 'text' as const, text: 'Maintenance request not found.' }] };
    }

    // RBAC: student can only see their own requests
    if (ctx.role === 'STUDENT' && request.createdByUserId !== ctx.userId) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: You can only view your own maintenance requests.' }] };
    }

    // STAFF: can only see requests on their property
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
      const propertyId = request.lease?.unit?.propertyId;
      if (propertyId && propertyId !== ctx.assignedPropertyId) {
        return { content: [{ type: 'text' as const, text: '❌ Access Denied: This request is not on your assigned property.' }] };
      }
    }

    const detail = {
      requestId: request.requestId,
      category: request.category,
      priority: request.priority,
      status: request.status,
      description: request.description,
      location: request.location,
      createdAt: request.createdAt,
      resolvedAt: request.resolvedAt,
      resolutionReason: request.resolutionReason,
      createdBy: `${request.createdBy.fName} ${request.createdBy.lName} (${request.createdBy.netId})`,
      assignedStaff: request.assignedStaff
        ? `${request.assignedStaff.fName} ${request.assignedStaff.lName}`
        : 'Unassigned',
      property: request.lease?.unit?.property?.name || 'N/A',
      unit: request.lease?.unit?.unitNumber || 'N/A',
      comments: request.comments.map((c) => ({
        by: `${c.user.fName} ${c.user.lName}`,
        content: c.content,
        at: c.createdAt,
      })),
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(detail, null, 2) }] };
  }
}
