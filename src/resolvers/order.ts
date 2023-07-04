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
import { Product } from "../entity/Product";
import { OrderItem } from "../entity/OrderItem";
import { getProductImage } from "../utils/s3";
import { Order } from "../entity/Order";
import { stripe } from "../utils/stripe";

@Resolver(Order)
export class OrderResolver {
  @FieldResolver(() => Number)
  sub_total(@Root() order: Order) {
    return order.order_items
      .map((item) => item.price)
      .reduce((currentSum, value) => currentSum + value);
  }

  @FieldResolver(() => Number)
  shipping_total(@Root() order: Order) {
    return order.order_items
      .map((item) => item.shipping_price)
      .reduce((currentSum, value) => currentSum + value);
  }

  @FieldResolver(() => Number)
  grand_total(@Root() order: Order) {
    const subTotal = order.order_items
      .map((item) => item.price)
      .reduce((currentSum, value) => currentSum + value);
    const shippingTotal = order.order_items
      .map((item) => item.shipping_price)
      .reduce((currentSum, value) => currentSum + value);
    return subTotal + shippingTotal;
  }

  @Query(() => [Order])
  @UseMiddleware(isAuth)
  async orders(@Ctx() { user_payload }: MyContext): Promise<Order[]> {
    const orders = await Order.find({
      where: { user_id: user_payload!.id },
      relations: { order_items: true, store: { user: true } },
    });

    for (const order of orders) {
      for (const item of order.order_items) {
        const image = await getProductImage(item.images[0]);
        item.images = [image];
      }
    }

    return orders;
  }

  @Query(() => Order)
  @UseMiddleware(isAuth)
  async order(
    @Arg("order_id") order_id: number,
    @Ctx() { user_payload }: MyContext
  ): Promise<Order> {
    const order = await Order.findOne({
      where: { id: order_id, user_id: user_payload!.id },
      relations: { order_items: true, user: { addresses: true }, store: { user: true } },
    });

    if (!order) {
      throw new Error("Order Not Found");
    }

    for (const item of order.order_items) {
      const image = await getProductImage(item.images[0]);
      item.images = [image];
    }

    return order;
  }
}
