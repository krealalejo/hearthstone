import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.heartshtone.app",
  appName: "Hearth",
  webDir: "dist",
  // POC loads the live Nuxt dev server (SSR + API + Mongo) instead of the
  // static `dist` bundle, since auth/inventory/etc need the server backend.
  // Forwarded via `adb reverse tcp:3000 tcp:3000` so the emulator's
  // localhost:3000 maps straight to the host machine's dev server.
  // Use your machine's LAN IP instead when testing on a physical device.
  server: {
    url: "http://localhost:3000",
    cleartext: true,
  },
};

export default config;
