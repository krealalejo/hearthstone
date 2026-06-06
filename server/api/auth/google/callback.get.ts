import {
  defineEventHandler,
  getCookie,
  getQuery,
  getRequestURL,
  deleteCookie,
  sendRedirect,
  setCookie,
  createError,
} from "h3";
import { User } from "#server/models/User";
import { Household } from "#server/models/Household";
import { PendingInvite } from "#server/models/PendingInvite";
import { signAccessToken, signRefreshToken } from "#server/utils/jwt";

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const query = getQuery(event);
  const code = query.code as string | undefined;
  const state = query.state as string | undefined;

  const expectedState = getCookie(event, "oauth_state");
  deleteCookie(event, "oauth_state", { path: "/" });

  if (!code || !state || !expectedState || state !== expectedState) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid OAuth state",
    });
  }

  const redirectUri =
    config.googleRedirectUri ||
    `${getRequestURL(event).origin}/api/auth/google/callback`;

  const tokenRes = await $fetch<{ access_token: string }>(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      body: {
        code,
        client_id: config.googleClientId,
        client_secret: config.googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      },
    },
  );

  const profile = await $fetch<GoogleUserInfo>(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${tokenRes.access_token}` } },
  );

  if (!profile.email_verified) {
    throw createError({
      statusCode: 401,
      statusMessage: "Google email not verified",
    });
  }

  let user = await User.findOne({
    $or: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }],
  });

  if (user) {
    if (!user.googleId) {
      user.googleId = profile.sub;
      await user.save();
    }
  } else {
    let householdId: string;
    let role: "admin" | "member";

    const pendingInvite = await PendingInvite.findOne({
      email: profile.email.toLowerCase(),
    });

    if (pendingInvite) {
      householdId = pendingInvite.householdId.toString();
      role = pendingInvite.role;
      await PendingInvite.deleteOne({ _id: pendingInvite._id });
    } else {
      const household = await Household.create({
        name: `${profile.name.split(" ")[0]}'s Home`,
        emoji: "mdi-home",
      });
      householdId = household._id.toString();
      role = "admin";
    }

    user = await User.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.sub,
      householdId,
      role,
      status: "active",
      weekXp: 0,
      totalXp: 0,
    });
  }

  const tokenPayload = {
    sub: user._id.toString(),
    householdId: user.householdId.toString(),
    role: user.role,
  };
  const accessToken = await signAccessToken(tokenPayload, config.jwtSecret);
  const refreshToken = await signRefreshToken(
    { sub: user._id.toString() },
    config.jwtSecret,
  );

  const isProd = process.env.NODE_ENV === "production";
  setCookie(event, "access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });
  setCookie(event, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000,
  });

  return sendRedirect(event, "/dashboard");
});
