export default defineNuxtPlugin((nuxtApp) => {
  const saved = localStorage.getItem("theme");
  const dark = saved
    ? saved === "dark"
    : globalThis.matchMedia("(prefers-color-scheme: dark)").matches;

  nuxtApp.hook("vuetify:before-create", ({ vuetifyOptions }) => {
    vuetifyOptions.theme = {
      ...vuetifyOptions.theme,
      defaultTheme: dark ? "dark" : "light",
    };
  });
});
