import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class LeaseService {
  constructor(private prisma: PrismaService) {}

  async getMyLease(userId: number) {
    return this.prisma.lease.findFirst({
      where: {
        OR: [
          { userId },
          { occupants: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        room: true,
        bed: true,
        occupants: {
          include: {
            user: {
              select: {
                userId: true,
                netId: true,
                fName: true,
                lName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async createLease(data: {
    userId: number;
    leaseType: any;
    unitId?: number;
    roomId?: number;
    bedId?: number;
    startDate: string;
    endDate: string;
    totalDue: number;
    dueThisMonth: number;
  }) {
    return this.prisma.lease.create({
      data: {
        userId: data.userId,
        leaseType: data.leaseType || 'BY_BED',
        assignedUnitId: data.unitId,
        assignedRoomId: data.roomId,
        assignedBedId: data.bedId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalDue: data.totalDue,
        dueThisMonth: data.dueThisMonth,
        status: 'PENDING_SIGNATURE',
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

  async reassignUserToLease(userId: number, targetLeaseId: number, asHolder: boolean) {
    // 1. Fetch Target Lease and Unit Info
    const targetLease = await this.prisma.lease.findUnique({
      where: { leaseId: targetLeaseId },
      include: {
        unit: true,
        occupants: true,
      },
    });

    if (!targetLease) {
      throw new Error(`Target lease ${targetLeaseId} not found`);
    }

    const unit = targetLease.unit;
    if (!unit) {
      throw new Error(`Lease ${targetLeaseId} is not associated with a unit`);
    }

    // 2. Occupancy Check
    const currentOccupancy = await this.prisma.occupant.count({
      where: {
        lease: {
          assignedUnitId: unit.unitId,
        },
      },
    });

    if (unit.maxOccupancy && currentOccupancy >= unit.maxOccupancy) {
      throw new Error(
        `Unit ${unit.unitNumber} is at maximum occupancy (${unit.maxOccupancy})`,
      );
    }

    // 3. Holder Check
    if (asHolder) {
      const existingHolder = targetLease.occupants.find(
        (o) => o.occupantType === 'LEASE_HOLDER',
      );
      if (existingHolder) {
        throw new Error(
          `Lease ${targetLeaseId} already has a lease holder (${existingHolder.userId})`,
        );
      }
    }

    // 4. Perform Switch
    return this.prisma.$transaction(async (tx) => {
      // Remove user from any existing occupant roles they have in ANY lease
      await tx.occupant.deleteMany({
        where: { userId: userId },
      });

      // Add to new lease
      const newOccupant = await tx.occupant.create({
        data: {
          leaseId: targetLeaseId,
          userId: userId,
          occupantType: asHolder ? 'LEASE_HOLDER' : 'OCCUPANT',
        },
      });

      // Update student status to resident if they were an applicant
      await tx.user.update({
        where: { userId },
        data: { studentStatus: 'RESIDENT' },
      });

      return newOccupant;
    });
  }
}

