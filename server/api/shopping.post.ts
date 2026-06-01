import { ShoppingItem } from "#server/models/ShoppingItem";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const body = await readBody(event);
  if (!body.name)
    throw createError({ statusCode: 400, statusMessage: "name required" });

  const item = await ShoppingItem.create({
    householdId,
    name: body.name,
    source: body.source,
    invId: body.invId,
    qty: body.qty,
    price: body.price,
    checked: body.checked,
  });
  const doc = item.toJSON(); return { ...doc, id: doc._id.toString() };
});
