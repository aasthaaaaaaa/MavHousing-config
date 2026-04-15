import { PrismaService } from "../../../../common/prisma/prisma.service";
export interface RbacContext {
    userId: number;
    netId: string;
    email: string;
    role: 'ADMIN' | 'STAFF' | 'STUDENT' | 'DRAFT';
    fName: string;
    lName: string;
    assignedPropertyId: number | null;
    staffPosition: string | null;
}
export declare class RbacService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    identifyByEmail(email: string): Promise<RbacContext | null>;
    canAccessUser(ctx: RbacContext, targetUserId: number): boolean;
    isAdmin(ctx: RbacContext): boolean;
    isStaffOrAbove(ctx: RbacContext): boolean;
    getLeaseFilter(ctx: RbacContext): any;
    getMaintenanceFilter(ctx: RbacContext): any;
    getPaymentFilter(ctx: RbacContext): any;
    getApplicationFilter(ctx: RbacContext): any;
}
