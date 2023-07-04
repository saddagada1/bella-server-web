import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Follow } from "./Follow";
import { Like } from "./Like";
import { Cart } from "./Cart";
import { Store } from "./Store";
import { Address } from "./Address";
import { Order } from "./Order";

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

  @Field(() => [Cart])
  @OneToMany(() => Cart, (cart) => cart.user)
  carts!: Cart[];

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];

  @Field(() => [Address])
  @OneToMany(() => Address, (address) => address.user)
  addresses!: Address[];

  @Field()
  @Column({ default: false })
  has_store!: boolean;

  @Field(() => Store, { nullable: true })
  @OneToOne(() => Store, (store) => store.user)
  store!: Store;

  @Field(() => [Follow])
  @OneToMany(() => Follow, (follow) => follow.followed_by)
  following!: Follow[];

  @Field(() => [Follow])
  @OneToMany(() => Follow, (follow) => follow.followed_user)
  followers!: Follow[];

  @Field(() => [Like])
  @OneToMany(() => Like, (like) => like.user)
  likes!: Like[];

  @Field(() => String)
  @CreateDateColumn()
  created_at: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updated_at: Date;
}
