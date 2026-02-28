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

  private getTermDates(term: string): { startDate: Date; endDate: Date } {
    // Basic parser for "FALL_2026", "SPRING_2027", etc.
    const [season, yearStr] = term.split('_');
    const year = parseInt(yearStr) || new Date().getFullYear();

    if (season === 'FALL') {
      return {
        startDate: new Date(`${year}-08-15T00:00:00Z`),
        endDate: new Date(`${year}-12-15T00:00:00Z`),
      };
    }
    if (season === 'SPRING') {
      return {
        startDate: new Date(`${year}-01-10T00:00:00Z`),
        endDate: new Date(`${year}-05-15T00:00:00Z`),
      };
    }
    if (season === 'SUMMER') {
      return {
        startDate: new Date(`${year}-06-01T00:00:00Z`),
        endDate: new Date(`${year}-08-01T00:00:00Z`),
      };
    }

    // Default fallback
    const now = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(now.getFullYear() + 1);
    return { startDate: now, endDate: nextYear };
  }

  async updateApplicationStatus(appId: number, status: string) {
    const application = await this.prisma.application.findUnique({
      where: { appId },
      include: {
        preferredProperty: true,
      },
    });

    if (!application) {
      throw new NotFoundException(`Application with ID ${appId} not found`);
    }

    // If staff is approving, we need to enforce lease rules and auto-create a lease
    if (status === 'APPROVED' && application.status !== 'APPROVED') {
      
      // Check if this is an occupant invite application
      if (application.specialAccommodations?.startsWith('INVITE_LEASE:')) {
        const leaseIdStr = application.specialAccommodations.split(':')[1];
        const targetLeaseId = parseInt(leaseIdStr, 10);
        
        const targetLease = await this.prisma.lease.findUnique({
          where: { leaseId: targetLeaseId },
           include: { occupants: true, unit: true }
        });

        if (!targetLease) {
          throw new HttpException('Target lease for invitation not found', HttpStatus.NOT_FOUND);
        }

        if (targetLease.occupants.some(o => o.userId === application.userId)) {
           // Already an occupant, just mark app as approved
        } else {
           if (targetLease.occupants.length >= (targetLease.unit?.maxOccupancy || 1)) {
              throw new HttpException('Target unit is at maximum capacity', HttpStatus.BAD_REQUEST);
           }
           
           await this.prisma.occupant.create({
             data: {
               userId: application.userId,
               leaseId: targetLeaseId,
               occupantType: 'ROOMMATE',
               moveInDate: new Date(),
             }
           });
        }
        
        return this.prisma.application.update({
          where: { appId },
          data: { status: status as any },
        });
      }

      // 1. Check if the user is already on an active lease that is not complete
      const existingActiveLease = await this.prisma.lease.findFirst({
        where: {
          userId: application.userId,
          status: {
            in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any,
          },
        },
      });

      if (existingActiveLease && existingActiveLease.endDate > new Date()) {
        throw new BadRequestException(
          'User is already in an active lease that is not complete.',
        );
      }

      // 2. Identify the term dates
      const { startDate, endDate } = this.getTermDates(application.term);

      // Default to property leaseType if available, else fallback to BY_BED
      const leaseType = application.preferredProperty?.leaseType || 'BY_BED';

      // 3. Auto-create a LEASE and Occupant record
      await this.prisma.lease.create({
        data: {
          userId: application.userId,
          leaseType: leaseType as any,
          startDate,
          endDate,
          totalDue: 0,
          dueThisMonth: 0,
          status: 'ACTIVE',
          occupants: {
            create: {
              userId: application.userId,
              occupantType: 'LEASE_HOLDER',
              moveInDate: startDate,
            },
          },
        },
      });
    }

    return this.prisma.application.update({
      where: { appId },
      data: { status: status as any },
    });
  }

  async deleteApplication(appId: number, userId: number) {
    const application = await this.prisma.application.findUnique({
      where: { appId },
    });

    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }

    if (application.userId !== userId) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    // Prevent deletion of approved applications
    if (application.status === 'APPROVED') {
      throw new HttpException(
        'Cannot delete an approved application. Please contact staff.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Prevent deletion if there is an active lease for this term
    const activeLease = await this.prisma.lease.findFirst({
      where: {
        userId,
        status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any },
      },
    });

    if (activeLease && activeLease.endDate > new Date()) {
       // A strict term check could be added here, but usually, 
       // any active lease prevents withdrawing applications at this stage.
       throw new HttpException(
         'You have an active lease. Cannot remove application.',
         HttpStatus.BAD_REQUEST,
       );
    }

    await this.prisma.application.delete({
      where: { appId },
    });

    return { message: 'Application deleted successfully' };
  }

  async addOccupant(
    leaseId: number,
    targetUtaId: string,
    requesterUserId: number,
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { leaseId },
      include: { occupants: true, unit: true },
    });

    if (!lease) {
      throw new HttpException('Lease not found', HttpStatus.NOT_FOUND);
    }

    if (lease.leaseType !== 'BY_UNIT') {
      throw new HttpException(
        'Occupants can only be managed on BY_UNIT leases',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isLeaseHolder = lease.occupants.some(
      (o) =>
        o.userId === requesterUserId && o.occupantType === 'LEASE_HOLDER',
    );

    if (!isLeaseHolder && lease.userId !== requesterUserId) {
      throw new HttpException(
        'Only the lease holder can add occupants',
        HttpStatus.FORBIDDEN,
      );
    }

    const targetUser = await this.findUserByUtaId(targetUtaId);
    if (!targetUser) {
      throw new HttpException(
        'Target user not found by UTA ID',
        HttpStatus.NOT_FOUND,
      );
    }

    if (lease.occupants.some((o) => o.userId === targetUser.userId)) {
      throw new HttpException(
        'User is already an occupant on this lease',
        HttpStatus.CONFLICT,
      );
    }

    const currentOccupantsCount = lease.occupants.length;
    const maxOccupancy = lease.unit?.maxOccupancy || 1;

    if (currentOccupantsCount >= maxOccupancy) {
      throw new HttpException(
        `Cannot add occupant: unit is at max capacity (${maxOccupancy})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Pseudo-Invite application
    // (As requested, we inject a special note for the new occupant to see in their app tab)
    const newApp = await this.prisma.application.create({
      data: {
        userId: targetUser.userId,
        term: 'INVITE', // Or derive the term from lease.startDate
        status: 'SUBMITTED', // They will accept or deny it
        specialAccommodations: `INVITE_LEASE:${leaseId}`,
        submissionDate: new Date(),
      },
    });

    // Send email notification to the occupant
    console.log(`\n================================`);
    console.log(`[EMAIL DISPATCH] To: ${targetUser.email}`);
    console.log(`[EMAIL DISPATCH] Subject: You've been invited to join a lease!`);
    console.log(`[EMAIL DISPATCH] Body: Dear ${targetUser.fName}, you have been invited to join a lease as an occupant. Please log in to your housing portal and check your "My Applications" tab to Accept or Deny this request.`);
    console.log(`================================\n`);

    return { message: 'Occupant invitation sent successfully' };
  }

  async removeOccupant(
    leaseId: number,
    targetUserId: number,
    requesterUserId: number,
  ) {
    const lease = await this.prisma.lease.findUnique({
      where: { leaseId },
      include: { occupants: true },
    });

    if (!lease) {
      throw new HttpException('Lease not found', HttpStatus.NOT_FOUND);
    }

    const requesterIsLeaseHolder = lease.occupants.some(
      (o) =>
        o.userId === requesterUserId && o.occupantType === 'LEASE_HOLDER',
    );

    // Only the lease holder can remove others. The target can also remove themselves (deny/leave).
    if (!requesterIsLeaseHolder && requesterUserId !== targetUserId) {
      throw new HttpException(
        'Forbidden to remove this occupant',
        HttpStatus.FORBIDDEN,
      );
    }

    const targetOccupancy = lease.occupants.find(
      (o) => o.userId === targetUserId,
    );

    if (!targetOccupancy) {
      // If no occupancy is found, see if we just need to delete the pseudo invite application
      const inviteApp = await this.prisma.application.findFirst({
         where: {
            userId: targetUserId,
            specialAccommodations: `INVITE_LEASE:${leaseId}`,
         }
      });
      if (inviteApp) {
         await this.prisma.application.delete({ where: { appId: inviteApp.appId }});
         return { message: 'Occupant invitation withdrawn/denied' };
      }

      throw new HttpException(
        'User is not an occupant on this lease',
        HttpStatus.NOT_FOUND,
      );
    }

    if (targetOccupancy.occupantType === 'LEASE_HOLDER' && lease.occupants.length > 1) {
      throw new HttpException(
        'Cannot remove the primary lease holder while other occupants exist',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.occupant.delete({
      where: { occupantId: targetOccupancy.occupantId },
    });

    return { message: 'Occupant removed successfully' };
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
