import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ default: false })
  verified!: boolean;

  @Field()
  @Column({ default: false })
  oauth_user!: boolean;

  @Field()
  @Column("citext", { unique: true })
  email!: string;

  @Field()
  @Column("citext", { unique: true })
  username!: string;

  @Column({ nullable: true })
  password?: string;

  @Field()
  @Column({ default: 0 })
  token_version!: number;

  @Field()
  @Column()
  first_name!: string;

  @Field()
  @Column()
  last_name!: string;

  @Field()
  @Column({ default: "" })
  bio!: string;

  @Field()
  @Column({ default: "" })
  country!: string;

  @Field(() => String)
  @CreateDateColumn()
  created_at: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updated_at: Date;
}
