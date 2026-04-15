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
var MaintenanceTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const rbac_service_1 = require("../rbac/rbac.service");
let MaintenanceTool = MaintenanceTool_1 = class MaintenanceTool {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
        this.logger = new common_1.Logger(MaintenanceTool_1.name);
    }
    async getMaintenanceRequests({ senderEmail, status, category, limit, }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        const whereClause = this.rbac.getMaintenanceFilter(ctx);
        if (status)
            whereClause.status = status.toUpperCase();
        if (category)
            whereClause.category = category.toUpperCase();
        const requests = await this.prisma.maintenanceRequest.findMany({
            where: whereClause,
            include: {
                createdBy: { select: { netId: true, fName: true, lName: true, email: true } },
                assignedStaff: { select: { userId: true, fName: true, lName: true } },
                lease: {
                    include: {
                        unit: { include: { property: true } },
                        room: true,
                    },
                },
            },
            take: limit || 25,
            orderBy: { createdAt: 'desc' },
        });
        const result = requests.map((r) => ({
            requestId: r.requestId,
            category: r.category,
            priority: r.priority,
            status: r.status,
            description: r.description,
            location: r.location,
            createdAt: r.createdAt,
            resolvedAt: r.resolvedAt,
            resolutionReason: r.resolutionReason,
            createdBy: `${r.createdBy.fName} ${r.createdBy.lName} (${r.createdBy.netId})`,
            assignedStaff: r.assignedStaff
                ? `${r.assignedStaff.fName} ${r.assignedStaff.lName}`
                : 'Unassigned',
            property: r.lease?.unit?.property?.name || 'N/A',
            unit: r.lease?.unit?.unitNumber || 'N/A',
        }));
        return {
            content: [{
                    type: 'text',
                    text: `${result.length} maintenance request(s):\n${JSON.stringify(result, null, 2)}`,
                }],
        };
    }
    async getMaintenanceDetails({ senderEmail, requestId }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        const request = await this.prisma.maintenanceRequest.findUnique({
            where: { requestId },
            include: {
                createdBy: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
                assignedStaff: { select: { userId: true, fName: true, lName: true } },
                lease: { include: { unit: { include: { property: true } } } },
                comments: {
                    include: { user: { select: { fName: true, lName: true } } },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!request) {
            return { content: [{ type: 'text', text: 'Maintenance request not found.' }] };
        }
        if (ctx.role === 'STUDENT' && request.createdByUserId !== ctx.userId) {
            return { content: [{ type: 'text', text: '❌ Access Denied: You can only view your own maintenance requests.' }] };
        }
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
            const propertyId = request.lease?.unit?.propertyId;
            if (propertyId && propertyId !== ctx.assignedPropertyId) {
                return { content: [{ type: 'text', text: '❌ Access Denied: This request is not on your assigned property.' }] };
            }
        }
        const detail = {
            requestId: request.requestId,
            category: request.category,
            priority: request.priority,
            status: request.status,
            description: request.description,
            location: request.location,
            createdAt: request.createdAt,
            resolvedAt: request.resolvedAt,
            resolutionReason: request.resolutionReason,
            createdBy: `${request.createdBy.fName} ${request.createdBy.lName} (${request.createdBy.netId})`,
            assignedStaff: request.assignedStaff
                ? `${request.assignedStaff.fName} ${request.assignedStaff.lName}`
                : 'Unassigned',
            property: request.lease?.unit?.property?.name || 'N/A',
            unit: request.lease?.unit?.unitNumber || 'N/A',
            comments: request.comments.map((c) => ({
                by: `${c.user.fName} ${c.user.lName}`,
                content: c.content,
                at: c.createdAt,
            })),
        };
        return { content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }] };
    }
};
exports.MaintenanceTool = MaintenanceTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_maintenance_requests',
        description: 'Get maintenance requests. STUDENT: own requests only. STAFF: requests for assigned property. ADMIN: all requests.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            status: zod_1.z.string().optional().describe('Filter by status: OPEN, IN_PROGRESS, RESOLVED, CLOSED'),
            category: zod_1.z.string().optional().describe('Filter by category: PLUMBING, HVAC, ELECTRICAL, INTERNET, APPLIANCE, STRUCTURAL, OTHER'),
            limit: zod_1.z.number().optional().default(25).describe('Max results'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaintenanceTool.prototype, "getMaintenanceRequests", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_maintenance_details',
        description: 'Get detailed info about a specific maintenance request including comments. RBAC checked.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            requestId: zod_1.z.number().describe('The maintenance request ID'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MaintenanceTool.prototype, "getMaintenanceDetails", null);
exports.MaintenanceTool = MaintenanceTool = MaintenanceTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rbac_service_1.RbacService])
], MaintenanceTool);
//# sourceMappingURL=maintenance.tool.js.map