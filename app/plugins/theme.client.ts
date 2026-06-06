export default defineNuxtPlugin({
  enforce: "post",
  setup(nuxtApp) {
    const saved = localStorage.getItem("theme");
    const dark = saved
      ? saved === "dark"
      : globalThis.matchMedia("(prefers-color-scheme: dark)").matches;

    const vuetify = nuxtApp.vueApp.config.globalProperties.$vuetify;
    if (vuetify) {
      vuetify.theme.change(dark ? "dark" : "light");
    }
  },
});
