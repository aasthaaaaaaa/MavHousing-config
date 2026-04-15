import { PrismaService } from "../../../../common/prisma/prisma.service";
import { RbacService } from '../rbac/rbac.service';
export declare class UserTool {
    private readonly prisma;
    private readonly rbac;
    private readonly logger;
    constructor(prisma: PrismaService, rbac: RbacService);
    lookupUser({ senderEmail, netId, utaId, email }: {
        senderEmail: string;
        netId?: string;
        utaId?: string;
        email?: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    listUsers({ senderEmail, role, limit }: {
        senderEmail: string;
        role?: string;
        limit?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
