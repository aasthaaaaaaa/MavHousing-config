import { PrismaService } from "../../../../common/prisma/prisma.service";
import { RbacService } from '../rbac/rbac.service';
export declare class HousingTool {
    private readonly prisma;
    private readonly rbac;
    private readonly logger;
    constructor(prisma: PrismaService, rbac: RbacService);
    getProperties({ senderEmail }: {
        senderEmail: string;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getAvailability({ senderEmail, propertyId }: {
        senderEmail: string;
        propertyId?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
    getPropertyHierarchy({ senderEmail, propertyId }: {
        senderEmail: string;
        propertyId?: number;
    }): Promise<{
        content: {
            type: "text";
            text: string;
        }[];
    }>;
}
