import {
  defineEventHandler,
  getCookie,
  getQuery,
  getRequestURL,
  deleteCookie,
  sendRedirect,
  createError,
} from "h3";
import { User } from "#server/models/User";
import { signAppHandoffToken } from "#server/utils/jwt";
import { joinOrCreateHousehold, startSession } from "#server/utils/authSession";
import {
  APP_AUTH_CALLBACK_URL,
  appChallengeFromState,
} from "#server/utils/appAuth";

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
    const { householdId, role } = await joinOrCreateHousehold(
      profile.email,
      profile.name,
    );

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

  const appChallenge = appChallengeFromState(state);
  if (appChallenge) {
    const handoffToken = await signAppHandoffToken(
      { ...tokenPayload, challenge: appChallenge },
      config.jwtSecret,
    );
    const appUrl = new URL(APP_AUTH_CALLBACK_URL);
    appUrl.searchParams.set("token", handoffToken);
    return sendRedirect(event, appUrl.toString());
  }

  await startSession(event, tokenPayload, config.jwtSecret);

  return sendRedirect(event, "/dashboard");
});
