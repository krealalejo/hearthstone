import { AppNotification } from "#server/models/AppNotification";

export default defineEventHandler(async (event) => {
  const { userId, householdId } = event.context.user;
  await AppNotification.deleteMany({ userId, householdId });
  return { ok: true };
});
