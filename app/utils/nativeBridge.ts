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
  };
}

export function nativeBridge(): CapacitorBridge | undefined {
  if (!import.meta.client) return undefined;
  const bridge = (window as unknown as { Capacitor?: CapacitorBridge })
    .Capacitor;
  return bridge?.isNativePlatform() ? bridge : undefined;
}
