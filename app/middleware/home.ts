export default defineNuxtRouteMiddleware(() => {
  return navigateTo("/dashboard", { replace: true });
});
