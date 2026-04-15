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
var UserTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const rbac_service_1 = require("../rbac/rbac.service");
let UserTool = UserTool_1 = class UserTool {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
        this.logger = new common_1.Logger(UserTool_1.name);
    }
    async lookupUser({ senderEmail, netId, utaId, email }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Your email is not registered in MavHousing.' }] };
        }
        let whereClause = {};
        if (netId)
            whereClause = { netId };
        else if (utaId)
            whereClause = { utaId };
        else if (email)
            whereClause = { email };
        else {
            whereClause = { userId: ctx.userId };
        }
        const user = await this.prisma.user.findFirst({
            where: whereClause,
            select: {
                userId: true,
                utaId: true,
                netId: true,
                fName: true,
                lName: true,
                email: true,
                phone: true,
                gender: true,
                role: true,
                studentStatus: true,
                staffPosition: true,
                requiresAdaAccess: true,
                isLocked: true,
                createdAt: true,
                assignedPropertyId: true,
            },
        });
        if (!user) {
            return { content: [{ type: 'text', text: 'No user found with the provided criteria.' }] };
        }
        if (!this.rbac.canAccessUser(ctx, user.userId)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: You can only view your own profile.' }] };
        }
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId && user.userId !== ctx.userId) {
            const hasLeaseOnProperty = await this.prisma.lease.findFirst({
                where: {
                    userId: user.userId,
                    unit: { propertyId: ctx.assignedPropertyId },
                    status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] },
                },
            });
            if (!hasLeaseOnProperty) {
                return { content: [{ type: 'text', text: '❌ Access Denied: This user is not on your assigned property.' }] };
            }
        }
        const result = {
            ...user,
            phone: user.phone?.toString() || null,
        };
        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    }
    async listUsers({ senderEmail, role, limit }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Your email is not registered in MavHousing.' }] };
        }
        if (!this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Only Admins and Staff can list users.' }] };
        }
        const whereClause = {};
        if (role)
            whereClause.role = role.toUpperCase();
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
            whereClause.leases = {
                some: {
                    unit: { propertyId: ctx.assignedPropertyId },
                    status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] },
                },
            };
        }
        const users = await this.prisma.user.findMany({
            where: whereClause,
            select: {
                userId: true,
                netId: true,
                fName: true,
                lName: true,
                email: true,
                role: true,
                studentStatus: true,
                staffPosition: true,
            },
            take: limit || 50,
            orderBy: { lName: 'asc' },
        });
        return {
            content: [{
                    type: 'text',
                    text: `Found ${users.length} user(s):\n${JSON.stringify(users, null, 2)}`,
                }],
        };
    }
};
exports.UserTool = UserTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'lookup_user',
        description: 'Look up a MavHousing user by netId, utaId, or email. RBAC: ADMIN sees any user. STAFF sees users on their property. STUDENT sees only themselves.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request (for RBAC)'),
            netId: zod_1.z.string().optional().describe('NetID to look up'),
            utaId: zod_1.z.string().optional().describe('UTA ID to look up'),
            email: zod_1.z.string().optional().describe('Email to look up'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserTool.prototype, "lookupUser", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'list_users',
        description: 'List MavHousing users. ADMIN: all users. STAFF: users on assigned property. STUDENT: denied.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request (for RBAC)'),
            role: zod_1.z.string().optional().describe('Filter by role: ADMIN, STAFF, STUDENT'),
            limit: zod_1.z.number().optional().default(50).describe('Max results to return'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserTool.prototype, "listUsers", null);
exports.UserTool = UserTool = UserTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rbac_service_1.RbacService])
], UserTool);
//# sourceMappingURL=user.tool.js.map