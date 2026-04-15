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
var LeaseTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaseTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const rbac_service_1 = require("../rbac/rbac.service");
let LeaseTool = LeaseTool_1 = class LeaseTool {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
        this.logger = new common_1.Logger(LeaseTool_1.name);
        this.leaseInclude = {
            user: {
                select: { userId: true, netId: true, fName: true, lName: true, email: true },
            },
            unit: { include: { property: true } },
            room: true,
            bed: true,
            occupants: {
                include: {
                    user: {
                        select: { userId: true, netId: true, fName: true, lName: true, email: true },
                    },
                },
            },
        };
    }
    async getLeaseInfo({ senderEmail, netId, leaseId }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Your email is not registered.' }] };
        }
        if (leaseId) {
            const lease = await this.prisma.lease.findUnique({
                where: { leaseId },
                include: this.leaseInclude,
            });
            if (!lease) {
                return { content: [{ type: 'text', text: 'No lease found with that ID.' }] };
            }
            if (!this.rbac.canAccessUser(ctx, lease.userId)) {
                return { content: [{ type: 'text', text: '❌ Access Denied: You cannot view this lease.' }] };
            }
            return { content: [{ type: 'text', text: JSON.stringify(this.serializeLease(lease), null, 2) }] };
        }
        let targetUserId = ctx.userId;
        if (netId && this.rbac.isStaffOrAbove(ctx)) {
            const targetUser = await this.prisma.user.findUnique({ where: { netId } });
            if (!targetUser) {
                return { content: [{ type: 'text', text: `No user found with netId "${netId}".` }] };
            }
            targetUserId = targetUser.userId;
        }
        else if (netId && !this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Students can only view their own lease.' }] };
        }
        const lease = await this.prisma.lease.findFirst({
            where: {
                OR: [{ userId: targetUserId }, { occupants: { some: { userId: targetUserId } } }],
                status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE', 'TERMINATION_REQUESTED'] },
            },
            orderBy: { createdAt: 'desc' },
            include: this.leaseInclude,
        });
        if (!lease) {
            return { content: [{ type: 'text', text: 'No active lease found.' }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(this.serializeLease(lease), null, 2) }] };
    }
    async getAllLeases({ senderEmail, status, limit }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        if (!this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Only Admins and Staff can list all leases. Use "get_lease_info" for your own lease.' }] };
        }
        const whereClause = this.rbac.getLeaseFilter(ctx);
        if (status)
            whereClause.status = status.toUpperCase();
        const leases = await this.prisma.lease.findMany({
            where: whereClause,
            include: this.leaseInclude,
            take: limit || 25,
            orderBy: { createdAt: 'desc' },
        });
        const serialized = leases.map((l) => this.serializeLease(l));
        return {
            content: [{
                    type: 'text',
                    text: `Found ${leases.length} lease(s):\n${JSON.stringify(serialized, null, 2)}`,
                }],
        };
    }
    async getOccupancy({ senderEmail }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Only Admins and Staff can view occupancy data.' }] };
        }
        const whereClause = {
            status: { in: ['SIGNED', 'ACTIVE'] },
            ...this.rbac.getLeaseFilter(ctx),
        };
        const leases = await this.prisma.lease.findMany({
            where: whereClause,
            include: {
                user: { select: { netId: true, fName: true, lName: true } },
                unit: { include: { property: true } },
                room: true,
                bed: true,
                occupants: {
                    include: {
                        user: { select: { netId: true, fName: true, lName: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const summary = leases.map((l) => ({
            leaseId: l.leaseId,
            tenant: `${l.user.fName} ${l.user.lName} (${l.user.netId})`,
            property: l.unit?.property?.name || 'Unassigned',
            unit: l.unit?.unitNumber || 'N/A',
            room: l.room?.roomLetter || 'N/A',
            bed: l.bed?.bedLetter || 'N/A',
            status: l.status,
            occupants: l.occupants.map((o) => `${o.user.fName} ${o.user.lName} (${o.occupantType})`),
        }));
        return {
            content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
        };
    }
    serializeLease(lease) {
        return {
            leaseId: lease.leaseId,
            status: lease.status,
            leaseType: lease.leaseType,
            startDate: lease.startDate,
            endDate: lease.endDate,
            totalDue: lease.totalDue?.toString(),
            dueThisMonth: lease.dueThisMonth?.toString(),
            terminationFee: lease.terminationFee?.toString() || null,
            terminationReason: lease.terminationReason,
            tenant: lease.user
                ? { netId: lease.user.netId, name: `${lease.user.fName} ${lease.user.lName}`, email: lease.user.email }
                : null,
            property: lease.unit?.property?.name || null,
            unit: lease.unit?.unitNumber || null,
            room: lease.room?.roomLetter || null,
            bed: lease.bed?.bedLetter || null,
            occupants: lease.occupants?.map((o) => ({
                name: `${o.user.fName} ${o.user.lName}`,
                netId: o.user.netId,
                type: o.occupantType,
            })) || [],
        };
    }
};
exports.LeaseTool = LeaseTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_lease_info',
        description: 'Get lease details for a user. STUDENT: own lease only. STAFF: leases on assigned property. ADMIN: any lease. Provide netId to look up a specific user, or leave blank for own lease.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            netId: zod_1.z.string().optional().describe('NetID of the user whose lease to look up (admin/staff only)'),
            leaseId: zod_1.z.number().optional().describe('Specific lease ID to look up'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaseTool.prototype, "getLeaseInfo", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_all_leases',
        description: 'List all leases. ADMIN: all leases. STAFF: leases on assigned property. STUDENT: denied.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            status: zod_1.z.string().optional().describe('Filter by status: SIGNED, ACTIVE, PENDING_SIGNATURE, TERMINATED, etc.'),
            limit: zod_1.z.number().optional().default(25).describe('Max results'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaseTool.prototype, "getAllLeases", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_occupancy',
        description: 'Get current occupancy data showing who is assigned where. ADMIN/STAFF only.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeaseTool.prototype, "getOccupancy", null);
exports.LeaseTool = LeaseTool = LeaseTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rbac_service_1.RbacService])
], LeaseTool);
//# sourceMappingURL=lease.tool.js.map