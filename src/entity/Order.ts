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
import { Store } from "./Store";
import { OrderItem } from "./OrderItem";

@ObjectType()
@Entity()
export class Order extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  payment_status!: string;

  @Field()
  @Column()
  order_status!: string;

  @Field()
  @Column()
  store_id!: number;

  @Field(() => Store)
  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: "store_id" })
  store!: Store;

  @Field()
  @Column()
  user_id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Field(() => [OrderItem])
  @OneToMany(() => OrderItem, (order_item) => order_item.order)
  order_items!: OrderItem[];
}
