import type { CapacitorConfig } from "@capacitor/cli";

const isDev = process.env.CAP_ENV === "dev";

const config: CapacitorConfig = {
  appId: "com.heartshtone.app",
  appName: "Hearth",
  webDir: "dist",
  server: isDev
    ? {
        url: "http://localhost:3000",
        cleartext: true,
      }
    : {
        url: "https://hearthstone-coral.vercel.app",
        androidScheme: "https",
      },
};

export default config;
