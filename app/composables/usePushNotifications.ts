import { ref } from "vue";
import { api } from "~/utils/api";
import {
  nativeBridge,
  type PushNotificationsPlugin,
} from "~/utils/nativeBridge";

const TOKEN_KEY = "pushToken";

export type PushToggleResult = "enabled" | "disabled" | "denied";

export function pushPlugin(): PushNotificationsPlugin | undefined {
  return nativeBridge()?.Plugins.PushNotifications;
}

function storedToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
}

async function fetchToken(plugin: PushNotificationsPlugin): Promise<string> {
  const handles: ReturnType<PushNotificationsPlugin["addListener"]>[] = [];
  try {
    const token = new Promise<string>((resolve, reject) => {
      handles.push(
        plugin.addListener("registration", (t) => resolve(t.value)),
        plugin.addListener("registrationError", (e) =>
          reject(new Error(e.error)),
        ),
      );
    });
    await plugin.register();
    return await token;
  } finally {
    for (const handle of await Promise.all(handles)) await handle.remove();
  }
}

export async function unregisterPushDevice() {
  const token = storedToken();
  if (!token) return;
  storeToken(null);
  await api("/api/push/devices", { method: "DELETE", body: { token } }).catch(
    () => null,
  );
  await pushPlugin()
    ?.unregister()
    .catch(() => null);
}

export function usePushNotifications() {
  const supported = Boolean(pushPlugin());
  const enabled = ref(Boolean(storedToken()));
  const busy = ref(false);

  async function enable(): Promise<PushToggleResult> {
    const plugin = pushPlugin();
    if (!plugin) return "disabled";
    const permission = await plugin.requestPermissions();
    if (permission.receive !== "granted") return "denied";
    const token = await fetchToken(plugin);
    await api("/api/push/devices", { method: "POST", body: { token } });
    storeToken(token);
    return "enabled";
  }

  async function toggle(): Promise<PushToggleResult> {
    busy.value = true;
    try {
      if (enabled.value) {
        await unregisterPushDevice();
        enabled.value = false;
        return "disabled";
      }
      const result = await enable();
      enabled.value = result === "enabled";
      return result;
    } finally {
      busy.value = false;
    }
  }

  return { supported, enabled, busy, toggle };
}
