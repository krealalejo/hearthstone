import { TodoItem } from "#server/models/TodoItem";
import { todoPatchSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const { id, ...updates } = validate(todoPatchSchema, await readBody(event));

  const item = await TodoItem.findOneAndUpdate(
    { _id: id, householdId },
    updates,
    { returnDocument: "after" },
  );
  if (!item) throw createError({ statusCode: 404, statusMessage: "Not found" });
  const doc = item.toJSON();
  return { ...doc, id: doc._id.toString() };
});
