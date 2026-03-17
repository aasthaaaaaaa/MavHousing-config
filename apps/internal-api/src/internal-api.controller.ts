import { Controller, Get, Post, Body } from '@nestjs/common';
import { InternalApiService } from './internal-api.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller()
export class InternalApiController {
  constructor(
    private readonly internalApiService: InternalApiService,
    @InjectQueue('hello-world') private readonly helloWorldQueue: Queue,
  ) {}

  @Get()
  getHello(): string {
    return this.internalApiService.getHello();
  }

  @Post('trigger-job')
  async triggerJob(@Body() data: { name?: string }) {
    const job = await this.helloWorldQueue.add('hello-job', {
      name: data.name || 'World',
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Job added to queue',
      jobId: job.id,
    };
  }
}
