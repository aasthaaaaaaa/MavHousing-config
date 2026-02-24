import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "./role.enum";

export class UpdateUserDto {
    @ApiProperty()
    @IsOptional()
    @IsEmail()
    readonly email?: string;

    @ApiProperty()
    @IsOptional()
    @IsEnum(Role)
    readonly role?: Role;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly gender?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly studentStatus?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly staffPosition?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly requiresAdaAccess?: boolean;
}

