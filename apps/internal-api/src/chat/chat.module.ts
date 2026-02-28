import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaModule } from '@common/prisma/prisma.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatDocument, ChatDocumentSchema } from './chat-document.schema';

@Module({
  imports: [
    PrismaModule,
    MongooseModule.forFeature([{ name: ChatDocument.name, schema: ChatDocumentSchema }])
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
})
export class ChatModule {}
