"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HousingTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HousingTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const rbac_service_1 = require("../rbac/rbac.service");
let HousingTool = HousingTool_1 = class HousingTool {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
        this.logger = new common_1.Logger(HousingTool_1.name);
    }
    async getProperties({ senderEmail }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
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
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    }
    async getAvailability({ senderEmail, propertyId }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        const whereClause = propertyId ? { propertyId } : {};
        const properties = await this.prisma.property.findMany({
            where: whereClause,
            include: {
                units: {
                    include: {
                        leases: {
                            where: { status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] } },
                        },
                        rooms: {
                            include: {
                                leases: {
                                    where: { status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] } },
                                },
                                beds: {
                                    include: {
                                        leases: {
                                            where: { status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] } },
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
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
    async getPropertyHierarchy({ senderEmail, propertyId }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Only Admins and Staff can view property hierarchy.' }] };
        }
        const whereClause = {};
        if (propertyId)
            whereClause.propertyId = propertyId;
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
                                            where: { status: { in: ['SIGNED', 'ACTIVE'] } },
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
                        occupants: b.leases.flatMap((l) => l.occupants.map((o) => `${o.user.fName} ${o.user.lName} (${o.user.netId})`)),
                    })),
                })),
            })),
        }));
        return { content: [{ type: 'text', text: JSON.stringify(tree, null, 2) }] };
    }
};
exports.HousingTool = HousingTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_properties',
        description: 'List all MavHousing properties with basic info. Available to all authenticated users.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HousingTool.prototype, "getProperties", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_availability',
        description: 'Get property availability — vacant units, rooms, and beds. Available to all authenticated users.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            propertyId: zod_1.z.number().optional().describe('Specific property ID to check (leave empty for all)'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HousingTool.prototype, "getAvailability", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_property_hierarchy',
        description: 'Get full property → unit → room → bed tree with occupant info. ADMIN/STAFF only.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            propertyId: zod_1.z.number().optional().describe('Specific property ID'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HousingTool.prototype, "getPropertyHierarchy", null);
exports.HousingTool = HousingTool = HousingTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rbac_service_1.RbacService])
], HousingTool);
//# sourceMappingURL=housing.tool.js.map