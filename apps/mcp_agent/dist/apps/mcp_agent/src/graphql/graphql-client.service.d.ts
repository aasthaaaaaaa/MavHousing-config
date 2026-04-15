import { ConfigService } from '@nestjs/config';
export declare class GraphqlClientService {
    private readonly config;
    private readonly logger;
    private readonly graphqlUrl;
    constructor(config: ConfigService);
    query<T = any>(queryStr: string, variables?: Record<string, any>): Promise<T | null>;
    healthCheck(): Promise<boolean>;
}
