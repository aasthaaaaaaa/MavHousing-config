import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { HousingService } from './housing.service';
import { UploadService } from './upload.service';
import { UploadIdRequestDto } from './dto/upload-id-request.dto';

@Controller('housing')
export class HousingController {
  constructor(
    private readonly housingService: HousingService,
    private readonly uploadService: UploadService,
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

  @Get('properties/:propertyId/available-beds')
  async getAvailableBeds(@Param('propertyId') propertyId: string) {
    return this.housingService.getAvailableBeds(parseInt(propertyId, 10));
  }

  @Get('terms')
  async getTerms() {
    return this.housingService.getTerms();
  }

  @Post('application')
  async createApplication(@Body() body: any, @Req() req: any) {
    // For MVP, we'll extract userId from the request
    // In production, this should come from authenticated user context
    const userId = body.userId || 1; // Fallback for testing

    return this.housingService.createApplication(userId, {
      term: body.term,
      preferredPropertyId: body.preferredPropertyId,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      emergencyContactRelation: body.emergencyContactRelation,
      sleepSchedule: body.sleepSchedule,
      cleanliness: body.cleanliness,
      noiseLevel: body.noiseLevel,
      smokingPreference: body.smokingPreference,
      dietaryRestrictions: body.dietaryRestrictions,
      specialAccommodations: body.specialAccommodations,
    });
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

  @Get('my-applications')
  async getMyApplications(@Req() req: any) {
    // Get userId from query params (sent by frontend)
    const userId = parseInt(req.query.userId) || 1;
    return this.housingService.getUserApplications(userId);
  }

  @Get('applications')
  async getAllApplications() {
    return this.housingService.getAllApplications();
  }

  @Patch('applications/:id/status')
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.housingService.updateApplicationStatus(
      parseInt(id),
      body.status,
    );
  }

  @Get('students')
  async getStudents() {
    return this.housingService.getStudents();
  }

  @Get('hierarchy')
  async getHierarchy() {
    return this.housingService.getHierarchy();
  }

  @Get('occupancy-stats')
  async getOccupancyStats() {
    return this.housingService.getOccupancyStats();
  }
}
