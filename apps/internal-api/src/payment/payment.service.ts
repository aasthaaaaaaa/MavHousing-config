import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  /** Get all payments for a user (via their leases) */
  async getMyPayments(userId: number) {
    return this.prisma.payment.findMany({
      where: {
        lease: { userId },
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

  /** Get payment summary for a user (lease balance info) */
  async getPaymentSummary(userId: number) {
    const lease = await this.prisma.lease.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        unit: { include: { property: true } },
      },
    });

    if (!lease) return null;

    const payments = await this.prisma.payment.findMany({
      where: { leaseId: lease.leaseId, isSuccessful: true },
    });

    const totalPaid = payments.reduce(
      (sum, p) => sum + Number(p.amountPaid),
      0,
    );
    const totalDue = Number(lease.totalDue);
    const balance = totalDue - totalPaid;

    return {
      lease,
      totalDue,
      totalPaid,
      balance,
      dueThisMonth: Number(lease.dueThisMonth),
      paymentCount: payments.length,
    };
  }

  /** Simulate making a payment */
  async makePayment(
    userId: number,
    data: { amount: number; method: string },
  ) {
    // Find the active lease
    const lease = await this.prisma.lease.findFirst({
      where: { userId },
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
