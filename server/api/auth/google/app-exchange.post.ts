import { verifyToken } from "#server/utils/jwt";
import { pkceChallengeFor } from "#server/utils/appAuth";
import { startSession } from "#server/utils/authSession";
import { appHandoffSchema, validate } from "#server/utils/validate";

export default defineEventHandler(async (event) => {
  const { token, verifier } = validate(appHandoffSchema, await readBody(event));
  const config = useRuntimeConfig(event);

  const handoff = await verifyToken(token, config.jwtSecret).catch(() => {
    throw createError({ statusCode: 401, statusMessage: "Handoff invalid" });
  });

  if (
    handoff.purpose !== "app-handoff" ||
    handoff.challenge !== pkceChallengeFor(verifier)
  ) {
    throw createError({ statusCode: 401, statusMessage: "Handoff invalid" });
  }

  await startSession(
    event,
    {
      sub: handoff.sub as string,
      householdId: handoff.householdId,
      role: handoff.role,
    },
    config.jwtSecret,
  );

  return { ok: true };
});
