"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentModule = void 0;
const common_1 = require("@nestjs/common");
const agent_service_1 = require("./agent.service");
const rbac_module_1 = require("../rbac/rbac.module");
const email_module_1 = require("../email/email.module");
const user_tool_1 = require("../tools/user.tool");
const lease_tool_1 = require("../tools/lease.tool");
const payment_tool_1 = require("../tools/payment.tool");
const maintenance_tool_1 = require("../tools/maintenance.tool");
const application_tool_1 = require("../tools/application.tool");
const housing_tool_1 = require("../tools/housing.tool");
const reports_tool_1 = require("../tools/reports.tool");
const email_tool_1 = require("../tools/email.tool");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        imports: [rbac_module_1.RbacModule, email_module_1.EmailModule],
        providers: [
            agent_service_1.AgentService,
            user_tool_1.UserTool,
            lease_tool_1.LeaseTool,
            payment_tool_1.PaymentTool,
            maintenance_tool_1.MaintenanceTool,
            application_tool_1.ApplicationTool,
            housing_tool_1.HousingTool,
            reports_tool_1.ReportsTool,
            email_tool_1.EmailTool,
        ],
        exports: [agent_service_1.AgentService],
    })
], AgentModule);
//# sourceMappingURL=agent.module.js.map