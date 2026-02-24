import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Module } from '@nestjs/common';
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
  ],
  controllers: [InternalApiController],
  providers: [InternalApiService, InternalApiResolver],
})
export class InternalApiModule {}
