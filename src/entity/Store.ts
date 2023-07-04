import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  BaseEntity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
  Column,
} from "typeorm";
import { User } from "./User";
import { Product } from "./Product";
import { Cart } from "./Cart";
import { Order } from "./Order";

@ObjectType()
@Entity()
export class Store extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  stripe_account_id!: string;

  @Field()
  @Column({ default: false })
  stripe_setup!: boolean;

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
  @OneToOne(() => User, (user) => user.store)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Field(() => [Order])
  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];

  @Field(() => [Cart])
  @OneToMany(() => Cart, (cart) => cart.store)
  carts: Cart[];

  @Field(() => [Product])
  @OneToMany(() => Product, (product) => product.store)
  products!: Product[];
}
