import { useHomeStore } from "~/stores/home";

export default defineNuxtRouteMiddleware(() => {
  const store = useHomeStore();
  return navigateTo(store.authed ? "/dashboard" : "/login", { replace: true });
});
