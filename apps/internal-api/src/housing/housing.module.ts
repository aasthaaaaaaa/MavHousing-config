import { Module, OnModuleInit } from '@nestjs/common';
import { HousingController } from './housing.controller';
import { HousingService } from './housing.service';
import { UploadService } from './upload.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
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
export class HousingModule implements OnModuleInit {
  constructor(
    @InjectQueue('occupancy-report') private readonly reportQueue: Queue,
  ) {}

  async onModuleInit() {
    // Schedule the job to run at 11:59 PM on the last day of every month
    // "59 23 L * *" is supported by most BullMQ cron parsers for 'Last day'
    // Fallback to "0 0 1 * *" (1st of month) if native 'L' is not supported in the env
    await this.reportQueue.add(
      'monthly-automated-report',
      { type: 'AUTOMATED' },
      {
        repeat: {
          pattern: '0 0 1 * *', // Run on 1st of every month at midnight
        },
        jobId: 'monthly-occupancy-report', // Fixed ID to avoid duplicates
      },
    );
    console.log('BullMQ: Scheduled monthly occupancy report for the 1st of every month.');
  }
}
