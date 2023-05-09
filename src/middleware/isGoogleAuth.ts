import { MyContext } from "../utils/types";
import { MiddlewareFn } from "type-graphql";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  redirectUri: "http://localhost:3000",
});

export const isGoogleAuth: MiddlewareFn<MyContext> = async ({ context }, next) => {
  try {
    const authorization = context.req.headers.authorization;
    if (!authorization) {
      console.log("1");
      throw "Not Authenticated With Google";
    }
    const authRegex = /^Basic/;
    if (!authRegex.test(authorization) || authorization.split(" ").length !== 2) {
      console.log("s");
      throw "Not Authenticated With Google";
    }
    const code = authorization.split(" ")[1];
    const response = await googleClient.getToken(code);
    if (!response.tokens.id_token) {
      throw "Not Authenticated With Google";
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: response.tokens.id_token,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw "Not Authenticated With Google";
    }
    context.google_payload = { google_email: payload.email };
  } catch (err) {
    console.log(err);
    throw new Error("Not Authenticated With Google");
  }

  return next();
};
