import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { DbModule } from '@libs/db';
import { jwtConstants } from 'apps/auth-server/src/constants';
import { EmailModule } from 'apps/comms-server/src/email/email.module';

@Module({
  imports: [
    DbModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
    EmailModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}

