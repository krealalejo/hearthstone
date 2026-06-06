import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";

vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("$fetch", vi.fn());

function makeFetch(returnValue: unknown = {}) {
  return (vi.mocked($fetch) as any).mockResolvedValue(returnValue);
}

function makeFetchFail(statusCode = 500) {
  const err = Object.assign(new Error("fetch failed"), { statusCode });
  return vi.mocked($fetch).mockRejectedValue(err);
}

function baseMember(overrides = {}) {
  return {
    id: "u1",
    name: "Alice",
    email: "alice@example.com",
    role: "admin" as const,
    status: "active" as const,
    weekXp: 0,
    totalXp: 0,
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
  if (document.documentElement.style.getPropertyValue("--accent")) {
    document.documentElement.style.removeProperty("--accent");
  }
});

describe("saveSettings", () => {
  it("does nothing when current user is not a member", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.currentUserId = "missing";
    store.members = [baseMember({ id: "u1" })];

    await store.saveSettings({
      name: "Bob",
      accentColor: "#fff",
      avatarEmoji: "🐶",
      avatarImage: "",
    });

    expect($fetch).not.toHaveBeenCalled();
    expect(store.members[0]!.name).toBe("Alice");
  });

  it("updates member, household, applies accent color, and toasts on success", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.currentUser = "Alice";
    store.members = [baseMember()];
    store.household = {
      id: "hh1",
      name: "Home",
      emoji: "🏠",
      weekStartDay: "monday",
      currency: "$",
    } as any;

    await store.saveSettings({
      name: "Alicia",
      accentColor: "#ff0000",
      avatarEmoji: "🐱",
      avatarImage: "img.png",
      weekStartDay: "sunday",
      currency: "EUR",
      locale: "es",
    });

    expect(store.members[0]!.name).toBe("Alicia");
    expect(store.members[0]!.accentColor).toBe("#ff0000");
    expect(store.members[0]!.avatarEmoji).toBe("🐱");
    expect(store.members[0]!.avatarImage).toBe("img.png");
    expect(store.members[0]!.locale).toBe("es");
    expect(store.currentUser).toBe("Alicia");
    expect(store.household.weekStartDay).toBe("sunday");
    expect(store.household.currency).toBe("EUR");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(
      "#ff0000",
    );
    expect($fetch).toHaveBeenCalledWith(
      "/api/members",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect($fetch).toHaveBeenCalledWith(
      "/api/household",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(store.toasts[0]!.title).toBe("Settings saved");
  });

  it("rolls back member, household, and accent color on failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.currentUser = "Alice";
    store.members = [baseMember({ accentColor: "#000000" })];
    store.household = {
      id: "hh1",
      name: "Home",
      emoji: "🏠",
      weekStartDay: "monday",
      currency: "$",
    } as any;

    await store.saveSettings({
      name: "Alicia",
      accentColor: "#ff0000",
      avatarEmoji: "🐱",
      avatarImage: "img.png",
      weekStartDay: "sunday",
      currency: "EUR",
    });

    expect(store.members[0]!.name).toBe("Alice");
    expect(store.members[0]!.accentColor).toBe("#000000");
    expect(store.currentUser).toBe("Alice");
    expect(store.household.weekStartDay).toBe("monday");
    expect(store.household.currency).toBe("$");
    expect(document.documentElement.style.getPropertyValue("--accent")).toBe(
      "#000000",
    );
    expect(store.toasts[0]!.title).toBe("Save failed");
  });

  it("calls _handle401 when save fails with 401", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember()];
    store.household = { id: "hh1", name: "Home", emoji: "🏠" } as any;
    const handle401 = vi
      .spyOn(store, "_handle401")
      .mockResolvedValue(undefined as any);

    await store.saveSettings({
      name: "Alicia",
      accentColor: "",
      avatarEmoji: "",
      avatarImage: "",
    });

    expect(handle401).toHaveBeenCalled();
  });
});

describe("applyAccentColor", () => {
  it("sets accent custom properties when member has accentColor", () => {
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember({ accentColor: "#123456" })];

    store.applyAccentColor();

    const root = document.documentElement.style;
    expect(root.getPropertyValue("--accent")).toBe("#123456");
    expect(root.getPropertyValue("--accent-soft")).toContain("#123456");
    expect(root.getPropertyValue("--accent-soft-2")).toContain("#123456");
    expect(root.getPropertyValue("--accent-ink")).toContain("#123456");
  });

  it("removes accent custom properties when member has no accentColor", () => {
    const store = useHomeStore();
    store.currentUserId = "u1";
    store.members = [baseMember({ accentColor: undefined })];
    document.documentElement.style.setProperty("--accent", "#abcdef");

    store.applyAccentColor();

    const root = document.documentElement.style;
    expect(root.getPropertyValue("--accent")).toBe("");
    expect(root.getPropertyValue("--accent-soft")).toBe("");
    expect(root.getPropertyValue("--accent-soft-2")).toBe("");
    expect(root.getPropertyValue("--accent-ink")).toBe("");
  });
});
