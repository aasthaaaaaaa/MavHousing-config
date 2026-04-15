import { Module } from '@nestjs/common';
import { EmailReplyService } from './email-reply.service';

@Module({
  providers: [EmailReplyService],
  exports: [EmailReplyService],
})
export class EmailModule {}
