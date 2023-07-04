import { Resolver, Query, Mutation, Ctx, UseMiddleware, Field, InputType, Arg } from "type-graphql";
import { MyContext } from "../utils/types";
import { isAuth } from "../middleware/isAuth";
import { Store } from "../entity/Store";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { getProductImage } from "../utils/s3";
import { stripe } from "../utils/stripe";

@InputType()
class CreateStoreInput {
  @Field()
  first_name!: string;
  @Field()
  last_name!: string;
  @Field()
  line_1!: string;
  @Field()
  line_2!: string;
  @Field()
  city!: string;
  @Field()
  province!: string;
  @Field()
  zip!: string;
  @Field()
  country!: string;
}

@Resolver()
export class StoreResolver {
  @Mutation(() => Store)
  @UseMiddleware(isAuth)
  async createStore(
    @Arg("createStoreInput") createStoreInput: CreateStoreInput,
    @Ctx() { user_payload }: MyContext
  ): Promise<Store> {
    const stripe_account = await stripe.accounts.create({
      type: "express",
      country: createStoreInput.country,
    });

    const store = await Store.create({
      ...createStoreInput,
      user_id: user_payload!.id,
      stripe_account_id: stripe_account.id,
    }).save();

    await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ has_store: true })
      .where({ id: user_payload!.id })
      .returning("*")
      .execute();

    return store;
  }

  @Query(() => String)
  @UseMiddleware(isAuth)
  async stripeAccountLink(@Ctx() { user_payload }: MyContext): Promise<String> {
    const store = await Store.findOne({ where: { user_id: user_payload!.id } });
    if (!store) {
      throw new Error("Store Not Found");
    }

    const accountLink = await stripe.accountLinks.create({
      account: store.stripe_account_id,
      refresh_url: "http://localhost:3000/store",
      return_url: "http://localhost:3000/store",
      type: "account_onboarding",
    });

    return accountLink.url;
  }

  @Query(() => Store)
  @UseMiddleware(isAuth)
  async store(@Ctx() { user_payload }: MyContext): Promise<Store> {
    const store = await Store.findOne({
      where: { user_id: user_payload!.id },
      relations: { products: true },
    });
    if (!store) {
      throw new Error("Store Not Found");
    }

    // should be a webhook
    if (!store.stripe_setup) {
      const stripe_account = await stripe.accounts.retrieve({
        stripeAccount: store.stripe_account_id,
      });

      if (stripe_account.charges_enabled && stripe_account.details_submitted) {
        const result = await AppDataSource.createQueryBuilder()
          .update(Store)
          .set({ stripe_setup: true })
          .where({ user_id: user_payload!.id })
          .returning("*")
          .execute();

        for (const product of result.raw[0].products) {
          const image = await getProductImage(product.images[0]);
          product.images = [image];
        }

        return result.raw[0];
      }
    }

    for (const product of store.products) {
      const image = await getProductImage(product.images[0]);
      product.images = [image];
    }

    return store;
  }
}
