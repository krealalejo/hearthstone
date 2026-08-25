import { refreshSession } from "~/utils/session";

export default defineNuxtRouteMiddleware(async () => {
  const headers = useRequestHeaders(["cookie"]);
  try {
    await $fetch("/api/auth/me", { headers });
  } catch {
    if (!(await refreshSession())) return navigateTo("/login");
  }
});
