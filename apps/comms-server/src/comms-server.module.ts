import { Module } from '@nestjs/common';
import { CommsServerController } from './comms-server.controller';
import { CommsServerService } from './comms-server.service';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { SmsModule } from './sms/sms.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EmailModule, SmsModule],
  controllers: [CommsServerController],
  providers: [CommsServerService],
})
export class CommsServerModule {}
