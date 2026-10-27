import { User } from "#server/models/User";
import { verifyToken, signAccessToken } from "#server/utils/jwt";
import { setAccessTokenCookie } from "#server/utils/authSession";

export default defineEventHandler(async (event) => {
  const token = getCookie(event, "refresh_token");
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "No refresh token" });
  }

  const config = useRuntimeConfig(event);
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

  setAccessTokenCookie(event, accessToken);

  return { ok: true };
});
