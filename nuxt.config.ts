// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: "2025-06-01",

  runtimeConfig: {
    mongoUri: "", // overridden by NUXT_MONGO_URI in .env
    jwtSecret: "", // overridden by NUXT_JWT_SECRET in .env
    googleClientId: "", // overridden by NUXT_GOOGLE_CLIENT_ID in .env
    googleClientSecret: "", // overridden by NUXT_GOOGLE_CLIENT_SECRET in .env
    googleRedirectUri: "", // overridden by NUXT_GOOGLE_REDIRECT_URI in .env
  },

  devtools: { enabled: true },

  modules: ["@pinia/nuxt", "vuetify-nuxt-module", "@nuxtjs/i18n"],

  i18n: {
    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "es", name: "Español", file: "es.json" },
      { code: "ca", name: "Català", file: "ca.json" },
    ],
    langDir: "locales",
    defaultLocale: "en",
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: false,
      redirectOn: "root",
      alwaysRedirect: false,
    },
  },

  vuetify: {
    moduleOptions: {
      importComposables: true,
    },
    vuetifyOptions: {
      theme: {
        defaultTheme: "light",
        themes: {
          light: {
            dark: false,
            colors: {
              primary: "#6fa88a",
              "primary-darken-1": "#4a7a64",
              secondary: "#8c8070",
              background: "#f9f5f0",
              surface: "#fdfcfb",
              error: "#c0573b",
              info: "#5b8fa8",
              success: "#5a9a72",
              warning: "#b87c3a",
            },
          },
          dark: {
            dark: true,
            colors: {
              primary: "#7ec4a0",
              "primary-darken-1": "#5a9a78",
              secondary: "#a89d8a",
              background: "#2e2925",
              surface: "#3a342e",
              error: "#e07b60",
              info: "#7ab0cc",
              success: "#7abf90",
              warning: "#d49a5a",
            },
          },
        },
      },
      defaults: {
        VDialog: { maxWidth: 480 },
        VBtn: { variant: "flat", rounded: "sm" },
        VTextField: {
          variant: "outlined",
          density: "compact",
          hideDetails: "auto",
        },
        VTextarea: {
          variant: "outlined",
          density: "compact",
          hideDetails: "auto",
        },
        VSelect: {
          variant: "outlined",
          density: "compact",
          hideDetails: "auto",
        },
      },
    },
  },

  css: ["~/assets/css/tokens.css", "~/assets/css/components.css"],

  app: {
    head: {
      title: "Hearthstone — Home Dashboard",
      script: [
        {
          innerHTML: `(function(){var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.theme=d?'dark':'light';})();`,
          type: "text/javascript",
        },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/favicon.png" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Hanken+Grotesque:wght@400;500;600;700&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700&family=Spectral:wght@400;500;600&family=Mulish:wght@400;500;600;700&display=swap",
          media: "print",
          onload: "this.media='all'",
        },
      ],
    },
    pageTransition: { name: "page", mode: "out-in" },
  },
});
