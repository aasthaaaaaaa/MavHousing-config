import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { EmailService } from 'apps/comms-server/src/email/email.service';

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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
    const extraFees = Number(lease.terminationFee || 0);
    const totalDueThisMonth = monthlyRent + extraFees;

    // Check successful payments for the current calendar month
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

    const totalPaidThisMonth = thisMonthPayments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0,
    );

    const amountDueThisMonth = Math.max(
      0,
      totalDueThisMonth - totalPaidThisMonth,
    );
    const paidThisMonth = amountDueThisMonth <= 0;

    // Count all successful payments for the history badge
    const allSuccessfulPayments = await this.prisma.payment.count({
      where: { leaseId: lease.leaseId, isSuccessful: true },
    });

    return {
      lease,
      monthlyRent,
      extraFees,
      totalDueThisMonth,
      totalPaidThisMonth,
      paidThisMonth,
      amountDueThisMonth,
      paymentsMade: allSuccessfulPayments,
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
    const payment = await this.prisma.payment.create({
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
            user: { select: { email: true, fName: true } },
            unit: { include: { property: true } },
          },
        },
      },
    });

    // Fire-and-forget: send payment confirmation email
    const user = payment.lease?.user;
    if (user) {
      const formattedAmount = `$${Number(data.amount).toFixed(2)}`;
      const method = data.method.replace('_', ' ');
      const context = `Amount: ${formattedAmount} | Method: ${method}`;
      this.emailService
        .sendTemplateEmail('paymentSuccessful', user.email, user.fName, context)
        .catch((e) => console.error('[PaymentService] Failed to send payment confirmation email:', e));
    }

    return payment;
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

  /** Staff: Get payments for a specific student by NetId */
  async getPaymentsByNetId(netId: string) {
    return this.prisma.payment.findMany({
      where: {
        lease: {
          user: { netId },
        },
      },
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

  /** Staff: Get payments for a specific lease */
  async getPaymentsByLeaseId(leaseId: number) {
    return this.prisma.payment.findMany({
      where: { leaseId },
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
