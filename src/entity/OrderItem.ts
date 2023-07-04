import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, JoinColumn, ManyToOne, Column } from "typeorm";
import { Product } from "./Product";
import { Order } from "./Order";

@ObjectType()
@Entity()
export class OrderItem extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column()
  price!: number;

  @Field()
  @Column()
  shipping_price!: number;

  @Field()
  @Column({ default: 1 })
  quantity!: number;

  @Field()
  @Column()
  name!: string;

  @Field(() => [String])
  @Column("text", { array: true })
  images!: string[];

  @Field()
  @Column()
  product_id!: number;

  @Field(() => Product)
  @ManyToOne(() => Product, (product) => product.order_items)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Field()
  @Column()
  order_id!: number;

  @Field(() => Order)
  @ManyToOne(() => Order, (order) => order.order_items)
  @JoinColumn({ name: "order_id" })
  order!: Order;
}
