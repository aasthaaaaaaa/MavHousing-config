import { IsEmail, IsNotEmpty, IsOptional,} from "class-validator"
import { ValidatePassword } from "common/validator/validatePasswordSec.decorator"
export class UserSignup{

    @IsNotEmpty()
    readonly fName:string

    @IsOptional()
    readonly mName:string

    @IsNotEmpty()
    readonly lName:string
    
    @IsEmail()
    @IsNotEmpty()
    readonly email:string

    @IsNotEmpty()
    readonly netId:string
    
    @IsNotEmpty()
    @ValidatePassword() // Custom Decorator that Validates based on UTA Password requirements
    readonly password:string

}