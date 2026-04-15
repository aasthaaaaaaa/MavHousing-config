import { PrismaService } from "../../../../common/prisma/prisma.service";
import { RbacService } from '../rbac/rbac.service';
export declare class LeaseTool {
    private readonly prisma;
    private readonly rbac;
    private readonly logger;
    constructor(prisma: PrismaService, rbac: RbacService);
    private readonly leaseInclude;
    getLeaseInfo({ senderEmail, netId, leaseId }: {
        senderEmail: string;
        netId?: string;
        leaseId?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getAllLeases({ senderEmail, status, limit }: {
        senderEmail: string;
        status?: string;
        limit?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getOccupancy({ senderEmail }: {
        senderEmail: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    private serializeLease;
}
