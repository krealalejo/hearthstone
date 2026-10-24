import { nativeBridge } from "~/utils/nativeBridge";

const VERIFIER_KEY = "google_signin_verifier";
const APP_AUTH_URL_PREFIX = "com.heartshtone.app://auth";

function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createPkcePair() {
  const verifier = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return { verifier, challenge: toBase64Url(new Uint8Array(digest)) };
}

export function useNativeGoogleSignIn() {
  function isNativeApp(): boolean {
    return nativeBridge() !== undefined;
  }

  async function start() {
    const bridge = nativeBridge();
    if (!bridge) return;
    const { verifier, challenge } = await createPkcePair();
    localStorage.setItem(VERIFIER_KEY, verifier);
    const url = new URL("/api/auth/google", window.location.origin);
    url.searchParams.set("challenge", challenge);
    await bridge.Plugins.Browser.open({ url: url.toString() });
  }

  async function complete(appUrl: string) {
    if (!appUrl.startsWith(APP_AUTH_URL_PREFIX)) return;
    const token = new URL(appUrl).searchParams.get("token");
    const verifier = localStorage.getItem(VERIFIER_KEY);
    if (!token || !verifier) return;
    localStorage.removeItem(VERIFIER_KEY);
    await nativeBridge()?.Plugins.Browser.close().catch(() => undefined);
    await $fetch("/api/auth/google/app-exchange", {
      method: "POST",
      body: { token, verifier },
    });
    window.location.replace("/dashboard");
  }

  async function listen() {
    const bridge = nativeBridge();
    if (!bridge) return;
    await bridge.Plugins.App.addListener("appUrlOpen", ({ url }) => {
      complete(url);
    });
    const launch = await bridge.Plugins.App.getLaunchUrl();
    if (launch?.url) await complete(launch.url);
  }

  return { isNativeApp, start, listen };
}
