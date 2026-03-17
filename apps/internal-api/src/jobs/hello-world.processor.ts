import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('hello-world')
export class HelloWorldProcessor extends WorkerHost {
  private readonly logger = new Logger(HelloWorldProcessor.name);

  constructor() {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${job.id} with data: ${JSON.stringify(job.data)}`);
    
    // Simulate some work 
    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log(`Job ${job.id} completed! Hello ${job.data.name || 'World'}`);
    console.log(`[BullMQ] Job ${job.id} done!`);

    return {
      status: 'success',
      message: `Hello ${job.data.name || 'World'} from BullMQ!`,
    };
  }
}
