import { User } from "#server/models/User";
import { verifyToken, signAccessToken } from "#server/utils/jwt";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "refresh_token");
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "No refresh token" });
  }

  const config = useRuntimeConfig(event); // pass event — required for env override
  const payload = await verifyToken(token, config.jwtSecret).catch(() => {
    throw createError({
      statusCode: 401,
      statusMessage: "Refresh token invalid",
    });
  });

  const user = await User.findById(payload.sub);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "User not found" });
  }

  const accessToken = await signAccessToken(
    {
      sub: user._id.toString(),
      householdId: user.householdId.toString(),
      role: user.role,
    },
    config.jwtSecret,
  );

  const isProd = process.env.NODE_ENV === "production";
  setCookie(event, "access_token", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 3600, // 1 hour — D-07
  });

  return { ok: true };
});
