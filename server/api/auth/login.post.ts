import bcrypt from "bcryptjs";
import { User } from "#server/models/User";
import { startSession } from "#server/utils/authSession";
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

  if (!user.passwordHash) {
    throw createError({
      statusCode: 401,
      statusMessage:
        "This account uses Google sign-in. Continue with Google instead.",
    });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  await startSession(
    event,
    {
      sub: user._id.toString(),
      householdId: user.householdId.toString(),
      role: user.role,
    },
    useRuntimeConfig(event).jwtSecret,
  );

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
});
