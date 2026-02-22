import { Controller, Get, Post, Body, Req, Patch, Param } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  /** Student: get their active lease for auto-populating leaseId */
  @Get('active-lease')
  async getActiveLease(@Req() req: any) {
    const userId = parseInt(req.query.userId) || 1;
    return this.maintenanceService.getActiveLease(userId);
  }

  /** Student: submit a new request */
  @Post('request')
  async createRequest(@Body() body: any) {
    const { userId, leaseId, category, priority, description } = body;
    return this.maintenanceService.createRequest(userId, leaseId, {
      category,
      priority,
      description,
    });
  }

  /** Student: view their own requests */
  @Get('my-requests')
  async getMyRequests(@Req() req: any) {
    const userId = parseInt(req.query.userId) || 1;
    return this.maintenanceService.getMyRequests(userId);
  }

  /** Staff: view all requests */
  @Get('requests')
  async getAllRequests() {
    return this.maintenanceService.getAllRequests();
  }

  /** Staff: update request status */
  @Patch('requests/:id/status')
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() body: { status: string; staffId?: number },
  ) {
    return this.maintenanceService.updateRequestStatus(
      parseInt(id),
      body.status,
      body.staffId,
    );
  }

  /** Staff: get staff list for assignment */
  @Get('staff')
  async getStaffList() {
    return this.maintenanceService.getStaffList();
  }
}
