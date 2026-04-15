import { RbacService } from '../rbac/rbac.service';
import { ConfigService } from '@nestjs/config';
export declare class EmailTool {
    private readonly rbac;
    private readonly config;
    private readonly logger;
    private resend;
    private defaultSender;
    constructor(rbac: RbacService, config: ConfigService);
    private get commsServerUrl();
    sendEmail({ senderEmail, to, template, subject, body, firstName, context, }: {
        senderEmail: string;
        to: string;
        template?: string;
        subject?: string;
        body?: string;
        firstName?: string;
        context?: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    listEmailTemplates({ senderEmail }: {
        senderEmail: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
