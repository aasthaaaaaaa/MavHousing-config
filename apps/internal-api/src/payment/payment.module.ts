import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaModule } from '@common/prisma/prisma.module';
import { EmailModule } from 'apps/comms-server/src/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [PaymentController],
  providers: [PaymentService],
  exports: [PaymentService],
})
export class PaymentModule {}

