import { User } from "#server/models/User";
import { serializeLean } from "#server/utils/serialize";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return serializeLean(await User.find({ householdId }).lean());
});
