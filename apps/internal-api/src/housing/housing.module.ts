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
    BullModule.registerQueue(
      { name: 'occupancy-report' },
      { name: 'property-reports' },
      { name: 'lease-reports' },
      { name: 'finance-reports' },
    ),
  ],
  controllers: [HousingController],
  providers: [HousingService, UploadService],
  exports: [HousingService, UploadService],
})
export class HousingModule implements OnModuleInit {
  constructor(
    @InjectQueue('occupancy-report') private readonly reportQueue: Queue,
    @InjectQueue('property-reports') private readonly propertyQueue: Queue,
    @InjectQueue('lease-reports') private readonly leaseQueue: Queue,
    @InjectQueue('finance-reports') private readonly financeQueue: Queue,
  ) {}

  async onModuleInit() {
    // Schedule Occupancy Report
    await this.reportQueue.add(
      'monthly-automated-report',
      { type: 'AUTOMATED' },
      {
        repeat: { pattern: '0 0 1 * *' },
        jobId: 'monthly-occupancy-report',
      },
    );

    // Schedule Admin Reports
    await this.propertyQueue.add(
      'generate',
      {},
      {
        repeat: { pattern: '0 0 1 * *' },
        jobId: 'monthly-prop-report',
      },
    );

    await this.leaseQueue.add(
      'generate',
      {},
      {
        repeat: { pattern: '0 0 1 * *' },
        jobId: 'monthly-lease-report',
      },
    );

    await this.financeQueue.add(
      'generate',
      {},
      {
        repeat: { pattern: '0 0 1 * *' },
        jobId: 'monthly-finance-report',
      },
    );

    console.log('BullMQ: Scheduled all monthly administrative reports.');
  }
}
