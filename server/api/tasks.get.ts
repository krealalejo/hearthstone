import { Task } from "#server/models/Task";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return await Task.find({ householdId }).lean({ virtuals: true });
});
