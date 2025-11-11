import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthServerService } from './auth-server.service';
import { UserSignup } from '../entity/user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@Controller("auth")
export class AuthServerController {
  constructor(private readonly authServerService: AuthServerService) {}

  @Get()
  getHello(): string {
    return this.authServerService.getHello();
  }

  @Post('create-new')
  @ApiOperation({summary:'Creates new user'})
  @ApiBody({
    type: UserSignup,
    examples: {
      default: {
        value: {
          email: 'john@example.com',
          fName: 'John',
          lName: 'Doe',
          netId:'axjh03',
          password: 'P@ssw0rd123',
        },
      },
    },
  })
  createUser(@Body() user:UserSignup){
    return this.authServerService.createUser(user)
  }

  @Get('get-all')
  getAllUser(){
    return this.authServerService.getAllUser()
  }
}
