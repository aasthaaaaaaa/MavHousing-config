import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BulletinController } from './bulletin.controller';
import { BulletinService } from './bulletin.service';
import { BulletinSchema } from './schemas/bulletin.schema';
import { PrismaModule } from '@common/prisma/prisma.module';
import { HousingModule } from '../housing/housing.module';
import { EmailModule } from 'apps/comms-server/src/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Bulletin',
        schema: BulletinSchema,
        collection: 'bulletin-boards',
      },
    ]),
    PrismaModule,
    HousingModule,
    EmailModule,
  ],
  controllers: [BulletinController],
  providers: [BulletinService],
})
export class BulletinModule {}

