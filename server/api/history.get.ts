import { HistoryEntry } from "#server/models/HistoryEntry";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return await HistoryEntry.find({ householdId }).lean({ virtuals: true });
});
