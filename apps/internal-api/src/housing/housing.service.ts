import { Injectable } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class HousingService {
  constructor(private prisma: PrismaService) {}

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

  async getAvailableBeds(propertyId: number) {
    return this.prisma.bed.findMany({
      where: {
        room: {
          unit: {
            propertyId,
          }
        },
        leases: {
          none: {
            status: {
              in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE']
            }
          }
        }
      },
      include: {
        room: {
          include: {
            unit: true
          }
        }
      },
      orderBy: [
        { room: { unit: { unitNumber: 'asc' } } },
        { room: { roomLetter: 'asc' } },
        { bedLetter: 'asc' }
      ]
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
        classification: applicationData.classification,
        expectedGraduation: applicationData.expectedGraduation,
        emergencyContactName: applicationData.emergencyContactName,
        emergencyContactPhone: applicationData.emergencyContactPhone,
        emergencyContactRelation: applicationData.emergencyContactRelation,
        sleepSchedule: applicationData.sleepSchedule,
        cleanliness: applicationData.cleanliness,
        noiseLevel: applicationData.noiseLevel,
        smokingPreference: applicationData.smokingPreference,
        dietaryRestrictions: applicationData.dietaryRestrictions,
        specialAccommodations: applicationData.specialAccommodations,
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

  async getAllApplications() {
    return this.prisma.application.findMany({
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
      select: { userId: true, netId: true, fName: true, lName: true, email: true },
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
                      select: { userId: true, netId: true, fName: true, lName: true },
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
                          select: { userId: true, netId: true, fName: true, lName: true },
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
                              select: { userId: true, netId: true, fName: true, lName: true },
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
                  in: ['SIGNED', 'ACTIVE'] as any
                }
              },
              include: {
                occupants: true
              }
            },
            rooms: {
              include: {
                leases: {
                  where: {
                    status: {
                      in: ['SIGNED', 'ACTIVE'] as any
                    }
                  },
                  include: {
                    occupants: true
                  }
                },
                beds: {
                  include: {
                    leases: {
                      where: {
                        status: {
                          in: ['SIGNED', 'ACTIVE'] as any
                        }
                      },
                      include: {
                        occupants: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Aggregate stats per property
    const stats = properties.map(property => {
      let totalCapacity = 0;
      let occupiedCount = 0;

      property.units.forEach(unit => {
        // Add unit max occupancy to total capacity
        totalCapacity += unit.maxOccupancy || 0;

        // Count occupants in unit-level leases
        unit.leases.forEach(lease => {
          occupiedCount += lease.occupants.length;
        });

        // Count occupants in room-level leases
        unit.rooms.forEach(room => {
          room.leases.forEach(lease => {
            occupiedCount += lease.occupants.length;
          });

          // Count occupants in bed-level leases
          room.beds.forEach(bed => {
            bed.leases.forEach(lease => {
              occupiedCount += lease.occupants.length;
            });
          });
        });
      });

      const vacancyRate = totalCapacity > 0 
        ? ((totalCapacity - occupiedCount) / totalCapacity) * 100 
        : 0;

      return {
        propertyId: property.propertyId,
        propertyName: property.name,
        propertyType: property.propertyType,
        totalCapacity,
        occupiedBeds: occupiedCount,
        vacantBeds: totalCapacity - occupiedCount,
        vacancyRate: parseFloat(vacancyRate.toFixed(2))
      };
    });

    const systemTotalCapacity = stats.reduce((sum, s) => sum + s.totalCapacity, 0);
    const systemOccupied = stats.reduce((sum, s) => sum + s.occupiedBeds, 0);
    const systemVacancyRate = systemTotalCapacity > 0
      ? ((systemTotalCapacity - systemOccupied) / systemTotalCapacity) * 100
      : 0;

    return {
      overview: {
        totalCapacity: systemTotalCapacity,
        occupiedBeds: systemOccupied,
        vacantBeds: systemTotalCapacity - systemOccupied,
        vacancyRate: parseFloat(systemVacancyRate.toFixed(2))
      },
      properties: stats
    };
  }
}

