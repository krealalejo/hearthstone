import { defineEventHandler, getCookie, createError, getRequestURL } from "h3";
import { verifyToken } from "#server/utils/jwt";

export default defineEventHandler(async (event) => {
  // Only protect API routes; let page renders and assets through
  const path = event.path ?? getRequestURL(event).pathname;
  if (!path.startsWith("/api/") || path.startsWith("/api/auth/")) return;

  const token = getCookie(event, "access_token");
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const config = useRuntimeConfig(event); // pass event — required for env override

  try {
    const payload = await verifyToken(token, config.jwtSecret);
    event.context.user = {
      userId: payload.sub as string,
      householdId: payload.householdId as string,
      role: payload.role as string,
    };
  } catch {
    throw createError({
      statusCode: 401,
      statusMessage: "Token invalid or expired",
    });
  }
});
