import { Product } from "../entity/Product";
import { Resolver, Query, Arg, Mutation, Ctx, UseMiddleware, InputType, Field } from "type-graphql";
import { S3Client } from "@aws-sdk/client-s3";
import { MyContext } from "../utils/types";
import { isAuth } from "../middleware/isAuth";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_REGION,
});

@InputType()
class CreateProductInput {
  @Field()
  name!: string;
  @Field()
  description!: string;
  @Field()
  department!: string;
  @Field()
  category!: string;
  @Field()
  subcategory!: string;
  @Field()
  condition!: string;
  @Field()
  quantity!: number;
  @Field({ nullable: true })
  size?: string;
  @Field({ nullable: true })
  designer?: string;
  @Field({ nullable: true })
  colour?: string;
  @Field({ nullable: true })
  source?: string;
  @Field({ nullable: true })
  era?: string;
  @Field({ nullable: true })
  style?: string;
  @Field()
  country!: string;
  @Field()
  offer_free_shipping!: boolean;
  @Field()
  shipping_price!: number;
  @Field()
  offer_global_shipping!: boolean;
  @Field()
  global_shipping_price!: number;
  @Field()
  price!: number;
}

@Resolver()
export class ProductResolver {
  @Query(() => [Product])
  Products(): Promise<Product[]> {
    return Product.find();
  }

  @Query(() => Product, { nullable: true })
  Product(@Arg("id") id: number): Promise<Product | null> {
    return Product.findOne({ where: { id: id } });
  }

  @Mutation(() => Product)
  @UseMiddleware(isAuth)
  async createProduct(@Arg("ProductInput") ProductInput: CreateProductInput, @Ctx() { user_payload }: MyContext): Promise<Product> {
    return Product.create({
      ...ProductInput,
    }).save();
  }

  // @Mutation(() => Product, {nullable: true})
  // async updateProduct(
  //     @Arg('id') _id: number,
  //     @Arg('name', () => String, {nullable: true}) name: string
  // ): Promise<Product | null> {
  //     const Product = await Product.findOne({where: {_id: _id}})
  //     if(!Product) {
  //         return null;
  //     }
  //     if(typeof name !== undefined) {
  //         await Product.update({_id}, {name});
  //     }
  //     return Product
  // }

  // @Mutation(() => Boolean)
  // async deleteProduct(
  //     @Arg('id') _id: number
  // ): Promise<Boolean> {
  //     await Product.delete(_id);
  //     return true;
  // }
}
