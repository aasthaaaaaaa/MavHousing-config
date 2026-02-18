import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LeaseService } from './lease.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';

@Controller('lease')
export class LeaseController {
  constructor(private readonly leaseService: LeaseService) {}

  @Post()
  create(@Body() createLeaseDto: CreateLeaseDto) {
    return this.leaseService.create(createLeaseDto);
  }

  @Get()
  findAll() {
    return this.leaseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leaseService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeaseDto: UpdateLeaseDto) {
    return this.leaseService.update(+id, updateLeaseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leaseService.remove(+id);
  }
}
