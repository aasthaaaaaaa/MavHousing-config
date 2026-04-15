"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mcp_nest_1 = require("@rekog/mcp-nest");
const prisma_module_1 = require("../../../common/prisma/prisma.module");
const rbac_module_1 = require("./rbac/rbac.module");
const agent_module_1 = require("./agent/agent.module");
const email_module_1 = require("./email/email.module");
const email_webhook_controller_1 = require("./email/email-webhook.controller");
const graphql_client_module_1 = require("./graphql/graphql-client.module");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_tool_1 = require("./tools/user.tool");
const lease_tool_1 = require("./tools/lease.tool");
const payment_tool_1 = require("./tools/payment.tool");
const maintenance_tool_1 = require("./tools/maintenance.tool");
const application_tool_1 = require("./tools/application.tool");
const housing_tool_1 = require("./tools/housing.tool");
const reports_tool_1 = require("./tools/reports.tool");
const email_tool_1 = require("./tools/email.tool");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../../.env'],
            }),
            prisma_module_1.PrismaModule,
            mcp_nest_1.McpModule.forRoot({
                name: 'mavhousing-mcp-agent',
                version: '1.0.0',
            }),
            rbac_module_1.RbacModule,
            agent_module_1.AgentModule,
            email_module_1.EmailModule,
            graphql_client_module_1.GraphqlClientModule,
        ],
        controllers: [
            app_controller_1.AppController,
            email_webhook_controller_1.EmailWebhookController,
        ],
        providers: [
            app_service_1.AppService,
            user_tool_1.UserTool,
            lease_tool_1.LeaseTool,
            payment_tool_1.PaymentTool,
            maintenance_tool_1.MaintenanceTool,
            application_tool_1.ApplicationTool,
            housing_tool_1.HousingTool,
            reports_tool_1.ReportsTool,
            email_tool_1.EmailTool,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map