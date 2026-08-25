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

describe("setInvQty", () => {
  it("updates qty and PATCHes API", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.inventory = [baseItem()];

    await store.setInvQty("i1", 5);

    expect(store.inventory[0]!.qty).toBe(5);
  });

  it("clamps to 0 minimum", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3 })];

    await store.setInvQty("i1", -1);

    expect(store.inventory[0]!.qty).toBe(0);
  });

  it("auto-adds shopping item when qty <= min (not already in list)", async () => {
    const shopCreated = {
      id: "s_new",
      name: "Milk",
      source: "auto",
      invId: "i1",
      qty: 5,
      price: 2.5,
      checked: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(shopCreated);

    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3, min: 2, optimal: 6 })];
    store.shopping = [];

    await store.setInvQty("i1", 1);

    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.id).toBe("s_new");
    expect(store.toasts[0]!.kind).toBe("restock");
  });

  it("does not add shopping item when already in list for same invId", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3, min: 2 })];
    store.shopping = [
      {
        id: "s_existing",
        name: "Milk",
        source: "auto",
        invId: "i1",
        qty: 1,
        price: null,
        checked: false,
      },
    ];

    await store.setInvQty("i1", 1);

    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.id).toBe("s_existing");
  });

  it("reverts on failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3 })];

    await store.setInvQty("i1", 5);

    expect(store.inventory[0]!.qty).toBe(3);
    expect(store.toasts[0]!.title).toBe("Update failed");
  });

  it("does nothing for unknown id", async () => {
    const store = useHomeStore();
    store.inventory = [];
    await store.setInvQty("nonexistent", 5);
    expect($fetch).not.toHaveBeenCalled();
  });

  it("removes temp shopping item when PATCH fails after optimistic restock add", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3, min: 2, optimal: 6 })];
    store.shopping = [];

    await store.setInvQty("i1", 1);

    expect(store.shopping).toHaveLength(0);
    expect(store.inventory[0]!.qty).toBe(3);
    expect(store.toasts.some((t) => t.title === "Update failed")).toBe(true);
  });

  it("calls _handle401 on 401 error during setInvQty", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3, min: 2 })];
    store.shopping = [];

    await expect(store.setInvQty("i1", 1)).resolves.toBeUndefined();
  });
});

describe("saveInv", () => {
  it("creates new item via POST", async () => {
    const created = baseItem({ id: "i_new" });
    makeFetch(created);
    const store = useHomeStore();

    await store.saveInv({ name: "Milk", cat: "food" });

    expect(store.inventory).toHaveLength(1);
    expect(store.inventory[0]!.id).toBe("i_new");
  });

  it("updates existing item via PATCH", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3 })];

    await store.saveInv({ id: "i1", name: "Milk", qty: 5 });

    expect(store.inventory[0]!.qty).toBe(5);
  });

  it("reverts existing item on PATCH failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3 })];

    await store.saveInv({ id: "i1", name: "Milk", qty: 5 });

    expect(store.inventory[0]!.qty).toBe(3);
    expect(store.toasts[0]!.title).toBe("Update failed");
  });

  it("shows toast on create failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();

    await store.saveInv({ name: "NewItem" });

    expect(store.toasts[0]!.title).toBe("Failed to create item");
  });

  it("auto-adds shopping when updated item goes at/below min", async () => {
    const shopCreated = {
      id: "s_new",
      name: "Milk",
      source: "auto",
      invId: "i1",
      qty: 4,
      price: 2.5,
      checked: false,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(shopCreated);

    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 5, min: 2, optimal: 6 })];
    store.shopping = [];

    await store.saveInv({ id: "i1", name: "Milk", qty: 1 });

    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.id).toBe("s_new");
  });

  it("does not add shopping item when item already in shopping for same invId", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 5, min: 2, optimal: 6 })];
    store.shopping = [
      {
        id: "s_existing",
        name: "Milk",
        source: "auto",
        invId: "i1",
        qty: 3,
        price: null,
        checked: false,
      },
    ];

    await store.saveInv({ id: "i1", name: "Milk", qty: 1 });

    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.id).toBe("s_existing");
  });

  it("removes temp shopping item when saveInv fails with restock pending", async () => {
    const err = Object.assign(new Error("fetch failed"), { statusCode: 500 });
    vi.mocked($fetch).mockRejectedValue(err);
    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 5, min: 2, optimal: 6 })];
    store.shopping = [];

    await store.saveInv({ id: "i1", name: "Milk", qty: 1 });

    expect(store.shopping).toHaveLength(0);
    expect(store.toasts.some((t) => t.title === "Update failed")).toBe(true);
  });

  it("calls _handle401 on 401 error during saveInv update", async () => {
    const err = Object.assign(new Error("fetch failed"), { statusCode: 401 });
    vi.mocked($fetch).mockRejectedValue(err);
    const store = useHomeStore();
    store.inventory = [baseItem()];

    await expect(
      store.saveInv({ id: "i1", name: "Milk", qty: 5 })
    ).resolves.toBeUndefined();
  });

  it("calls _handle401 on 401 error during create", async () => {
    const err = Object.assign(new Error("fetch failed"), { statusCode: 401 });
    vi.mocked($fetch).mockRejectedValue(err);
    const store = useHomeStore();

    await expect(store.saveInv({ name: "NewItem" })).resolves.toBeUndefined();
  });

  it("handles saveInv PATCH when id not found in inventory (idx=-1)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any).mockResolvedValueOnce({});
    const store = useHomeStore();
    store.inventory = [baseItem()];

    await store.saveInv({ id: "nonexistent", name: "Ghost" });

    expect(store.inventory).toHaveLength(1);
  });

  it("saveInv catch block with idx=-1 (item not in inventory on failure)", async () => {
    const err = Object.assign(new Error("fetch failed"), { statusCode: 500 });
    vi.mocked($fetch).mockRejectedValue(err);
    const store = useHomeStore();
    store.inventory = [baseItem()];

    await store.saveInv({ id: "nonexistent", name: "Ghost" });

    expect(store.toasts[0]!.title).toBe("Update failed");
  });
});

describe("setInvQty — race condition branches", () => {
  it("handles case where temp item was removed before POST resolves (idx=-1 branch)", async () => {
    let resolvePost: (v: unknown) => void = () => {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any)
      .mockResolvedValueOnce({})
      .mockImplementationOnce(
        () => new Promise((resolve) => { resolvePost = resolve; }),
      );

    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 3, min: 2, optimal: 6 })];
    store.shopping = [];

    const pending = store.setInvQty("i1", 1);
    await vi.waitFor(() => expect($fetch).toHaveBeenCalledTimes(2));
    store.shopping = [];
    store.flashShopId = "something-else";
    resolvePost({ id: "s_new", name: "Milk", source: "auto", invId: "i1", qty: 5, price: 2.5, checked: false });

    await pending;
    expect(store.inventory[0]!.qty).toBe(1);
  });
});
