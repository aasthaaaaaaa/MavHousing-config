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
        user: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
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

  async getOccupancy() {
    return this.prisma.lease.findMany({
      where: { status: { in: ['SIGNED', 'ACTIVE'] as any } },
      include: {
        user: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
        unit: { include: { property: true } },
        room: true,
        bed: true,
        occupants: {
          include: {
            user: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addOccupant(leaseId: number, userId: number, occupantType: string) {
    return this.prisma.occupant.create({
      data: {
        leaseId,
        userId,
        occupantType: occupantType as any,
      },
      include: {
        user: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
      },
    });
  }

  async removeOccupant(occupantId: number) {
    return this.prisma.occupant.delete({ where: { occupantId } });
  }
}
