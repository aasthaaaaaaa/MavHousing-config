import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Patch,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { HousingService } from './housing.service';
import { UploadService } from './upload.service';
import { UploadIdRequestDto } from './dto/upload-id-request.dto';
import { CreateHousingApplicationDto } from './dto/create-housing-application.dto';

@Controller('housing')
export class HousingController {
  constructor(
    private readonly housingService: HousingService,
    private readonly uploadService: UploadService,
    @InjectQueue('occupancy-report') private readonly reportQueue: Queue,
    @InjectQueue('property-reports') private readonly propertyQueue: Queue,
    @InjectQueue('lease-reports') private readonly leaseQueue: Queue,
    @InjectQueue('finance-reports') private readonly financeQueue: Queue,
  ) {}

  @Get('user-by-utaid/:utaId')
  async getUserByUtaId(@Param('utaId') utaId: string) {
    const user = await this.housingService.findUserByUtaId(utaId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  @Get('properties')
  async getProperties() {
    return this.housingService.getProperties();
  }

  @Get('properties/availability')
  async getPropertiesAvailability() {
    return this.housingService.getPropertiesAvailability();
  }

  @Get('properties/:propertyId/available-units')
  async getAvailableUnits(@Param('propertyId') propertyId: string) {
    return this.housingService.getAvailableUnits(parseInt(propertyId, 10));
  }

  @Get('properties/:propertyId/available-rooms')
  async getAvailableRooms(@Param('propertyId') propertyId: string) {
    return this.housingService.getAvailableRooms(parseInt(propertyId, 10));
  }

  @Get('properties/:propertyId/available-beds')
  async getAvailableBeds(@Param('propertyId') propertyId: string) {
    return this.housingService.getAvailableBeds(parseInt(propertyId, 10));
  }

  @Get('terms')
  async getTerms() {
    return this.housingService.getTerms();
  }

  @Post('application')
  async createApplication(
    @Body() body: CreateHousingApplicationDto,
    @Req() req: any,
  ) {
    // For MVP, we'll extract userId from the request
    // In production, this should come from authenticated user context
    const userId = body.userId || 1; // Fallback for testing

    return this.housingService.createApplication(userId, body);
  }

  @Post('upload-id')
  @UseInterceptors(FileInterceptor('file'))
  async uploadIdCard(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadIdRequestDto,
  ) {
    if (!file) {
      throw new HttpException('File is required', HttpStatus.BAD_REQUEST);
    }
    // Perform OCR and Upload
    return this.uploadService.processIdCard(file, body.netId);
  }

  @Post('maintenance/upload')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadMaintenanceAttachments(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: any,
  ) {
    const userId = parseInt(req.query.userId || req.body.userId) || 1;
    
    // Convert to array if single file
    const filesArray = Array.isArray(files) ? files : [files].filter(Boolean);
    
    if (!filesArray.length) {
      return [];
    }

    return this.uploadService.uploadMaintenanceFiles(filesArray, userId);
  }

  @Get('my-applications')
  async getMyApplications(@Req() req: any) {
    // Get userId from query params (sent by frontend)
    const userId = parseInt(req.query.userId) || 1;
    return this.housingService.getUserApplications(userId);
  }

  @Get('applications')
  async getAllApplications(@Req() req: any) {
    const propertyId = req.query.propertyId ? parseInt(req.query.propertyId) : undefined;
    return this.housingService.getAllApplications(propertyId);
  }

  @Get('applications/:id')
  async getApplicationById(@Param('id') id: string) {
    const application = await this.housingService.getApplicationById(
      parseInt(id),
    );
    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }
    return application;
  }

  @Patch('applications/:id/status')
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string; requestInfo?: string },
  ) {
    return this.housingService.updateApplicationStatus(
      parseInt(id),
      body.status,
      body.reason,
      body.requestInfo,
    );
  }

  @Get('students')
  async getStudents() {
    return this.housingService.getStudents();
  }

  @Delete('applications/:id')
  async deleteApplication(@Param('id') id: string, @Req() req: any) {
    const userId = parseInt(req.query.userId);
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.housingService.deleteApplication(parseInt(id), userId);
  }

  @Post('leases/:leaseId/occupants')
  async addOccupant(
    @Param('leaseId') leaseId: string,
    @Body() body: { utaId: string },
    @Req() req: any,
  ) {
    const requesterUserId = parseInt(req.query.userId);
    if (!requesterUserId) {
      throw new HttpException(
        'Requester User ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.housingService.addOccupant(
      parseInt(leaseId),
      body.utaId,
      requesterUserId,
    );
  }

  @Delete('leases/:leaseId/occupants/:userId')
  async removeOccupant(
    @Param('leaseId') leaseId: string,
    @Param('userId') targetUserId: string,
    @Req() req: any,
  ) {
    const requesterUserId = parseInt(req.query.userId);
    if (!requesterUserId) {
      throw new HttpException(
        'Requester User ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.housingService.removeOccupant(
      parseInt(leaseId),
      parseInt(targetUserId),
      requesterUserId,
    );
  }

  @Get('hierarchy')
  async getHierarchy() {
    return this.housingService.getHierarchy();
  }

  @Get('occupancy-stats')
  async getOccupancyStats() {
    return this.housingService.getOccupancyStats();
  }

  @Post('occupancy-report/trigger')
  async triggerOccupancyReport() {
    const job = await this.reportQueue.add('generate-report', {
      triggeredAt: new Date().toISOString(),
    });

    return {
      message: 'Occupancy report job added to queue',
      jobId: job.id,
    };
  }

  @Post('reports/trigger')
  async triggerAdminReport(@Body() data: { type: string; netId?: string; sortBy?: string }) {
    const { type, netId, sortBy } = data;
    let job;
    switch (type) {
      case 'property-assignments':
        job = await this.propertyQueue.add('generate', {});
        break;
      case 'lease-inventory':
        job = await this.leaseQueue.add('generate', {});
        break;
      case 'financial-summary':
        job = await this.financeQueue.add('generate', { netId, sortBy: sortBy as any });
        break;
      default:
        throw new HttpException('Invalid report type', HttpStatus.BAD_REQUEST);
    }

    return {
      message: `${type} report job added to queue`,
      jobId: job.id,
    };
  }
}
