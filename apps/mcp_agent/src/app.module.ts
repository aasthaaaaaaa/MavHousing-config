import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { McpModule } from '@rekog/mcp-nest';
import { PrismaModule } from '@common/prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
import { AgentModule } from './agent/agent.module';
import { EmailModule } from './email/email.module';
import { EmailWebhookController } from './email/email-webhook.controller';
import { GraphqlClientModule } from './graphql/graphql-client.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// MCP Tool providers (also registered in AgentModule, but McpModule needs them)
import { UserTool } from './tools/user.tool';
import { LeaseTool } from './tools/lease.tool';
import { PaymentTool } from './tools/payment.tool';
import { MaintenanceTool } from './tools/maintenance.tool';
import { ApplicationTool } from './tools/application.tool';
import { HousingTool } from './tools/housing.tool';
import { ReportsTool } from './tools/reports.tool';
import { EmailTool } from './tools/email.tool';

@Module({
  imports: [
    // Environment config — loads .env from the monorepo root
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // Database — shared Prisma module (connects to PostgreSQL)
    PrismaModule,

    // MCP Server — exposes tools via SSE/HTTP transport
    McpModule.forRoot({
      name: 'mavhousing-mcp-agent',
      version: '1.0.0',
    }),

    // RBAC — role-based access control
    RbacModule,

    // Agent — orchestration, intent parsing, tool execution
    AgentModule,

    // Email — Resend send/receive
    EmailModule,

    // GraphQL — client for internal-api queries
    GraphqlClientModule,
  ],
  controllers: [
    AppController,
    EmailWebhookController,
  ],
  providers: [
    AppService,
    // MCP tools — @rekog/mcp-nest discovers @Tool decorators
    UserTool,
    LeaseTool,
    PaymentTool,
    MaintenanceTool,
    ApplicationTool,
    HousingTool,
    ReportsTool,
    EmailTool,
  ],
})
export class AppModule {}
