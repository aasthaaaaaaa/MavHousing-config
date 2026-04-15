import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PrismaService } from '@common/prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class HousingTool {
  private readonly logger = new Logger(HousingTool.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  @Tool({
    name: 'get_properties',
    description: 'List all MavHousing properties with basic info. Available to all authenticated users.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
    }),
  })
  async getProperties({ senderEmail }: { senderEmail: string }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const properties = await this.prisma.property.findMany({
      select: {
        propertyId: true,
        name: true,
        address: true,
        propertyType: true,
        leaseType: true,
        baseRate: true,
        totalCapacity: true,
      },
    });

    const result = properties.map((p) => ({
      ...p,
      baseRate: p.baseRate?.toString() || null,
    }));

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
    };
  }

  @Tool({
    name: 'get_availability',
    description:
      'Get property availability — vacant units, rooms, and beds. Available to all authenticated users.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      propertyId: z.number().optional().describe('Specific property ID to check (leave empty for all)'),
    }),
  })
  async getAvailability({ senderEmail, propertyId }: { senderEmail: string; propertyId?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const whereClause: any = propertyId ? { propertyId } : {};

    const properties = await this.prisma.property.findMany({
      where: whereClause,
      include: {
        units: {
          include: {
            leases: {
              where: { status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any } },
            },
            rooms: {
              include: {
                leases: {
                  where: { status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any } },
                },
                beds: {
                  include: {
                    leases: {
                      where: { status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = properties.map((p) => {
      const totalUnits = p.units.length;
      const availableUnits = p.units.filter((u) => u.leases.length === 0).length;
      let totalRooms = 0, availableRooms = 0, totalBeds = 0, availableBeds = 0;

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
        propertyType: p.propertyType,
        leaseType: p.leaseType,
        availability: {
          totalUnits, availableUnits,
          totalRooms, availableRooms,
          totalBeds, availableBeds,
          occupancyRate: totalBeds > 0
            ? `${Math.round(((totalBeds - availableBeds) / totalBeds) * 100)}%`
            : 'N/A',
        },
      };
    });

    return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
  }

  @Tool({
    name: 'get_property_hierarchy',
    description:
      'Get full property → unit → room → bed tree with occupant info. ADMIN/STAFF only.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      propertyId: z.number().optional().describe('Specific property ID'),
    }),
  })
  async getPropertyHierarchy({ senderEmail, propertyId }: { senderEmail: string; propertyId?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: Only Admins and Staff can view property hierarchy.' }] };
    }

    const whereClause: any = {};
    if (propertyId) whereClause.propertyId = propertyId;
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
      whereClause.propertyId = ctx.assignedPropertyId;
    }

    const properties = await this.prisma.property.findMany({
      where: whereClause,
      include: {
        units: {
          include: {
            rooms: {
              include: {
                beds: {
                  include: {
                    leases: {
                      where: { status: { in: ['SIGNED', 'ACTIVE'] as any } },
                      include: {
                        occupants: {
                          include: {
                            user: { select: { netId: true, fName: true, lName: true } },
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
        assignedStaff: {
          select: { netId: true, fName: true, lName: true, staffPosition: true },
        },
      },
    });

    // Simplified tree output
    const tree = properties.map((p) => ({
      property: p.name,
      staff: p.assignedStaff.map((s) => `${s.fName} ${s.lName} (${s.staffPosition})`),
      units: p.units.map((u) => ({
        unit: u.unitNumber,
        floor: u.floorLevel,
        ada: u.requiresAdaAccess,
        maxOccupancy: u.maxOccupancy,
        rooms: u.rooms.map((r) => ({
          room: r.roomLetter,
          beds: r.beds.map((b) => ({
            bed: b.bedLetter,
            occupants: b.leases.flatMap((l) =>
              l.occupants.map((o) => `${o.user.fName} ${o.user.lName} (${o.user.netId})`),
            ),
          })),
        })),
      })),
    }));

    return { content: [{ type: 'text' as const, text: JSON.stringify(tree, null, 2) }] };
  }
}
