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
  FieldResolver,
  Root,
} from "type-graphql";
import { MyContext } from "../utils/types";
import { isAuth } from "../middleware/isAuth";
import { randomBytes } from "../utils/rand";
import { deleteProductImages, getProductImages, uploadProductImages } from "../utils/s3";
import { Like } from "../entity/Like";
import { User } from "../entity/User";

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
  price!: number;
}

@ObjectType()
class CreateProductResponse {
  @Field()
  id: number;
  @Field(() => [String])
  upload_urls: string[];
}

@Resolver(Product)
export class ProductResolver {
  @Query(() => [Product])
  products(): Promise<Product[]> {
    return Product.find();
  }

  @Query(() => Product)
  async product(@Arg("id") id: number): Promise<Product> {
    const product = await Product.findOne({
      where: { id: id },
      relations: { store: { user: true }, likes: true },
    });
    if (!product) {
      throw new Error("Product Not Found");
    }
    product.images = await getProductImages(product.images);

    return product;
  }

  @Mutation(() => CreateProductResponse)
  @UseMiddleware(isAuth)
  async createProduct(
    @Arg("ProductInput") ProductInput: CreateProductInput,
    @Ctx() { user_payload }: MyContext
  ): Promise<CreateProductResponse> {
    const store = await User.findOne({ where: { id: user_payload!.id } });
    if (!store) {
      throw new Error("No Store Initialized");
    }
    const image_names = Array(ProductInput.num_of_images)
      .fill(null)
      .map(() => randomBytes());
    const { num_of_images, ...rest } = ProductInput;
    const product = await Product.create({
      ...rest,
      images: image_names,
      store_id: store.id,
      sold: false,
    }).save();
    const upload_urls = await uploadProductImages(image_names);
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
  @UseMiddleware(isAuth)
  async deleteProduct(@Arg("id") id: number): Promise<Boolean> {
    const product = await Product.findOne({ where: { id: id } });
    if (!product) {
      throw new Error("Product Not Found");
    }
    await deleteProductImages(product.images);
    await Product.delete(id);
    return true;
  }

  @FieldResolver(() => Number)
  num_likes(@Root() product: Product) {
    if (product.likes) {
      return product.likes.length;
    } else {
      return 0;
    }
  }

  @Mutation(() => Like)
  @UseMiddleware(isAuth)
  async like(@Arg("id") id: number, @Ctx() { user_payload }: MyContext): Promise<Like> {
    try {
      const like = await Like.create({
        id: user_payload!.id,
        product_id: id,
      }).save();
      return like;
    } catch (err) {
      if (err.code === "23505") {
        if (err.detail.includes("already exists")) {
          throw new Error("Product Already Liked");
        }
      }
      throw new Error("Something Went Wrong");
    }
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async unlike(@Arg("id") id: number, @Ctx() { user_payload }: MyContext): Promise<Boolean> {
    await Like.delete({ id: user_payload!.id, product_id: id });
    return true;
  }
}
