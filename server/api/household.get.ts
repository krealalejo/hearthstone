import { Household } from "#server/models/Household";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  const [hh] = serializeLean(
    await Household.find({ _id: householdId }).lean(),
  );
  if (!hh) throw createError({ statusCode: 404, statusMessage: "Household not found" });
  return hh;
});
