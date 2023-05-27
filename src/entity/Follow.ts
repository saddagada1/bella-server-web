import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  ManyToOne,
  CreateDateColumn,
  BaseEntity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Follow extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @PrimaryColumn()
  followed_by_id!: number;

  @Field()
  @PrimaryColumn()
  followed_id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.following)
  @JoinColumn({ name: "followed_by_id" })
  followed_by!: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.followers)
  @JoinColumn({ name: "followed_id" })
  followed_user!: User;

  @Field(() => String)
  @CreateDateColumn()
  created_at: Date;
}
