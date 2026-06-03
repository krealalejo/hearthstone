import { Household } from "#server/models/Household";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const { name, emoji, lastResetWeek, weekStartDay, currency } =
    await readBody(event);
  if (!name && !emoji && !lastResetWeek && !weekStartDay && !currency)
    throw createError({
      statusCode: 400,
      statusMessage:
        "name, emoji, lastResetWeek, weekStartDay, or currency required",
    });

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (emoji) updates.emoji = emoji;
  if (lastResetWeek) updates.lastResetWeek = lastResetWeek;
  if (weekStartDay) updates.weekStartDay = weekStartDay;
  if (currency) updates.currency = currency;

  const hh = await Household.findByIdAndUpdate(householdId, updates, {
    new: true,
  });
  if (!hh)
    throw createError({
      statusCode: 404,
      statusMessage: "Household not found",
    });
  const doc = hh.toJSON();
  return { ...doc, id: doc._id.toString() };
});
