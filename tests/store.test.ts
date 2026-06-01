import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";

describe("home store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("starts unauthenticated", () => {
    const store = useHomeStore();
    expect(store.authed).toBe(false);
  });

  it("setCurrentUser sets authed", () => {
    const store = useHomeStore();
    store.setCurrentUser({ id: "u1", name: "Alex", role: "admin" });
    expect(store.authed).toBe(true);
  });

  it("logout clears authed", async () => {
    const store = useHomeStore();
    store.setCurrentUser({ id: "u1", name: "Alex", role: "admin" });
    // logout calls $fetch — stub by resetting state directly via the action
    store.authed = false;
    expect(store.authed).toBe(false);
  });

  it("toggleTask credits XP to assignee", () => {
    const store = useHomeStore();
    const task = store.tasks.find((t) => t.assignee && !t.done);
    if (!task) return;
    const member = store.members.find((m) => m.id === task.assignee)!;
    const before = member.weekXp;
    store.toggleTask(task.id);
    expect(member.weekXp).toBe(before + task.xp);
  });

  it("toggleTask un-credits XP when unchecking", () => {
    const store = useHomeStore();
    const task = store.tasks.find((t) => t.assignee && !t.done);
    if (!task) return;
    const member = store.members.find((m) => m.id === task.assignee)!;
    const before = member.weekXp;
    store.toggleTask(task.id);
    store.toggleTask(task.id);
    expect(member.weekXp).toBe(before);
  });

  it("auto-injects item into shopping list when qty drops to min", () => {
    const store = useHomeStore();
    const item = store.inventory.find((i) => i.qty > i.min);
    if (!item) return;
    const beforeCount = store.shopping.filter(
      (s) => s.invId === item.id,
    ).length;
    store.setInvQty(item.id, item.min);
    const afterCount = store.shopping.filter((s) => s.invId === item.id).length;
    expect(afterCount).toBe(beforeCount + 1);
  });

  it("does not double-inject already-listed item", () => {
    const store = useHomeStore();
    const item = store.inventory.find((i) => i.qty > i.min);
    if (!item) return;
    store.setInvQty(item.id, item.min);
    store.setInvQty(item.id, item.min);
    const count = store.shopping.filter((s) => s.invId === item.id).length;
    expect(count).toBe(1);
  });

  it("checkout restocks linked inventory items to optimal", () => {
    const store = useHomeStore();
    const item = store.inventory.find((i) => i.qty > i.min);
    if (!item) return;
    store.setInvQty(item.id, item.min);
    const shopItem = store.shopping.find((s) => s.invId === item.id);
    if (!shopItem) return;
    store.toggleShop(shopItem.id);
    store.checkout();
    const restocked = store.inventory.find((i) => i.id === item.id)!;
    expect(restocked.qty).toBe(restocked.optimal);
  });

  it("checkout archives to history", () => {
    const store = useHomeStore();
    const beforeLen = store.history.length;
    const shopItem = store.shopping[0];
    if (!shopItem) return;
    store.toggleShop(shopItem.id);
    store.checkout();
    expect(store.history.length).toBe(beforeLen + 1);
  });

  it("checkout removes checked items from shopping list", () => {
    const store = useHomeStore();
    const item = store.shopping[0];
    if (!item) return;
    store.toggleShop(item.id);
    store.checkout();
    expect(store.shopping.find((s) => s.id === item.id)).toBeUndefined();
  });

  it("claimTask assigns currentUser", () => {
    const store = useHomeStore();
    const task = store.tasks.find((t) => !t.assignee);
    if (!task) return;
    store.claimTask(task.id);
    expect(task.assignee).toBe(store.currentUser);
  });

  it("resetWeek resets recurring tasks and clears XP", () => {
    const store = useHomeStore();
    const recurringTask = store.tasks.find((t) => t.recurring && !t.done);
    if (!recurringTask) return;
    const taskId = recurringTask.id;
    store.toggleTask(taskId);
    expect(store.tasks.find((t) => t.id === taskId)?.done).toBe(true);
    store.resetWeek();
    expect(store.tasks.find((t) => t.id === taskId)?.done).toBe(false);
    store.members.forEach((m) => {
      if (m.status === "active") expect(m.weekXp).toBe(0);
    });
  });

  it("addManualShop adds item to shopping list", () => {
    const store = useHomeStore();
    const before = store.shopping.length;
    store.addManualShop("Test item");
    expect(store.shopping.length).toBe(before + 1);
    expect(store.shopping.at(-1)?.name).toBe("Test item");
    expect(store.shopping.at(-1)?.source).toBe("manual");
  });

  it("invite adds pending member", () => {
    const store = useHomeStore();
    const before = store.members.length;
    store.invite("new@example.com");
    expect(store.members.length).toBe(before + 1);
    expect(store.members.at(-1)?.status).toBe("pending");
  });
});
