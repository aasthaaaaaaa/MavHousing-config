import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PrismaService } from '@common/prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class PaymentTool {
  private readonly logger = new Logger(PaymentTool.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  @Tool({
    name: 'get_payment_summary',
    description:
      'Get payment summary including monthly rent, amount due, and payment status. STUDENT: own only. STAFF/ADMIN: by netId.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      netId: z.string().optional().describe('NetID of user to check (admin/staff only)'),
    }),
  })
  async getPaymentSummary({ senderEmail, netId }: { senderEmail: string; netId?: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    let targetUserId = ctx.userId;
    if (netId) {
      if (!this.rbac.isStaffOrAbove(ctx)) {
        return { content: [{ type: 'text' as const, text: '❌ Access Denied: Students can only check their own payments.' }] };
      }
      const targetUser = await this.prisma.user.findUnique({ where: { netId } });
      if (!targetUser) {
        return { content: [{ type: 'text' as const, text: `No user found with netId "${netId}".` }] };
      }
      targetUserId = targetUser.userId;
    }

    const lease = await this.prisma.lease.findFirst({
      where: {
        OR: [{ userId: targetUserId }, { occupants: { some: { userId: targetUserId } } }],
      },
      orderBy: { createdAt: 'desc' },
      include: { unit: { include: { property: true } } },
    });

    if (!lease) {
      return { content: [{ type: 'text' as const, text: 'No active lease found — no payment info available.' }] };
    }

    const monthlyRent = Number(lease.dueThisMonth);
    const extraFees = Number(lease.terminationFee || 0);
    const totalDueThisMonth = monthlyRent + extraFees;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const thisMonthPayments = await this.prisma.payment.findMany({
      where: {
        leaseId: lease.leaseId,
        isSuccessful: true,
        transactionDate: { gte: startOfMonth, lt: startOfNextMonth },
      },
    });

    const totalPaidThisMonth = thisMonthPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
    const amountDueThisMonth = Math.max(0, totalDueThisMonth - totalPaidThisMonth);

    const allPaymentsCount = await this.prisma.payment.count({
      where: { leaseId: lease.leaseId, isSuccessful: true },
    });

    const summary = {
      property: lease.unit?.property?.name || 'N/A',
      unit: lease.unit?.unitNumber || 'N/A',
      monthlyRent: `$${monthlyRent.toFixed(2)}`,
      extraFees: `$${extraFees.toFixed(2)}`,
      totalDueThisMonth: `$${totalDueThisMonth.toFixed(2)}`,
      totalPaidThisMonth: `$${totalPaidThisMonth.toFixed(2)}`,
      amountStillDue: `$${amountDueThisMonth.toFixed(2)}`,
      rentPaidThisMonth: amountDueThisMonth <= 0,
      totalPaymentsMade: allPaymentsCount,
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(summary, null, 2) }] };
  }

  @Tool({
    name: 'get_payment_history',
    description:
      'Get payment transaction history. STUDENT: own only. STAFF/ADMIN: by netId or all.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      netId: z.string().optional().describe('NetID to look up (admin/staff)'),
      limit: z.number().optional().default(20).describe('Max results'),
    }),
  })
  async getPaymentHistory({ senderEmail, netId, limit }: { senderEmail: string; netId?: string; limit?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const whereClause: any = this.rbac.getPaymentFilter(ctx);

    if (netId && this.rbac.isStaffOrAbove(ctx)) {
      whereClause.lease = { ...whereClause.lease, user: { netId } };
    } else if (netId && !this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Students can only view their own payments.' }] };
    }

    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      include: {
        lease: {
          include: {
            user: { select: { netId: true, fName: true, lName: true } },
            unit: { include: { property: true } },
          },
        },
      },
      take: limit || 20,
      orderBy: { transactionDate: 'desc' },
    });

    const result = payments.map((p) => ({
      paymentId: p.paymentId,
      date: p.transactionDate,
      amount: `$${Number(p.amountPaid).toFixed(2)}`,
      method: p.method,
      success: p.isSuccessful,
      tenant: `${p.lease.user.fName} ${p.lease.user.lName} (${p.lease.user.netId})`,
      property: p.lease.unit?.property?.name || 'N/A',
    }));

    return {
      content: [{ type: 'text' as const, text: `${result.length} payment(s):\n${JSON.stringify(result, null, 2)}` }],
    };
  }

  @Tool({
    name: 'get_payment_stats',
    description: 'Get aggregate payment statistics — collection rate, totals. ADMIN/STAFF only.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
    }),
  })
  async getPaymentStats({ senderEmail }: { senderEmail: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Only Admins and Staff can view payment stats.' }] };
    }

    const allPayments = await this.prisma.payment.findMany();
    const total = allPayments.length;
    const successful = allPayments.filter((p) => p.isSuccessful).length;
    const failed = total - successful;
    const totalCollected = allPayments
      .filter((p) => p.isSuccessful)
      .reduce((sum, p) => sum + Number(p.amountPaid), 0);

    const stats = {
      totalTransactions: total,
      successfulPayments: successful,
      failedPayments: failed,
      collectionRate: total > 0 ? `${Math.round((successful / total) * 100)}%` : 'N/A',
      totalCollected: `$${totalCollected.toFixed(2)}`,
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(stats, null, 2) }] };
  }

  @Tool({
    name: 'check_rent_status',
    description:
      'Quick check: is rent paid this month? STUDENT: own. STAFF/ADMIN: by netId.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      netId: z.string().optional().describe('NetID to check (admin/staff only)'),
    }),
  })
  async checkRentStatus({ senderEmail, netId }: { senderEmail: string; netId?: string }) {
    // Reuse getPaymentSummary internally
    const result = await this.getPaymentSummary({ senderEmail, netId });
    return result;
  }
}
