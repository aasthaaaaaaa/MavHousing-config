import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BulletinService } from './bulletin.service';
import { CreateBulletinDto } from './dto/create-bulletin.dto';
import { BaseAuthGuard } from 'apps/auth-server/src/guards/baseauth.guard';
import { RolesGuard } from 'apps/auth-server/src/guards/RBAC/roles.guard';
import { RoleRequired } from 'apps/auth-server/src/guards/RBAC/roles.decorator';
import { Role } from 'apps/auth-server/DTO/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../housing/upload.service';

@Controller('bulletin')
export class BulletinController {
  constructor(
    private readonly bulletinService: BulletinService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(BaseAuthGuard, RolesGuard)
  @RoleRequired(Role.ADMIN, Role.STAFF)
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateBulletinDto,
    @Request() req: any,
  ) {
    const authorId = req.user.userId;

    let finalContent = dto.content;

    if (dto.type === 'PHOTO') {
      if (!file) {
        throw new HttpException('A photo is required for a PHOTO bulletin.', HttpStatus.BAD_REQUEST);
      }
      finalContent = await this.uploadService.uploadBulletinPhoto(file, authorId);
    } else {
      if (!finalContent) {
        throw new HttpException('Text content is required for a TEXT bulletin.', HttpStatus.BAD_REQUEST);
      }
    }

    // Parse array strings sent via FormData
    const targetPropertyIds = dto.targetPropertyIds ? String(dto.targetPropertyIds).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
    const targetLeaseIds = dto.targetLeaseIds ? String(dto.targetLeaseIds).split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : [];
    const targetPropertyTypes = dto.targetPropertyTypes ? String(dto.targetPropertyTypes).split(',').map(t => t.trim()).filter(Boolean) : [];

    return this.bulletinService.create(authorId, {
      type: dto.type,
      title: dto.title,
      content: finalContent,
      targetType: dto.targetType,
      targetPropertyIds,
      targetLeaseIds,
      targetPropertyTypes,
    });
  }

  @Get()
  @UseGuards(BaseAuthGuard)
  findAll(@Request() req: any) {
    const userId = req.user.userId;
    const role = req.user.role;
    return this.bulletinService.findAllForUser(userId, role);
  }

  @Delete(':id')
  @UseGuards(BaseAuthGuard, RolesGuard)
  @RoleRequired(Role.ADMIN, Role.STAFF)
  remove(@Param('id') id: string) {
    return this.bulletinService.remove(id);
  }
}
