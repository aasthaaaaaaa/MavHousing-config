import { Module } from '@nestjs/common';
import { HousingController } from './housing.controller';
import { HousingService } from './housing.service';
import { UploadService } from './upload.service';
import { UtilsModule } from '@libs/common';
import { CommsServerModule } from '../../../comms-server/src/comms-server.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    UtilsModule,
    CommsServerModule,
    BullModule.registerQueue({
      name: 'occupancy-report',
    }),
  ],
  controllers: [HousingController],
  providers: [HousingService, UploadService],
  exports: [HousingService, UploadService],
})
export class HousingModule {}
