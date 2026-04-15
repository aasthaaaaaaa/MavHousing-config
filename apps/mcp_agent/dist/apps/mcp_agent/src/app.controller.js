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
var AppController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const agent_service_1 = require("./agent/agent.service");
const graphql_client_service_1 = require("./graphql/graphql-client.service");
let AppController = AppController_1 = class AppController {
    constructor(agentService, graphqlClient) {
        this.agentService = agentService;
        this.graphqlClient = graphqlClient;
        this.logger = new common_1.Logger(AppController_1.name);
    }
    getHealth() {
        return {
            status: 'ok',
            service: 'mavhousing-mcp-agent',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            endpoints: {
                swagger: '/api',
                mcpSse: '/sse',
                webhook: '/webhook/resend',
                agentQuery: 'POST /agent/query',
            },
        };
    }
    async getDetailedHealth() {
        const graphqlOk = await this.graphqlClient.healthCheck();
        return {
            status: 'ok',
            service: 'mavhousing-mcp-agent',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            connections: {
                graphql: graphqlOk ? 'connected' : 'unreachable',
                database: 'connected',
            },
        };
    }
    async agentQuery(body) {
        this.logger.log(`📨 REST query from: ${body.email} — "${body.message}"`);
        const result = await this.agentService.processRequest(body.email, body.message, body.subject || 'REST Query');
        return {
            success: true,
            from: body.email,
            query: body.message,
            response: result,
            timestamp: new Date().toISOString(),
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiTags)('Health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiTags)('Health'),
    (0, swagger_1.ApiOperation)({ summary: 'Detailed health check with connectivity status' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "getDetailedHealth", null);
__decorate([
    (0, common_1.Post)('agent/query'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({
        summary: 'Send a natural language query to the MCP agent (REST alternative to email)',
        description: 'Simulate sending a request to the agent as if via email. ' +
            'The agent identifies the sender via email → RBAC, processes the request, and returns the result. ' +
            'In production, use the Resend webhook instead.',
    }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            required: ['email', 'message'],
            properties: {
                email: {
                    type: 'string',
                    description: 'Sender email address (used for RBAC identification)',
                    example: 'axjh03@mavs.uta.edu',
                },
                message: {
                    type: 'string',
                    description: 'Natural language query',
                    example: 'Show me my lease information',
                },
                subject: {
                    type: 'string',
                    description: 'Optional subject line',
                    example: 'Housing Inquiry',
                },
            },
        },
        examples: {
            'Student - Lease Info': {
                value: { email: 'student@mavs.uta.edu', message: 'What is my lease info?' },
            },
            'Student - Payment Status': {
                value: { email: 'student@mavs.uta.edu', message: 'Have I paid rent this month?' },
            },
            'Admin - All Leases': {
                value: { email: 'admin@uta.edu', message: 'Show me all leases' },
            },
            'Admin - Generate Report': {
                value: { email: 'admin@uta.edu', message: 'Generate a finance report' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Agent processed the query and returned results' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Access denied — email not registered' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AppController.prototype, "agentQuery", null);
exports.AppController = AppController = AppController_1 = __decorate([
    (0, swagger_1.ApiTags)('Agent'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [agent_service_1.AgentService,
        graphql_client_service_1.GraphqlClientService])
], AppController);
//# sourceMappingURL=app.controller.js.map