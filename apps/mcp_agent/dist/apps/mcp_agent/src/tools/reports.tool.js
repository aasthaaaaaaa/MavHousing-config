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
var ReportsTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const rbac_service_1 = require("../rbac/rbac.service");
const config_1 = require("@nestjs/config");
let ReportsTool = ReportsTool_1 = class ReportsTool {
    constructor(rbac, config) {
        this.rbac = rbac;
        this.config = config;
        this.logger = new common_1.Logger(ReportsTool_1.name);
    }
    get internalApiUrl() {
        return this.config.get('INTERNAL_API_URL') || 'http://localhost:3009';
    }
    async generateReport({ senderEmail, reportType, netId, sortBy, }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx || !this.rbac.isAdmin(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Only Admins can generate reports.' }] };
        }
        const queueMap = {
            property: 'property-reports',
            lease: 'lease-reports',
            finance: 'finance-reports',
            occupancy: 'occupancy-report',
        };
        const queueName = queueMap[reportType];
        if (!queueName) {
            return { content: [{ type: 'text', text: `Unknown report type: ${reportType}. Available: property, lease, finance, occupancy.` }] };
        }
        try {
            const jobData = {};
            if (reportType === 'finance') {
                if (netId)
                    jobData.netId = netId;
                if (sortBy)
                    jobData.sortBy = sortBy;
            }
            if (reportType === 'occupancy') {
                jobData.type = 'AUTOMATED';
            }
            const response = await fetch(`${this.internalApiUrl}/queues/api/queues/${queueName}/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `mcp-agent-${Date.now()}`, data: jobData }),
            });
            if (response.ok) {
                return {
                    content: [{
                            type: 'text',
                            text: `✅ Report queued successfully!\n\nType: ${reportType}\nQueue: ${queueName}\nThe generated PDF will be emailed to the admin address.${netId ? `\nTarget student: ${netId}` : ''}`,
                        }],
                };
            }
            else {
                return {
                    content: [{
                            type: 'text',
                            text: `⚠️ Report generation requested but couldn't reach the job queue. Ensure internal-api is running on ${this.internalApiUrl}.\n\nReport type: ${reportType}\nTo trigger manually: Go to ${this.internalApiUrl}/queues and add a job to "${queueName}" with data: ${JSON.stringify(jobData)}`,
                        }],
                };
            }
        }
        catch (error) {
            return {
                content: [{
                        type: 'text',
                        text: `⚠️ Could not connect to internal-api at ${this.internalApiUrl}. Make sure it's running.\n\nReport type: ${reportType}`,
                    }],
            };
        }
    }
    async getReportTypes({ senderEmail }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        const reports = [
            {
                type: 'property',
                name: 'Property Roster Report',
                description: 'Generates a roster of all assigned residents per property as PDF.',
                queue: 'property-reports',
                access: 'ADMIN only',
            },
            {
                type: 'lease',
                name: 'Lease Ledger Report',
                description: 'Master landscape ledger of all leases as PDF.',
                queue: 'lease-reports',
                access: 'ADMIN only',
            },
            {
                type: 'finance',
                name: 'Financial Summary Report',
                description: 'Payment summary and student audits as PDF. Optional: filter by netId, sort by person/date.',
                queue: 'finance-reports',
                access: 'ADMIN only',
                parameters: 'netId (optional), sortBy: "person" | "date" (optional)',
            },
            {
                type: 'occupancy',
                name: 'Occupancy Report',
                description: 'Monthly occupancy & vacancy percentages as PDF.',
                queue: 'occupancy-report',
                access: 'ADMIN only',
            },
        ];
        return { content: [{ type: 'text', text: JSON.stringify(reports, null, 2) }] };
    }
};
exports.ReportsTool = ReportsTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'generate_report',
        description: 'Trigger generation of an admin report (sent to admin email as PDF). ADMIN only. Types: property, lease, finance, occupancy.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            reportType: zod_1.z.enum(['property', 'lease', 'finance', 'occupancy']).describe('Type of report to generate'),
            netId: zod_1.z.string().optional().describe('For finance reports: specific student netId'),
            sortBy: zod_1.z.string().optional().describe('For finance reports: "person" or "date"'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsTool.prototype, "generateReport", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'get_report_types',
        description: 'List all available report types and their descriptions.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsTool.prototype, "getReportTypes", null);
exports.ReportsTool = ReportsTool = ReportsTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rbac_service_1.RbacService,
        config_1.ConfigService])
], ReportsTool);
//# sourceMappingURL=reports.tool.js.map