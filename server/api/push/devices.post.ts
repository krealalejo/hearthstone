import { DeviceToken } from "#server/models/DeviceToken";
import { deviceTokenSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { userId, householdId } = event.context.user;
  const { token } = validate(deviceTokenSchema, await readBody(event));
  await DeviceToken.findOneAndUpdate(
    { token },
    { token, userId, householdId, platform: "android" },
    { upsert: true },
  );
  return { ok: true };
});
