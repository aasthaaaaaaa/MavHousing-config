import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PrismaService } from '@common/prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class LeaseTool {
  private readonly logger = new Logger(LeaseTool.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  private readonly leaseInclude = {
    user: {
      select: { userId: true, netId: true, fName: true, lName: true, email: true },
    },
    unit: { include: { property: true } },
    room: true,
    bed: true,
    occupants: {
      include: {
        user: {
          select: { userId: true, netId: true, fName: true, lName: true, email: true },
        },
      },
    },
  };

  @Tool({
    name: 'get_lease_info',
    description:
      'Get lease details for a user. STUDENT: own lease only. STAFF: leases on assigned property. ADMIN: any lease. Provide netId to look up a specific user, or leave blank for own lease.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      netId: z.string().optional().describe('NetID of the user whose lease to look up (admin/staff only)'),
      leaseId: z.number().optional().describe('Specific lease ID to look up'),
    }),
  })
  async getLeaseInfo({ senderEmail, netId, leaseId }: { senderEmail: string; netId?: string; leaseId?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Your email is not registered.' }] };
    }

    if (leaseId) {
      const lease = await this.prisma.lease.findUnique({
        where: { leaseId },
        include: this.leaseInclude,
      });
      if (!lease) {
        return { content: [{ type: 'text' as const, text: 'No lease found with that ID.' }] };
      }
      if (!this.rbac.canAccessUser(ctx, lease.userId)) {
        return { content: [{ type: 'text' as const, text: '❌ Access Denied: You cannot view this lease.' }] };
      }
      return { content: [{ type: 'text' as const, text: JSON.stringify(this.serializeLease(lease), null, 2) }] };
    }

    // Find user to query
    let targetUserId = ctx.userId;
    if (netId && this.rbac.isStaffOrAbove(ctx)) {
      const targetUser = await this.prisma.user.findUnique({ where: { netId } });
      if (!targetUser) {
        return { content: [{ type: 'text' as const, text: `No user found with netId "${netId}".` }] };
      }
      targetUserId = targetUser.userId;
    } else if (netId && !this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Students can only view their own lease.' }] };
    }

    const lease = await this.prisma.lease.findFirst({
      where: {
        OR: [{ userId: targetUserId }, { occupants: { some: { userId: targetUserId } } }],
        status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE', 'TERMINATION_REQUESTED'] as any },
      },
      orderBy: { createdAt: 'desc' },
      include: this.leaseInclude,
    });

    if (!lease) {
      return { content: [{ type: 'text' as const, text: 'No active lease found.' }] };
    }

    return { content: [{ type: 'text' as const, text: JSON.stringify(this.serializeLease(lease), null, 2) }] };
  }

  @Tool({
    name: 'get_all_leases',
    description:
      'List all leases. ADMIN: all leases. STAFF: leases on assigned property. STUDENT: denied.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      status: z.string().optional().describe('Filter by status: SIGNED, ACTIVE, PENDING_SIGNATURE, TERMINATED, etc.'),
      limit: z.number().optional().default(25).describe('Max results'),
    }),
  })
  async getAllLeases({ senderEmail, status, limit }: { senderEmail: string; status?: string; limit?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    if (!this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Only Admins and Staff can list all leases. Use "get_lease_info" for your own lease.' }] };
    }

    const whereClause: any = this.rbac.getLeaseFilter(ctx);
    if (status) whereClause.status = status.toUpperCase();

    const leases = await this.prisma.lease.findMany({
      where: whereClause,
      include: this.leaseInclude,
      take: limit || 25,
      orderBy: { createdAt: 'desc' },
    });

    const serialized = leases.map((l) => this.serializeLease(l));
    return {
      content: [{
        type: 'text' as const,
        text: `Found ${leases.length} lease(s):\n${JSON.stringify(serialized, null, 2)}`,
      }],
    };
  }

  @Tool({
    name: 'get_occupancy',
    description: 'Get current occupancy data showing who is assigned where. ADMIN/STAFF only.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
    }),
  })
  async getOccupancy({ senderEmail }: { senderEmail: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Only Admins and Staff can view occupancy data.' }] };
    }

    const whereClause: any = {
      status: { in: ['SIGNED', 'ACTIVE'] as any },
      ...this.rbac.getLeaseFilter(ctx),
    };

    const leases = await this.prisma.lease.findMany({
      where: whereClause,
      include: {
        user: { select: { netId: true, fName: true, lName: true } },
        unit: { include: { property: true } },
        room: true,
        bed: true,
        occupants: {
          include: {
            user: { select: { netId: true, fName: true, lName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = leases.map((l) => ({
      leaseId: l.leaseId,
      tenant: `${l.user.fName} ${l.user.lName} (${l.user.netId})`,
      property: l.unit?.property?.name || 'Unassigned',
      unit: l.unit?.unitNumber || 'N/A',
      room: (l.room as any)?.roomLetter || 'N/A',
      bed: (l.bed as any)?.bedLetter || 'N/A',
      status: l.status,
      occupants: l.occupants.map((o) => `${o.user.fName} ${o.user.lName} (${o.occupantType})`),
    }));

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }],
    };
  }

  private serializeLease(lease: any) {
    return {
      leaseId: lease.leaseId,
      status: lease.status,
      leaseType: lease.leaseType,
      startDate: lease.startDate,
      endDate: lease.endDate,
      totalDue: lease.totalDue?.toString(),
      dueThisMonth: lease.dueThisMonth?.toString(),
      terminationFee: lease.terminationFee?.toString() || null,
      terminationReason: lease.terminationReason,
      tenant: lease.user
        ? { netId: lease.user.netId, name: `${lease.user.fName} ${lease.user.lName}`, email: lease.user.email }
        : null,
      property: lease.unit?.property?.name || null,
      unit: lease.unit?.unitNumber || null,
      room: lease.room?.roomLetter || null,
      bed: lease.bed?.bedLetter || null,
      occupants: lease.occupants?.map((o: any) => ({
        name: `${o.user.fName} ${o.user.lName}`,
        netId: o.user.netId,
        type: o.occupantType,
      })) || [],
    };
  }
}
