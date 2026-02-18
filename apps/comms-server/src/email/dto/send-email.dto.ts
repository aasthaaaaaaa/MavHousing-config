import { IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for sending a templated email.
 */
export class SendEmailDto {
  @ApiProperty({
    description: 'Recipient email address',
    example: 'axjh03@gmail.com',
  })
  @IsEmail()
  to: string;

  @ApiProperty({
    description: 'Recipient first name (for personalization)',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({
    description: 'Custom context / additional details for the email body',
    example: 'Proof of enrollment and photo ID are still missing.',
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
