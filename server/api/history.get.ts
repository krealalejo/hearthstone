import { HistoryEntry } from "#server/models/HistoryEntry";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return serializeLean(await HistoryEntry.find({ householdId }).lean());
});
