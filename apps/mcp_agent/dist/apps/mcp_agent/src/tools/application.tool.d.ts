import { PrismaService } from "../../../../common/prisma/prisma.service";
import { RbacService } from '../rbac/rbac.service';
export declare class ApplicationTool {
    private readonly prisma;
    private readonly rbac;
    private readonly logger;
    constructor(prisma: PrismaService, rbac: RbacService);
    getApplications({ senderEmail, status, limit }: {
        senderEmail: string;
        status?: string;
        limit?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getApplicationDetails({ senderEmail, appId }: {
        senderEmail: string;
        appId: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
