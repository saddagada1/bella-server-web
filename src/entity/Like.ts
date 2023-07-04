import { Field, ObjectType } from "type-graphql";
import {
  Entity,
  ManyToOne,
  BaseEntity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Product } from "./Product";

@ObjectType()
@Entity()
export class Like extends BaseEntity {
  @Field()
  @PrimaryColumn()
  id!: number;

  @Field()
  @PrimaryColumn()
  product_id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.likes)
  @JoinColumn({ name: "id" })
  user!: User;

  @Field(() => Product)
  @ManyToOne(() => Product, (product) => product.likes)
  @JoinColumn({ name: "product_id" })
  product!: Product;
}
