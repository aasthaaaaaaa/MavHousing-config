import { AgentService } from '../agent/agent.service';
export declare class EmailWebhookController {
    private readonly agentService;
    private readonly logger;
    constructor(agentService: AgentService);
    handleResendWebhook(body: any): Promise<{
        received: boolean;
        processed: boolean;
        reason: string;
        from?: undefined;
        subject?: undefined;
    } | {
        received: boolean;
        processed: boolean;
        from: any;
        subject: any;
        reason?: undefined;
    }>;
    private stripHtml;
}
