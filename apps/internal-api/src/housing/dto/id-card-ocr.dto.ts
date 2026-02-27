import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';
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
  utaId: string;

  @ApiPropertyOptional({ example: 'john.doe@mavs.uta.edu' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '817-555-1234' })
  @IsString()
  @IsOptional()
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
