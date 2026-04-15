import { PrismaService } from "../../../../common/prisma/prisma.service";
import { RbacService } from '../rbac/rbac.service';
export declare class PaymentTool {
    private readonly prisma;
    private readonly rbac;
    private readonly logger;
    constructor(prisma: PrismaService, rbac: RbacService);
    getPaymentSummary({ senderEmail, netId }: {
        senderEmail: string;
        netId?: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getPaymentHistory({ senderEmail, netId, limit }: {
        senderEmail: string;
        netId?: string;
        limit?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getPaymentStats({ senderEmail }: {
        senderEmail: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    checkRentStatus({ senderEmail, netId }: {
        senderEmail: string;
        netId?: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
