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
var PaymentTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const prisma_service_1 = require("../../../../common/prisma/prisma.service");
const rbac_service_1 = require("../rbac/rbac.service");
let PaymentTool = PaymentTool_1 = class PaymentTool {
    constructor(prisma, rbac) {
        this.prisma = prisma;
        this.rbac = rbac;
        this.logger = new common_1.Logger(PaymentTool_1.name);
    }
    async getPaymentSummary({ senderEmail, netId }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        let targetUserId = ctx.userId;
        if (netId) {
            if (!this.rbac.isStaffOrAbove(ctx)) {
                return { content: [{ type: 'text', text: '❌ Access Denied: Students can only check their own payments.' }] };
            }
            const targetUser = await this.prisma.user.findUnique({ where: { netId } });
            if (!targetUser) {
                return { content: [{ type: 'text', text: `No user found with netId "${netId}".` }] };
            }
            targetUserId = targetUser.userId;
        }
        const lease = await this.prisma.lease.findFirst({
            where: {
                OR: [{ userId: targetUserId }, { occupants: { some: { userId: targetUserId } } }],
            },
            orderBy: { createdAt: 'desc' },
            include: { unit: { include: { property: true } } },
        });
        if (!lease) {
            return { content: [{ type: 'text', text: 'No active lease found — no payment info available.' }] };
        }
        const monthlyRent = Number(lease.dueThisMonth);
        const extraFees = Number(lease.terminationFee || 0);
        const totalDueThisMonth = monthlyRent + extraFees;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const thisMonthPayments = await this.prisma.payment.findMany({
            where: {
                leaseId: lease.leaseId,
                isSuccessful: true,
                transactionDate: { gte: startOfMonth, lt: startOfNextMonth },
            },
        });
        const totalPaidThisMonth = thisMonthPayments.reduce((sum, p) => sum + Number(p.amountPaid), 0);
        const amountDueThisMonth = Math.max(0, totalDueThisMonth - totalPaidThisMonth);
        const allPaymentsCount = await this.prisma.payment.count({
            where: { leaseId: lease.leaseId, isSuccessful: true },
        });
        const summary = {
            property: lease.unit?.property?.name || 'N/A',
            unit: lease.unit?.unitNumber || 'N/A',
            monthlyRent: `$${monthlyRent.toFixed(2)}`,
            extraFees: `$${extraFees.toFixed(2)}`,
            totalDueThisMonth: `$${totalDueThisMonth.toFixed(2)}`,
            totalPaidThisMonth: `$${totalPaidThisMonth.toFixed(2)}`,
            amountStillDue: `$${amountDueThisMonth.toFixed(2)}`,
            rentPaidThisMonth: amountDueThisMonth <= 0,
            totalPaymentsMade: allPaymentsCount,
        };
        return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
    }
    async getPaymentHistory({ senderEmail, netId, limit }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        const whereClause = this.rbac.getPaymentFilter(ctx);
        if (netId && this.rbac.isStaffOrAbove(ctx)) {
            whereClause.lease = { ...whereClause.lease, user: { netId } };
        }
        else if (netId && !this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Students can only view their own payments.' }] };
        }
        const payments = await this.prisma.payment.findMany({
            where: whereClause,
            include: {
                lease: {
                    include: {
                        user: { select: { netId: true, fName: true, lName: true } },
                        unit: { include: { property: true } },
                    },
                },
            },
            take: limit || 20,
            orderBy: { transactionDate: 'desc' },
        });
        const result = payments.map((p) => ({
            paymentId: p.paymentId,
            date: p.transactionDate,
            amount: `$${Number(p.amountPaid).toFixed(2)}`,
            method: p.method,
            success: p.isSuccessful,
            tenant: `${p.lease.user.fName} ${p.lease.user.lName} (${p.lease.user.netId})`,
            property: p.lease.unit?.property?.name || 'N/A',
        }));
        return {
            content: [{ type: 'text', text: `${result.length} payment(s):\n${JSON.stringify(result, null, 2)}` }],
        };
    }
    async getPaymentStats({ senderEmail }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Only Admins and Staff can view payment stats.' }] };
        }
        const allPayments = await this.prisma.payment.findMany();
        const total = allPayments.length;
        const successful = allPayments.filter((p) => p.isSuccessful).length;
        const failed = total - successful;
        const totalCollected = allPayments
            .filter((p) => p.isSuccessful)
            .reduce((sum, p) => sum + Number(p.amountPaid), 0);
        const stats = {
            totalTransactions: total,
            successfulPayments: successful,
            failedPayments: failed,
            collectionRate: total > 0 ? `${Math.round((successful / total) * 100)}%` : 'N/A',
            totalCollected: `$${totalCollected.toFixed(2)}`,
        };
        return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
    }
    async checkRentStatus({ senderEmail, netId }) {
        const result = await this.getPaymentSummary({ senderEmail, netId });
        return result;
    }
};
exports.PaymentTool = PaymentTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_payment_summary',
        description: 'Get payment summary including monthly rent, amount due, and payment status. STUDENT: own only. STAFF/ADMIN: by netId.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            netId: zod_1.z.string().optional().describe('NetID of user to check (admin/staff only)'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentTool.prototype, "getPaymentSummary", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_payment_history',
        description: 'Get payment transaction history. STUDENT: own only. STAFF/ADMIN: by netId or all.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            netId: zod_1.z.string().optional().describe('NetID to look up (admin/staff)'),
            limit: zod_1.z.number().optional().default(20).describe('Max results'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentTool.prototype, "getPaymentHistory", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_payment_stats',
        description: 'Get aggregate payment statistics — collection rate, totals. ADMIN/STAFF only.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentTool.prototype, "getPaymentStats", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'check_rent_status',
        description: 'Quick check: is rent paid this month? STUDENT: own. STAFF/ADMIN: by netId.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            netId: zod_1.z.string().optional().describe('NetID to check (admin/staff only)'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentTool.prototype, "checkRentStatus", null);
exports.PaymentTool = PaymentTool = PaymentTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rbac_service_1.RbacService])
], PaymentTool);
//# sourceMappingURL=payment.tool.js.map