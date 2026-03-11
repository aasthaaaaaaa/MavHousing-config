import { Module } from '@nestjs/common';
import { HousingController } from './housing.controller';
import { HousingService } from './housing.service';
import { UploadService } from './upload.service';
import { UtilsModule } from '@libs/common';
import { CommsServerModule } from '../../../comms-server/src/comms-server.module';

@Module({
  imports: [UtilsModule, CommsServerModule],
  controllers: [HousingController],
  providers: [HousingService, UploadService],
  exports: [HousingService],
})
export class HousingModule {}
