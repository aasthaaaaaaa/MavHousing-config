import { Module } from '@nestjs/common';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { PrismaModule } from '@common/prisma/prisma.module';
import { EmailModule } from 'apps/comms-server/src/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}

