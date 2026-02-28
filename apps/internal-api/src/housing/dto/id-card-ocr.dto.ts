import {
  IsString,
  IsOptional,
  IsEmail,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IdCardOcrDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  fName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lName: string;

  @ApiProperty({ example: '1001234567' })
  @IsString()
  @IsNotEmpty()
  @Length(10, 10, { message: 'Student ID must be exactly 10 digits' })
  @Matches(/^\d+$/, { message: 'Student ID must contain only numbers' })
  utaId: string;

  @ApiPropertyOptional({ example: 'john.doe@mavs.uta.edu' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '817-555-1234' })
  @IsString()
  @IsOptional()
  @Matches(/^(\+?\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;
}

export class IdCardResponseDto extends IdCardOcrDto {
  @ApiProperty({ example: 'https://example.com/doc.jpg' })
  @IsString()
  docUrl: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg' })
  @IsString()
  profilePicUrl: string;
}
