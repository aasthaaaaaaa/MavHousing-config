/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';
import { BulletinTargetType, BulletinType } from '../schemas/bulletin.schema';

export class CreateBulletinDto {
  @IsEnum(BulletinType)
  @IsNotEmpty()
  type: BulletinType;

  @IsString()
  @IsOptional()
  title?: string;

  // We make content optional here because if it's a PHOTO, the controller
  // extracts it from the Multipart file buffer, and if it's TEXT, it comes from the form field.
  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(BulletinTargetType)
  @IsNotEmpty()
  targetType: BulletinTargetType;

  // Since FormData submits arrays as comma-separated strings or multiple keys,
  // we accept any type and parse it strictly in the Controller/Service layer.
  @IsOptional()
  targetPropertyIds?: any;

  @IsOptional()
  targetLeaseIds?: any;

  @IsOptional()
  targetPropertyTypes?: any;
}
