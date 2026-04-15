import { RbacService } from '../rbac/rbac.service';
import { ConfigService } from '@nestjs/config';
export declare class ReportsTool {
    private readonly rbac;
    private readonly config;
    private readonly logger;
    constructor(rbac: RbacService, config: ConfigService);
    private get internalApiUrl();
    generateReport({ senderEmail, reportType, netId, sortBy, }: {
        senderEmail: string;
        reportType: string;
        netId?: string;
        sortBy?: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getReportTypes({ senderEmail }: {
        senderEmail: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
