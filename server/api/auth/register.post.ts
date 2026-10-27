import bcrypt from "bcryptjs";
import { User } from "#server/models/User";
import { joinOrCreateHousehold, startSession } from "#server/utils/authSession";
import { registerSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { name, email, password } = validate(
    registerSchema,
    await readBody(event),
  );

  const existing = await User.findOne({ email });
  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: "Email already registered",
    });
  }

  const hash = await bcrypt.hash(password, 12);
  const { householdId, role } = await joinOrCreateHousehold(email, name);

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

  await startSession(
    event,
    { sub: user._id.toString(), householdId, role: user.role },
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
