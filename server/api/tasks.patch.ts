import { Task } from "#server/models/Task";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const { id, ...updates } = await readBody(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });

  const task = await Task.findOneAndUpdate({ _id: id, householdId }, updates, {
    new: true,
  });
  if (!task) throw createError({ statusCode: 404, statusMessage: "Not found" });
  const doc = task.toJSON(); return { ...doc, id: doc._id.toString() };
});
