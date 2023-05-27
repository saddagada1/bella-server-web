import { Field, ObjectType } from "type-graphql";
import { Entity, BaseEntity, PrimaryGeneratedColumn, JoinColumn, ManyToOne, Column } from "typeorm";
import { Product } from "./Product";
import { Cart } from "./Cart";

@ObjectType()
@Entity()
export class CartItem extends BaseEntity {
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
  @Column()
  name!: string;

  @Field(() => [String])
  @Column("text", { array: true })
  images!: string[];

  @Field()
  @Column()
  product_id!: number;

  @Field(() => Product)
  @ManyToOne(() => Product, (product) => product.cart_items)
  @JoinColumn({ name: "product_id" })
  product!: Product;

  @Field()
  @Column()
  cart_id!: number;

  @Field(() => Cart)
  @ManyToOne(() => Cart, (cart) => cart.cart_items)
  @JoinColumn({ name: "cart_id" })
  cart!: Cart;
}
