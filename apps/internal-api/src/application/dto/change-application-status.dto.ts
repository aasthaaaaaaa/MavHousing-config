import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '@mav-housing/prisma';

export class ChangeApplicationStatusDto {
    @ApiProperty({
        enum: ApplicationStatus,
        example: ApplicationStatus.APPROVED,
        description: 'New status for the application',
    })
    @IsEnum(ApplicationStatus)
    status: ApplicationStatus;
}
