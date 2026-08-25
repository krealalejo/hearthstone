import { useHomeStore } from "~/stores/home";
import { refreshSession } from "~/utils/session";

export default defineNuxtRouteMiddleware(async () => {
  const store = useHomeStore();
  if (store.authed) return;

  const headers = useRequestHeaders(["cookie"]);
  try {
    await $fetch("/api/auth/me", { headers });
  } catch {
    if (!(await refreshSession())) return navigateTo("/login");
  }
});
