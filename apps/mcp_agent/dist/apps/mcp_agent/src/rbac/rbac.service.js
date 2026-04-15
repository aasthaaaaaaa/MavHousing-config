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
var RbacService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
let RbacService = RbacService_1 = class RbacService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RbacService_1.name);
    }
    async identifyByEmail(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
            select: {
                userId: true,
                netId: true,
                email: true,
                role: true,
                fName: true,
                lName: true,
                assignedPropertyId: true,
                staffPosition: true,
            },
        });
        if (!user) {
            this.logger.warn(`RBAC: No user found for email "${email}"`);
            return null;
        }
        if (user.role === 'DRAFT') {
            this.logger.warn(`RBAC: User "${email}" has DRAFT role — access denied`);
            return null;
        }
        this.logger.log(`RBAC: Identified ${user.netId} as ${user.role}`);
        return {
            userId: user.userId,
            netId: user.netId,
            email: user.email,
            role: user.role,
            fName: user.fName,
            lName: user.lName,
            assignedPropertyId: user.assignedPropertyId,
            staffPosition: user.staffPosition,
        };
    }
    canAccessUser(ctx, targetUserId) {
        if (ctx.role === 'ADMIN')
            return true;
        if (ctx.role === 'STUDENT')
            return ctx.userId === targetUserId;
        if (ctx.role === 'STAFF')
            return true;
        return false;
    }
    isAdmin(ctx) {
        return ctx.role === 'ADMIN';
    }
    isStaffOrAbove(ctx) {
        return ctx.role === 'ADMIN' || ctx.role === 'STAFF';
    }
    getLeaseFilter(ctx) {
        if (ctx.role === 'ADMIN')
            return {};
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
            return { unit: { propertyId: ctx.assignedPropertyId } };
        }
        return {
            OR: [
                { userId: ctx.userId },
                { occupants: { some: { userId: ctx.userId } } },
            ],
        };
    }
    getMaintenanceFilter(ctx) {
        if (ctx.role === 'ADMIN')
            return {};
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
            return {
                lease: { unit: { propertyId: ctx.assignedPropertyId } },
            };
        }
        return { createdByUserId: ctx.userId };
    }
    getPaymentFilter(ctx) {
        if (ctx.role === 'ADMIN')
            return {};
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
            return {
                lease: { unit: { propertyId: ctx.assignedPropertyId } },
            };
        }
        return {
            lease: {
                OR: [
                    { userId: ctx.userId },
                    { occupants: { some: { userId: ctx.userId } } },
                ],
            },
        };
    }
    getApplicationFilter(ctx) {
        if (ctx.role === 'ADMIN')
            return {};
        if (ctx.role === 'STAFF' && ctx.assignedPropertyId) {
            return { preferredPropertyId: ctx.assignedPropertyId };
        }
        return { userId: ctx.userId };
    }
};
exports.RbacService = RbacService;
exports.RbacService = RbacService = RbacService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RbacService);
//# sourceMappingURL=rbac.service.js.map