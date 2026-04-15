import { PrismaService } from "../../../../common/prisma/prisma.service";
import { RbacService } from '../rbac/rbac.service';
export declare class MaintenanceTool {
    private readonly prisma;
    private readonly rbac;
    private readonly logger;
    constructor(prisma: PrismaService, rbac: RbacService);
    getMaintenanceRequests({ senderEmail, status, category, limit, }: {
        senderEmail: string;
        status?: string;
        category?: string;
        limit?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getMaintenanceDetails({ senderEmail, requestId }: {
        senderEmail: string;
        requestId: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
