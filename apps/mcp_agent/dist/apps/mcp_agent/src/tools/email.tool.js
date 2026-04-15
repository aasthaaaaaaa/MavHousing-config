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
var EmailTool_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailTool = void 0;
const common_1 = require("@nestjs/common");
const mcp_nest_1 = require("@rekog/mcp-nest");
const zod_1 = require("zod");
const rbac_service_1 = require("../rbac/rbac.service");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let EmailTool = EmailTool_1 = class EmailTool {
    constructor(rbac, config) {
        this.rbac = rbac;
        this.config = config;
        this.logger = new common_1.Logger(EmailTool_1.name);
        this.resend = new resend_1.Resend(this.config.get('RESEND_API'));
        this.defaultSender = 'Mav Housing Agent <onboarding@resend.dev>';
    }
    get commsServerUrl() {
        return this.config.get('COMMS_SERVER_URL') || 'http://localhost:3000';
    }
    async sendEmail({ senderEmail, to, template, subject, body, firstName, context, }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx || !this.rbac.isStaffOrAbove(ctx)) {
            return { content: [{ type: 'text', text: '❌ Access Denied: Only Admins and Staff can send emails.' }] };
        }
        if (template) {
            try {
                const response = await fetch(`${this.commsServerUrl}/email/send/${template}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to,
                        firstName: firstName || 'Resident',
                        context,
                    }),
                });
                if (response.ok) {
                    return {
                        content: [{ type: 'text', text: `✅ Template email "${template}" sent to ${to}` }],
                    };
                }
                else {
                    const errText = await response.text();
                    return {
                        content: [{ type: 'text', text: `⚠️ Failed to send template email: ${errText}` }],
                    };
                }
            }
            catch (error) {
                return {
                    content: [{ type: 'text', text: `⚠️ Could not reach comms-server at ${this.commsServerUrl}. Is it running?` }],
                };
            }
        }
        if (!subject || !body) {
            return { content: [{ type: 'text', text: 'Please provide both subject and body for custom emails, or specify a template name.' }] };
        }
        try {
            await this.resend.emails.send({
                to,
                from: this.defaultSender,
                subject,
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0064B1; padding: 20px; color: white; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🏠 MavHousing</h2>
          </div>
          <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            ${body.replace(/\n/g, '<br/>')}
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
            Sent by MavHousing MCP Agent on behalf of ${ctx.fName} ${ctx.lName}
          </p>
        </div>`,
            });
            return { content: [{ type: 'text', text: `✅ Email sent to ${to}` }] };
        }
        catch (error) {
            return { content: [{ type: 'text', text: `❌ Failed to send email: ${error}` }] };
        }
    }
    async listEmailTemplates({ senderEmail }) {
        const ctx = await this.rbac.identifyByEmail(senderEmail);
        if (!ctx) {
            return { content: [{ type: 'text', text: '❌ Access Denied.' }] };
        }
        try {
            const response = await fetch(`${this.commsServerUrl}/email/templates`);
            if (response.ok) {
                const templates = await response.json();
                return { content: [{ type: 'text', text: `Available templates:\n${JSON.stringify(templates, null, 2)}` }] };
            }
        }
        catch (error) {
        }
        const knownTemplates = [
            'welcome', 'submitted', 'incomplete', 'deleted', 'decisionMade',
            'approved', 'rejected', 'roomAssignment', 'announcement',
            'paymentFailed', 'paymentSuccessful',
            'uploadFailed', 'missingDocuments', 'deadlinePassed',
            'leaseAvailable', 'leaseOfferIssued', 'leaseAcceptedWelcome',
            'bulletinPosted',
            'maintenanceOpened', 'maintenanceClosed', 'maintenanceCommentAdded',
            'forgotPassword',
        ];
        return { content: [{ type: 'text', text: `Known templates:\n${JSON.stringify(knownTemplates, null, 2)}` }] };
    }
};
exports.EmailTool = EmailTool;
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'send_email',
        description: 'Send an email to a user via Resend. ADMIN/STAFF only. Can use templates or custom content.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
            to: zod_1.z.string().describe('Recipient email address'),
            template: zod_1.z.string().optional().describe('Email template name (e.g. welcome, approved, paymentSuccessful). Leave empty for custom email.'),
            subject: zod_1.z.string().optional().describe('Custom email subject (used if no template)'),
            body: zod_1.z.string().optional().describe('Custom email body in plain text (used if no template)'),
            firstName: zod_1.z.string().optional().describe('Recipient first name (used with templates)'),
            context: zod_1.z.string().optional().describe('Additional context for the template'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailTool.prototype, "sendEmail", null);
__decorate([
    (0, mcp_nest_1.Tool)({
        name: 'list_email_templates',
        description: 'List all available email templates from the comms server.',
        parameters: zod_1.z.object({
            senderEmail: zod_1.z.string().describe('Email of the person making the request'),
        }),
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailTool.prototype, "listEmailTemplates", null);
exports.EmailTool = EmailTool = EmailTool_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rbac_service_1.RbacService,
        config_1.ConfigService])
], EmailTool);
//# sourceMappingURL=email.tool.js.map