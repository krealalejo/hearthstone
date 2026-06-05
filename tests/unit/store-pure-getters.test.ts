import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";

describe("home store — getters", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("lowCount counts items at or below min", () => {
    const store = useHomeStore();
    store.inventory = [
      {
        id: "i1",
        name: "A",
        cat: "food",
        qty: 1,
        min: 2,
        optimal: 5,
        price: null,
        icon: "",
      },
      {
        id: "i2",
        name: "B",
        cat: "food",
        qty: 2,
        min: 2,
        optimal: 5,
        price: null,
        icon: "",
      },
      {
        id: "i3",
        name: "C",
        cat: "food",
        qty: 5,
        min: 2,
        optimal: 5,
        price: null,
        icon: "",
      },
    ];
    expect(store.lowCount).toBe(2);
  });

  it("shopCount counts unchecked shopping items", () => {
    const store = useHomeStore();
    store.shopping = [
      {
        id: "s1",
        name: "A",
        source: "manual",
        invId: null,
        qty: 1,
        price: null,
        checked: false,
      },
      {
        id: "s2",
        name: "B",
        source: "manual",
        invId: null,
        qty: 1,
        price: null,
        checked: true,
      },
    ];
    expect(store.shopCount).toBe(1);
  });

  it("me returns member matching currentUserId", () => {
    const store = useHomeStore();
    store.members = [
      {
        id: "u1",
        name: "Alice",
        email: "a@a.com",
        role: "admin",
        status: "active",
        weekXp: 10,
        totalXp: 100,
      },
    ];
    store.currentUserId = "u1";
    expect(store.me.name).toBe("Alice");
  });

  it("me falls back to first active member when no id match", () => {
    const store = useHomeStore();
    store.members = [
      {
        id: "u1",
        name: "Alice",
        email: "a@a.com",
        role: "admin",
        status: "active",
        weekXp: 0,
        totalXp: 0,
      },
    ];
    store.currentUserId = "nonexistent";
    expect(store.me.name).toBe("Alice");
  });

  it("me returns empty shell when no members", () => {
    const store = useHomeStore();
    store.members = [];
    store.currentUserId = "u1";
    expect(store.me.id).toBe("");
  });

  it("activeMembers filters by status=active", () => {
    const store = useHomeStore();
    store.members = [
      {
        id: "u1",
        name: "A",
        email: "",
        role: "admin",
        status: "active",
        weekXp: 0,
        totalXp: 0,
      },
      {
        id: "u2",
        name: "B",
        email: "",
        role: "member",
        status: "pending",
        weekXp: 0,
        totalXp: 0,
      },
    ];
    expect(store.activeMembers).toHaveLength(1);
    expect(store.activeMembers[0]!.id).toBe("u1");
  });

  it("pendingMembers filters by status=pending", () => {
    const store = useHomeStore();
    store.members = [
      {
        id: "u1",
        name: "A",
        email: "",
        role: "admin",
        status: "active",
        weekXp: 0,
        totalXp: 0,
      },
      {
        id: "u2",
        name: "B",
        email: "",
        role: "member",
        status: "pending",
        weekXp: 0,
        totalXp: 0,
      },
    ];
    expect(store.pendingMembers).toHaveLength(1);
    expect(store.pendingMembers[0]!.id).toBe("u2");
  });

  it("weekNo returns a positive integer", () => {
    const store = useHomeStore();
    expect(store.weekNo).toBeGreaterThan(0);
    expect(Number.isInteger(store.weekNo)).toBe(true);
  });

  it("weekKey returns a string", () => {
    const store = useHomeStore();
    expect(typeof store.weekKey).toBe("string");
    expect(store.weekKey.length).toBeGreaterThan(0);
  });

  it("weekNo/weekKey use sunday mode when weekStartDay=sunday", () => {
    const store = useHomeStore();
    store.household.weekStartDay = "sunday";
    expect(store.weekKey).toMatch(/^S-\d{4}-\d{2}-\d{2}$/);
    expect(store.weekNo).toBeGreaterThan(0);
  });
});
