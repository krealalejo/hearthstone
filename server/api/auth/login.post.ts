import bcrypt from "bcryptjs";
import { User } from "#server/models/User";
import { signAccessToken, signRefreshToken } from "#server/utils/jwt";
import { loginSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { email, password } = validate(loginSchema, await readBody(event));

  const user = await User.findOne({ email });
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  const config = useRuntimeConfig(event);
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

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
});
