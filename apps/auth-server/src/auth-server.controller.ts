import { Body, Query, Controller, Get, Delete, Patch, Param, Post, HttpCode, HttpStatus, UseGuards, Request} from '@nestjs/common';
import { AuthServerService } from './auth-server.service';
import { UserSignup } from '../DTO/userSignUp.dto';
import { UpdateUserDto } from '../DTO/updateUser.dto';
import { ApiTags, ApiQuery, ApiOperation, ApiResponse, ApiBody, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { UserSignIn } from '../DTO/signin.dto';
import { BaseAuthGuard } from './guards/baseauth.guard';
import { RolesGuard } from './guards/RBAC/roles.guard';
import { RoleRequired } from './guards/RBAC/roles.decorator';
import { Role } from '../DTO/role.enum';

@Controller("auth")
export class AuthServerController {
  constructor(private readonly authServerService: AuthServerService) {}
  
  @Get()
  getHealth(){
    return "Health OK!"
  }
  
  @Post('create-new')
  @ApiOperation({summary:'Creates new user'})
  @ApiBody({
    type: UserSignup,
    examples: {
      default: {
        value: {
          email: 'john@example.com',
          fName: 'AALOK',
          lName: 'JHA',
          netId:'aalokvault',
          password: 'P@ssw0rd123',
          role: 'guest'
        },
      },
    },
  })
  async createUser(@Body() user:UserSignup){
    const result = await this.authServerService.createUser(user)
    if(result){
      console.log(`user ${user.netId} was created`)
      return 'created'
    }
    console.log(`user ${user.netId} already exists`)
    return 'not created'
    
  }

  @Get('users')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getAllUsers() {
    const users = await this.authServerService.getAllUser();
    // Return users without password hash
    return users.map(({ password, ...user }) => user);
  }

  @Patch('users/:netId')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN)
  @ApiOperation({ summary: 'Update user by NetID (Admin only)' })
  @ApiBody({ type: UpdateUserDto })
  async updateUser(@Param('netId') netId: string, @Body() updates: UpdateUserDto) {
    const updated = await this.authServerService.updateUser(netId, updates);
    if (updated) {
      return { message: `User ${netId} updated successfully` };
    }
    return { message: `User ${netId} not found` };
  }

  @Delete('users/:netId')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user by NetID (Admin only)' })
  async deleteUser(@Param('netId') netId: string) {
    const deleted = await this.authServerService.remove(netId);
    if (deleted) {
      return { message: `User ${netId} deleted successfully` };
    }
    return { message: `User ${netId} not found` };
  }

  // Deprecated unsecured endpoint
  @Get('get-all')
  getAllUserUnsecured(){
    return this.authServerService.getAllUser()
  }


  @Get('find-user')
  @ApiOperation({summary:"Searches if a user is there or not"})
  @ApiQuery({ name: 'netId', required: true, type: String })
  findOne(@Query('netId') netId: string){
    return this.authServerService.findOne(netId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: UserSignIn,
    examples: {
      default: {
        value: {
          netId:'axjh03',
          password: 'P@ssw0rd123',
        },
      },
    },
  })
  signIn(@Body() userData:UserSignIn){
    return this.authServerService.signin(userData.netId, userData.password)
  }

  // Test BaseAuthGuard
  @UseGuards(BaseAuthGuard)
  @Get('test-baseauth')
  @ApiOperation({ summary: 'Test BaseAuthGuard - returns the JWT payload' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns the logged-in user payload' })
  testBaseAuth(@Request() req) {
    return req.user;
  }

  @Get('checkRBACAdmin')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN)
  checkRBACAdmin(){
    return this.authServerService.checkRBACAdmin()
  }

  @Get('checkRBACStudent')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STUDENT)
  checkRBACStudent(){
    return this.authServerService.checkRBACStudent()
  }

  @Get('checkRBACFaculty')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.FACULTY)
  checkRBACFaculty(){
    return this.authServerService.checkRBACFaculty()
  }

  @Get('checkRBACGuest')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.GUEST)
  checkRBACGuest(){
    return this.authServerService.checkRBACGuest()
  }

  @Get('checkRBACStaff')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STAFF)
  checkRBACStaff(){
    return this.authServerService.checkRBACStaff()
  }

  @Get('admin-or-staff')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN, Role.STAFF)
  adminOrStaff(){
    return { message: 'Allowed for admin or staff' };
  }

}
