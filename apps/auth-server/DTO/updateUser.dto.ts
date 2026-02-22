import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "./role.enum";

export class UpdateUserDto {
    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly fName?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    readonly lName?: string;

    @ApiProperty()
    @IsOptional()
    @IsEmail()
    readonly email?: string;

    @ApiProperty()
    @IsOptional()
    @IsEnum(Role)
    readonly role?: Role;
}
