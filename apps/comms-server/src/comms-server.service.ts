import { Injectable } from '@nestjs/common';

@Injectable()
export class CommsServerService {
  getHello(): string {
    return 'OK! (comms-server)';
  }
}
