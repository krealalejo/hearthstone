import { DeviceToken } from "#server/models/DeviceToken";
import { deviceTokenSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user;
  const { token } = validate(deviceTokenSchema, await readBody(event));
  await DeviceToken.deleteOne({ token, userId });
  return { ok: true };
});
