interface NativeListenerHandle {
  remove: () => Promise<void>;
}

export interface CapacitorBridge {
  isNativePlatform: () => boolean;
  Plugins: {
    Browser: {
      open: (options: { url: string }) => Promise<void>;
      close: () => Promise<void>;
    };
    App: {
      addListener: (
        event: "appUrlOpen",
        handler: (data: { url: string }) => void,
      ) => Promise<NativeListenerHandle>;
      getLaunchUrl: () => Promise<{ url: string } | undefined>;
    };
    SystemBars: {
      setStyle: (options: { style: "DARK" | "LIGHT" }) => Promise<void>;
    };
    PushNotifications?: PushNotificationsPlugin;
  };
}

export interface PushNotificationsPlugin {
  requestPermissions: () => Promise<{ receive: string }>;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  addListener(
    event: "registration",
    handler: (token: { value: string }) => void,
  ): Promise<NativeListenerHandle>;
  addListener(
    event: "registrationError",
    handler: (error: { error: string }) => void,
  ): Promise<NativeListenerHandle>;
  addListener(
    event: "pushNotificationActionPerformed",
    handler: (action: {
      notification: { data?: Record<string, string> };
    }) => void,
  ): Promise<NativeListenerHandle>;
}

export function nativeBridge(): CapacitorBridge | undefined {
  if (!import.meta.client) return undefined;
  const bridge = (window as unknown as { Capacitor?: CapacitorBridge })
    .Capacitor;
  return bridge?.isNativePlatform() ? bridge : undefined;
}
