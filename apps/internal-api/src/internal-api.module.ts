import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { InternalApiController } from './internal-api.controller';
import { InternalApiService } from './internal-api.service';
import { InternalApiResolver } from './internal-api.resolver';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AuthServerModule } from '../../auth-server/src/auth-server.module';
import { CommsServerModule } from '../../comms-server/src/comms-server.module';
import { PrismaModule } from '@common/prisma/prisma.module';
import { HousingModule } from './housing/housing.module';
import { LeaseModule } from './lease/lease.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { PaymentModule } from './payment/payment.module';
import { ApplicationModule } from './application/application.module';
import { ChatModule } from './chat/chat.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { BulletinModule } from './bulletin/bulletin.module';
import { HelloWorldProcessor } from './jobs/hello-world.processor';
import { OccupancyReportProcessor } from './jobs/occupancy-report.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    PrismaModule,
    AuthServerModule,
    CommsServerModule,
    HousingModule,
    LeaseModule,
    MaintenanceModule,
    PaymentModule,
    ApplicationModule,
    ChatModule,
    AnnouncementsModule,
    BulletinModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'hello-world' }),
    BullBoardModule.forRoot({
      adapter: ExpressAdapter,
      route: '/queues',
    }),
    BullBoardModule.forFeature(
      { name: 'hello-world', adapter: BullMQAdapter },
      { name: 'occupancy-report', adapter: BullMQAdapter },
    ),
  ],
  controllers: [InternalApiController],
  providers: [
    InternalApiService,
    InternalApiResolver,
    HelloWorldProcessor,
    OccupancyReportProcessor,
  ],
})
export class InternalApiModule {}
