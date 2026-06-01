import { Task } from "#server/models/Task";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return serializeLean(await Task.find({ householdId }).lean());
});
