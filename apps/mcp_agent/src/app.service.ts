import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): string {
    return 'MavHousing MCP Agent is running!';
  }
}
