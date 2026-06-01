import { Household } from "#server/models/Household";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const { name, emoji } = await readBody(event);
  if (!name && !emoji)
    throw createError({
      statusCode: 400,
      statusMessage: "name or emoji required",
    });

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (emoji) updates.emoji = emoji;

  const hh = await Household.findByIdAndUpdate(householdId, updates, {
    new: true,
  });
  if (!hh)
    throw createError({
      statusCode: 404,
      statusMessage: "Household not found",
    });
  return hh.toJSON();
});
