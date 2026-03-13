import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bulletin, BulletinTargetType, BulletinType } from './schemas/bulletin.schema';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class BulletinService {
  constructor(
    @InjectModel(Bulletin.name) private bulletinModel: Model<Bulletin>,
    private prisma: PrismaService,
  ) {}

  async create(authorId: number, data: any) {
    const createdBulletin = new this.bulletinModel({
      ...data,
      authorId,
    });
    return createdBulletin.save();
  }

  async findAllForUser(userId: number, role: string) {
    const userRoleLower = role.toLowerCase();

    // Admins and staff can view all bulletins
    if (userRoleLower === 'admin' || userRoleLower === 'staff' || userRoleLower === 'management' || userRoleLower === 'resident_a' || userRoleLower === 'maintenance') {
      return this.bulletinModel.find().sort({ createdAt: -1 }).exec();
    }

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

    return this.bulletinModel.find({
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

  async remove(id: string) {
    const deletedBulletin = await this.bulletinModel.findByIdAndDelete(id).exec();
    if (!deletedBulletin) {
      throw new NotFoundException(`Bulletin #${id} not found`);
    }
    return deletedBulletin;
  }
}
