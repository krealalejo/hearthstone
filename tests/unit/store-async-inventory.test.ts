import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";

vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("$fetch", vi.fn());

function makeFetch(returnValue: unknown = {}) {
  return vi.mocked($fetch).mockResolvedValue(returnValue as never);
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
    vi.mocked($fetch)
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce(shopCreated as never);

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
    vi.mocked($fetch)
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce(shopCreated as never);

    const store = useHomeStore();
    store.inventory = [baseItem({ qty: 5, min: 2, optimal: 6 })];
    store.shopping = [];

    await store.saveInv({ id: "i1", name: "Milk", qty: 1 });

    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.id).toBe("s_new");
  });
});
