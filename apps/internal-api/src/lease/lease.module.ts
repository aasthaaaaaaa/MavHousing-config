import { Module } from '@nestjs/common';
import { LeaseController } from './lease.controller';
import { LeaseService } from './lease.service';
import { PrismaModule } from '@common/prisma/prisma.module';
import { EmailModule } from 'apps/comms-server/src/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [LeaseController],
  providers: [LeaseService],
  exports: [LeaseService],
})
export class LeaseModule {}

