import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { jwtConstants } from '../constants';

@Injectable()
export class BaseAuthGuard implements CanActivate {

  constructor(private jwtService:JwtService){}

  async canActivate(context: ExecutionContext): Promise<boolean>{
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if(!token){
      throw new UnauthorizedException();
    }
    try{
      const payload = await this.jwtService.verifyAsync(
        token,
        {
        secret: jwtConstants.secret
        }
    );
    console.log("PAYLOAD : ", payload)
    request['user'] = payload
    console.log("request ", request)

    /* 
    Since our Payload was
    File : auth-server.service.ts
    
    const payload = {
      username: user.netId,
      Role: user.role
    };

    Now it's 

    {
      "user": {
        "username": "axjh03",
        "Role": "student"
      }
    }
    
    after the above line of code

    So in any protected controller you can do:

    @Get('me')
    getMe(@Req() req) {
      return req.user; 
    }

    */

    }
    catch
    {
      throw new UnauthorizedException()
    }
    return true
  }
  
  // the token is always provided in the header
  // Bearer
  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
