import { Controller, Post, Get, Body, Param, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body()
    body: {
      userId: number;
      messages: { role: string; content: string }[];
    },
  ) {
    const reply = await this.chatService.chat(body.userId, body.messages);
    return { reply };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('leaseId') leaseIdStr: string,
    @Body('senderId') senderIdStr: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const leaseId = parseInt(leaseIdStr, 10);
    const senderId = parseInt(senderIdStr, 10);
    
    if (!leaseId || !senderId) {
      throw new BadRequestException('leaseId and senderId are required');
    }

    const doc = await this.chatService.uploadChatFile(leaseId, senderId, file);
    return doc;
  }

  @Get('documents/:leaseId')
  async getDocuments(@Param('leaseId') leaseIdStr: string) {
    const leaseId = parseInt(leaseIdStr, 10);
    if (!leaseId) {
      throw new BadRequestException('Invalid leaseId');
    }
    return this.chatService.getChatDocuments(leaseId);
  }
}
