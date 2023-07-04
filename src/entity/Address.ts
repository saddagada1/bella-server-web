import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, JoinColumn, Column, ManyToOne } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Address extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  first_name!: string;

  @Field()
  @Column()
  last_name!: string;

  @Field()
  @Column()
  line_1!: string;

  @Field()
  @Column()
  line_2!: string;

  @Field()
  @Column()
  city!: string;

  @Field()
  @Column()
  province!: string;

  @Field()
  @Column()
  zip!: string;

  @Field()
  @Column()
  country!: string;

  @Field()
  @Column()
  user_id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.addresses)
  @JoinColumn({ name: "user_id" })
  user!: User;
}
