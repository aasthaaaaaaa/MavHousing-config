import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class LeaseService {
  constructor(private prisma: PrismaService) {}

  async getMyLease(userId: number) {
    return this.prisma.lease.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        room: true,
        bed: true,
      },
    });
  }

  async getAllLeases() {
    return this.prisma.lease.findMany({
      include: {
        user: {
          select: {
            netId: true,
            fName: true,
            lName: true,
            email: true,
          },
        },
        unit: {
          include: {
            property: true,
          },
        },
        room: true,
        bed: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateLeaseStatus(leaseId: number, status: string) {
    return this.prisma.lease.update({
      where: { leaseId },
      data: { status: status as any, updatedAt: new Date() },
    });
  }
}
