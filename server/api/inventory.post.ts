import { InventoryItem } from "#server/models/InventoryItem";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const body = await readBody(event);
  if (!body.name)
    throw createError({ statusCode: 400, statusMessage: "name required" });

  const item = await InventoryItem.create({
    householdId,
    name: body.name,
    cat: body.cat,
    qty: body.qty,
    min: body.min,
    optimal: body.optimal,
    price: body.price,
    icon: body.icon,
  });
  const doc = item.toJSON(); return { ...doc, id: doc._id.toString() };
});
