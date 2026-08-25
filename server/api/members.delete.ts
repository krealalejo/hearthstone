import { User } from "#server/models/User";
import { PendingInvite } from "#server/models/PendingInvite";

export default defineEventHandler(async (event) => {
  const { householdId, role: callerRole, userId } = event.context.user;
  if (callerRole !== "admin")
    throw createError({ statusCode: 403, statusMessage: "Admin only" });

  const { id } = await readBody(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });

  if (id === userId)
    throw createError({
      statusCode: 400,
      statusMessage: "Cannot remove yourself",
    });

  const result = await User.deleteOne({ _id: id, householdId });
  if (result.deletedCount) return { ok: true };

  const invite = await PendingInvite.deleteOne({ _id: id, householdId });
  if (invite.deletedCount) return { ok: true };

  throw createError({ statusCode: 404, statusMessage: "Member not found" });
});
