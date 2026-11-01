import { Household } from "#server/models/Household";
import { householdPatchSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const {
    name,
    emoji,
    lastResetWeek,
    weekStartDay,
    currency,
    restockSyncedAt,
    timezone,
  } = validate(householdPatchSchema, await readBody(event));

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (emoji) updates.emoji = emoji;
  if (lastResetWeek) updates.lastResetWeek = lastResetWeek;
  if (weekStartDay !== undefined) updates.weekStartDay = weekStartDay;
  if (currency) updates.currency = currency;
  if (restockSyncedAt) updates.restockSyncedAt = restockSyncedAt;
  if (timezone) updates.timezone = timezone;

  const hh = await Household.findByIdAndUpdate(householdId, updates, {
    returnDocument: "after",
  });
  if (!hh)
    throw createError({
      statusCode: 404,
      statusMessage: "Household not found",
    });
  const doc = hh.toJSON();
  return { ...doc, id: doc._id.toString() };
});
