import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

export interface RbacContext {
  userId: number;
  netId: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'STUDENT' | 'DRAFT';
  fName: string;
  lName: string;
  assignedPropertyId: number | null;
  staffPosition: string | null;
}

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Identify a user by their email address and return their RBAC context.
   * Returns null if the user is not found or has DRAFT role (unverified).
   */
  async identifyByEmail(email: string): Promise<RbacContext | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        userId: true,
        netId: true,
        email: true,
        role: true,
        fName: true,
        lName: true,
        assignedPropertyId: true,
        staffPosition: true,
      },
    });

    if (!user) {
      this.logger.warn(`RBAC: No user found for email "${email}"`);
      return null;
    }

    if (user.role === 'DRAFT') {
      this.logger.warn(`RBAC: User "${email}" has DRAFT role — access denied`);
      return null;
    }

    this.logger.log(`RBAC: Identified ${user.netId} as ${user.role}`);

    return {
      userId: user.userId,
      netId: user.netId,
      email: user.email,
      role: user.role as RbacContext['role'],
      fName: user.fName,
      lName: user.lName,
      assignedPropertyId: user.assignedPropertyId,
      staffPosition: user.staffPosition,
    };
  }

  /**
   * Check if the user is allowed to access another user's data.
   * ADMIN: always. STAFF: only if on same assigned property. STUDENT: only self.
   */
  canAccessUser(ctx: RbacContext, targetUserId: number): boolean {
    if (ctx.role === 'ADMIN') return true;
    if (ctx.role === 'STUDENT') return ctx.userId === targetUserId;
    // STAFF: allow — further filtering happens at the tool level by property
    if (ctx.role === 'STAFF') return true;
    return false;
  }

  /**
   * Check if user has admin-level access.
   */
  isAdmin(ctx: RbacContext): boolean {
    return ctx.role === 'ADMIN';
  }

  /**
   * Check if user has staff-level access (includes admin).
   */
  isStaffOrAbove(ctx: RbacContext): boolean {
    return ctx.role === 'ADMIN' || ctx.role === 'STAFF';
  }

  /**
   * Build Prisma where-clause filter for lease queries based on role.
   */
  getLeaseFilter(ctx: RbacContext): any {
    if (ctx.role === 'ADMIN') return {};
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
      return { unit: { propertyId: ctx.assignedPropertyId } };
    }
    // STUDENT: only their own leases
    return {
      OR: [
        { userId: ctx.userId },
        { occupants: { some: { userId: ctx.userId } } },
      ],
    };
  }

  /**
   * Build Prisma where-clause filter for maintenance queries based on role.
   */
  getMaintenanceFilter(ctx: RbacContext): any {
    if (ctx.role === 'ADMIN') return {};
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
      return {
        lease: { unit: { propertyId: ctx.assignedPropertyId } },
      };
    }
    return { createdByUserId: ctx.userId };
  }

  /**
   * Build Prisma where-clause filter for payment queries based on role.
   */
  getPaymentFilter(ctx: RbacContext): any {
    if (ctx.role === 'ADMIN') return {};
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
      return {
        lease: { unit: { propertyId: ctx.assignedPropertyId } },
      };
    }
    return {
      lease: {
        OR: [
          { userId: ctx.userId },
          { occupants: { some: { userId: ctx.userId } } },
        ],
      },
    };
  }

  /**
   * Build Prisma where-clause filter for application queries based on role.
   */
  getApplicationFilter(ctx: RbacContext): any {
    if (ctx.role === 'ADMIN') return {};
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
      return { preferredPropertyId: ctx.assignedPropertyId };
    }
    return { userId: ctx.userId };
  }
}
