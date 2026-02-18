import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { InternalApiService } from './internal-api.service';
import { InternalApiResolver } from './internal-api.resolver';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthServerModule } from 'apps/auth-server/src/auth-server.module';
import { CommsServerModule } from 'apps/comms-server/src/comms-server.module';
import { ApplicationModule } from './application/application.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { LeaseModule } from './lease/lease.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true, // required to generate schema in code-first
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const common = {
          type: 'postgres' as const,
          entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
          synchronize: true,
        };

        if (process.env.SQL_DATABASE_URL) {
          return {
            ...common,
            url: process.env.SQL_DATABASE_URL,
          };
        }

        return {
          ...common,
          host: process.env.POSTGRES_HOST ?? 'localhost',
          port: Number(process.env.POSTGRES_PORT) || 5432,
          username: process.env.POSTGRES_USER ?? 'postgres',
          password: process.env.POSTGRES_PASSWORD ?? 'postgres',
          database: process.env.POSTGRES_DB ?? 'mavhousing',
        };
      },
    }),
    AuthServerModule,
    CommsServerModule,
    ApplicationModule,
    MaintenanceModule,
    LeaseModule,
  ],
  providers: [InternalApiService, InternalApiResolver],
})
export class InternalApiModule {}
