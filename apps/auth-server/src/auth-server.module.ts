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
      // TODO : Later migrate jwtConstants ... to .env file... see constants.txt
      secret: jwtConstants.secret,
      // TODO: Find a way to sign out user automatically if access_token is expired.....
      // currenlty if expired.. have to manually clear cookies/session
      signOptions: { expiresIn: '1h' }, // User has to sign in again after 24h
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

/*

providers: [
  AuthServerService,
  {
    provide: APP_GUARD,
    useClass: RolesGuard,
  },
  {
    provide: APP_GUARD,
    useClass: BaseAuthGuard,
  },
],

// MAKES BASEAUTHGUARD global
*/
