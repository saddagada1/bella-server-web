import {
  Resolver,
  Query,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
  FieldResolver,
  Root,
} from "type-graphql";
import { MyContext } from "../utils/types";
import { isAuth } from "../middleware/isAuth";
import { Cart } from "../entity/Cart";
import { Product } from "../entity/Product";
import { CartItem } from "../entity/CartItem";
import { getProductImage } from "../utils/s3";
import { stripe } from "../utils/stripe";

@Resolver(Cart)
export class CartResolver {
  @FieldResolver(() => Number)
  sub_total(@Root() cart: Cart) {
    return cart.cart_items
      .map((item) => item.price)
      .reduce((currentSum, value) => currentSum + value);
  }

  @FieldResolver(() => Number)
  shipping_total(@Root() cart: Cart) {
    return cart.cart_items
      .map((item) => item.shipping_price)
      .reduce((currentSum, value) => currentSum + value);
  }

  @FieldResolver(() => Number)
  grand_total(@Root() cart: Cart) {
    const subTotal = cart.cart_items
      .map((item) => item.price)
      .reduce((currentSum, value) => currentSum + value);
    const shippingTotal = cart.cart_items
      .map((item) => item.shipping_price)
      .reduce((currentSum, value) => currentSum + value);
    return subTotal + shippingTotal;
  }

  @Mutation(() => Cart)
  @UseMiddleware(isAuth)
  async addProductToCart(
    @Arg("id") id: number,
    @Arg("quantity") quantity: number,
    @Ctx() { user_payload }: MyContext
  ): Promise<Cart> {
    const product = await Product.findOne({
      where: { id: id },
      relations: { store: { user: true } },
    });
    if (!product) {
      throw new Error("Product Not Found");
    }

    if (quantity > product.quantity || quantity <= 0) {
      throw new Error("Invalid Quantity");
    }

    let cart = await Cart.findOne({
      where: [{ user_id: user_payload!.id, store_id: product.store_id }],
      relations: { cart_items: true },
    });

    if (!cart) {
      cart = await Cart.create({
        user_id: user_payload!.id,
        store_id: product.store_id,
      }).save();
    }

    if (
      cart.cart_items &&
      cart.cart_items.find((item: CartItem) => item.product_id === product.id)
    ) {
      throw new Error("Product Already In Cart");
    }

    const cart_item = await CartItem.create({
      price: product.price,
      shipping_price: product.shipping_price,
      quantity: quantity,
      name: product.name,
      images: product.images,
      product_id: product.id,
      cart_id: cart.id,
    }).save();

    const image = await getProductImage(cart_item.images[0]);
    cart_item.images = [image];

    if (cart.cart_items) {
      cart.cart_items = [...cart.cart_items, cart_item];
    } else {
      cart.cart_items = [cart_item];
    }

    cart.store = product.store;

    return cart;
  }

  @Mutation(() => Boolean)
  async removeProductFromCart(
    @Arg("cart_item_id") cart_item_id: number,
    @Arg("cart_id") cart_id: number
  ): Promise<Boolean> {
    const cart = await Cart.findOne({ where: { id: cart_id }, relations: { cart_items: true } });

    if (cart && cart.cart_items && cart.cart_items.length <= 1) {
      await CartItem.delete(cart_item_id);
      await Cart.delete(cart.id);
      return true;
    }

    await CartItem.delete(cart_item_id);
    return true;
  }

  @Mutation(() => String)
  @UseMiddleware(isAuth)
  async createStripeCheckoutSession(
    @Arg("cart_id") cart_id: number,
    @Ctx() { user_payload }: MyContext
  ): Promise<string> {
    const cart = await Cart.findOne({
      where: { id: cart_id, user_id: user_payload!.id },
      relations: { cart_items: true, store: { user: true } },
    });

    if (!cart) {
      throw new Error("Cart Not Found");
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: await Promise.all(
        cart.cart_items.map(async (item) => {
          const images = await getProductImage(item.images[0]);
          return {
            price_data: {
              currency: "CAN",
              product_data: {
                name: item.name,
                images: [images],
              },
              unit_amount: item.price + item.shipping_price * 100,
            },
            quantity: item.quantity,
          };
        })
      ),
      payment_intent_data: {
        application_fee_amount:
          cart.cart_items
            .map((item) => item.price + item.shipping_price * 100)
            .reduce((currentSum, value) => currentSum + value) * 0.08,
        transfer_data: {
          destination: cart.store.stripe_account_id,
        },
      },
      success_url: "http://localhost:3000/orders",
      cancel_url: "http://localhost:3000/bag",
    });

    if (!session.url) {
      throw new Error("Error Creating Stripe Session");
    }

    return session.url;
  }

  @Query(() => [Cart])
  @UseMiddleware(isAuth)
  async carts(@Ctx() { user_payload }: MyContext): Promise<Cart[]> {
    const carts = await Cart.find({
      where: { user_id: user_payload!.id },
      relations: { cart_items: true, store: { user: true } },
    });

    for (const cart of carts) {
      for (const item of cart.cart_items) {
        const image = await getProductImage(item.images[0]);
        item.images = [image];
      }
    }

    return carts;
  }

  @Query(() => Cart)
  @UseMiddleware(isAuth)
  async cart(@Arg("cart_id") cart_id: number, @Ctx() { user_payload }: MyContext): Promise<Cart> {
    const cart = await Cart.findOne({
      where: { id: cart_id, user_id: user_payload!.id },
      relations: { cart_items: true, user: { addresses: true }, store: { user: true } },
    });

    if (!cart) {
      throw new Error("Cart Not Found");
    }

    for (const item of cart.cart_items) {
      const image = await getProductImage(item.images[0]);
      item.images = [image];
    }

    return cart;
  }
}
