import bcrypt from "bcryptjs";
import { User } from "#server/models/User";
import { Household } from "#server/models/Household";
import { PendingInvite } from "#server/models/PendingInvite";
import { signAccessToken, signRefreshToken } from "#server/utils/jwt";

export default defineEventHandler(async (event) => {
  const { name, email, password } = await readBody(event);
  if (!name || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email already registered",
    });
  }

  const hash = await bcrypt.hash(password, 12); // async, 12 rounds — D-01

  // D-04: check for pending invite matching this email
  let householdId: string;
  let role: "admin" | "member";

  const pendingInvite = await PendingInvite.findOne({
    email: email.toLowerCase(),
  });

  if (pendingInvite) {
    // D-04: auto-join the inviting household as member
    householdId = pendingInvite.householdId.toString();
    role = pendingInvite.role;
    await PendingInvite.deleteOne({ _id: pendingInvite._id });
  } else {
    // D-02: auto-create household on signup
    const household = await Household.create({
      name: `${name.split(" ")[0]}'s Home`,
      emoji: "mdi-home",
    });
    householdId = household._id.toString();
    role = "admin";
  }

  const user = await User.create({
    name,
    email,
    passwordHash: hash,
    householdId,
    role,
    status: "active",
    weekXp: 0,
    totalXp: 0,
  });

  const config = useRuntimeConfig(event); // pass event — required for env override
  const tokenPayload = {
    sub: user._id.toString(),
    householdId: householdId.toString(),
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
    maxAge: 3600, // 1 hour — D-07
  });
  setCookie(event, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 2592000, // 30 days — D-08
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
