import { HistoryEntry } from "#server/models/HistoryEntry";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const body = await readBody(event);
  if (!body.date)
    throw createError({ statusCode: 400, statusMessage: "date required" });

  const entry = await HistoryEntry.create({
    householdId,
    date: body.date,
    items: body.items,
    total: body.total,
  });
  return entry.toJSON();
});
