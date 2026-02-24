import { Controller, Post, Get, Body, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AnnouncementsService } from './announcements.service';
import { ApiTags, ApiConsumes, ApiOperation } from '@nestjs/swagger';

@ApiTags('Announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  @ApiOperation({ summary: 'Create and send a new announcement' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  }))
  async createAnnouncement(
    @Body('heading') heading: string,
    @Body('message') message: string,
    @Body('scope') scope: string,
    @Body('scopeValue') scopeValue: string,
    @Body('senderRole') senderRole: string,
    @Body('senderId') senderId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!heading || !message || !scope || !senderRole || !senderId) {
      throw new BadRequestException('Missing required fields');
    }

    return this.announcementsService.createAnnouncement(
      heading,
      message,
      scope,
      scopeValue,
      senderRole,
      parseInt(senderId, 10),
      file,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get previous announcements' })
  async getAnnouncements(@Query('role') role: string) {
    if (!role) {
      throw new BadRequestException('Role query parameter is required');
    }
    return this.announcementsService.getAnnouncements(role);
  }
}
