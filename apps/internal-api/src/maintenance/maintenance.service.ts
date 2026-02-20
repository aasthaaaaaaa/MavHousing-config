import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  /** Student: get their active lease (needed to auto-populate leaseId) */
  async getActiveLease(userId: number) {
    return this.prisma.lease.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { leaseId: true, status: true },
    });
  }

  /** Student: submit a new maintenance request */
  async createRequest(
    userId: number,
    leaseId: number,
    data: { category: string; priority: string; description: string },
  ) {
    return this.prisma.maintenanceRequest.create({
      data: {
        createdByUserId: userId,
        leaseId,
        category: data.category as any,
        priority: data.priority as any,
        description: data.description,
        status: 'OPEN',
        updatedAt: new Date(),
      },
    });
  }

  /** Student: view their own requests */
  async getMyRequests(userId: number) {
    return this.prisma.maintenanceRequest.findMany({
      where: { createdByUserId: userId },
      include: {
        assignedStaff: {
          select: { fName: true, lName: true },
        },
        lease: {
          include: {
            unit: { include: { property: true } },
            room: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Staff: view all requests */
  async getAllRequests() {
    return this.prisma.maintenanceRequest.findMany({
      include: {
        createdBy: {
          select: { netId: true, fName: true, lName: true, email: true },
        },
        assignedStaff: {
          select: { userId: true, fName: true, lName: true },
        },
        lease: {
          include: {
            unit: { include: { property: true } },
            room: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Staff: update status (and optionally assign staff) */
  async updateRequestStatus(
    requestId: number,
    status: string,
    staffId?: number,
  ) {
    return this.prisma.maintenanceRequest.update({
      where: { requestId },
      data: {
        status: status as any,
        updatedAt: new Date(),
        ...(staffId && { assignedStaffId: staffId }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date() }),
      },
    });
  }

  /** Staff: get list of staff users for assignment */
  async getStaffList() {
    return this.prisma.user.findMany({
      where: { role: 'STAFF' },
      select: { userId: true, fName: true, lName: true, netId: true },
    });
  }
}
