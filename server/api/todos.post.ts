import { TodoItem } from "#server/models/TodoItem";
import { todoSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const body = validate(todoSchema, await readBody(event));

  const item = await TodoItem.create({
    householdId,
    text: body.text,
    done: body.done,
  });
  const doc = item.toJSON();
  return { ...doc, id: doc._id.toString() };
});
