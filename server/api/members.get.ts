import { User } from "#server/models/User";

export default defineEventHandler(async (event) => {
  const { householdId } = event.context.user;
  return await User.find({ householdId }).lean({ virtuals: true });
});
