import { Controller, Post, Body } from '@nestjs/common';
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
}
