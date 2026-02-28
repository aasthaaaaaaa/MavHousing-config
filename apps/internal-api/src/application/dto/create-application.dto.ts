import { ApplicationStatus } from '@mav-housing/prisma';
import { UserSignup } from 'apps/auth-server/DTO/userSignUp.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/*
Application basic payload
{
    "personalDetails": { 
      "fName": "string",
      "mName": "string",
      "lName": "string",
      "utaId": 1001234567,
      "email": "abc1234@mavs.uta.edu",
      "gender": "M | F | Other"
    },
    "emergencyContact": {
      "name": "string",
      "phone": "string"
    },
    "applicationSelection": {
      "intakeSemester": "Fall 2025",
      "buildingId": "string",
      "unitType": "BY_UNIT | BY_ROOM | BY_BED", 
      "isAdaRequired": false,
      "agreementAccepted": true
    }
  }

Then for each unit type we have different fields

for by unit, it's if they have a occupant or not and we can add
    "occupant1": {
        "utaId": 1001234567,
        "gender": "M | F | Other"
    },
    "occupant2": {
        "utaId": 1001234567,
        "gender": "M | F | Other"
    },
    "occupant3": {
        "utaId": 1001234567,
        "gender": "M | F | Other"
    },
    "occupant4": {
        "utaId": 1001234567,
        "gender": "M | F | Other"
    }

for by room it's not occupant but is room_id



*/

class PersonalDetailsDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  fName: UserSignup['fName'];

  @ApiPropertyOptional({ example: null })
  @IsString()
  @IsOptional()
  mName?: UserSignup['mName'];

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lName: UserSignup['lName'];

  @ApiProperty({ example: '1001234567' })
  @IsString()
  @IsNotEmpty()
  utaId: UserSignup['utaId'];

  @ApiProperty({ example: 'jd1234@mavs.uta.edu' })
  @IsString()
  @IsNotEmpty()
  email: UserSignup['email'];

  @ApiProperty({ example: 'MALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  gender: UserSignup['gender'];
}

class EmergencyContactDto {
  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '8175551234' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}

class ApplicationSelectionDto {
  @ApiProperty({ example: 'Fall 2025' })
  @IsString()
  @IsNotEmpty()
  intakeSemester: string;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ example: 'BY_UNIT', enum: ['BY_UNIT', 'BY_ROOM', 'BY_BED'] })
  @IsString()
  @IsNotEmpty()
  unitType: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isAdaRequired?: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  agreementAccepted: boolean;
}

class OccupantDto {
  @ApiProperty({ example: '1007654321' })
  @IsString()
  @IsNotEmpty()
  utaId: UserSignup['utaId'];

  @ApiProperty({ example: 'FEMALE', enum: ['MALE', 'FEMALE', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  gender: UserSignup['gender'];
}

export class CreateApplication_By_Unit_DTO {
  static STATUS = ApplicationStatus;

  @ApiProperty({ type: PersonalDetailsDto })
  @ValidateNested()
  @Type(() => PersonalDetailsDto)
  personalDetails: PersonalDetailsDto;

  @ApiProperty({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ type: ApplicationSelectionDto })
  @ValidateNested()
  @Type(() => ApplicationSelectionDto)
  applicationSelection: ApplicationSelectionDto;

  @ApiPropertyOptional({ type: [OccupantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OccupantDto)
  occupants?: OccupantDto[];
}

export class CreateApplication_By_Room_DTO {
  static STATUS = ApplicationStatus;

  @ApiProperty({ type: PersonalDetailsDto })
  @ValidateNested()
  @Type(() => PersonalDetailsDto)
  personalDetails: PersonalDetailsDto;

  @ApiProperty({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ type: ApplicationSelectionDto })
  @ValidateNested()
  @Type(() => ApplicationSelectionDto)
  applicationSelection: ApplicationSelectionDto;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  roomId: string;
}

export class CreateApplication_By_Bed_DTO {
  static STATUS = ApplicationStatus;

  @ApiProperty({ type: PersonalDetailsDto })
  @ValidateNested()
  @Type(() => PersonalDetailsDto)
  personalDetails: PersonalDetailsDto;

  @ApiProperty({ type: EmergencyContactDto })
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact: EmergencyContactDto;

  @ApiProperty({ type: ApplicationSelectionDto })
  @ValidateNested()
  @Type(() => ApplicationSelectionDto)
  applicationSelection: ApplicationSelectionDto;

  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  bedId: string;
}
