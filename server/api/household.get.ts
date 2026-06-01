import { Household } from "#server/models/Household";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const hh = await Household.findById(householdId).lean({ virtuals: true });
  if (!hh)
    throw createError({
      statusCode: 404,
      statusMessage: "Household not found",
    });
  return hh;
});
