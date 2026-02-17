import { PartialType } from '@nestjs/swagger';
import {
    CreateApplication_By_Unit_DTO,
    CreateApplication_By_Room_DTO,
    CreateApplication_By_Bed_DTO,
} from './create-application.dto';

export class UpdateApplication_By_Unit_DTO extends PartialType(CreateApplication_By_Unit_DTO) {}

export class UpdateApplication_By_Room_DTO extends PartialType(CreateApplication_By_Room_DTO) {}

export class UpdateApplication_By_Bed_DTO extends PartialType(CreateApplication_By_Bed_DTO) {}
