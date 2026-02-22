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
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
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
    ChatModule,
  ],
  controllers: [InternalApiController],
  providers: [InternalApiService, InternalApiResolver],
})
export class InternalApiModule {}
