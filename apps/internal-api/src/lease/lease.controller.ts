import { Controller, Get, Req, Patch, Param, Body, Post, Delete } from '@nestjs/common';
import { LeaseService } from './lease.service';

@Controller('lease')
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Get('my-lease')
  async getMyLease(@Req() req: any) {
    const userId = parseInt(req.query.userId) || 1;
    return this.leaseService.getMyLease(userId);
  }

  @Post('create')
  async createLease(@Body() body: any) {
    return this.leaseService.createLease(body);
  }

  @Get('leases')
  async getAllLeases() {
    return this.leaseService.getAllLeases();
  }

  @Patch('leases/:id/status')
  async updateLeaseStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.leaseService.updateLeaseStatus(parseInt(id), body.status);
  }
}
