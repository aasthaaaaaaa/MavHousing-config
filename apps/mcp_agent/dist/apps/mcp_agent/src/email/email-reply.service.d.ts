import { ConfigService } from '@nestjs/config';
export declare class EmailReplyService {
    private readonly config;
    private readonly logger;
    private resend;
    private defaultSender;
    constructor(config: ConfigService);
    replyToSender(to: string, subject: string, content: string): Promise<boolean>;
    sendAccessDenied(to: string, originalSubject: string): Promise<void>;
    private formatReplyHtml;
    formatToolResults(results: any[]): string;
    private formatObjectAsCard;
    private formatArrayAsTable;
}
