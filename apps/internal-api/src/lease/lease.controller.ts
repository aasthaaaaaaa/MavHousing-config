import {
  Controller,
  Get,
  Req,
  Patch,
  Param,
  Body,
  Post,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
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

  @Patch('reassign')
  async reassignUser(
    @Body() body: { userId: number; leaseId: number; asHolder: boolean },
  ) {
    return this.leaseService.reassignUserToLease(
      body.userId,
      body.leaseId,
      body.asHolder,
    );
  }

  @Get('occupancy')
  async getOccupancy() {
    return this.leaseService.getOccupancy();
  }

  @Post('occupancy/:leaseId')
  async addOccupant(
    @Param('leaseId', ParseIntPipe) leaseId: number,
    @Body() body: { userId: number; occupantType: string },
  ) {
    return this.leaseService.addOccupant(leaseId, body.userId, body.occupantType);
  }

  @Delete('occupancy/:occupantId')
  async removeOccupant(@Param('occupantId', ParseIntPipe) occupantId: number) {
    return this.leaseService.removeOccupant(occupantId);
  }

  @Get('user-lease/:userId')
  async getUserLease(@Param('userId', ParseIntPipe) userId: number) {
    return this.leaseService.getUserLease(userId);
  }

  @Patch('end/:id')
  async endLease(@Param('id', ParseIntPipe) id: number) {
    return this.leaseService.updateLeaseStatus(id, 'COMPLETED');
  }

  @Patch(':id/request-termination')
  async requestTermination(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string },
  ) {
    return this.leaseService.requestTermination(id, body.reason);
  }

  @Patch(':id/termination-fee')
  async setTerminationFee(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { amount: number },
  ) {
    return this.leaseService.setTerminationFee(id, body.amount);
  }

  @Patch(':id/approve-termination')
  async approveTermination(@Param('id', ParseIntPipe) id: number) {
    return this.leaseService.approveTermination(id);
  }
}
