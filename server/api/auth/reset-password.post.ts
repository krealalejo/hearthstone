import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "#server/models/User";
import { PasswordResetToken } from "#server/models/PasswordResetToken";

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, { message: "At least 1 uppercase letter" })
    .regex(/\d/, { message: "At least 1 number" })
    .regex(/[^A-Za-z0-9]/, "At least 1 symbol"),
});

export default defineEventHandler(async (event) => {
  const result = schema.safeParse(await readBody(event));
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: result.error.issues[0]?.message,
    });
  }

  const { token, password } = result.data;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await PasswordResetToken.findOne({
    tokenHash,
    expiresAt: { $gt: new Date() },
  });

  if (!record) {
    throw createError({
      statusCode: 400,
      statusMessage: "Reset link is invalid or has expired",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.updateOne({ _id: record.userId }, { passwordHash });
  await PasswordResetToken.deleteOne({ _id: record._id });

  return { ok: true };
});
