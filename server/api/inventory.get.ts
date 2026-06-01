import { InventoryItem } from "#server/models/InventoryItem";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return await InventoryItem.find({ householdId }).lean({ virtuals: true });
});
