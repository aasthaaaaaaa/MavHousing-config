import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Req,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
    @Body()
    body: { status: string; staffId?: number; resolutionReason?: string },
  ) {
    return this.maintenanceService.updateRequestStatus(
      parseInt(id),
      body.status,
      body.staffId,
      body.resolutionReason,
    );
  }

  /** Staff: get staff list for assignment */
  @Get('staff')
  async getStaffList() {
    return this.maintenanceService.getStaffList();
  }

  /** Common: Add a comment to a request */
  @Post('requests/:id/comments')
  async createComment(
    @Param('id') id: string,
    @Body() body: { userId: number; content?: string; attachmentUrl?: string },
  ) {
    return this.maintenanceService.createComment(
      parseInt(id),
      body.userId,
      body.content,
      body.attachmentUrl,
    );
  }

  /** Common: Get comments for a request */
  @Get('requests/:id/comments')
  async getComments(@Param('id') id: string) {
    return this.maintenanceService.getComments(parseInt(id));
  }

  /** Common: Upload an attachment */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const url = await this.maintenanceService.uploadAttachment(file);
    return { url };
  }

  /** Common: Delete a comment */
  @Delete('comments/:commentId')
  async deleteComment(@Param('commentId') commentId: string) {
    return this.maintenanceService.deleteComment(commentId);
  }
}
