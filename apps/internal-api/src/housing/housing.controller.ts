import { Controller, Get, Post, Body, Req, UseGuards, Patch, Param } from '@nestjs/common';
import { HousingService } from './housing.service';

@Controller('housing')
export class HousingController {
  constructor(private readonly housingService: HousingService) {}

  @Get('properties')
  async getProperties() {
    return this.housingService.getProperties();
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
    });
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
  async updateApplicationStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.housingService.updateApplicationStatus(parseInt(id), body.status);
  }
}
