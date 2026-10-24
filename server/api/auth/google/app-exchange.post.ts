import { signAccessToken, signRefreshToken, verifyToken } from "#server/utils/jwt";
import { pkceChallengeFor } from "#server/utils/appAuth";
import { appHandoffSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { token, verifier } = validate(appHandoffSchema, await readBody(event));
  const config = useRuntimeConfig(event);

  const handoff = await verifyToken(token, config.jwtSecret).catch(() => {
    throw createError({ statusCode: 401, statusMessage: "Handoff invalid" });
  });

  if (
    handoff.purpose !== "app-handoff" ||
    handoff.challenge !== pkceChallengeFor(verifier)
  ) {
    throw createError({ statusCode: 401, statusMessage: "Handoff invalid" });
  }

  const userId = handoff.sub as string;
  const accessToken = await signAccessToken(
    {
      sub: userId,
      householdId: handoff.householdId,
      role: handoff.role,
    },
    config.jwtSecret,
  );
  const refreshToken = await signRefreshToken(
    { sub: userId },
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

  return { ok: true };
});
