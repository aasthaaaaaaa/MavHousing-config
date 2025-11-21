import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@ObjectType()
@Entity({ name: 'users' })
export class User {
  @Field(() => Int)
  @PrimaryGeneratedColumn({ name: 'user_id' })
  user_id: number;

  @Field({ nullable: true })
  @Column({ name: 'first_name', nullable: true })
  first_name?: string;

  @Field({ nullable: true })
  @Column({ name: 'last_name', nullable: true })
  last_name?: string;

  @Field({ nullable: true })
  @Column({ unique: true, nullable: true })
  email?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  @Column({ name: 'uta_id', unique: true, nullable: true })
  uta_id?: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  role?: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
