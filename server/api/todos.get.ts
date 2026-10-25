import { TodoItem } from "#server/models/TodoItem";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return serializeLean(
    await TodoItem.find({ householdId }).sort({ createdAt: 1 }).lean(),
  );
});
