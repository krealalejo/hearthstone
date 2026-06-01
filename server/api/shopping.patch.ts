import { ShoppingItem } from "#server/models/ShoppingItem";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const { id, ...updates } = await readBody(event);
  if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });

  const item = await ShoppingItem.findOneAndUpdate(
    { _id: id, householdId },
    updates,
    { new: true },
  );
  if (!item) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return item.toJSON();
});
