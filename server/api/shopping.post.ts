import { ShoppingItem } from "#server/models/ShoppingItem";
import { shoppingSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const body = validate(shoppingSchema, await readBody(event));

  const item = await ShoppingItem.create({
    householdId,
    name: body.name,
    source: body.source,
    invId: body.invId,
    qty: body.qty,
    price: body.price,
    checked: body.checked,
  });
  const doc = item.toJSON();
  return { ...doc, id: doc._id.toString() };
});
