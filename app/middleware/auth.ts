export default defineNuxtRouteMiddleware(async () => {
  try {
    await $fetch("/api/auth/me");
  } catch {
    return navigateTo("/auth");
  }
});
