import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { GeminiService } from './gemini.service';
import { DatabaseTool } from '../tools/database.tool';
import { RbacModule } from '../rbac/rbac.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [RbacModule, EmailModule],
  providers: [
    AgentService,
    GeminiService,
    DatabaseTool,
  ],
  exports: [AgentService],
})
export class AgentModule {}
