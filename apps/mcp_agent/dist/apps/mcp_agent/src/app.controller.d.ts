import { AgentService } from './agent/agent.service';
import { GraphqlClientService } from './graphql/graphql-client.service';
export declare class AppController {
    private readonly agentService;
    private readonly graphqlClient;
    private readonly logger;
    constructor(agentService: AgentService, graphqlClient: GraphqlClientService);
    getHealth(): {
        status: string;
        service: string;
        version: string;
        timestamp: string;
        endpoints: {
            swagger: string;
            mcpSse: string;
            webhook: string;
            agentQuery: string;
        };
    };
    getDetailedHealth(): Promise<{
        status: string;
        service: string;
        version: string;
        timestamp: string;
        connections: {
            graphql: string;
            database: string;
        };
    }>;
    agentQuery(body: {
        email: string;
        message: string;
        subject?: string;
    }): Promise<{
        success: boolean;
        from: string;
        query: string;
        response: string;
        timestamp: string;
    }>;
}
