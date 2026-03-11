import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  /** Get all payments for a user (via their leases) */
  async getMyPayments(userId: number) {
    return this.prisma.payment.findMany({
      where: {
        lease: {
          OR: [{ userId }, { occupants: { some: { userId } } }],
        },
      },
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }

  /** Get payment summary for a user — monthly-rent focused */
  async getPaymentSummary(userId: number) {
    const lease = await this.prisma.lease.findFirst({
      where: {
        OR: [{ userId }, { occupants: { some: { userId } } }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        unit: { include: { property: true } },
      },
    });

    if (!lease) return null;

    const monthlyRent = Number(lease.dueThisMonth);

    // Check if a successful payment exists for the current calendar month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const thisMonthPayment = await this.prisma.payment.findFirst({
      where: {
        leaseId: lease.leaseId,
        isSuccessful: true,
        transactionDate: { gte: startOfMonth, lt: startOfNextMonth },
      },
    });

    const paidThisMonth = !!thisMonthPayment;

    // Count all successful payments
    const allPayments = await this.prisma.payment.findMany({
      where: { leaseId: lease.leaseId },
    });
    const successCount = allPayments.filter((p) => p.isSuccessful).length;

    return {
      lease,
      monthlyRent,
      paidThisMonth,
      amountDueThisMonth: paidThisMonth ? 0 : monthlyRent,
      paymentsMade: successCount,
    };
  }

  /** Simulate making a payment */
  async makePayment(userId: number, data: { amount: number; method: string }) {
    // Find the active lease
    const lease = await this.prisma.lease.findFirst({
      where: {
        OR: [{ userId }, { occupants: { some: { userId } } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!lease) throw new Error('No active lease found');

    // Simulate payment processing — always succeeds for MVP
    return this.prisma.payment.create({
      data: {
        leaseId: lease.leaseId,
        amountPaid: data.amount,
        method: data.method as any,
        isSuccessful: true,
        transactionDate: new Date(),
      },
      include: {
        lease: {
          include: {
            unit: { include: { property: true } },
          },
        },
      },
    });
  }

  /** Staff/Admin: get payment compliance stats */
  async getPaymentStats() {
    const allPayments = await this.prisma.payment.findMany();
    const total = allPayments.length;
    const successful = allPayments.filter((p) => p.isSuccessful).length;
    const failed = total - successful;
    const collectionRate = total > 0 ? Math.round((successful / total) * 100) : 0;

    return { totalPayments: total, successfulPayments: successful, failedPayments: failed, collectionRate };
  }

  /** Staff: view all payments  */
  async getAllPayments() {
    return this.prisma.payment.findMany({
      include: {
        lease: {
          include: {
            user: {
              select: { netId: true, fName: true, lName: true, email: true },
            },
            unit: { include: { property: true } },
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });
  }
}
