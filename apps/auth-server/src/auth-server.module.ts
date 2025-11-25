import { Module } from '@nestjs/common';
import { AuthServerController } from './auth-server.controller';
import { AuthServerService } from './auth-server.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants';
@Module({
  imports: [
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
  providers: [AuthServerService],
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
