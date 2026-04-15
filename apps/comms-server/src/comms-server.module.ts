import { Module } from '@nestjs/common';
import { CommsServerController } from './comms-server.controller';
import { CommsServerService } from './comms-server.service';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), EmailModule],
  controllers: [CommsServerController],
  providers: [CommsServerService],
  exports: [EmailModule],
})
export class CommsServerModule {}
