import { Task } from "#server/models/Task";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const { id } = await readBody(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });

  const result = await Task.deleteOne({ _id: id, householdId });
  if (!result.deletedCount)
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  return { ok: true };
});
