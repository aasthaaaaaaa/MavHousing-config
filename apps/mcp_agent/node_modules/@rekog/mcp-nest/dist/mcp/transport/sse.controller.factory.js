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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSseController = createSseController;
const common_1 = require("@nestjs/common");
const mcp_sse_service_1 = require("../services/mcp-sse.service");
const normalize_endpoint_1 = require("../utils/normalize-endpoint");
const mcp_logger_factory_1 = require("../utils/mcp-logger.factory");
function createSseController(sseEndpoint, messagesEndpoint, apiPrefix, guards = [], decorators = [], options) {
    var SseController_1;
    let SseController = SseController_1 = class SseController {
        constructor(mcpOptions, mcpSseService) {
            this.mcpOptions = mcpOptions;
            this.mcpSseService = mcpSseService;
            this.logger = (0, mcp_logger_factory_1.createMcpLogger)(SseController_1.name, options || mcpOptions);
        }
        onModuleInit() {
            this.mcpSseService.initialize();
        }
        async sse(rawReq, rawRes) {
            return this.mcpSseService.createSseConnection(rawReq, rawRes, messagesEndpoint, apiPrefix);
        }
        async messages(rawReq, rawRes, body) {
            await this.mcpSseService.handleMessage(rawReq, rawRes, body);
        }
    };
    __decorate([
        (0, common_1.Get)((0, normalize_endpoint_1.normalizeEndpoint)(`${apiPrefix}/${sseEndpoint}`)),
        (0, common_1.UseGuards)(...guards),
        __param(0, (0, common_1.Req)()),
        __param(1, (0, common_1.Res)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object]),
        __metadata("design:returntype", Promise)
    ], SseController.prototype, "sse", null);
    __decorate([
        (0, common_1.Post)((0, normalize_endpoint_1.normalizeEndpoint)(`${apiPrefix}/${messagesEndpoint}`)),
        (0, common_1.UseGuards)(...guards),
        __param(0, (0, common_1.Req)()),
        __param(1, (0, common_1.Res)()),
        __param(2, (0, common_1.Body)()),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object, Object]),
        __metadata("design:returntype", Promise)
    ], SseController.prototype, "messages", null);
    SseController = SseController_1 = __decorate([
        (0, common_1.Controller)({
            version: common_1.VERSION_NEUTRAL,
        }),
        (0, common_1.applyDecorators)(...decorators),
        __param(0, (0, common_1.Inject)('MCP_OPTIONS')),
        __metadata("design:paramtypes", [Object, mcp_sse_service_1.McpSseService])
    ], SseController);
    return SseController;
}
//# sourceMappingURL=sse.controller.factory.js.map