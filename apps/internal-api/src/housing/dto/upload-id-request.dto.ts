import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadIdRequestDto {
  @ApiProperty({ description: 'The NetID of the user', example: 'axj1234' })
  @IsString()
  @IsNotEmpty()
  netId: string;
}
