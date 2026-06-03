import { User } from "#server/models/User";

export default defineEventHandler(async (event) => {
  const { userId, householdId, role: callerRole } = event.context.user;
  const { id, ...updates } = await readBody(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });

  if (updates.role && callerRole !== "admin")
    throw createError({ statusCode: 403, statusMessage: "Admin only" });

  const profileFields = ["name", "accentColor", "avatarEmoji", "avatarImage"];
  const updatingProfile = profileFields.some((f) => f in updates);
  if (updatingProfile && callerRole !== "admin" && id !== userId)
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });

  const member = await User.findOneAndUpdate(
    { _id: id, householdId },
    updates,
    { returnDocument: "after" },
  );
  if (!member)
    throw createError({ statusCode: 404, statusMessage: "Member not found" });
  const doc = member.toJSON();
  return { ...doc, id: doc._id.toString() };
});
