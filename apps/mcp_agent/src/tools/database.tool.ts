import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { RbacContext } from '../rbac/rbac.service';

/**
 * DatabaseTool: A flexible query tool that lets the AI agent
 * run any read-only Prisma query against the MavHousing database.
 *
 * Instead of dozens of rigid tool methods, this single tool
 * accepts a model name, filter, includes, and ordering,
 * then executes it against Prisma and returns the results.
 */
@Injectable()
export class DatabaseTool {
  private readonly logger = new Logger(DatabaseTool.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute a flexible read query against any model.
   */
  async query(params: {
    model: string;
    where?: Record<string, any>;
    include?: Record<string, any>;
    select?: Record<string, any>;
    orderBy?: Record<string, any>;
    take?: number;
    skip?: number;
  }): Promise<{ success: boolean; count: number; data: any }> {
    const { model, where, include, select, orderBy, take, skip } = params;

    const modelName = model.toLowerCase();
    const prismaModel = this.getPrismaModel(modelName);

    if (!prismaModel) {
      return { success: false, count: 0, data: `Unknown model: ${model}` };
    }

    try {
      const queryOptions: any = {};
      if (where) queryOptions.where = where;
      if (include) queryOptions.include = include;
      if (select && !include) queryOptions.select = select;
      if (orderBy) queryOptions.orderBy = orderBy;
      if (take) queryOptions.take = Math.min(take, 50); // cap at 50
      if (skip) queryOptions.skip = skip;

      const results = await prismaModel.findMany(queryOptions);
      this.logger.log(`Query on ${model}: ${results.length} results`);

      return {
        success: true,
        count: results.length,
        data: results,
      };
    } catch (error) {
      this.logger.error(`Query failed on ${model}: ${error}`);
      return { success: false, count: 0, data: `Query error: ${error}` };
    }
  }

  /**
   * Get a single record by ID.
   */
  async findOne(params: {
    model: string;
    where: Record<string, any>;
    include?: Record<string, any>;
  }): Promise<{ success: boolean; data: any }> {
    const prismaModel = this.getPrismaModel(params.model.toLowerCase());

    if (!prismaModel) {
      return { success: false, data: `Unknown model: ${params.model}` };
    }

    try {
      const result = await prismaModel.findFirst({
        where: params.where,
        include: params.include,
      });

      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`FindOne failed on ${params.model}: ${error}`);
      return { success: false, data: `Query error: ${error}` };
    }
  }

  /**
   * Count records matching a filter.
   */
  async count(params: {
    model: string;
    where?: Record<string, any>;
  }): Promise<{ success: boolean; count: number }> {
    const prismaModel = this.getPrismaModel(params.model.toLowerCase());

    if (!prismaModel) {
      return { success: false, count: 0 };
    }

    try {
      const count = await prismaModel.count({ where: params.where || {} });
      return { success: true, count };
    } catch (error) {
      this.logger.error(`Count failed on ${params.model}: ${error}`);
      return { success: false, count: 0 };
    }
  }

  /**
   * Aggregate data (sum, avg, min, max) on a model.
   */
  async aggregate(params: {
    model: string;
    where?: Record<string, any>;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
    _count?: boolean | Record<string, boolean>;
  }): Promise<{ success: boolean; data: any }> {
    const prismaModel = this.getPrismaModel(params.model.toLowerCase());

    if (!prismaModel) {
      return { success: false, data: `Unknown model: ${params.model}` };
    }

    try {
      const aggOptions: any = {};
      if (params.where) aggOptions.where = params.where;
      if (params._sum) aggOptions._sum = params._sum;
      if (params._avg) aggOptions._avg = params._avg;
      if (params._min) aggOptions._min = params._min;
      if (params._max) aggOptions._max = params._max;
      if (params._count) aggOptions._count = params._count;

      const result = await prismaModel.aggregate(aggOptions);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`Aggregate failed on ${params.model}: ${error}`);
      return { success: false, data: `Aggregate error: ${error}` };
    }
  }

  /**
   * Group by a field and aggregate.
   */
  async groupBy(params: {
    model: string;
    by: string[];
    where?: Record<string, any>;
    _count?: boolean | Record<string, boolean>;
    _sum?: Record<string, boolean>;
    orderBy?: Record<string, string>;
  }): Promise<{ success: boolean; data: any }> {
    const prismaModel = this.getPrismaModel(params.model.toLowerCase());

    if (!prismaModel) {
      return { success: false, data: `Unknown model: ${params.model}` };
    }

    try {
      const result = await prismaModel.groupBy({
        by: params.by,
        where: params.where || {},
        _count: params._count || true,
        _sum: params._sum,
        orderBy: params.orderBy,
      });
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`GroupBy failed on ${params.model}: ${error}`);
      return { success: false, data: `GroupBy error: ${error}` };
    }
  }

  /**
   * Map model name to the actual Prisma delegate.
   */
  private getPrismaModel(modelName: string): any {
    const map: Record<string, any> = {
      user: this.prisma.user,
      property: this.prisma.property,
      unit: this.prisma.unit,
      room: this.prisma.room,
      bed: this.prisma.bed,
      application: this.prisma.application,
      lease: this.prisma.lease,
      occupant: this.prisma.occupant,
      payment: this.prisma.payment,
      maintenancerequest: this.prisma.maintenanceRequest,
      maintenancecomment: this.prisma.maintenanceComment,
      chatroom: this.prisma.chatRoom,
      chatmessage: this.prisma.chatMessage,
      readreceipt: this.prisma.readReceipt,
    };
    return map[modelName] || null;
  }
}
