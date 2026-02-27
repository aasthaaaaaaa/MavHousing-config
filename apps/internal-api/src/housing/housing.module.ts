import { Module } from '@nestjs/common';
import { HousingController } from './housing.controller';
import { HousingService } from './housing.service';
import { UploadService } from './upload.service';
import { UtilsModule } from '@libs/common';

@Module({
  imports: [UtilsModule],
  controllers: [HousingController],
  providers: [HousingService, UploadService],
  exports: [HousingService],
})
export class HousingModule {}
