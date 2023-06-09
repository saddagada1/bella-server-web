import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  BaseEntity,
  OneToMany,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  Column,
} from "typeorm";
import { User } from "./User";
import { CartItem } from "./CartItem";
import { Store } from "./Store";

@ObjectType()
@Entity()
export class Cart extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  store_id!: number;

  @Field(() => Store)
  @ManyToOne(() => Store, (store) => store.carts)
  @JoinColumn({ name: "store_id" })
  store!: Store;

  @Field()
  @Column()
  user_id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.carts)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Field(() => [CartItem])
  @OneToMany(() => CartItem, (cart_item) => cart_item.cart)
  cart_items!: CartItem[];
}
