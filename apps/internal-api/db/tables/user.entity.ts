import { Column, Entity, Check, PrimaryColumn, Unique } from "typeorm";
import { Role } from "apps/auth-server/DTO/role.enum";
@Entity('users') // Maps this class to the 'users' table in PostgresSQL
@Unique(['netId'])
@Unique(['email'])
@Check(`"uta_id" >= 0000000000 AND "uta_id" <= 9999999999`)
export class User{
    @PrimaryColumn({ type: 'bigint' }) 
    utaId: number;

    @Column({nullable:false})
    netId:string;

    @Column({nullable:false})
    fName: string;

    @Column({nullable:true})
    mName: string;

    @Column({nullable:false})
    lName: string;

    @Column({nullable:false})
    email:string;

    @Column({nullable:false})
    password:string;

    @Column({nullable:true})
    phone:string

    @Column({
        type: 'enum',
        enum: Role,
        default: Role.GUEST,
      })
    role: Role;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}