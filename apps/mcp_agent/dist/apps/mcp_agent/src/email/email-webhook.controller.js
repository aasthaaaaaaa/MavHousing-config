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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailWebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_service_1 = require("../agent/agent.service");
let EmailWebhookController = EmailWebhookController_1 = class EmailWebhookController {
    constructor(agentService) {
        this.agentService = agentService;
        this.logger = new common_1.Logger(EmailWebhookController_1.name);
    }
    async handleResendWebhook(body) {
        this.logger.log(`📨 Resend webhook received: ${JSON.stringify(body?.type || 'unknown')}`);
        const eventData = body?.data || body;
        const senderEmail = eventData?.from || eventData?.sender?.email;
        const subject = eventData?.subject || 'MavHousing Query';
        const messageBody = eventData?.text || eventData?.body || this.stripHtml(eventData?.html) || '';
        if (!senderEmail) {
            this.logger.warn('Webhook received but no sender email found');
            return { received: true, processed: false, reason: 'No sender email' };
        }
        if (!messageBody.trim()) {
            this.logger.warn(`Webhook from ${senderEmail} but empty body`);
            return { received: true, processed: false, reason: 'Empty message body' };
        }
        this.agentService
            .processRequest(senderEmail, messageBody, subject)
            .catch((err) => this.logger.error(`Failed to process webhook from ${senderEmail}: ${err}`));
        return {
            received: true,
            processed: true,
            from: senderEmail,
            subject,
        };
    }
    stripHtml(html) {
        if (!html)
            return '';
        return html
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
};
exports.EmailWebhookController = EmailWebhookController;
__decorate([
    (0, common_1.Post)('resend'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Resend inbound email webhook — receives incoming emails' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                type: { type: 'string', description: 'Event type from Resend' },
                data: {
                    type: 'object',
                    properties: {
                        from: { type: 'string', description: 'Sender email' },
                        to: { type: 'array', items: { type: 'string' } },
                        subject: { type: 'string' },
                        text: { type: 'string', description: 'Plain text body' },
                        html: { type: 'string', description: 'HTML body' },
                    },
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailWebhookController.prototype, "handleResendWebhook", null);
exports.EmailWebhookController = EmailWebhookController = EmailWebhookController_1 = __decorate([
    (0, swagger_1.ApiTags)('Webhook'),
    (0, common_1.Controller)('webhook'),
    __metadata("design:paramtypes", [agent_service_1.AgentService])
], EmailWebhookController);
//# sourceMappingURL=email-webhook.controller.js.map