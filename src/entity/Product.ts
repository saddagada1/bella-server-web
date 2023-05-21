import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Product extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => [String])
  @Column("text", { array: true })
  images!: string[];

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column()
  description!: string;

  @Field()
  @Column()
  department!: string;

  @Field()
  @Column()
  category!: string;

  @Field()
  @Column()
  subcategory!: string;

  @Field()
  @Column()
  condition!: string;

  @Field()
  @Column()
  quantity!: number;

  @Field()
  @Column()
  size!: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  designer?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  colour?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  source?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  era?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  style?: string;

  @Field()
  @Column()
  country!: string;

  @Field()
  @Column()
  offer_free_shipping!: boolean;

  @Field()
  @Column()
  shipping_price!: number;

  @Field()
  @Column()
  offer_global_shipping!: boolean;

  @Field()
  @Column()
  global_shipping_price!: number;

  @Field()
  @Column()
  price!: number;

  @Field()
  @Column()
  sold!: boolean;

  @Field()
  @Column()
  creator_id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.products)
  @JoinColumn({ name: "creator_id" })
  creator!: User;

  @Field(() => String)
  @CreateDateColumn()
  created_at: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updated_at: Date;
}
