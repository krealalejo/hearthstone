import { AppNotification } from "#server/models/AppNotification";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { userId, householdId } = event.context.user;
  const items = await AppNotification.find({ userId, householdId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  return serializeLean(items);
});
