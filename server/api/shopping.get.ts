import { ShoppingItem } from "#server/models/ShoppingItem";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return await ShoppingItem.find({ householdId }).lean({ virtuals: true });
});
