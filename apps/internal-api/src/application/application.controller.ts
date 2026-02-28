import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ApplicationService } from './application.service';
import {
  CreateApplication_By_Unit_DTO,
  CreateApplication_By_Room_DTO,
  CreateApplication_By_Bed_DTO,
} from './dto/create-application.dto';
import { BaseAuthGuard } from 'apps/auth-server/src/guards/baseauth.guard';
import { RolesGuard } from 'apps/auth-server/src/guards/RBAC/roles.guard';
import { RoleRequired } from 'apps/auth-server/src/guards/RBAC/roles.decorator';
import { Role } from 'apps/auth-server/DTO/role.enum';
import { ChangeApplicationStatusDto } from './dto/change-application-status.dto';

@ApiTags('Application Flow')
@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get('/housing/availability')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STAFF, Role.ADMIN)
  @ApiOperation({
    summary:
      'Get available buildings with units (rooms/beds based on property leaseType)',
  })
  @ApiResponse({
    status: 200,
    description:
      'BY_UNIT: units only. BY_ROOM: units with rooms. BY_BED: units with rooms and beds.',
  })
  getHousingAvailability() {
    return this.applicationService.getHousingAvailability();
  }

  @Get('my')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STUDENT)
  @ApiOperation({ summary: 'View my applications (Student only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all applications for the logged-in student',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be STUDENT',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  findMyApplications(@Request() req) {
    return this.applicationService.findMyApplications(req.user.username);
  }

  @Post('submit/by-unit')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STUDENT)
  @ApiOperation({
    summary: 'Submit a BY_UNIT housing application (Student only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Application submitted with UNDER_REVIEW status',
  })
  @ApiResponse({
    status: 400,
    description: 'UTA ID mismatch or validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be STUDENT',
  })
  @ApiResponse({ status: 404, description: 'User not found in system' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate application for this term',
  })
  @ApiBody({
    type: CreateApplication_By_Unit_DTO,
    examples: {
      default: {
        summary: 'BY_UNIT application with occupants',
        value: {
          personalDetails: {
            fName: 'Aalok',
            mName: null,
            lName: 'Jha',
            utaId: '1001234567',
            email: 'axjh03@mavs.uta.edu',
            gender: 'MALE',
          },
          emergencyContact: {
            name: 'Jane Doe',
            phone: '8175551234',
          },
          applicationSelection: {
            intakeSemester: 'Fall 2025',
            buildingId: '1',
            unitType: 'BY_UNIT',
            isAdaRequired: false,
            agreementAccepted: true,
          },
          occupants: [
            {
              utaId: '1007654321',
              gender: 'FEMALE',
            },
          ],
        },
      },
    },
  })
  submitByUnit(@Body() dto: CreateApplication_By_Unit_DTO, @Request() req) {
    return this.applicationService.submitByUnit(req.user.username, dto);
  }

  @Post('submit/by-room')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STUDENT)
  @ApiOperation({
    summary: 'Submit a BY_ROOM housing application (Student only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Application submitted with UNDER_REVIEW status',
  })
  @ApiResponse({
    status: 400,
    description: 'UTA ID mismatch or validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be STUDENT',
  })
  @ApiResponse({ status: 404, description: 'User not found in system' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate application for this term',
  })
  @ApiBody({
    type: CreateApplication_By_Room_DTO,
    examples: {
      default: {
        summary: 'BY_ROOM application',
        value: {
          personalDetails: {
            fName: 'Emily',
            mName: null,
            lName: 'Chen',
            utaId: '1002345678',
            email: 'emc234@mavs.uta.edu',
            gender: 'FEMALE',
          },
          emergencyContact: {
            name: 'Robert Chen',
            phone: '2145559876',
          },
          applicationSelection: {
            intakeSemester: 'Fall 2025',
            buildingId: '3',
            unitType: 'BY_ROOM',
            isAdaRequired: false,
            agreementAccepted: true,
          },
          roomId: '1',
        },
      },
    },
  })
  submitByRoom(@Body() dto: CreateApplication_By_Room_DTO, @Request() req) {
    return this.applicationService.submitByRoom(req.user.username, dto);
  }

  @Post('submit/by-bed')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.STUDENT)
  @ApiOperation({
    summary: 'Submit a BY_BED housing application (Student only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Application submitted with UNDER_REVIEW status',
  })
  @ApiResponse({
    status: 400,
    description: 'UTA ID mismatch or validation error',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be STUDENT',
  })
  @ApiResponse({ status: 404, description: 'User not found in system' })
  @ApiResponse({
    status: 409,
    description: 'Duplicate application for this term',
  })
  @ApiBody({
    type: CreateApplication_By_Bed_DTO,
    examples: {
      default: {
        summary: 'BY_BED application',
        value: {
          personalDetails: {
            fName: 'Christopher',
            mName: 'James',
            lName: 'Brown',
            utaId: '1005678901',
            email: 'cjb567@mavs.uta.edu',
            gender: 'MALE',
          },
          emergencyContact: {
            name: 'Sarah Brown',
            phone: '9725553456',
          },
          applicationSelection: {
            intakeSemester: 'Fall 2025',
            buildingId: '4',
            unitType: 'BY_BED',
            isAdaRequired: false,
            agreementAccepted: true,
          },
          bedId: '1',
        },
      },
    },
  })
  submitByBed(@Body() dto: CreateApplication_By_Bed_DTO, @Request() req) {
    return this.applicationService.submitByBed(req.user.username, dto);
  }

  // ═══════════════════════════════════════════════════
  // ADMIN / STAFF ENDPOINTS — Manage Applications
  // ═══════════════════════════════════════════════════

  @Get('all')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'List all applications (Admin/Staff only)' })
  @ApiResponse({
    status: 200,
    description: 'Returns all applications with user and property details',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be ADMIN or STAFF',
  })
  findAll() {
    return this.applicationService.findAll();
  }

  @Get('by-id/:appId')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Lookup application by application ID (Admin/Staff only)',
  })
  @ApiParam({ name: 'appId', type: Number, example: 1 })
  @ApiResponse({
    status: 200,
    description: 'Returns the application with user and property details',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be ADMIN or STAFF',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  findByAppId(@Param('appId', ParseIntPipe) appId: number) {
    return this.applicationService.findByAppId(appId);
  }

  @Get('by-utaid/:utaId')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Lookup applications by student UTA ID (Admin/Staff only)',
  })
  @ApiParam({ name: 'utaId', type: String, example: '1001234567' })
  @ApiResponse({
    status: 200,
    description: 'Returns user info and all their applications',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be ADMIN or STAFF',
  })
  @ApiResponse({ status: 404, description: 'User with given UTA ID not found' })
  findByUtaId(@Param('utaId') utaId: string) {
    return this.applicationService.findByUtaId(utaId);
  }

  @Patch('update-status/:appId')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Change application status (Admin/Staff only)' })
  @ApiParam({ name: 'appId', type: Number, example: 1 })
  @ApiBody({ type: ChangeApplicationStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Application status updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be ADMIN or STAFF',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  updateStatus(
    @Param('appId', ParseIntPipe) appId: number,
    @Body() dto: ChangeApplicationStatusDto,
  ) {
    return this.applicationService.updateStatus(appId, dto.status);
  }

  @Delete(':appId')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @RoleRequired(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Delete an application (Admin/Staff only)' })
  @ApiParam({ name: 'appId', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: 'Application deleted successfully' })
  @ApiResponse({
    status: 403,
    description: 'Insufficient role — must be ADMIN or STAFF',
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  remove(@Param('appId', ParseIntPipe) appId: number) {
    return this.applicationService.remove(appId);
  }
}
