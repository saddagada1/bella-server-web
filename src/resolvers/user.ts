import { MyContext } from "../utils/types";
import { Resolver, Query, Mutation, InputType, Field, Arg, Ctx, ObjectType, UseMiddleware } from "type-graphql";
import argon2 from "argon2";
import { User } from "../entity/User";
import { ACCESS_TOKEN_EXPIRES_IN, FORGOT_PASSWORD_PREFIX, VERIFY_EMAIL_PREFIX } from "../utils/constants";
import { sendEmail } from "../utils/sendEmail";
import { isAuth } from "../middleware/isAuth";
import { isGoogleAuth } from "../middleware/isGoogleAuth";
import { AppDataSource } from "../data-source";
import { createAccessToken, createRefreshToken, generateOTP } from "../utils/auth";

@InputType()
class RegisterInput {
  @Field()
  email: string;
  @Field()
  password: string;
  @Field()
  username: string;
  @Field()
  first_name: string;
  @Field()
  last_name: string;
}

@InputType()
class RegisterWithGoogleInput {
  @Field()
  username: string;
  @Field()
  first_name: string;
  @Field()
  last_name: string;
}

@InputType()
class LoginInput {
  @Field()
  email: string;
  @Field()
  password: string;
}

@InputType()
class ChangePasswordInput {
  @Field()
  old_password: string;
  @Field()
  new_password: string;
}

@InputType()
class ChangeForgotPasswordInput {
  @Field()
  email: string;
  @Field()
  token: string;
  @Field()
  password: string;
}

@InputType()
class ChangeAboutInput {
  @Field()
  first_name: string;
  @Field()
  last_name: string;
  @Field()
  bio: string;
  @Field()
  country: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class Auth {
  @Field()
  access_token: string;
  @Field()
  expires_in: number;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@ObjectType()
class AuthResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Auth, { nullable: true })
  auth?: Auth;
}

@Resolver()
export class UserResolver {
  @Mutation(() => AuthResponse)
  async register(@Arg("registerOptions") registerOptions: RegisterInput, @Ctx() { redis, res }: MyContext): Promise<AuthResponse> {
    const hashedPassword = await argon2.hash(registerOptions.password);
    let user;
    try {
      user = await User.create({
        email: registerOptions.email,
        password: hashedPassword,
        username: registerOptions.username,
        first_name: registerOptions.first_name,
        last_name: registerOptions.last_name,
      }).save();
    } catch (err) {
      console.log(err);
      if (err.code === "23505") {
        if (err.detail.includes("username")) {
          return {
            errors: [
              {
                field: "username",
                message: `Username Taken`,
              },
            ],
          };
        }
        if (err.detail.includes("email")) {
          return {
            errors: [
              {
                field: "email",
                message: `Email in Use`,
              },
            ],
          };
        }
      }
    }

    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: `Server Error: Unable to Create User`,
          },
        ],
      };
    }

    const token = await generateOTP();

    await redis.set(VERIFY_EMAIL_PREFIX + user.id, token, "EX", 1000 * 60 * 60); // 1 hour

    const emailBody = `Your Token is: ${token}`;

    sendEmail(user.email, "REMASTER - VERIFY EMAIL", emailBody);

    res.cookie("qid", createRefreshToken(user), { httpOnly: true, path: "/refresh_token" });

    return {
      user: user,
      auth: {
        access_token: createAccessToken(user),
        expires_in: ACCESS_TOKEN_EXPIRES_IN,
      },
    };
  }

  @Mutation(() => AuthResponse)
  @UseMiddleware(isGoogleAuth)
  async registerWithGoogle(
    @Arg("registerOptions") registerOptions: RegisterWithGoogleInput,
    @Ctx() { google_payload, res }: MyContext
  ): Promise<AuthResponse> {
    const email = google_payload!.google_email;
    if (!email) {
      return {
        errors: [
          {
            field: "username",
            message: `No Email Associated with Account`,
          },
        ],
      };
    }

    let user;
    try {
      user = await User.create({
        email: email,
        username: registerOptions.username,
        first_name: registerOptions.first_name,
        last_name: registerOptions.last_name,
        verified: true,
        oauth_user: true,
      }).save();
    } catch (err) {
      console.error(err);
      if (err.code === "23505") {
        if (err.detail.includes("username")) {
          return {
            errors: [
              {
                field: "username",
                message: `Username Taken`,
              },
            ],
          };
        }
        if (err.detail.includes("email")) {
          return {
            errors: [
              {
                field: "username",
                message: `Email in Use`,
              },
            ],
          };
        }
      }
    }

    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: `Server Error: Unable to Create User`,
          },
        ],
      };
    }

    res.cookie("qid", createRefreshToken(user), { httpOnly: true, path: "/refresh_token" });

    return {
      user: user,
      auth: {
        access_token: createAccessToken(user),
        expires_in: ACCESS_TOKEN_EXPIRES_IN,
      },
    };
  }

  @Mutation(() => AuthResponse)
  async login(@Arg("loginOptions") loginOptions: LoginInput, @Ctx() { res }: MyContext): Promise<AuthResponse> {
    const user = await User.findOne({ where: { email: loginOptions.email } });
    if (!user || !user.password) {
      return {
        errors: [
          {
            field: "email",
            message: "Invalid Email or Password",
          },
        ],
      };
    }

    const isValid = await argon2.verify(user.password, loginOptions.password);
    if (!isValid) {
      return {
        errors: [
          {
            field: "email",
            message: "Invalid Email or Password",
          },
        ],
      };
    }

    res.cookie("qid", createRefreshToken(user), { httpOnly: true, path: "/refresh_token" });

    return {
      user: user,
      auth: {
        access_token: createAccessToken(user),
        expires_in: ACCESS_TOKEN_EXPIRES_IN,
      },
    };
  }

  @Mutation(() => AuthResponse)
  @UseMiddleware(isGoogleAuth)
  async loginWithGoogle(@Ctx() { res, google_payload }: MyContext): Promise<AuthResponse> {
    const email = google_payload!.google_email;
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return {
        errors: [
          {
            field: "google",
            message: "No Account Found",
          },
        ],
      };
    }

    res.cookie("qid", createRefreshToken(user), { httpOnly: true, path: "/refresh_token" });

    return {
      user: user,
      auth: {
        access_token: createAccessToken(user),
        expires_in: ACCESS_TOKEN_EXPIRES_IN,
      },
    };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changeUsername(@Arg("username") username: string, @Ctx() { user_payload }: MyContext): Promise<UserResponse> {
    const duplicateUser = await User.findOne({
      where: { username: username },
    });
    if (duplicateUser) {
      return {
        errors: [
          {
            field: "username",
            message: "Username Taken",
          },
        ],
      };
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ username: username })
      .where({ id: user_payload!.user.id })
      .returning("*")
      .execute();

    return { user: result.raw[0] };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changeEmail(@Arg("email") email: string, @Ctx() { user_payload }: MyContext): Promise<UserResponse> {
    const duplicateUser = await User.findOne({ where: { email: email } });
    if (duplicateUser) {
      return {
        errors: [
          {
            field: "email",
            message: "Email in Use",
          },
        ],
      };
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ email: email })
      .where({ id: user_payload!.user.id })
      .returning("*")
      .execute();

    return { user: result.raw[0] };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changePassword(
    @Arg("changePasswordOptions") changePasswordOptions: ChangePasswordInput,
    @Ctx() { user_payload }: MyContext
  ): Promise<UserResponse> {
    if (!user_payload!.user.oauth_user) {
      const isValid = await argon2.verify(user_payload!.user.password!, changePasswordOptions.old_password);
      if (!isValid) {
        return {
          errors: [
            {
              field: "old_password",
              message: "Incorrect Password",
            },
          ],
        };
      }
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ password: await argon2.hash(changePasswordOptions.new_password), oauth_user: false })
      .where({ id: user_payload!.user.id })
      .returning("*")
      .execute();

    return { user: result.raw[0] };
  }

  @Mutation(() => User)
  @UseMiddleware(isAuth)
  async changeAbout(@Arg("changeAboutOptions") changeAboutOptions: ChangeAboutInput, @Ctx() { user_payload }: MyContext): Promise<User> {
    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({
        first_name: changeAboutOptions.first_name,
        last_name: changeAboutOptions.last_name,
        bio: changeAboutOptions.bio,
        country: changeAboutOptions.country,
      })
      .where({ id: user_payload!.user.id })
      .returning("*")
      .execute();

    return result.raw[0];
  }

  @Mutation(() => AuthResponse)
  async changeForgotPassword(
    @Arg("changeForgotPasswordOptions")
    changeForgotPasswordOptions: ChangeForgotPasswordInput,
    @Ctx() { redis, res }: MyContext
  ): Promise<AuthResponse> {
    const key = FORGOT_PASSWORD_PREFIX + changeForgotPasswordOptions.email;

    const value = await redis.get(key);
    if (!value) {
      return {
        errors: [
          {
            field: "token",
            message: `Token Expired`,
          },
        ],
      };
    }

    const userID = value.split(":")[0];
    const storedToken = value.split(":")[1];

    if (changeForgotPasswordOptions.token !== storedToken) {
      return {
        errors: [
          {
            field: "token",
            message: `Token Invalid`,
          },
        ],
      };
    }

    const numUserID = parseInt(userID);

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({
        password: await argon2.hash(changeForgotPasswordOptions.password),
        token_version: () => "token_version + 1",
      })
      .where({ id: numUserID })
      .returning("*")
      .execute();

    await redis.del(key);

    res.cookie("qid", createRefreshToken(result.raw[0]), {
      httpOnly: true,
      path: "/refresh_token",
    });

    return {
      user: result.raw[0],
      auth: {
        access_token: createAccessToken(result.raw[0]),
        expires_in: ACCESS_TOKEN_EXPIRES_IN,
      },
    };
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { redis }: MyContext) {
    const user = await User.findOne({ where: { email: email } });
    if (!user) {
      return true;
    }

    const key = FORGOT_PASSWORD_PREFIX + user.email;

    const duplicate = await redis.exists(key);

    if (duplicate !== 0) {
      await redis.del(key);
    }

    const token = await generateOTP();

    await redis.set(key, `${user.id}:${token}`, "EX", 1000 * 60 * 60); // 1 hour

    const emailBody = `Your Token is: ${token}`;

    sendEmail(email, "REMASTER - FORGOT PASSWORD", emailBody);

    return true;
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async verifyEmail(@Arg("token") token: string, @Ctx() { user_payload, redis }: MyContext): Promise<UserResponse> {
    const key = VERIFY_EMAIL_PREFIX + user_payload!.user.id;

    const storedToken = await redis.get(key);
    if (!storedToken) {
      return {
        errors: [
          {
            field: "token",
            message: `Token Expired`,
          },
        ],
      };
    }

    if (storedToken !== token) {
      return {
        errors: [
          {
            field: "token",
            message: `Token Invalid`,
          },
        ],
      };
    }

    const result = await AppDataSource.createQueryBuilder()
      .update(User)
      .set({ verified: true })
      .where({ id: user_payload!.user.id })
      .returning("*")
      .execute();

    await redis.del(key);

    return { user: result.raw[0] };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async sendVerifyEmail(@Ctx() { user_payload, redis }: MyContext) {
    const key = VERIFY_EMAIL_PREFIX + user_payload!.user.id;

    const duplicate = await redis.exists(key);

    if (duplicate !== 0) {
      await redis.del(key);
    }

    const token = await generateOTP();

    await redis.set(key, token, "EX", 1000 * 60 * 60); // 1 hour

    const emailBody = `Your Token is: ${token}`;

    sendEmail(user_payload!.user.email, "REMASTER - VERIFY EMAIL", emailBody);

    return true;
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { res }: MyContext) {
    res.cookie("qid", "", {
      httpOnly: true,
      path: "/refresh_token",
    });

    return true;
  }

  @Query(() => User)
  async userByUsername(@Arg("username") username: string): Promise<User> {
    const user = await User.findOne({ where: { username: username } });
    if (!user) {
      throw new Error("User Not Found");
    }

    return user;
  }

  @Query(() => [User])
  @UseMiddleware(isAuth)
  users(): Promise<User[]> {
    return User.find();
  }
}
