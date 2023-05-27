import { Resolver, Query, Arg, Mutation, Ctx, UseMiddleware } from "type-graphql";
import { MyContext } from "../utils/types";
import { isAuth } from "../middleware/isAuth";
import { Cart } from "../entity/Cart";
import { Product } from "../entity/Product";
import { CartItem } from "../entity/CartItem";
import { getProductImage } from "../utils/s3";

@Resolver()
export class CartResolver {
  @Mutation(() => CartItem)
  @UseMiddleware(isAuth)
  async addProductToCart(
    @Arg("id") id: number,
    @Ctx() { user_payload }: MyContext
  ): Promise<CartItem> {
    const product = await Product.findOne({ where: { id: id } });
    if (!product) {
      throw new Error("Product Not Found");
    }

    let cart = await Cart.findOne({
      where: [{ user_id: user_payload!.id, store_id: product.store_id }],
    });

    if (!cart) {
      cart = await Cart.create({
        user_id: user_payload!.id,
        store_id: product.store_id,
      }).save();
    }

    if (cart.cart_items && cart.cart_items.find((item) => item.product_id === product.id)) {
      throw new Error("Product Already In Cart");
    }

    const cart_item = await CartItem.create({
      price: product.price,
      shipping_price: product.shipping_price,
      name: product.name,
      images: product.images,
      product_id: product.id,
      cart_id: cart.id,
    }).save();

    return cart_item; //
  }

  @Mutation(() => Boolean)
  async removeProductFromCart(@Arg("cart_item_id") cart_item_id: number): Promise<Boolean> {
    await CartItem.delete(cart_item_id);
    return true;
  }

  @Query(() => [Cart])
  @UseMiddleware(isAuth)
  async carts(@Ctx() { user_payload }: MyContext): Promise<Cart[]> {
    const carts = await Cart.find({
      where: { user_id: user_payload!.id },
      relations: { cart_items: true, user: true },
    });

    for (const cart of carts) {
      for (const item of cart.cart_items) {
        const image = await getProductImage(item.images[0]);
        item.images = [image];
      }
    }

    return carts;
  }
}
