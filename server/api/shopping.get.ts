import { ShoppingItem } from "#server/models/ShoppingItem";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return serializeLean(await ShoppingItem.find({ householdId }).lean());
});
