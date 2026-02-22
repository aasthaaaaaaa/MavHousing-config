import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDate,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ValidatePassword } from '@common/validator/validatePasswordSec.decorator';
import { Role } from './role.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Gender, StudentStatus, StaffPosition } from '@mav-housing/prisma';

export class UserSignup {
  @ApiProperty()
  @IsNotEmpty()
  readonly fName: string;

  @ApiProperty()
  @IsOptional()
  readonly mName: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly lName: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly netId: string;

  @ApiProperty()
  @IsNotEmpty()
  readonly utaId: string;

  @ApiProperty()
  @IsNotEmpty()
  @ValidatePassword() // Custom Decorator that Validates based on UTA Password requirements
  passwordHash: string;

  @ApiProperty()
  @IsEnum(Role)
  readonly role: Role; // Defaults to undefined

  @ApiProperty()
  @IsEnum(Gender)
  @IsNotEmpty()
  readonly gender: Gender;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  readonly dob: Date;

  @ApiProperty()
  @IsEnum(StudentStatus)
  @IsOptional()
  readonly studentStatus: StudentStatus;

  @ApiProperty()
  @IsEnum(StaffPosition)
  @IsOptional()
  readonly staffPosition: StaffPosition;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  readonly requiresAdaAccess: boolean;
}
