import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for sending a templated SMS.
 */
export class SendSmsDto {
  @ApiProperty({
    description: 'Recipient phone number (E.164 format)',
    example: '+18175551234',
  })
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Recipient first name (for personalization)',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'Custom context / additional details',
    example: 'Proof of enrollment is missing.',
  })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional({
    description: 'Portal URL override',
    example: 'https://mavhousing.uta.edu',
  })
  @IsString()
  @IsOptional()
  portalUrl?: string;
}
