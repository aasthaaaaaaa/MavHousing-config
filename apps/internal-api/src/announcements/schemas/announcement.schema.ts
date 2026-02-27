import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Announcement extends Document {
  @Prop({ required: true })
  heading: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true })
  scope: string; // e.g., 'ALL', 'ALL_STUDENTS', 'PROPERTY', etc.

  @Prop()
  scopeValue?: string; // e.g., '1' for propertyId, or 'netid123'

  @Prop({ required: true })
  senderRole: string; // 'ADMIN' or 'STAFF'

  @Prop({ required: true })
  senderId: number;

  @Prop({ type: [String] })
  attachmentNames?: string[];
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
