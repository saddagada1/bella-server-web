import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  ManyToOne,
  CreateDateColumn,
  BaseEntity,
  PrimaryColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Follow extends BaseEntity {
  @Field()
  @PrimaryColumn()
  id!: number;

  @Field()
  @PrimaryColumn()
  followed_id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.following)
  @JoinColumn({ name: "id" })
  followed_by!: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.followers)
  @JoinColumn({ name: "followed_id" })
  followed_user!: User;

  @Field(() => String)
  @CreateDateColumn()
  created_at: Date;
}
