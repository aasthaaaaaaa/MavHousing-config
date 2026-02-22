import {
  Body,
  Query,
  Controller,
  Get, Post,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  ForbiddenException,
  NotFoundException,
  Delete,
  Param,
} from '@nestjs/common';
import { AuthServerService } from './auth-server.service';
import { UserSignup } from '../DTO/userSignUp.dto';
import { UpdateUserDto } from '../DTO/updateUser.dto';
import {
  ApiQuery,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserSignIn } from '../DTO/signin.dto';
import { BaseAuthGuard } from './guards/baseauth.guard';
import { RolesGuard } from './guards/RBAC/roles.guard';
import { RoleRequired } from './guards/RBAC/roles.decorator';
import { Role } from '../DTO/role.enum';
import { Gender, StaffPosition, StudentStatus } from 'generated/prisma';

@Controller('auth')
export class AuthServerController {
  constructor(private readonly authServerService: AuthServerService) {}

  @Get()
  getHealth() {
    return 'Health OK!';
  }

  // we can extend this create new based on different type of create-new.... like create new with certain fields only

  /*
  The function creates accounts
  It also used RBAC to determine necessary persmission requirements
    - Admins can create both Staff and Student accounts.
    - Staff can only create Student accounts.
    - Throws ForbiddenException if a non-admin attempts to create a staff account.
  */

  @Post('create-new')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Creates new account' })
  @RoleRequired(Role.ADMIN, Role.STAFF)
  @ApiBody({
    type: UserSignup,
    examples: {
      default: {
        value: {
          netId: 'iaalok03',
          passwordHash: 'P@ssw0rd123',
          role: Role.STAFF,
          email: 'iaalok0303@uta.edu',
          fName: 'Aalok',
          mName: null,
          lName: 'Jha',
          gender: Gender.MALE,
          dob: '1999-01-01',
          utaId: '123456789',
          studentStatus: StudentStatus.RESIDENT,
          staffPosition: StaffPosition.MANAGEMENT,
          requiresAdaAccess: true,
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

  @Get('get-all')
  getAllUser() {
    return this.authServerService.getAllUser();
  }

  @Get('find-user')
  @ApiOperation({ summary: 'Searches if a user is there or not' })
  @ApiQuery({ name: 'netId', required: true, type: String })
  findOne(@Query('netId') netId: string) {
    return this.authServerService.findOne(netId);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    type: UserSignIn,
    examples: {
      default: {
        value: {
          netId: 'axjh03',
          password: 'P@ssw0rd123',
        },
      },
    },
  })
  signIn(@Body() userData: UserSignIn) {
    return this.authServerService.signin(userData.netId, userData.password);
  }

  // Test BaseAuthGuard
  @UseGuards(BaseAuthGuard)
  @Get('test-baseauth')
  @ApiOperation({ summary: 'Test BaseAuthGuard - returns the JWT payload' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Returns the logged-in user payload',
  })
  testBaseAuth(@Request() req) {
    return req.user;
  }

  @Get('checkRBACAdmin')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN)
  checkRBACAdmin() {
    return this.authServerService.checkRBACAdmin();
  }

  @Get('checkRBACStudent')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STUDENT)
  checkRBACStudent() {
    return this.authServerService.checkRBACStudent();
  }

  @Get('checkRBACStaff')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STAFF)
  checkRBACStaff() {
    return this.authServerService.checkRBACStaff();
  }

  @Get('admin-or-staff')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN, Role.STAFF)
  adminOrStaff() {
    return { message: 'Allowed for admin or staff' };
  }
}
