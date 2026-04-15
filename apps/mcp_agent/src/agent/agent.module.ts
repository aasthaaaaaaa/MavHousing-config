import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { RbacModule } from '../rbac/rbac.module';
import { EmailModule } from '../email/email.module';
import { UserTool } from '../tools/user.tool';
import { LeaseTool } from '../tools/lease.tool';
import { PaymentTool } from '../tools/payment.tool';
import { MaintenanceTool } from '../tools/maintenance.tool';
import { ApplicationTool } from '../tools/application.tool';
import { HousingTool } from '../tools/housing.tool';
import { ReportsTool } from '../tools/reports.tool';
import { EmailTool } from '../tools/email.tool';

@Module({
  imports: [RbacModule, EmailModule],
  providers: [
    AgentService,
    UserTool,
    LeaseTool,
    PaymentTool,
    MaintenanceTool,
    ApplicationTool,
    HousingTool,
    ReportsTool,
    EmailTool,
  ],
  exports: [AgentService],
})
export class AgentModule {}
