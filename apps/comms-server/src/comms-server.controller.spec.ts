import { Test, TestingModule } from '@nestjs/testing';
import { CommsServerController } from './comms-server.controller';
import { CommsServerService } from './comms-server.service';

describe('CommsServerController', () => {
  let commsServerController: CommsServerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CommsServerController],
      providers: [CommsServerService],
    }).compile();

    commsServerController = app.get<CommsServerController>(
      CommsServerController,
    );
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(commsServerController.getHello()).toBe('Hello World!');
    });
  });
});
