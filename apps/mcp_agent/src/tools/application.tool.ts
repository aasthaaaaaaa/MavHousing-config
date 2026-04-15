import { Injectable, Logger } from '@nestjs/common';
import { Tool } from '@rekog/mcp-nest';
import { z } from 'zod';
import { PrismaService } from '@common/prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class ApplicationTool {
  private readonly logger = new Logger(ApplicationTool.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  @Tool({
    name: 'get_applications',
    description:
      'Get housing applications. STUDENT: own applications only. STAFF: applications for assigned property. ADMIN: all.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      status: z.string().optional().describe('Filter by status: DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CANCELLED'),
      limit: z.number().optional().default(25).describe('Max results'),
    }),
  })
  async getApplications({ senderEmail, status, limit }: { senderEmail: string; status?: string; limit?: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const whereClause: any = this.rbac.getApplicationFilter(ctx);
    if (status) whereClause.status = status.toUpperCase();

    const applications = await this.prisma.application.findMany({
      where: whereClause,
      include: {
        user: { select: { userId: true, netId: true, fName: true, lName: true, email: true } },
        preferredProperty: {
          select: { propertyId: true, name: true, propertyType: true, leaseType: true },
        },
      },
      take: limit || 25,
      orderBy: { createdAt: 'desc' },
    });

    const result = applications.map((a) => ({
      appId: a.appId,
      status: a.status,
      term: a.term,
      submissionDate: a.submissionDate,
      applicant: a.user
        ? `${a.user.fName} ${a.user.lName} (${a.user.netId})`
        : 'Unknown',
      preferredProperty: a.preferredProperty?.name || 'None specified',
      leaseType: a.preferredProperty?.leaseType || 'N/A',
    }));

    return {
      content: [{
        type: 'text' as const,
        text: `${result.length} application(s):\n${JSON.stringify(result, null, 2)}`,
      }],
    };
  }

  @Tool({
    name: 'get_application_details',
    description: 'Get detailed view of a specific application. RBAC checked.',
    parameters: z.object({
      senderEmail: z.string().describe('Email of the person making the request'),
      appId: z.number().describe('Application ID to look up'),
    }),
  })
  async getApplicationDetails({ senderEmail, appId }: { senderEmail: string; appId: number }) {
    const ctx = await this.rbac.identifyByEmail(senderEmail);
    if (!ctx) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied.' }] };
    }

    const app = await this.prisma.application.findUnique({
      where: { appId },
      include: {
        user: {
          select: {
            userId: true, netId: true, utaId: true, fName: true, lName: true,
            email: true, gender: true, requiresAdaAccess: true,
          },
        },
        preferredProperty: true,
      },
    });

    if (!app) {
      return { content: [{ type: 'text' as const, text: 'Application not found.' }] };
    }

    // RBAC: student can only see own applications
    if (ctx.role === 'STUDENT' && app.userId !== ctx.userId) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: You can only view your own applications.' }] };
    }

    // STAFF: only applications for their property
    if (ctx.role === 'STAFF' && ctx.assignedPropertyId && app.preferredPropertyId !== ctx.assignedPropertyId) {
      return { content: [{ type: 'text' as const, text: '❌ Access Denied: This application is not for your property.' }] };
    }

    const detail = {
      appId: app.appId,
      status: app.status,
      term: app.term,
      submissionDate: app.submissionDate,
      createdAt: app.createdAt,
      applicant: app.user,
      preferredProperty: app.preferredProperty
        ? { name: app.preferredProperty.name, type: app.preferredProperty.propertyType, leaseType: app.preferredProperty.leaseType }
        : null,
      preferences: {
        sleepSchedule: app.sleepSchedule,
        cleanliness: app.cleanliness,
        noiseLevel: app.noiseLevel,
        smokingPreference: app.smokingPreference,
        dietaryRestrictions: app.dietaryRestrictions,
        specialAccommodations: app.specialAccommodations,
      },
      emergencyContact: {
        name: app.emergencyContactName,
        phone: app.emergencyContactPhone,
        relation: app.emergencyContactRelation,
      },
    };

    return { content: [{ type: 'text' as const, text: JSON.stringify(detail, null, 2) }] };
  }
}
