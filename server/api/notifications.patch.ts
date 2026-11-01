import { AppNotification } from "#server/models/AppNotification";

export default defineEventHandler(async (event) => {
  const { userId, householdId } = event.context.user;
  await AppNotification.updateMany(
    { userId, householdId, readAt: null },
    { readAt: new Date() },
  );
  return { ok: true };
});
