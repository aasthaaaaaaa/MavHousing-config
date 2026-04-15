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
var ApplicationTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const rbac_service_1 = require("../rbac/rbac.service");
let ApplicationTool = ApplicationTool_1 = class ApplicationTool {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
        this.logger = new common_1.Logger(ApplicationTool_1.name);
    }
    async getApplications({ senderEmail, status, limit }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        const whereClause = this.rbac.getApplicationFilter(ctx);
        if (status)
            whereClause.status = status.toUpperCase();
        const applications = await this.prisma.application.findMany({
            where: whereClause,
            include: {
                user: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
                preferredProperty: {
                    select: { propertyId: true, name: true, propertyType: true, leaseType: true },
                },
            },
            take: limit || 25,
            orderBy: { createdAt: 'desc' },
        });
        const result = applications.map((a) => ({
            appId: a.appId,
            status: a.status,
            term: a.term,
            submissionDate: a.submissionDate,
            applicant: a.user
                ? `${a.user.fName} ${a.user.lName} (${a.user.netId})`
                : 'Unknown',
            preferredProperty: a.preferredProperty?.name || 'None specified',
            leaseType: a.preferredProperty?.leaseType || 'N/A',
        }));
        return {
            content: [{
                    type: 'text',
                    text: `${result.length} application(s):\n${JSON.stringify(result, null, 2)}`,
                }],
        };
    }
    async getApplicationDetails({ senderEmail, appId }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        const app = await this.prisma.application.findUnique({
            where: { appId },
            include: {
                user: {
                    select: {
                        userId: true, netId: true, utaId: true, fName: true, lName: true,
                        email: true, gender: true, requiresAdaAccess: true,
                    },
                },
                preferredProperty: true,
            },
        });
        if (!app) {
            return { content: [{ type: 'text', text: 'Application not found.' }] };
        }
        if (ctx.role === 'STUDENT' && app.userId !== ctx.userId) {
            return { content: [{ type: 'text', text: '❌ Access Denied: You can only view your own applications.' }] };
        }
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId && app.preferredPropertyId !== ctx.assignedPropertyId) {
            return { content: [{ type: 'text', text: '❌ Access Denied: This application is not for your property.' }] };
        }
        const detail = {
            appId: app.appId,
            status: app.status,
            term: app.term,
            submissionDate: app.submissionDate,
            createdAt: app.createdAt,
            applicant: app.user,
            preferredProperty: app.preferredProperty
                ? { name: app.preferredProperty.name, type: app.preferredProperty.propertyType, leaseType: app.preferredProperty.leaseType }
                : null,
            preferences: {
                sleepSchedule: app.sleepSchedule,
                cleanliness: app.cleanliness,
                noiseLevel: app.noiseLevel,
                smokingPreference: app.smokingPreference,
                dietaryRestrictions: app.dietaryRestrictions,
                specialAccommodations: app.specialAccommodations,
            },
            emergencyContact: {
                name: app.emergencyContactName,
                phone: app.emergencyContactPhone,
                relation: app.emergencyContactRelation,
            },
        };
        return { content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }] };
    }
};
exports.ApplicationTool = ApplicationTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_applications',
        description: 'Get housing applications. STUDENT: own applications only. STAFF: applications for assigned property. ADMIN: all.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            status: zod_1.z.string().optional().describe('Filter by status: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED'),
            limit: zod_1.z.number().optional().default(25).describe('Max results'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApplicationTool.prototype, "getApplications", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_application_details',
        description: 'Get detailed view of a specific application. RBAC checked.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            appId: zod_1.z.number().describe('Application ID to look up'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApplicationTool.prototype, "getApplicationDetails", null);
exports.ApplicationTool = ApplicationTool = ApplicationTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rbac_service_1.RbacService])
], ApplicationTool);
//# sourceMappingURL=application.tool.js.map