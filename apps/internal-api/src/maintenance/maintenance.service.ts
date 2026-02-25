import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

@Injectable()
export class MaintenanceService {
  private s3Client: S3Client;

  constructor(private prisma: PrismaService) {
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

  /** Student: submit a new maintenance request */
  async createRequest(
    userId: number,
    leaseId: number,
    data: { category: string; priority: string; description: string },
  ) {
    return this.prisma.maintenanceRequest.create({
      data: {
        createdByUserId: userId,
        leaseId,
        category: data.category as any,
        priority: data.priority as any,
        description: data.description,
        status: 'OPEN',
        updatedAt: new Date(),
      },
    });
  }

  /** Student: view their own requests */
  async getMyRequests(userId: number) {
    return this.prisma.maintenanceRequest.findMany({
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
  }

  /** Staff: view all requests */
  async getAllRequests() {
    return this.prisma.maintenanceRequest.findMany({
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
  }

  async updateRequestStatus(
    requestId: number,
    status: string,
    staffId?: number,
    resolutionReason?: string,
  ) {
    return this.prisma.maintenanceRequest.update({
      where: { requestId },
      data: {
        status: status as any,
        updatedAt: new Date(),
        ...(staffId && { assignedStaffId: staffId }),
        ...(status === 'RESOLVED' && { resolvedAt: new Date(), resolutionReason }),
      },
    });
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
    return this.prisma.maintenanceComment.create({
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
        let key = comment.attachmentUrl;
        if (key.startsWith('http')) {
          key = key.split('/').pop() || key;
        }

        try {
          const command = new GetObjectCommand({
            Bucket: 'maintenance',
            Key: key,
          });
          // Generate a presigned URL valid for 1 hour (3600 seconds)
          comment.attachmentUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
        } catch (error) {
          console.error('Failed to generate presigned URL', error);
        }
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
        console.error('Failed to delete S3 object during comment deletion', error);
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
