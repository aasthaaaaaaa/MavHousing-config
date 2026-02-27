import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class HousingService {
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const accountId = this.configService.get<string>('R3_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'R3_SECRET_ACCESS_KEY',
    );

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string,
      },
      forcePathStyle: true,
    });
  }

  private async getSignedUrl(key: string, bucket: string): Promise<string> {
    if (!key || key.startsWith('http')) return key;
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (e) {
      return '';
    }
  }

  async findUserByUtaId(utaId: string) {
    return this.prisma.user.findUnique({
      where: { utaId },
      select: {
        userId: true,
        utaId: true,
        fName: true,
        lName: true,
        email: true,
        phone: true,
        gender: true,
        requiresAdaAccess: true,
      },
    });
  }

  async getProperties() {
    return this.prisma.property.findMany({
      select: {
        propertyId: true,
        name: true,
        address: true,
        propertyType: true,
        leaseType: true,
      },
    });
  }

  async getPropertiesAvailability() {
    const properties = await this.prisma.property.findMany({
      include: {
        units: {
          include: {
            leases: {
              where: {
                status: {
                  in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any,
                },
              },
            },
            rooms: {
              include: {
                leases: {
                  where: {
                    status: {
                      in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any,
                    },
                  },
                },
                beds: {
                  include: {
                    leases: {
                      where: {
                        status: {
                          in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return properties.map((p) => {
      const totalUnits = p.units.length;
      const availableUnits = p.units.filter(
        (u) => u.leases.length === 0,
      ).length;

      let totalRooms = 0;
      let availableRooms = 0;

      let totalBeds = 0;
      let availableBeds = 0;

      p.units.forEach((u) => {
        totalRooms += u.rooms.length;
        availableRooms += u.rooms.filter((r) => r.leases.length === 0).length;
        u.rooms.forEach((r) => {
          totalBeds += r.beds.length;
          availableBeds += r.beds.filter((b) => b.leases.length === 0).length;
        });
      });

      return {
        propertyId: p.propertyId,
        name: p.name,
        address: p.address,
        propertyType: p.propertyType,
        leaseType: p.leaseType,
        availability: {
          totalUnits,
          availableUnits,
          totalRooms,
          availableRooms,
          totalBeds,
          availableBeds,
        },
      };
    });
  }

  async getAvailableBeds(propertyId: number) {
    return this.prisma.bed.findMany({
      where: {
        room: {
          unit: {
            propertyId,
          },
        },
        leases: {
          none: {
            status: {
              in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'],
            },
          },
        },
      },
      include: {
        room: {
          include: {
            unit: true,
          },
        },
      },
      orderBy: [
        { room: { unit: { unitNumber: 'asc' } } },
        { room: { roomLetter: 'asc' } },
        { bedLetter: 'asc' },
      ],
    });
  }

  async getTerms() {
    // For MVP, return hardcoded terms
    // In production, this could come from a Terms table
    return [
      { value: 'FALL_2026', label: 'Fall 2026' },
      { value: 'SPRING_2027', label: 'Spring 2027' },
      { value: 'SUMMER_2027', label: 'Summer 2027' },
    ];
  }

  async createApplication(userId: number, applicationData: any) {
    return this.prisma.application.create({
      data: {
        userId,
        term: applicationData.term,
        preferredPropertyId: applicationData.preferredPropertyId,
        emergencyContactName: applicationData.emergencyContactName,
        emergencyContactPhone: applicationData.emergencyContactPhone,
        emergencyContactRelation: applicationData.emergencyContactRelation,
        sleepSchedule: applicationData.sleepSchedule,
        cleanliness: applicationData.cleanliness,
        noiseLevel: applicationData.noiseLevel,
        smokingPreference: applicationData.smokingPreference,
        dietaryRestrictions: applicationData.dietaryRestrictions,
        specialAccommodations: applicationData.specialAccommodations,
        idCardUrl: applicationData.idCardUrl,
        status: 'SUBMITTED',
        submissionDate: new Date(),
      },
    });
  }

  async getUserApplications(userId: number) {
    return this.prisma.application.findMany({
      where: { userId },
      include: {
        preferredProperty: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async transformApplication(app: any) {
    if (!app) return null;

    if (app.user) {
      // Reconstruct or use stored key
      const nameKey = `${app.user.fName || ''}${app.user.lName || ''}`
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const userIdentifier = nameKey || app.user.netId || 'unknown';

      const defaultPicKey = `${userIdentifier}_${app.user.utaId}_profile.jpg`;
      const picKey = app.user.profilePicUrl || defaultPicKey;
      app.user.profilePicUrl = await this.getSignedUrl(picKey, 'userpic');

      const defaultDocKey = `${userIdentifier}_${app.user.utaId}_id.jpg`;
      const docKey = app.idCardUrl || defaultDocKey;
      app.idCardUrl = await this.getSignedUrl(docKey, 'documents');
    }

    return app;
  }

  async getAllApplications() {
    const apps = await this.prisma.application.findMany({
      include: {
        user: {
          select: {
            userId: true,
            utaId: true,
            netId: true,
            fName: true,
            lName: true,
            email: true,
            profilePicUrl: true,
          },
        },
        preferredProperty: {
          select: {
            propertyId: true,
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        submissionDate: 'desc',
      },
    });

    return Promise.all(apps.map((app) => this.transformApplication(app)));
  }

  async getApplicationById(appId: number) {
    const app = await this.prisma.application.findUnique({
      where: { appId },
      include: {
        user: {
          include: {
            leases: {
              include: {
                unit: true,
                room: true,
                bed: true,
                occupants: true,
              },
              orderBy: { startDate: 'desc' },
            },
            occupancies: {
              include: {
                lease: {
                  include: {
                    unit: true,
                    room: true,
                    bed: true,
                    occupants: true,
                  },
                },
              },
            },
          },
        },
        preferredProperty: true,
      },
    });

    return this.transformApplication(app);
  }

  async updateApplicationStatus(appId: number, status: string) {
    return this.prisma.application.update({
      where: { appId },
      data: { status: status as any },
    });
  }

  async getStudents() {
    return this.prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        userId: true,
        netId: true,
        fName: true,
        lName: true,
        email: true,
      },
      orderBy: { lName: 'asc' },
    });
  }

  async getHierarchy() {
    return this.prisma.property.findMany({
      include: {
        units: {
          include: {
            leases: {
              where: { status: { in: ['SIGNED', 'ACTIVE'] as any } },
              include: {
                occupants: {
                  include: {
                    user: {
                      select: {
                        userId: true,
                        netId: true,
                        fName: true,
                        lName: true,
                      },
                    },
                  },
                },
              },
            },
            rooms: {
              include: {
                leases: {
                  where: { status: { in: ['SIGNED', 'ACTIVE'] as any } },
                  include: {
                    occupants: {
                      include: {
                        user: {
                          select: {
                            userId: true,
                            netId: true,
                            fName: true,
                            lName: true,
                          },
                        },
                      },
                    },
                  },
                },
                beds: {
                  include: {
                    leases: {
                      where: { status: { in: ['SIGNED', 'ACTIVE'] as any } },
                      include: {
                        occupants: {
                          include: {
                            user: {
                              select: {
                                userId: true,
                                netId: true,
                                fName: true,
                                lName: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getOccupancyStats() {
    // Fetch all properties with their units and active lease occupants
    const properties = await this.prisma.property.findMany({
      include: {
        units: {
          include: {
            leases: {
              where: {
                status: {
                  in: ['SIGNED', 'ACTIVE'] as any,
                },
              },
              include: {
                occupants: true,
              },
            },
            rooms: {
              include: {
                leases: {
                  where: {
                    status: {
                      in: ['SIGNED', 'ACTIVE'] as any,
                    },
                  },
                  include: {
                    occupants: true,
                  },
                },
                beds: {
                  include: {
                    leases: {
                      where: {
                        status: {
                          in: ['SIGNED', 'ACTIVE'] as any,
                        },
                      },
                      include: {
                        occupants: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Aggregate stats per property
    const stats = properties.map((property) => {
      let totalCapacity = 0;
      let occupiedCount = 0;

      property.units.forEach((unit) => {
        // Add unit max occupancy to total capacity
        totalCapacity += unit.maxOccupancy || 0;

        // Count occupants in unit-level leases
        unit.leases.forEach((lease) => {
          occupiedCount += lease.occupants.length;
        });

        // Count occupants in room-level leases
        unit.rooms.forEach((room) => {
          room.leases.forEach((lease) => {
            occupiedCount += lease.occupants.length;
          });

          // Count occupants in bed-level leases
          room.beds.forEach((bed) => {
            bed.leases.forEach((lease) => {
              occupiedCount += lease.occupants.length;
            });
          });
        });
      });

      const vacancyRate =
        totalCapacity > 0
          ? ((totalCapacity - occupiedCount) / totalCapacity) * 100
          : 0;

      return {
        propertyId: property.propertyId,
        propertyName: property.name,
        propertyType: property.propertyType,
        totalCapacity,
        occupiedBeds: occupiedCount,
        vacantBeds: totalCapacity - occupiedCount,
        vacancyRate: parseFloat(vacancyRate.toFixed(2)),
      };
    });

    const systemTotalCapacity = stats.reduce(
      (sum, s) => sum + s.totalCapacity,
      0,
    );
    const systemOccupied = stats.reduce((sum, s) => sum + s.occupiedBeds, 0);
    const systemVacancyRate =
      systemTotalCapacity > 0
        ? ((systemTotalCapacity - systemOccupied) / systemTotalCapacity) * 100
        : 0;

    return {
      overview: {
        totalCapacity: systemTotalCapacity,
        occupiedBeds: systemOccupied,
        vacantBeds: systemTotalCapacity - systemOccupied,
        vacancyRate: parseFloat(systemVacancyRate.toFixed(2)),
      },
      properties: stats,
    };
  }
}
