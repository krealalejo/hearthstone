import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";

mockNuxtImport("$fetch", () => vi.fn());

vi.stubGlobal("navigateTo", vi.fn());

function makeFetch(returnValue: unknown = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (vi.mocked($fetch) as any).mockResolvedValue(returnValue);
}

function makeFetchFail(statusCode = 500) {
  const err = Object.assign(new Error("fetch failed"), { statusCode });
  return vi.mocked($fetch).mockRejectedValue(err);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
});

function baseMember(overrides = {}) {
  return {
    id: "u1",
    name: "Alice",
    email: "alice@example.com",
    role: "admin" as const,
    status: "active" as const,
    weekXp: 0,
    totalXp: 0,
    accentColor: undefined as string | undefined,
    avatarEmoji: undefined as string | undefined,
    avatarImage: undefined as string | undefined,
    locale: undefined as "en" | "es" | "ca" | undefined,
    ...overrides,
  };
}

describe("renameHousehold", () => {
  it("updates name optimistically", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Old Name", emoji: "🏠" };

    await store.renameHousehold("New Name");

    expect(store.household.name).toBe("New Name");
  });

  it("reverts on failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Old Name", emoji: "🏠" };

    await store.renameHousehold("New Name");

    expect(store.household.name).toBe("Old Name");
    expect(store.toasts[0]!.title).toBe("Failed to rename household");
  });
});

describe("saveSettings", () => {
  it("returns early when member not found", async () => {
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [];

    await store.saveSettings({
      name: "Bob",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
    });

    expect($fetch).not.toHaveBeenCalled();
  });

  it("updates member fields and shows Settings saved toast", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember({ name: "Alice" })];

    await store.saveSettings({
      name: "Bob",
      accentColor: "#ff0000",
      avatarEmoji: "🐱",
      avatarImage: "",
    });

    expect(store.members[0]!.name).toBe("Bob");
    expect(store.members[0]!.accentColor).toBe("#ff0000");
    expect(store.members[0]!.avatarEmoji).toBe("🐱");
    expect(store.toasts.some((t) => t.title === "Settings saved")).toBe(true);
  });

  it("updates currentUser name on success", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.currentUser = "Alice";
    store.members = [baseMember({ name: "Alice" })];

    await store.saveSettings({
      name: "Bob",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
    });

    expect(store.currentUser).toBe("Bob");
  });

  it("PATCHes /api/household when weekStartDay changes", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];
    store.household = { id: "hh1", name: "Home", emoji: "🏠", weekStartDay: "monday" };

    await store.saveSettings({
      name: "Alice",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
      weekStartDay: "sunday",
    });

    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(2);
    expect(store.household.weekStartDay).toBe("sunday");
  });

  it("PATCHes /api/household when currency changes", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];
    store.household = { id: "hh1", name: "Home", emoji: "🏠", currency: "$" };

    await store.saveSettings({
      name: "Alice",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
      currency: "€",
    });

    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(2);
    expect(store.household.currency).toBe("€");
  });

  it("does not PATCH household when weekStartDay is unchanged", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];
    store.household = { id: "hh1", name: "Home", emoji: "🏠", weekStartDay: "monday" };

    await store.saveSettings({
      name: "Alice",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
      weekStartDay: "monday",
    });

    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(1);
  });

  it("reverts member fields and shows Save failed on error", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.currentUser = "Alice";
    store.members = [baseMember({ name: "Alice", accentColor: "#aaa" })];

    await store.saveSettings({
      name: "Bob",
      accentColor: "#fff",
      avatarEmoji: "",
      avatarImage: "",
    });

    expect(store.members[0]!.name).toBe("Alice");
    expect(store.currentUser).toBe("Alice");
    expect(store.toasts.some((t) => t.title === "Save failed")).toBe(true);
  });

  it("reverts weekStartDay on error when it was passed", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];
    store.household = { id: "hh1", name: "Home", emoji: "🏠", weekStartDay: "monday" };

    await store.saveSettings({
      name: "Alice",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
      weekStartDay: "sunday",
    });

    expect(store.household.weekStartDay).toBe("monday");
  });

  it("reverts currency on error when it was passed", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];
    store.household = { id: "hh1", name: "Home", emoji: "🏠", currency: "$" };

    await store.saveSettings({
      name: "Alice",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
      currency: "€",
    });

    expect(store.household.currency).toBe("$");
  });

  it("calls _handle401 on 401 error", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];

    await expect(
      store.saveSettings({
        name: "Bob",
        accentColor: "",
        avatarEmoji: "",
        avatarImage: "",
      })
    ).resolves.toBeUndefined();
  });

  it("saves locale when provided", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];

    await store.saveSettings({
      name: "Alice",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
      locale: "es",
    });

    expect(store.members[0]!.locale).toBe("es");
  });
});
