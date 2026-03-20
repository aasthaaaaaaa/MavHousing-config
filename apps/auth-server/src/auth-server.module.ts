import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthServerController } from './auth-server.controller';
import { AuthServerService } from './auth-server.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { PrismaModule } from '@common/prisma/prisma.module';
import { DbModule } from '@libs/db';
import { LoggerModule, AllExceptionsFilter } from '@libs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    DbModule,
    LoggerModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthServerController],
  providers: [
    AuthServerService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
  exports: [AuthServerService],
})
export class AuthServerModule {}