import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { Announcement } from './schemas/announcement.schema';

@Injectable()
export class AnnouncementsService {
  private resend: Resend;
  private defaultSender: string;

  constructor(
    @InjectModel('AnnouncementAdmin') private adminModel: Model<Announcement>,
    @InjectModel('AnnouncementStaff') private staffModel: Model<Announcement>,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API'));
    this.defaultSender = 'MavHousing Announcements<announcements@mavhousing.xyz>';
  }

  async createAnnouncement(
    heading: string,
    message: string,
    scope: string,
    scopeValue: string | undefined,
    senderRole: string,
    senderId: number,
    files?: Express.Multer.File[],
  ) {
    // 1. Resolve Emails
    const emails = await this.resolveEmails(scope, scopeValue);
    if (emails.length === 0) {
      throw new BadRequestException(
        'No recipients resolved for the given scope.',
      );
    }

    // 2. Save to Mongo
    const ModelToUse =
      senderRole === 'ADMIN' ? this.adminModel : this.staffModel;
    const newAnnouncement = new ModelToUse({
      heading,
      message,
      scope,
      scopeValue,
      senderRole,
      senderId,
      attachmentNames: files ? files.map((f) => f.originalname) : [],
    });
    await newAnnouncement.save();

    // 3. Send Emails via Resend
    // Format HTML
    const html = `
      <h1>${heading}</h1>
      <p>${message.replace(/\n/g, '<br/>')}</p>
      <hr/>
      <p><small>Sent by MavHousing ${senderRole}</small></p>
    `;

    const attachments = files?.length
      ? files.map((file) => ({
          filename: file.originalname,
          content: file.buffer,
        }))
      : undefined;

    let hasError = false;
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.defaultSender,
        to: emails,
        subject: heading,
        html: html,
        attachments,
      });

      if (error) {
        console.error('Resend API returned an error:', error);
        hasError = true;
      } else {
        console.log('Resend send success, data:', data);
      }
    } catch (error) {
      console.error('Failed to send announcement emails exception', error);
      hasError = true;
    }

    if (hasError) {
      throw new BadRequestException(
        'Failed to deliver announcements through Resend. Check server logs.',
      );
    }

    return newAnnouncement;
  }

  async getAnnouncements(role: string) {
    const ModelToUse = role === 'ADMIN' ? this.adminModel : this.staffModel;
    return ModelToUse.find().sort({ createdAt: -1 }).exec();
  }

  private chunkArray(arr: string[], size: number): string[][] {
    const results: string[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      results.push(arr.slice(i, i + size));
    }
    return results;
  }

  private async resolveEmails(
    scope: string,
    scopeValue?: string,
  ): Promise<string[]> {
    let users: { email: string }[] = [];

    switch (scope) {
      case 'ALL':
        users = await this.prisma.user.findMany({ select: { email: true } });
        break;
      case 'ALL_STUDENTS':
        users = await this.prisma.user.findMany({
          where: { role: 'STUDENT' as any },
          select: { email: true },
        });
        break;
      case 'ALL_STAFF':
        users = await this.prisma.user.findMany({
          where: { role: { in: ['STAFF', 'ADMIN'] as any[] } },
          select: { email: true },
        });
        break;
      case 'PROPERTY':
        if (!scopeValue) throw new BadRequestException('Property ID required');
        users = await this.getOccupantsFilter({
          unit: { propertyId: parseInt(scopeValue, 10) },
        });
        break;
      case 'UNIT':
        if (!scopeValue) throw new BadRequestException('Unit ID required');
        users = await this.getOccupantsFilter({
          unitId: parseInt(scopeValue, 10),
        });
        break;
      case 'ROOM':
        if (!scopeValue) throw new BadRequestException('Room ID required');
        users = await this.getOccupantsFilter({
          roomId: parseInt(scopeValue, 10),
        });
        break;
      case 'BED':
        if (!scopeValue) throw new BadRequestException('Bed ID required');
        users = await this.getOccupantsFilter({
          bedId: parseInt(scopeValue, 10),
        });
        break;
      case 'INDIVIDUAL':
        if (!scopeValue)
          throw new BadRequestException('Email or NetID required');
        users = await this.prisma.user.findMany({
          where: {
            OR: [{ email: scopeValue }, { netId: scopeValue }],
          },
          select: { email: true },
        });
        break;
      default:
        throw new BadRequestException('Invalid scope');
    }

    const emails = users.map((u) => u.email).filter((e) => !!e);
    return [...new Set(emails)];
  }

  private async getOccupantsFilter(assignmentFilter: any) {
    const leases = await this.prisma.lease.findMany({
      where: {
        status: { in: ['SIGNED', 'ACTIVE'] as any },
        assignedUnitId: assignmentFilter.unitId,
        assignedRoomId: assignmentFilter.roomId,
        assignedBedId: assignmentFilter.bedId,
        unit: assignmentFilter.unit,
      },
      include: {
        occupants: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    const users: { email: string }[] = [];
    for (const lease of leases) {
      for (const occ of lease.occupants) {
        if (occ.user && occ.user.email) {
          users.push({ email: occ.user.email });
        }
      }
    }
    return users;
  }
}
