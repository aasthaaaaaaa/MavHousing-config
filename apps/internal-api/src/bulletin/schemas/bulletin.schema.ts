import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum BulletinType {
  PHOTO = 'PHOTO',
  TEXT = 'TEXT',
}

export enum BulletinTargetType {
  ALL = 'ALL',
  PROPERTY = 'PROPERTY',
  LEASE = 'LEASE',
  PROPERTY_TYPE = 'PROPERTY_TYPE',
}

@Schema({ timestamps: true })
export class Bulletin extends Document {
  @Prop({ required: true, enum: BulletinType })
  type: string;

  @Prop()
  title?: string;

  @Prop({ required: true })
  content: string; // URL to R2 if PHOTO, HTML string if TEXT

  @Prop({ required: true })
  authorId: number; // Links to Postgres User table

  @Prop({ required: true, enum: BulletinTargetType })
  targetType: string;

  @Prop({ type: [Number], default: [] })
  targetPropertyIds: number[];

  @Prop({ type: [Number], default: [] })
  targetLeaseIds: number[];

  @Prop({ type: [String], default: [] })
  targetPropertyTypes: string[];
}

export const BulletinSchema = SchemaFactory.createForClass(Bulletin);
