export default defineNuxtRouteMiddleware(async () => {
  const headers = useRequestHeaders(["cookie"]);
  try {
    await $fetch("/api/auth/me", { headers });
  } catch {
    return navigateTo("/login");
  }
});
