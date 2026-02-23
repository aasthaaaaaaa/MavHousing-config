import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from '../constants';

@Injectable()
export class BaseAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      request['user'] = payload;
      /* 
    Since our Payload was
    File : auth-server.service.ts
    
    const payload = {
      username: user.netId,
      role: user.role.toLowerCase(),
      userId: user.userId,
      fName: user.fName,
      lName: user.lName,
      jti: randomUUID(),
    };

    Now it's 

    {
      "user": {
        "username": "axjh03",
        "role": "student",
        "userId": 1,
        "fName": "John",
        "lName": "Doe"
      }
    }
    
    after the above line of code

    So in any protected controller you can do:

    @Get('me')
    getMe(@Req() req) {
      return req.user; 
    }

    */
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  // the token is always provided in the header
  // Bearer
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
