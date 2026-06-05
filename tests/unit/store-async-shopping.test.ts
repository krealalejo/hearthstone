import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";

vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("$fetch", vi.fn());

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
    vi.mocked($fetch)
      .mockResolvedValueOnce(histEntry as never)
      .mockResolvedValueOnce({} as never);

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
});
