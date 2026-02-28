import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatDocumentDocument = ChatDocument & Document;

@Schema({ collection: 'lease-chat', timestamps: true })
export class ChatDocument {
  @Prop({ required: true })
  leaseId: number;

  @Prop({ required: true })
  senderId: number;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileType: string;
}

export const ChatDocumentSchema = SchemaFactory.createForClass(ChatDocument);
