import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.enum';

export class UpdateUserDto {
  @ApiProperty() @IsOptional() @IsString() readonly fName?: string;
  @ApiProperty() @IsOptional() @IsString() readonly lName?: string;
  @ApiProperty() @IsOptional() @IsEmail() readonly email?: string;
  @ApiProperty() @IsOptional() @IsString() readonly phone?: string;
  @ApiProperty() @IsOptional() @IsEnum(Role) readonly role?: Role;
  @ApiProperty() @IsOptional() @IsString() readonly gender?: string;
  @ApiProperty() @IsOptional() @IsString() readonly studentStatus?: string;
  @ApiProperty() @IsOptional() @IsString() readonly staffPosition?: string;
  @ApiProperty() @IsOptional() @IsBoolean() readonly requiresAdaAccess?: boolean;
  @ApiProperty() @IsOptional() @IsBoolean() readonly isLocked?: boolean;
  @ApiProperty() @IsOptional() @IsString() readonly lockReason?: string;
  @ApiProperty() @IsOptional() @IsString() readonly newPassword?: string;
  @ApiProperty() @IsOptional() readonly assignedPropertyId?: number;
}
