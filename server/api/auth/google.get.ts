import {
  defineEventHandler,
  getQuery,
  getRequestURL,
  sendRedirect,
  setCookie,
} from "h3";
import { randomBytes } from "node:crypto";
import { isPkceValue } from "#server/utils/appAuth";

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event);
  const { challenge } = getQuery(event);
  const nonce = randomBytes(16).toString("hex");
  const state = isPkceValue(challenge) ? `${nonce}.${challenge}` : nonce;

  setCookie(event, "oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const redirectUri =
    config.googleRedirectUri ||
    `${getRequestURL(event).origin}/api/auth/google/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", config.googleClientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("prompt", "select_account");

  return sendRedirect(event, authUrl.toString());
});
