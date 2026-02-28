import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementSchema } from './schemas/announcement.schema';
import { PrismaModule } from '@common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'AnnouncementAdmin',
        schema: AnnouncementSchema,
        collection: 'announcements-admin',
      },
      {
        name: 'AnnouncementStaff',
        schema: AnnouncementSchema,
        collection: 'announcements-staff',
      },
    ]),
    PrismaModule,
    ConfigModule,
  ],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
