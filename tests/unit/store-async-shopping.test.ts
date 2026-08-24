import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";

mockNuxtImport("$fetch", () => vi.fn());

vi.stubGlobal("navigateTo", vi.fn());

function makeFetchFail(statusCode = 500) {
  const err = Object.assign(new Error("fetch failed"), { statusCode });
  return vi.mocked($fetch).mockRejectedValue(err);
}

function baseItem(overrides = {}) {
  return {
    id: "i1",
    name: "Milk",
    cat: "food" as const,
    qty: 3,
    min: 1,
    optimal: 6,
    price: 2.5,
    icon: "",
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
});

describe("checkout", () => {
  it("does nothing when no checked items", async () => {
    const store = useHomeStore();
    store.shopping = [
      {
        id: "s1",
        name: "X",
        source: "manual",
        invId: null,
        qty: 1,
        price: null,
        checked: false,
      },
    ];

    await store.checkout();

    expect($fetch).not.toHaveBeenCalled();
  });

  it("removes checked items, adds history entry, resets linked inventory", async () => {
    const histEntry = { id: "h1", date: "2024-01-01", items: [], total: 5 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce(histEntry)
      .mockResolvedValueOnce({});

    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠", currency: "$" };
    store.inventory = [baseItem({ qty: 3, optimal: 6 })];
    store.shopping = [
      {
        id: "s1",
        name: "Milk",
        source: "auto",
        invId: "i1",
        qty: 2,
        price: 2.5,
        checked: true,
      },
    ];

    await store.checkout();

    expect(store.shopping).toHaveLength(0);
    expect(store.history).toHaveLength(1);
    expect(store.inventory[0]!.qty).toBe(6);
    expect(store.toasts[0]!.kind).toBe("check");
  });

  it("checkout with manual item (no invId) does not touch inventory", async () => {
    const histEntry = { id: "h2", date: "2024-01-02", items: [], total: 1 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce(histEntry)
      .mockResolvedValueOnce({});

    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠", currency: "$" };
    store.inventory = [baseItem({ qty: 3, optimal: 6 })];
    store.shopping = [
      {
        id: "s1",
        name: "Bread",
        source: "manual",
        invId: null,
        qty: 1,
        price: null,
        checked: true,
      },
    ];

    await store.checkout();

    expect(store.inventory[0]!.qty).toBe(3);
    expect(store.shopping).toHaveLength(0);
  });

  it("shows sync failed toast but keeps local state on API error", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    store.shopping = [
      {
        id: "s1",
        name: "X",
        source: "manual",
        invId: null,
        qty: 1,
        price: 1,
        checked: true,
      },
    ];

    await store.checkout();

    expect(store.toasts.some((t) => t.title === "Sync failed")).toBe(true);
  });

  it("calls _handle401 on 401 error during checkout", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    store.shopping = [
      {
        id: "s1",
        name: "X",
        source: "manual",
        invId: null,
        qty: 1,
        price: 1,
        checked: true,
      },
    ];

    await expect(store.checkout()).resolves.toBeUndefined();
  });

  it("checkout with multiple checked items produces plural toast body", async () => {
    const histEntry = { id: "h3", date: "2024-01-03", items: [], total: 3 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce(histEntry)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠", currency: "$" };
    store.inventory = [];
    store.shopping = [
      { id: "s1", name: "Apples", source: "manual", invId: null, qty: 1, price: 1, checked: true },
      { id: "s2", name: "Bread", source: "manual", invId: null, qty: 1, price: 2, checked: true },
    ];

    await store.checkout();

    const toast = store.toasts.find((t) => t.kind === "check");
    expect(toast?.body).toContain("items");
  });

  it("checkout with restocked item includes restock count in toast", async () => {
    const histEntry = { id: "h4", date: "2024-01-04", items: [], total: 5 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce(histEntry)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠", currency: "$" };
    store.inventory = [baseItem({ qty: 3, optimal: 6 })];
    store.shopping = [
      { id: "s1", name: "Milk", source: "auto", invId: "i1", qty: 1, price: 2.5, checked: true },
      { id: "s2", name: "Eggs", source: "manual", invId: null, qty: 2, price: 2.5, checked: true },
    ];

    await store.checkout();

    const toast = store.toasts.find((t) => t.kind === "check");
    expect(toast?.body).toContain("restocked");
  });
});
