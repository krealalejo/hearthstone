import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { flushPromises } from "@vue/test-utils";
import { mockNuxtImport, mountSuspended } from "@nuxt/test-utils/runtime";
import { useHomeStore, type AppNotification } from "~/stores/home";
import {
  pushPlugin,
  unregisterPushDevice,
  usePushNotifications,
} from "~/composables/usePushNotifications";

mockNuxtImport("$fetch", () => vi.fn());

const { mockNavigateTo } = vi.hoisted(() => ({ mockNavigateTo: vi.fn() }));
mockNuxtImport("navigateTo", () => mockNavigateTo);

type Listener = (payload: never) => void;

function installPlugin({
  permission = "granted",
  registrationError = "",
}: { permission?: string; registrationError?: string } = {}) {
  const listeners: Record<string, Listener> = {};
  const removed: string[] = [];
  const plugin = {
    requestPermissions: vi.fn().mockResolvedValue({ receive: permission }),
    register: vi.fn(async () => {
      if (registrationError)
        listeners.registrationError?.({ error: registrationError } as never);
      else listeners.registration?.({ value: "fcm-token" } as never);
    }),
    unregister: vi.fn().mockResolvedValue(undefined),
    addListener: vi.fn(async (event: string, handler: Listener) => {
      listeners[event] = handler;
      return { remove: vi.fn(async () => void removed.push(event)) };
    }),
  };
  (window as unknown as { Capacitor?: unknown }).Capacitor = {
    isNativePlatform: () => true,
    Plugins: { PushNotifications: plugin },
  };
  return { plugin, listeners, removed };
}

function notification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: "n1",
    type: "week-reminder",
    data: { mine: 2, unassigned: 1 },
    readAt: null,
    createdAt: "2026-11-06T09:00:00.000Z",
    ...overrides,
  };
}

beforeAll(() => {
  if (!globalThis.visualViewport) {
    Object.defineProperty(globalThis, "visualViewport", {
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        width: 1024,
        height: 768,
        offsetLeft: 0,
        offsetTop: 0,
        scale: 1,
        pageLeft: 0,
        pageTop: 0,
      },
      writable: true,
    });
  }
});

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
  localStorage.clear();
});

afterEach(() => {
  delete (window as unknown as { Capacitor?: unknown }).Capacitor;
});

describe("store notifications", () => {
  it("counts unread notifications", () => {
    const store = useHomeStore();
    store.setNotifications([
      notification(),
      notification({ id: "n2", readAt: "2026-11-06T10:00:00.000Z" }),
    ]);
    expect(store.unreadNotifications).toBe(1);
  });

  it("marks unread notifications as read", async () => {
    vi.mocked($fetch).mockResolvedValue({ ok: true });
    const store = useHomeStore();
    store.setNotifications([notification()]);
    await store.markNotificationsRead();
    expect(store.notifications[0]!.readAt).not.toBeNull();
    expect($fetch).toHaveBeenCalledWith("/api/notifications", {
      method: "PATCH",
    });
  });

  it("does nothing when everything is read", async () => {
    const store = useHomeStore();
    store.setNotifications([notification({ readAt: "x" })]);
    await store.markNotificationsRead();
    expect($fetch).not.toHaveBeenCalled();
  });

  it("reverts and toasts when marking read fails", async () => {
    vi.mocked($fetch).mockRejectedValue(new Error("down"));
    const store = useHomeStore();
    store.setNotifications([notification()]);
    await store.markNotificationsRead();
    expect(store.notifications[0]!.readAt).toBeNull();
    expect(store.toasts).toHaveLength(1);
  });
});

describe("store syncTimezone", () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  it("saves the browser timezone when it differs", async () => {
    vi.mocked($fetch).mockResolvedValue({});
    const store = useHomeStore();
    store.setHousehold({ id: "hh1", name: "Home", emoji: "", timezone: "x" });
    await store.syncTimezone();
    expect(store.household.timezone).toBe(timezone);
    expect($fetch).toHaveBeenCalledWith("/api/household", {
      method: "PATCH",
      body: { timezone },
    });
  });

  it("skips the request when the timezone is unchanged", async () => {
    const store = useHomeStore();
    store.setHousehold({ id: "hh1", name: "Home", emoji: "", timezone });
    await store.syncTimezone();
    expect($fetch).not.toHaveBeenCalled();
  });

  it("restores the previous timezone when saving fails", async () => {
    vi.mocked($fetch).mockRejectedValue(new Error("down"));
    const store = useHomeStore();
    store.setHousehold({ id: "hh1", name: "Home", emoji: "", timezone: "x" });
    await store.syncTimezone();
    expect(store.household.timezone).toBe("x");
  });
});

describe("store logout", () => {
  it("unregisters the device before logging out", async () => {
    vi.mocked($fetch).mockResolvedValue({});
    localStorage.setItem("pushToken", "fcm-token");
    const assign = vi.fn();
    vi.stubGlobal("location", { ...globalThis.location, assign });
    try {
      await useHomeStore().logout();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(vi.mocked($fetch).mock.calls.map((c) => c[0])).toEqual([
      "/api/push/devices",
      "/api/auth/logout",
    ]);
    expect(localStorage.getItem("pushToken")).toBeNull();
  });
});

describe("usePushNotifications", () => {
  it("is unsupported without the native plugin", async () => {
    expect(pushPlugin()).toBeUndefined();
    const push = usePushNotifications();
    expect(push.supported).toBe(false);
    expect(await push.toggle()).toBe("disabled");
  });

  it("registers the device and stores the token", async () => {
    vi.mocked($fetch).mockResolvedValue({ ok: true });
    const { removed } = installPlugin();
    const push = usePushNotifications();
    expect(push.supported).toBe(true);
    expect(await push.toggle()).toBe("enabled");
    expect(push.enabled.value).toBe(true);
    expect(push.busy.value).toBe(false);
    expect($fetch).toHaveBeenCalledWith("/api/push/devices", {
      method: "POST",
      body: { token: "fcm-token" },
    });
    expect(localStorage.getItem("pushToken")).toBe("fcm-token");
    expect(removed.sort()).toEqual(["registration", "registrationError"]);
  });

  it("stays off when permission is denied", async () => {
    const { plugin } = installPlugin({ permission: "denied" });
    const push = usePushNotifications();
    expect(await push.toggle()).toBe("denied");
    expect(push.enabled.value).toBe(false);
    expect(plugin.register).not.toHaveBeenCalled();
  });

  it("propagates registration errors", async () => {
    installPlugin({ registrationError: "no play services" });
    const push = usePushNotifications();
    await expect(push.toggle()).rejects.toThrow("no play services");
    expect(push.enabled.value).toBe(false);
    expect(push.busy.value).toBe(false);
  });

  it("unregisters when toggled off", async () => {
    vi.mocked($fetch).mockResolvedValue({ ok: true });
    const { plugin } = installPlugin();
    localStorage.setItem("pushToken", "fcm-token");
    const push = usePushNotifications();
    expect(push.enabled.value).toBe(true);
    expect(await push.toggle()).toBe("disabled");
    expect($fetch).toHaveBeenCalledWith("/api/push/devices", {
      method: "DELETE",
      body: { token: "fcm-token" },
    });
    expect(plugin.unregister).toHaveBeenCalled();
    expect(localStorage.getItem("pushToken")).toBeNull();
  });

  it("does nothing on unregister without a stored token", async () => {
    await unregisterPushDevice();
    expect($fetch).not.toHaveBeenCalled();
  });

  it("survives unavailable storage", async () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    vi.mocked($fetch).mockResolvedValue({ ok: true });
    installPlugin();
    try {
      const push = usePushNotifications();
      expect(push.enabled.value).toBe(false);
      expect(await push.toggle()).toBe("enabled");
    } finally {
      getItem.mockRestore();
      setItem.mockRestore();
    }
  });
});

describe("NotificationBell", () => {
  async function mountBell() {
    const { default: Component } = await import(
      "~/components/NotificationBell.vue"
    );
    const wrapper = await mountSuspended(Component, {
      attachTo: document.body,
    });
    const store = useHomeStore();
    store.setNotifications([]);
    store.toasts = [];
    return wrapper;
  }

  async function openPanel(wrapper: Awaited<ReturnType<typeof mountBell>>) {
    await wrapper.find("button.bell").trigger("click");
    await flushPromises();
  }

  it("shows the unread badge", async () => {
    const wrapper = await mountBell();
    useHomeStore().setNotifications([
      notification(),
      notification({ id: "n2" }),
    ]);
    await flushPromises();
    expect(wrapper.find(".bell-badge").text()).toBe("2");
    wrapper.unmount();
  });

  it("hides the badge when everything is read", async () => {
    const wrapper = await mountBell();
    useHomeStore().setNotifications([notification({ readAt: "x" })]);
    await flushPromises();
    expect(wrapper.find(".bell-badge").exists()).toBe(false);
    wrapper.unmount();
  });

  it("lists notifications, marks them read on open and links to to-dos", async () => {
    vi.mocked($fetch).mockResolvedValue({ ok: true });
    const wrapper = await mountBell();
    const store = useHomeStore();
    store.setNotifications([
      notification(),
      notification({
        id: "n2",
        data: { mine: 0, unassigned: 1 },
        readAt: "2026-10-30T09:00:00.000Z",
      }),
    ]);
    await openPanel(wrapper);

    const items = document.querySelectorAll(".bell-item");
    expect(items).toHaveLength(2);
    expect(items[0]!.textContent).toContain("2 days left this week");
    expect(items[0]!.textContent).toContain(
      "2 tasks assigned to you · 1 unassigned task",
    );
    expect(items[1]!.textContent).toContain("1 unassigned task");
    expect(items[1]!.textContent).not.toContain("assigned to you");
    expect(items[0]!.classList.contains("unread")).toBe(true);
    expect(items[1]!.classList.contains("unread")).toBe(false);
    expect(store.unreadNotifications).toBe(0);
    expect(document.querySelector(".bell-push")).toBeNull();

    (items[0] as HTMLElement).click();
    expect(mockNavigateTo).toHaveBeenCalledWith("/todos");
    wrapper.unmount();
  });

  it("shows the empty state", async () => {
    const wrapper = await mountBell();
    await openPanel(wrapper);
    expect(document.querySelector(".bell-empty")?.textContent).toContain(
      "No notifications yet",
    );
    wrapper.unmount();
  });

  it("shows the push switch on Android and toasts when denied", async () => {
    installPlugin({ permission: "denied" });
    const wrapper = await mountBell();
    const store = useHomeStore();
    await openPanel(wrapper);
    const input = document.querySelector<HTMLInputElement>(".bell-push input");
    expect(input).not.toBeNull();
    input!.click();
    await flushPromises();
    expect(store.toasts[0]?.title).toBe(
      "Notifications are blocked for this app",
    );
    wrapper.unmount();
  });

  it("toasts when the push toggle fails", async () => {
    installPlugin({ registrationError: "boom" });
    const wrapper = await mountBell();
    const store = useHomeStore();
    await openPanel(wrapper);
    document.querySelector<HTMLInputElement>(".bell-push input")!.click();
    await flushPromises();
    expect(store.toasts[0]?.title).toBe("Could not update push notifications");
    wrapper.unmount();
  });
});
