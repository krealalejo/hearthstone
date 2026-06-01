import { InventoryItem } from "#server/models/InventoryItem";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return serializeLean(await InventoryItem.find({ householdId }).lean());
});
