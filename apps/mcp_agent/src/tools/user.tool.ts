import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PrismaService } from '@common/prisma/prisma.service';
import { RbacService, RbacContext } from '../rbac/rbac.service';

@Injectable()
export class UserTool {
  private readonly logger = new Logger(UserTool.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  @Tool({
    name: 'lookup_user',
    description:
      'Look up a MavHousing user by netId, utaId, or email. RBAC: ADMIN sees any user. STAFF sees users on their property. STUDENT sees only themselves.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request (for RBAC)'),
      netId: z.string().optional().describe('NetID to look up'),
      utaId: z.string().optional().describe('UTA ID to look up'),
      email: z.string().optional().describe('Email to look up'),
    }),
  })
  async lookupUser({ senderEmail, netId, utaId, email }: { senderEmail: string; netId?: string; utaId?: string; email?: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Your email is not registered in MavHousing.' }] };
    }

    let whereClause: any = {};
    if (netId) whereClause = { netId };
    else if (utaId) whereClause = { utaId };
    else if (email) whereClause = { email };
    else {
      // Default: look up self
      whereClause = { userId: ctx.userId };
    }

    const user = await this.prisma.user.findFirst({
      where: whereClause,
      select: {
        userId: true,
        utaId: true,
        netId: true,
        fName: true,
        lName: true,
        email: true,
        phone: true,
        gender: true,
        role: true,
        studentStatus: true,
        staffPosition: true,
        requiresAdaAccess: true,
        isLocked: true,
        createdAt: true,
        assignedPropertyId: true,
      },
    });

    if (!user) {
      return { content: [{ type: 'text' as const, text: 'No user found with the provided criteria.' }] };
    }

    // RBAC check
    if (!this.rbac.canAccessUser(ctx, user.userId)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: You can only view your own profile.' }] };
    }

    // STAFF: additional check — can only see users on their property
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId && user.userId !== ctx.userId) {
      const hasLeaseOnProperty = await this.prisma.lease.findFirst({
        where: {
          userId: user.userId,
          unit: { propertyId: ctx.assignedPropertyId },
          status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any },
        },
      });
      if (!hasLeaseOnProperty) {
        return { content: [{ type: 'text' as const, text: '❌ Access Denied: This user is not on your assigned property.' }] };
      }
    }

    const result = {
      ...user,
      phone: user.phone?.toString() || null,
    };

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }

  @Tool({
    name: 'list_users',
    description:
      'List MavHousing users. ADMIN: all users. STAFF: users on assigned property. STUDENT: denied.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request (for RBAC)'),
      role: z.string().optional().describe('Filter by role: ADMIN, STAFF, STUDENT'),
      limit: z.number().optional().default(50).describe('Max results to return'),
    }),
  })
  async listUsers({ senderEmail, role, limit }: { senderEmail: string; role?: string; limit?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Your email is not registered in MavHousing.' }] };
    }

    if (!this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Only Admins and Staff can list users.' }] };
    }

    const whereClause: any = {};
    if (role) whereClause.role = role.toUpperCase();

    // STAFF: restrict to users with leases on their property
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
      whereClause.leases = {
        some: {
          unit: { propertyId: ctx.assignedPropertyId },
          status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] },
        },
      };
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        userId: true,
        netId: true,
        fName: true,
        lName: true,
        email: true,
        role: true,
        studentStatus: true,
        staffPosition: true,
      },
      take: limit || 50,
      orderBy: { lName: 'asc' },
    });

    return {
      content: [{
        type: 'text' as const,
        text: `Found ${users.length} user(s):\n${JSON.stringify(users, null, 2)}`,
      }],
    };
  }
}
