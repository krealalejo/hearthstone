import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";
import { readFileSync } from "fs";
import { resolve } from "path";

vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("$fetch", vi.fn());

describe("home store — API-backed (no seed / no localStorage)", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
  });

  // ── Initial state ──

  it("tasks initializes as empty array", () => {
    const store = useHomeStore();
    expect(store.tasks).toEqual([]);
  });

  it("members initializes as empty array", () => {
    const store = useHomeStore();
    expect(store.members).toEqual([]);
  });

  it("inventory initializes as empty array", () => {
    const store = useHomeStore();
    expect(store.inventory).toEqual([]);
  });

  it("authed initializes as false", () => {
    const store = useHomeStore();
    expect(store.authed).toBe(false);
  });

  // ── Hydration setters ──

  it("setTasks sets store.tasks", () => {
    const store = useHomeStore();
    const tasks = [
      {
        id: "1",
        title: "Clean",
        desc: "",
        roomId: "kitchen",
        assignee: null,
        xp: 10,
        recurring: false,
        done: false,
        doneBy: null,
      },
    ];
    store.setTasks(tasks);
    expect(store.tasks).toEqual(tasks);
  });

  it("setMembers sets store.members", () => {
    const store = useHomeStore();
    const members = [
      {
        id: "u1",
        name: "Alex",
        email: "alex@example.com",
        role: "admin" as const,
        status: "active" as const,
        weekXp: 0,
        totalXp: 0,
      },
    ];
    store.setMembers(members);
    expect(store.members).toEqual(members);
  });

  it("setCurrentUser sets currentUser, currentUserId, and authed=true", () => {
    const store = useHomeStore();
    store.setCurrentUser({ id: "u1", name: "Alex", role: "admin" });
    expect(store.currentUser).toBe("Alex");
    expect(store.currentUserId).toBe("u1");
    expect(store.authed).toBe(true);
  });

  it("login calls /api/auth/login POST", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any).mockResolvedValue({});
    const store = useHomeStore();

    await store.login("user@test.com", "pw123");

    expect($fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
  });

  it("logout calls /api/auth/logout and navigates", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any).mockResolvedValue({});
    const store = useHomeStore();

    await store.logout();

    expect($fetch).toHaveBeenCalledWith("/api/auth/logout", expect.objectContaining({ method: "POST" }));
  });

  it("logout still completes when $fetch throws", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any).mockRejectedValue(new Error("network error"));
    const store = useHomeStore();

    await expect(store.logout()).resolves.toBeUndefined();
  });

  it("weekKey getter returns sunday-start key when weekStartDay is sunday", () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠", weekStartDay: "sunday" };
    const key = store.weekKey;
    expect(key).toMatch(/^S-\d{4}-\d{2}-\d{2}$/);
  });

  // ── Source-level checks (DATA-03) ──

  it("home.ts source does not contain 'seed('", () => {
    const src = readFileSync(
      resolve(process.cwd(), "app/stores/home.ts"),
      "utf-8",
    );
    expect(src).not.toContain("seed(");
  });

  it("home.ts source does not contain 'quiethome.v2'", () => {
    const src = readFileSync(
      resolve(process.cwd(), "app/stores/home.ts"),
      "utf-8",
    );
    expect(src).not.toContain("quiethome.v2");
  });

  it("home.ts source does not contain 'localStorage'", () => {
    const src = readFileSync(
      resolve(process.cwd(), "app/stores/home.ts"),
      "utf-8",
    );
    expect(src).not.toContain("localStorage");
  });
});
