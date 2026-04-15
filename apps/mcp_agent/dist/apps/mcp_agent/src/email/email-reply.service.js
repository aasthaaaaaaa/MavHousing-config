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
var EmailReplyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailReplyService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let EmailReplyService = EmailReplyService_1 = class EmailReplyService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(EmailReplyService_1.name);
        this.resend = new resend_1.Resend(this.config.get('RESEND_API'));
        this.defaultSender = 'MavHousing Agent <onboarding@resend.dev>';
    }
    async replyToSender(to, subject, content) {
        try {
            await this.resend.emails.send({
                to,
                from: this.defaultSender,
                subject: `Re: ${subject}`,
                html: this.formatReplyHtml(content, subject),
            });
            this.logger.log(`Reply sent to ${to}: "${subject}"`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to send reply to ${to}: ${error}`);
            return false;
        }
    }
    async sendAccessDenied(to, originalSubject) {
        await this.replyToSender(to, originalSubject, `<div style="color: #DC2626; font-weight: bold; font-size: 18px;">⛔ Access Denied</div>
      <p>Your email address (<strong>${to}</strong>) is not registered in the MavHousing system, or your account does not have sufficient permissions for this request.</p>
      <p>If you believe this is an error, please contact your housing administrator.</p>`);
    }
    formatReplyHtml(content, subject) {
        return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width">
    </head>
    <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif;">
      <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0064B1 0%, #004a87 100%); padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 22px; font-weight: 600;">🏠 MavHousing Agent</h1>
          <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">Automated Response System</p>
        </div>

        <!-- Body -->
        <div style="background: white; padding: 28px 32px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="color: #6b7280; font-size: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f3f4f6;">
            RE: ${subject} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <div style="color: #1f2937; font-size: 14px; line-height: 1.6;">
            ${content}
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 16px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
            This is an automated response from the MavHousing MCP Agent.
            <br>Do not reply to this email. For further assistance, contact your housing office.
          </p>
        </div>
      </div>
    </body>
    </html>`;
    }
    formatToolResults(results) {
        return results
            .map((r) => {
            if (typeof r === 'string') {
                try {
                    const parsed = JSON.parse(r);
                    if (Array.isArray(parsed)) {
                        return this.formatArrayAsTable(parsed);
                    }
                    return this.formatObjectAsCard(parsed);
                }
                catch {
                    return `<p>${r.replace(/\n/g, '<br>')}</p>`;
                }
            }
            if (Array.isArray(r)) {
                return this.formatArrayAsTable(r);
            }
            if (typeof r === 'object') {
                return this.formatObjectAsCard(r);
            }
            return `<p>${String(r)}</p>`;
        })
            .join('<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">');
    }
    formatObjectAsCard(obj) {
        const entries = Object.entries(obj)
            .filter(([, v]) => v !== null && v !== undefined)
            .map(([k, v]) => {
            const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
            const value = typeof v === 'object' ? JSON.stringify(v) : String(v);
            return `<tr>
          <td style="padding: 6px 12px; font-weight: 600; color: #374151; white-space: nowrap; vertical-align: top;">${label}</td>
          <td style="padding: 6px 12px; color: #4b5563;">${value}</td>
        </tr>`;
        })
            .join('');
        return `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #e5e7eb; border-radius: 8px;">
      ${entries}
    </table>`;
    }
    formatArrayAsTable(arr) {
        if (arr.length === 0)
            return '<p style="color: #6b7280;">No records found.</p>';
        const headers = Object.keys(arr[0]);
        const headerRow = headers
            .map((h) => {
            const label = h.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
            return `<th style="padding: 8px 12px; background: #0064B1; color: white; text-align: left; font-size: 12px;">${label}</th>`;
        })
            .join('');
        const rows = arr
            .map((item, i) => `<tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            ${headers.map((h) => `<td style="padding: 6px 12px; font-size: 13px; color: #374151; border-bottom: 1px solid #f3f4f6;">${item[h] ?? ''}</td>`).join('')}
          </tr>`)
            .join('');
        return `<div style="overflow-x: auto;">
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #e5e7eb;">
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
    }
};
exports.EmailReplyService = EmailReplyService;
exports.EmailReplyService = EmailReplyService = EmailReplyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailReplyService);
//# sourceMappingURL=email-reply.service.js.map