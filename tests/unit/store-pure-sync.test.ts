import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";

mockNuxtImport("$fetch", () => vi.fn());

vi.stubGlobal("navigateTo", vi.fn());

describe("home store — sync actions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked($fetch).mockReset();
    vi.mocked($fetch).mockResolvedValue({ id: "srv_1" } as never);
  });

  it("_toast pushes toast with generated id", () => {
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Hello" });
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0]!.title).toBe("Hello");
    expect(store.toasts[0]!.kind).toBe("info");
    expect(store.toasts[0]!.id).toMatch(/^toast_/);
  });

  it("_toast assigns unique ids for consecutive toasts", () => {
    const store = useHomeStore();
    store._toast({ kind: "info", title: "A" });
    store._toast({ kind: "xp", title: "B" });
    expect(store.toasts[0]!.id).not.toBe(store.toasts[1]!.id);
  });

  it("dismissToast removes toast by id", () => {
    const store = useHomeStore();
    store._toast({ kind: "info", title: "X" });
    const id = store.toasts[0]!.id;
    store.dismissToast(id);
    expect(store.toasts).toHaveLength(0);
  });

  it("dismissToast leaves other toasts intact", () => {
    const store = useHomeStore();
    store._toast({ kind: "info", title: "A" });
    store._toast({ kind: "info", title: "B" });
    const idA = store.toasts[0]!.id;
    store.dismissToast(idA);
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0]!.title).toBe("B");
  });

  it("clearFlash sets flashShopId to null", () => {
    const store = useHomeStore();
    store.flashShopId = "some_id";
    store.clearFlash();
    expect(store.flashShopId).toBeNull();
  });

  it("setInventory sets inventory", () => {
    const store = useHomeStore();
    const items = [
      {
        id: "i1",
        name: "Milk",
        cat: "food" as const,
        qty: 2,
        min: 1,
        optimal: 4,
        price: 3.5,
        icon: "mdi-cup",
      },
    ];
    store.setInventory(items);
    expect(store.inventory).toEqual(items);
  });

  it("setShopping sets shopping", () => {
    const store = useHomeStore();
    const items = [
      {
        id: "s1",
        name: "Eggs",
        source: "manual" as const,
        invId: null,
        qty: 1,
        price: null,
        checked: false,
      },
    ];
    store.setShopping(items);
    expect(store.shopping).toEqual(items);
  });

  it("setHistory sets history", () => {
    const store = useHomeStore();
    const entries = [{ id: "h1", date: "2024-01-01", items: [], total: 0 }];
    store.setHistory(entries);
    expect(store.history).toEqual(entries);
  });

  it("setHousehold sets household", () => {
    const store = useHomeStore();
    store.setHousehold({ id: "hh1", name: "My House", emoji: "🏠" });
    expect(store.household.name).toBe("My House");
    expect(store.household.emoji).toBe("🏠");
  });

  it("deleteInv removes inventory item and linked shopping items", async () => {
    const store = useHomeStore();
    store.inventory = [
      {
        id: "i1",
        name: "Milk",
        cat: "food",
        qty: 2,
        min: 1,
        optimal: 4,
        price: null,
        icon: "",
      },
      {
        id: "i2",
        name: "Bread",
        cat: "food",
        qty: 1,
        min: 0,
        optimal: 2,
        price: null,
        icon: "",
      },
    ];
    store.shopping = [
      {
        id: "s1",
        name: "Milk",
        source: "auto",
        invId: "i1",
        qty: 1,
        price: null,
        checked: false,
      },
      {
        id: "s2",
        name: "Other",
        source: "manual",
        invId: null,
        qty: 1,
        price: null,
        checked: false,
      },
    ];
    await store.deleteInv("i1");
    expect(store.inventory).toHaveLength(1);
    expect(store.inventory[0]!.id).toBe("i2");
    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.id).toBe("s2");
  });

  it("toggleShop flips checked", async () => {
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
    await store.toggleShop("s1");
    expect(store.shopping[0]!.checked).toBe(true);
    await store.toggleShop("s1");
    expect(store.shopping[0]!.checked).toBe(false);
  });

  it("toggleShop does nothing for unknown id", async () => {
    const store = useHomeStore();
    store.shopping = [];
    await store.toggleShop("nonexistent");
    expect(store.shopping).toHaveLength(0);
  });

  it("addManualShop adds item with trimmed name and sets flashShopId", async () => {
    const store = useHomeStore();
    await store.addManualShop("  Eggs  ");
    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.name).toBe("Eggs");
    expect(store.shopping[0]!.source).toBe("manual");
    expect(store.shopping[0]!.checked).toBe(false);
    expect(store.flashShopId).toBe(store.shopping[0]!.id);
  });

  it("addManualShop ignores empty string", async () => {
    const store = useHomeStore();
    await store.addManualShop("   ");
    expect(store.shopping).toHaveLength(0);
  });

  it("setShopQty updates qty, minimum 1", async () => {
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
    await store.setShopQty("s1", 5);
    expect(store.shopping[0]!.qty).toBe(5);
    await store.setShopQty("s1", 0);
    expect(store.shopping[0]!.qty).toBe(1);
    await store.setShopQty("s1", -3);
    expect(store.shopping[0]!.qty).toBe(1);
  });

  it("setShopPrice updates price", async () => {
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
    await store.setShopPrice("s1", 4.99);
    expect(store.shopping[0]!.price).toBe(4.99);
    await store.setShopPrice("s1", null);
    expect(store.shopping[0]!.price).toBeNull();
  });

  it("removeShop removes item by id", async () => {
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
      {
        id: "s2",
        name: "Y",
        source: "manual",
        invId: null,
        qty: 1,
        price: null,
        checked: false,
      },
    ];
    await store.removeShop("s1");
    expect(store.shopping).toHaveLength(1);
    expect(store.shopping[0]!.id).toBe("s2");
  });

  it("invite adds pending member with given email and posts toast", async () => {
    const store = useHomeStore();
    await store.invite("bob@example.com");
    expect(store.members).toHaveLength(1);
    expect(store.members[0]!.email).toBe("bob@example.com");
    expect(store.members[0]!.status).toBe("pending");
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0]!.kind).toBe("info");
  });

  it("invite ignores empty string", async () => {
    const store = useHomeStore();
    await store.invite("   ");
    expect(store.members).toHaveLength(0);
  });

  it("revoke removes member by id", async () => {
    const store = useHomeStore();
    store.members = [
      {
        id: "m1",
        name: "Alice",
        email: "a@a.com",
        role: "admin",
        status: "active",
        weekXp: 0,
        totalXp: 0,
      },
      {
        id: "m2",
        name: "Bob",
        email: "b@b.com",
        role: "member",
        status: "pending",
        weekXp: 0,
        totalXp: 0,
      },
    ];
    await store.revoke("m2");
    expect(store.members).toHaveLength(1);
    expect(store.members[0]!.id).toBe("m1");
  });

  it("removeMember removes member by id", async () => {
    const store = useHomeStore();
    store.members = [
      {
        id: "m1",
        name: "Alice",
        email: "a@a.com",
        role: "admin",
        status: "active",
        weekXp: 0,
        totalXp: 0,
      },
    ];
    await store.removeMember("m1");
    expect(store.members).toHaveLength(0);
  });
});
