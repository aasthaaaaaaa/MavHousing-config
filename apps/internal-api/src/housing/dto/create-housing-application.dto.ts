import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHousingApplicationDto {
  @ApiProperty({ example: 'FALL_2026' })
  @IsString()
  @IsNotEmpty()
  term: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  preferredPropertyId: number;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  emergencyContactName: string;

  @ApiProperty({ example: '817-555-1234' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @Matches(/^(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, {
    message: 'Invalid phone number format',
  })
  emergencyContactPhone: string;

  @ApiProperty({ example: 'Mother' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  emergencyContactRelation: string;

  @ApiProperty({ example: 'Night Owl' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  sleepSchedule?: string;

  @ApiProperty({ example: 'Very Neat' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  cleanliness?: string;

  @ApiProperty({ example: 'Moderate' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  noiseLevel?: string;

  @ApiProperty({ example: 'Non-Smoker' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  smokingPreference?: string;

  @ApiPropertyOptional({ example: 'None' })
  @IsString()
  @IsOptional()
  dietaryRestrictions?: string;

  @ApiPropertyOptional({ example: 'None' })
  @IsString()
  @IsOptional()
  specialAccommodations?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  userId?: number;
}
