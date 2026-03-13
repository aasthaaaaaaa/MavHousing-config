import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BulletinController } from './bulletin.controller';
import { BulletinService } from './bulletin.service';
import { BulletinSchema } from './schemas/bulletin.schema';
import { PrismaModule } from '@common/prisma/prisma.module';
import { HousingModule } from '../housing/housing.module';

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
  ],
  controllers: [BulletinController],
  providers: [BulletinService],
})
export class BulletinModule {}
