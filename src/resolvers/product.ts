import { Product } from "../entity/Product";
import {
  Resolver,
  Query,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
  InputType,
  Field,
  ObjectType,
} from "type-graphql";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MyContext } from "../utils/types";
import { isAuth } from "../middleware/isAuth";
import { randomBytes } from "../utils/rand";

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  region: process.env.S3_REGION!,
});

@InputType()
class CreateProductInput {
  @Field()
  num_of_images!: number;
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

@ObjectType()
class CreateProductResponse {
  @Field()
  id: number;
  @Field(() => [String])
  upload_urls: string[];
}

@Resolver()
export class ProductResolver {
  @Query(() => [Product])
  Products(): Promise<Product[]> {
    return Product.find();
  }

  @Query(() => Product)
  async Product(@Arg("id") id: number): Promise<Product> {
    const product = await Product.findOne({ where: { id: id }, relations: { creator: true } });
    if (!product) {
      throw new Error("Product Not Found");
    }
    const get_params = product.images.map((name) => ({
      Bucket: process.env.S3_NAME!,
      Key: name,
    }));
    const get_commands = get_params.map((params) => new GetObjectCommand(params));
    const get_signed_urls = get_commands.map(
      async (command) => await getSignedUrl(s3, command, { expiresIn: 3600 })
    );
    product.images = await Promise.all(get_signed_urls);

    return product;
  }

  @Query(() => [Product])
  async userProducts(@Arg("user_id") user_id: number): Promise<Product[]> {
    const products = await Product.find({
      where: { creator_id: user_id },
    });

    for (const product of products) {
      const get_params = product.images.map((name) => ({
        Bucket: process.env.S3_NAME!,
        Key: name,
      }));
      const get_commands = get_params.map((params) => new GetObjectCommand(params));
      const get_signed_urls = get_commands.map(
        async (command) => await getSignedUrl(s3, command, { expiresIn: 3600 })
      );
      product.images = await Promise.all(get_signed_urls);
    }

    return products;
  }

  @Mutation(() => CreateProductResponse)
  @UseMiddleware(isAuth)
  async createProduct(
    @Arg("ProductInput") ProductInput: CreateProductInput,
    @Ctx() { user_payload }: MyContext
  ): Promise<CreateProductResponse> {
    const image_names = Array(ProductInput.num_of_images)
      .fill(null)
      .map(() => randomBytes());
    const { num_of_images, ...rest } = ProductInput;
    const product = await Product.create({
      ...rest,
      images: image_names,
      creator_id: user_payload!.user.id,
      sold: false,
    }).save();
    const upload_params = image_names.map((name) => ({
      Bucket: process.env.S3_NAME!,
      Key: name,
    }));
    const upload_commands = upload_params.map((params) => new PutObjectCommand(params));
    const upload_signed_urls = upload_commands.map(
      async (command) => await getSignedUrl(s3, command, { expiresIn: 60 })
    );
    const upload_urls = await Promise.all(upload_signed_urls);
    return {
      id: product.id,
      upload_urls: upload_urls,
    };
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

  @Mutation(() => Boolean)
  async deleteProduct(@Arg("id") id: number): Promise<Boolean> {
    const product = await Product.findOne({ where: { id: id } });
    if (!product) {
      throw new Error("Product Not Found");
    }
    const delete_params = product.images.map((name) => ({
      Bucket: process.env.S3_NAME!,
      Key: name,
    }));
    const delete_commands = delete_params.map((params) => new DeleteObjectCommand(params));
    const delete_images = delete_commands.map(async (command) => await s3.send(command));
    await Promise.all(delete_images);
    await Product.delete(id);
    return true;
  }
}
