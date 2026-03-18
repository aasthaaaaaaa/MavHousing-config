import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { EmailService } from 'apps/comms-server/src/email/email.service';

@Injectable()
export class MaintenanceService {
  private s3Client: S3Client;

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R3_API,
      credentials: {
        accessKeyId: process.env.R3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R3_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /** Student: get their active lease (needed to auto-populate leaseId) */
  async getActiveLease(userId: number) {
    return this.prisma.lease.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { leaseId: true, status: true },
    });
  }

  /** Helper to generate a pre-signed URL ensuring reliable key parsing */
  private async generateSignedUrl(urlOrKey: string): Promise<string> {
    if (!urlOrKey) return '';
    let key = urlOrKey;
    if (key.startsWith('http')) {
      try {
        const urlObj = new URL(key);
        // Extracts whatever is after the last slash in the pathname
        key = urlObj.pathname.split('/').pop() || key;
      } catch {
        key = key.split('/').pop() || key; // fallback
      }
    }
    try {
      const command = new GetObjectCommand({
        Bucket: 'maintenance',
        Key: key,
      });
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 * 24 });
    } catch {
      return urlOrKey; // Return original if failure
    }
  }

  /** Student: submit a new maintenance request */
  async createRequest(
    userId: number,
    leaseId: number,
    data: { category: string; priority: string; description: string; location?: string; attachments?: string[] },
  ) {
    return this.prisma.maintenanceRequest.create({
      data: {
        createdByUserId: userId,
        leaseId,
        category: data.category as any,
        priority: data.priority as any,
        description: data.description,
        location: data.location || null,
        attachments: data.attachments || [],
        status: 'OPEN',
        updatedAt: new Date(),
      },
    });
  }

  /** Student: view their own requests */
  async getMyRequests(userId: number) {
    const requests = await this.prisma.maintenanceRequest.findMany({
      where: { createdByUserId: userId },
      include: {
        assignedStaff: {
          select: { fName: true, lName: true },
        },
        lease: {
          include: {
            unit: { include: { property: true } },
            room: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    for (const req of requests) {
      if (req.attachments && req.attachments.length > 0) {
        req.attachments = await Promise.all(
          req.attachments.map(url => this.generateSignedUrl(url))
        );
      }
    }
    
    return requests;
  }

  /** Staff: view all requests */
  async getAllRequests(propertyId?: number) {
    const whereClause: any = {};
    
    if (propertyId) {
      whereClause.lease = {
        unit: {
          propertyId: propertyId,
        },
      };
    }

    const requests = await this.prisma.maintenanceRequest.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: { netId: true, fName: true, lName: true, email: true },
        },
        assignedStaff: {
          select: { userId: true, fName: true, lName: true },
        },
        lease: {
          include: {
            unit: { include: { property: true } },
            room: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const req of requests) {
      if (req.attachments && req.attachments.length > 0) {
        req.attachments = await Promise.all(
          req.attachments.map(url => this.generateSignedUrl(url))
        );
      }
    }
    
    return requests;
  }

  async updateRequestStatus(
    requestId: number,
    status: string,
    staffId?: number,
    resolutionReason?: string,
  ) {
    const updated = await this.prisma.maintenanceRequest.update({
      where: { requestId },
      data: {
        status: status as any,
        updatedAt: new Date(),
        ...(staffId && { assignedStaffId: staffId }),
        ...(status === 'RESOLVED' && {
          resolvedAt: new Date(),
          resolutionReason,
        }),
      },
      include: {
        createdBy: { select: { email: true, fName: true } },
        lease: { include: { unit: { include: { property: true } } } },
      },
    });

    // Fire-and-forget: notify the student of status change
    const user = updated.createdBy;
    if (user) {
      const propertyName = updated.lease?.unit?.property?.name;
      const context = propertyName ? `Property: ${propertyName}` : undefined;

      if (status === 'OPEN') {
        this.emailService
          .sendTemplateEmail('maintenanceOpened', user.email, user.fName, context)
          .catch((e) => console.error('[MaintenanceService] Failed to send maintenanceOpened email:', e));
      } else if (status === 'RESOLVED' || status === 'CLOSED') {
        this.emailService
          .sendTemplateEmail('maintenanceClosed', user.email, user.fName, resolutionReason || context)
          .catch((e) => console.error('[MaintenanceService] Failed to send maintenanceClosed email:', e));
      }
    }

    return updated;
  }

  /** Staff: get list of staff users for assignment */
  async getStaffList() {
    return this.prisma.user.findMany({
      where: { role: 'STAFF' },
      select: { userId: true, fName: true, lName: true, netId: true },
    });
  }

  /** Common: Upload attachment to Cloudflare R2 */
  async uploadAttachment(file: Express.Multer.File): Promise<string> {
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must be < 10MB');
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${randomUUID()}.${fileExt}`;
    const bucketName = 'maintenance';

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      // Return just the file name (key) to store in the database
      return fileName;
    } catch (error) {
      console.error('S3 Upload Error:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /** Common: Leave a comment on a request */
  async createComment(
    requestId: number,
    userId: number,
    content?: string,
    attachmentUrl?: string,
  ) {
    const comment = await this.prisma.maintenanceComment.create({
      data: {
        requestId,
        userId,
        content,
        attachmentUrl,
      },
      include: {
        user: { select: { fName: true, lName: true } },
      },
    });

    // Fire-and-forget: notify the request creator about the new comment
    this.prisma.maintenanceRequest
      .findUnique({
        where: { requestId },
        include: { createdBy: { select: { email: true, fName: true } } },
      })
      .then((req) => {
        const creator = req?.createdBy;
        // Only email if the commenter is NOT the creator (staff commenting on student's request)
        if (creator && creator.email) {
          const commenterName = comment.user
            ? `${comment.user.fName} ${comment.user.lName}`
            : 'Housing Staff';
          const preview = content ? (content.length > 80 ? content.slice(0, 80) + '…' : content) : undefined;
          const ctx = preview ? `${commenterName}: "${preview}"` : undefined;
          this.emailService
            .sendTemplateEmail('maintenanceCommentAdded', creator.email, creator.fName, ctx)
            .catch((e) => console.error('[MaintenanceService] Failed to send comment email:', e));
        }
      })
      .catch((e) => console.error('[MaintenanceService] Failed to fetch request for comment email:', e));

    return comment;
  }

  /** Common: Get comments for a request */
  async getComments(requestId: number) {
    const comments = await this.prisma.maintenanceComment.findMany({
      where: { requestId },
      include: {
        user: { select: { fName: true, lName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    for (const comment of comments) {
      if (comment.attachmentUrl) {
        comment.attachmentUrl = await this.generateSignedUrl(comment.attachmentUrl);
      }
    }

    return comments;
  }

  /** Common: Delete a comment (Soft delete + remove S3 object) */
  async deleteComment(commentId: string) {
    const comment = await this.prisma.maintenanceComment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new BadRequestException('Comment not found');
    }

    if (comment.attachmentUrl) {
      let key = comment.attachmentUrl;
      if (key.startsWith('http')) {
        key = key.split('/').pop() || key;
      }
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: 'maintenance',
            Key: key,
          }),
        );
      } catch (error) {
        console.error(
          'Failed to delete S3 object during comment deletion',
          error,
        );
      }
    }

    return this.prisma.maintenanceComment.update({
      where: { id: commentId },
      data: {
        content: '[DELETED COMMENT]',
        attachmentUrl: null,
      },
    });
  }
}
