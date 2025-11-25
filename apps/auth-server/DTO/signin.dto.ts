import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class UserSignIn{

    @ApiProperty()
    @IsString()
    readonly netId:string
    
    @ApiProperty()
    @IsString()
    readonly password:string
}