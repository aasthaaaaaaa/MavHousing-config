import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@libs/db';
import { ApplicationStatus } from '@mav-housing/prisma';
import {
  CreateApplication_By_Unit_DTO,
  CreateApplication_By_Room_DTO,
  CreateApplication_By_Bed_DTO,
} from './dto/create-application.dto';

@Injectable()
export class ApplicationService {
  constructor(private prisma: PrismaService) {}

  // ═══════════════════════════════════════════
  // STUDENT: Submit Application
  // ═══════════════════════════════════════════

  async submitByUnit(netId: string, dto: CreateApplication_By_Unit_DTO) {
    const user = await this.validateAndGetUser(
      netId,
      dto.personalDetails.utaId,
    );

    // Check for duplicate application in the same term
    await this.checkDuplicateApplication(
      user.userId,
      dto.applicationSelection.intakeSemester,
    );

    const application = await this.prisma.application.create({
      data: {
        userId: user.userId,
        term: dto.applicationSelection.intakeSemester,
        status: ApplicationStatus.UNDER_REVIEW,
        preferredPropertyId: dto.applicationSelection.buildingId
          ? parseInt(dto.applicationSelection.buildingId)
          : null,
        submissionDate: new Date(),
      },
    });

    return {
      message: 'BY_UNIT application submitted successfully',
      application,
      details: {
        personalDetails: dto.personalDetails,
        emergencyContact: dto.emergencyContact,
        applicationSelection: dto.applicationSelection,
        occupants: dto.occupants ?? [],
      },
    };
  }

  async submitByRoom(netId: string, dto: CreateApplication_By_Room_DTO) {
    const user = await this.validateAndGetUser(
      netId,
      dto.personalDetails.utaId,
    );
    await this.checkDuplicateApplication(
      user.userId,
      dto.applicationSelection.intakeSemester,
    );

    const application = await this.prisma.application.create({
      data: {
        userId: user.userId,
        term: dto.applicationSelection.intakeSemester,
        status: ApplicationStatus.UNDER_REVIEW,
        preferredPropertyId: dto.applicationSelection.buildingId
          ? parseInt(dto.applicationSelection.buildingId)
          : null,
        submissionDate: new Date(),
      },
    });

    return {
      message: 'BY_ROOM application submitted successfully',
      application,
      details: {
        personalDetails: dto.personalDetails,
        emergencyContact: dto.emergencyContact,
        applicationSelection: dto.applicationSelection,
        roomId: dto.roomId,
      },
    };
  }

  async submitByBed(netId: string, dto: CreateApplication_By_Bed_DTO) {
    const user = await this.validateAndGetUser(
      netId,
      dto.personalDetails.utaId,
    );
    await this.checkDuplicateApplication(
      user.userId,
      dto.applicationSelection.intakeSemester,
    );

    const application = await this.prisma.application.create({
      data: {
        userId: user.userId,
        term: dto.applicationSelection.intakeSemester,
        status: ApplicationStatus.UNDER_REVIEW,
        preferredPropertyId: dto.applicationSelection.buildingId
          ? parseInt(dto.applicationSelection.buildingId)
          : null,
        submissionDate: new Date(),
      },
    });

    return {
      message: 'BY_BED application submitted successfully',
      application,
      details: {
        personalDetails: dto.personalDetails,
        emergencyContact: dto.emergencyContact,
        applicationSelection: dto.applicationSelection,
        bedId: dto.bedId,
      },
    };
  }

  // ═══════════════════════════════════════════
  // STUDENT: View My Applications
  // ═══════════════════════════════════════════

  async findMyApplications(netId: string) {
    const user = await this.prisma.user.findUnique({
      where: { netId },
    });

    if (!user) {
      throw new NotFoundException(`User with netId "${netId}" not found`);
    }

    const applications = await this.prisma.application.findMany({
      where: { userId: user.userId },
      include: {
        preferredProperty: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((app) => ({
      ...app,
      preferredProperty: app.preferredProperty
        ? {
            ...app.preferredProperty,
            phone:
              app.preferredProperty.phone !== null
                ? app.preferredProperty.phone.toString()
                : null,
          }
        : null,
    }));
  }

  // ═══════════════════════════════════════════
  // PREREQUISITE: Housing Availability
  // ═══════════════════════════════════════════

  async getHousingAvailability() {
    const properties = await this.prisma.property.findMany({
      include: {
        units: {
          include: {
            rooms: {
              include: {
                beds: true,
              },
            },
          },
        },
      },
    });

    return properties.map((property) => ({
      propertyId: property.propertyId,
      name: property.name,
      address: property.address,
      propertyType: property.propertyType,
      leaseType: property.leaseType,
      phone: property.phone !== null ? property.phone.toString() : null,
      totalCapacity: property.totalCapacity,
      totalUnits: property.units.length,
      units: property.units.map((unit) => {
        const base = {
          unitId: unit.unitId,
          unitNumber: unit.unitNumber,
          floorLevel: unit.floorLevel,
          requiresAdaAccess: unit.requiresAdaAccess,
          maxOccupancy: unit.maxOccupancy,
        };

        // BY_UNIT: no rooms or beds needed
        if (property.leaseType === 'BY_UNIT') {
          return base;
        }

        // BY_ROOM: include rooms, but no beds
        if (property.leaseType === 'BY_ROOM') {
          return {
            ...base,
            rooms: unit.rooms.map((room) => ({
              roomId: room.roomId,
              roomLetter: room.roomLetter,
            })),
          };
        }

        // BY_BED: include rooms and beds
        return {
          ...base,
          rooms: unit.rooms.map((room) => ({
            roomId: room.roomId,
            roomLetter: room.roomLetter,
            beds: room.beds.map((bed) => ({
              bedId: bed.bedId,
              bedLetter: bed.bedLetter,
            })),
          })),
        };
      }),
    }));
  }

  // ═══════════════════════════════════════════
  // ADMIN / STAFF: Read & Manage Applications
  // ═══════════════════════════════════════════

  async findAll() {
    const applications = await this.prisma.application.findMany({
      include: {
        user: true,
        preferredProperty: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Convert BigInt phone fields to strings
    return applications.map((app) => ({
      ...app,
      user: app.user
        ? {
            ...app.user,
            phone: app.user.phone !== null ? app.user.phone.toString() : null,
          }
        : null,
      preferredProperty: app.preferredProperty
        ? {
            ...app.preferredProperty,
            phone:
              app.preferredProperty.phone !== null
                ? app.preferredProperty.phone.toString()
                : null,
          }
        : null,
    }));
  }

  async findByAppId(appId: number) {
    const application = await this.prisma.application.findUnique({
      where: { appId },
      include: {
        user: true,
        preferredProperty: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${appId} not found`);
    }

    return {
      ...application,
      user: application.user
        ? {
            ...application.user,
            phone:
              application.user.phone !== null
                ? application.user.phone.toString()
                : null,
          }
        : null,
      preferredProperty: application.preferredProperty
        ? {
            ...application.preferredProperty,
            phone:
              application.preferredProperty.phone !== null
                ? application.preferredProperty.phone.toString()
                : null,
          }
        : null,
    };
  }

  async findByUtaId(utaId: string) {
    const user = await this.prisma.user.findUnique({
      where: { utaId },
    });

    if (!user) {
      throw new NotFoundException(`User with UTA ID ${utaId} not found`);
    }

    const applications = await this.prisma.application.findMany({
      where: { userId: user.userId },
      include: {
        preferredProperty: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      user: {
        ...user,
        phone: user.phone !== null ? user.phone.toString() : null,
      },
      applications: applications.map((app) => ({
        ...app,
        preferredProperty: app.preferredProperty
          ? {
              ...app.preferredProperty,
              phone:
                app.preferredProperty.phone !== null
                  ? app.preferredProperty.phone.toString()
                  : null,
            }
          : null,
      })),
    };
  }

  async updateStatus(appId: number, status: ApplicationStatus) {
    const application = await this.prisma.application.findUnique({
      where: { appId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${appId} not found`);
    }

    const updated = await this.prisma.application.update({
      where: { appId },
      data: { status },
    });

    return {
      message: `Application ${appId} status changed to ${status}`,
      application: updated,
    };
  }

  async remove(appId: number) {
    const application = await this.prisma.application.findUnique({
      where: { appId },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${appId} not found`);
    }

    await this.prisma.application.delete({
      where: { appId },
    });

    return { message: `Application ${appId} has been deleted` };
  }

  // ═══════════════════════════════════════════
  // Private Helpers
  // ═══════════════════════════════════════════

  private async validateAndGetUser(netId: string, utaId: string) {
    // Look up the user by netId (from JWT)
    const user = await this.prisma.user.findUnique({
      where: { netId },
    });

    if (!user) {
      throw new NotFoundException(`User with netId "${netId}" not found`);
    }

    // Verify the utaId in the payload matches the logged-in user
    if (user.utaId !== utaId) {
      throw new BadRequestException(
        `UTA ID "${utaId}" does not match the logged-in user`,
      );
    }

    return user;
  }

  private async checkDuplicateApplication(userId: number, term: string) {
    const existing = await this.prisma.application.findUnique({
      where: {
        userId_term: { userId, term },
      },
    });

    if (existing) {
      throw new ConflictException(
        `You already have an application for term "${term}"`,
      );
    }
  }
}
