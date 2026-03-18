import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bulletin, BulletinTargetType, BulletinType } from './schemas/bulletin.schema';
import { PrismaService } from '@common/prisma/prisma.service';
import { EmailService } from 'apps/comms-server/src/email/email.service';

@Injectable()
export class BulletinService {
  constructor(
    @InjectModel(Bulletin.name) private bulletinModel: Model<Bulletin>,
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(authorId: number, data: any) {
    const createdBulletin = new this.bulletinModel({
      ...data,
      authorId,
    });
    const saved = await createdBulletin.save();

    // Fetch author name for email context
    const author = await this.prisma.user.findUnique({
      where: { userId: authorId },
      select: { fName: true, lName: true },
    });
    const authorName = author ? `${author.fName} ${author.lName}` : 'Housing Staff';

    // Fire-and-forget: notify targeted students
    this.notifyTargetedStudents(saved, authorName).catch((err) =>
      console.error('[BulletinService] Failed to send bulletin emails:', err),
    );

    return saved;
  }

  private async notifyTargetedStudents(bulletin: any, authorName: string) {
    let students: { email: string; fName: string }[] = [];

    if (bulletin.targetType === BulletinTargetType.ALL) {
      students = await this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { email: true, fName: true },
      });
    } else if (bulletin.targetType === BulletinTargetType.PROPERTY && bulletin.targetPropertyIds?.length) {
      const leases = await this.prisma.lease.findMany({
        where: {
          unit: { propertyId: { in: bulletin.targetPropertyIds } },
          status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any },
        },
        include: { user: { select: { email: true, fName: true } } },
      });
      students = leases.map((l) => l.user).filter(Boolean) as any;
    } else if (bulletin.targetType === BulletinTargetType.LEASE && bulletin.targetLeaseIds?.length) {
      const leases = await this.prisma.lease.findMany({
        where: { leaseId: { in: bulletin.targetLeaseIds } },
        include: { user: { select: { email: true, fName: true } } },
      });
      students = leases.map((l) => l.user).filter(Boolean) as any;
    } else if (bulletin.targetType === BulletinTargetType.PROPERTY_TYPE && bulletin.targetPropertyTypes?.length) {
      const leases = await this.prisma.lease.findMany({
        where: {
          unit: { property: { propertyType: { in: bulletin.targetPropertyTypes } } },
          status: { in: ['SIGNED', 'ACTIVE', 'PENDING_SIGNATURE'] as any },
        },
        include: { user: { select: { email: true, fName: true } } },
      });
      students = leases.map((l) => l.user).filter(Boolean) as any;
    }

    // Deduplicate by email
    const unique = [...new Map(students.map((s) => [s.email, s])).values()];

    await Promise.allSettled(
      unique.map((s) =>
        this.emailService.sendTemplateEmail(
          'bulletinPosted',
          s.email,
          s.fName,
          authorName,
        ),
      ),
    );
  }

  async findAllForUser(userId: number, role: string) {
    const userRoleLower = role.toLowerCase();

    let bulletins: any[] = [];

    // Admins and staff can view all bulletins
    if (userRoleLower === 'admin' || userRoleLower === 'staff' || userRoleLower === 'management' || userRoleLower === 'resident_a' || userRoleLower === 'maintenance') {
      bulletins = await this.bulletinModel.find().sort({ createdAt: -1 }).exec();
    } else {
      // Students only see bulletins targeting ALL, or targeting their active properties, active leases, or specific property types
      const userLeases = await this.prisma.lease.findMany({
        where: { userId },
        include: {
          unit: {
            select: { propertyId: true },
          },
        },
      });

      const activeLeaseIds = userLeases.map((l) => l.leaseId);
      const activePropertyIds = userLeases
        .map((l) => l.unit?.propertyId)
        .filter((id) => id != null) as number[];

      // We need to also know the PropertyTypes for the properties they are in
      const properties = await this.prisma.property.findMany({
        where: { propertyId: { in: activePropertyIds } },
        select: { propertyType: true },
      });
      const activePropertyTypes = properties.map((p) => p.propertyType);

      bulletins = await this.bulletinModel.find({
        $or: [
          { targetType: BulletinTargetType.ALL },
          { 
            targetType: BulletinTargetType.PROPERTY, 
            targetPropertyIds: { $in: Array.from(activePropertyIds) } 
          },
          { 
            targetType: BulletinTargetType.LEASE, 
            targetLeaseIds: { $in: Array.from(activeLeaseIds) } 
          },
          { 
            targetType: BulletinTargetType.PROPERTY_TYPE, 
            targetPropertyTypes: { $in: Array.from(activePropertyTypes) } 
          },
        ]
      }).sort({ createdAt: -1 }).exec();
    }

    // Populate the author information manually using Prisma
    const authorIds = [...new Set(bulletins.map((b) => b.authorId))].filter(Boolean);
    const authors = await this.prisma.user.findMany({
      where: { userId: { in: authorIds } },
      select: { userId: true, fName: true, lName: true },
    });
    
    const authorMap = new Map(authors.map((a) => [a.userId, a]));

    return bulletins.map((b) => {
      const doc = b.toObject();
      doc.author = authorMap.get(doc.authorId) || null;
      return doc;
    });
  }

  async remove(id: string) {
    const deletedBulletin = await this.bulletinModel.findByIdAndDelete(id).exec();
    if (!deletedBulletin) {
      throw new NotFoundException(`Bulletin #${id} not found`);
    }
    return deletedBulletin;
  }
}

