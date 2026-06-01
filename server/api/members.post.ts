import { User } from "#server/models/User";
import { PendingInvite } from "#server/models/PendingInvite";

export default defineEventHandler(async (event) => {
  const { householdId, role: callerRole } = event.context.user;
  if (callerRole !== "admin")
    throw createError({ statusCode: 403, statusMessage: "Admin only" });

  const { email, role = "member" } = await readBody(event);
  if (!email)
    throw createError({ statusCode: 400, statusMessage: "email required" });

  const existing = await User.findOne({
    email: email.toLowerCase(),
    householdId,
  });
  if (existing)
    throw createError({
      statusCode: 409,
      statusMessage: "Already a member of this household",
    });

  const invite = await PendingInvite.create({
    householdId,
    email: email.toLowerCase(),
    role,
  });
  const doc = invite.toJSON(); return { ...doc, id: doc._id.toString() };
});
