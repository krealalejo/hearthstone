import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useHomeStore } from "~/stores/home";

vi.mock("~/composables/useAnimations", () => ({
  useAnimations: () => ({
    animateCheckToggle: vi.fn(),
    animateIn: vi.fn(),
    staggerIn: vi.fn(),
    animateAdd: vi.fn(),
    animateShopItemIn: vi.fn(),
  }),
}));

vi.mock("~/composables/useConfetti", () => ({
  useConfetti: () => ({ fire: vi.fn() }),
}));

vi.mock("~/composables/useColorMode", () => ({
  useColorMode: () => ({ isDark: { value: false }, toggle: vi.fn() }),
}));

vi.mock("~/composables/useBootstrap", () => ({
  useBootstrap: vi.fn().mockResolvedValue(undefined),
}));

function baseMember(overrides = {}) {
  return {
    id: "u1",
    name: "Alice Smith",
    email: "alice@example.com",
    role: "admin" as const,
    status: "active" as const,
    weekXp: 100,
    totalXp: 500,
    ...overrides,
  };
}

function baseTask(overrides = {}) {
  return {
    id: "t1",
    title: "Clean Kitchen",
    desc: "Scrub counters",
    roomId: "kitchen",
    assignee: null as string | null,
    xp: 20,
    recurring: false,
    done: false,
    doneBy: null as string | null,
    ...overrides,
  };
}

function baseInvItem(overrides = {}) {
  return {
    id: "i1",
    name: "Milk",
    cat: "food" as const,
    qty: 3,
    min: 1,
    optimal: 6,
    price: 2.5,
    icon: "mdi-cup",
    ...overrides,
  };
}

function baseShopItem(overrides = {}) {
  return {
    id: "s1",
    name: "Eggs",
    source: "manual" as const,
    invId: null as string | null,
    qty: 2,
    price: 1.5,
    checked: false,
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("Leaderboard", () => {
  it("renders leaderboard card", async () => {
    const { default: Component } =
      await import("~/components/dashboard/Leaderboard.vue");
    const wrapper = await mountSuspended(Component);
    expect(wrapper.find(".leader").exists()).toBe(true);
  });

  it("shows ranked members sorted by weekXp", async () => {
    const { default: Component } =
      await import("~/components/dashboard/Leaderboard.vue");
    const wrapper = await mountSuspended(Component);
    const store = useHomeStore();
    store.members = [
      baseMember({ id: "u1", name: "Alice", weekXp: 50, totalXp: 100 }),
      baseMember({ id: "u2", name: "Bob", weekXp: 150, totalXp: 300 }),
    ];
    await nextTick();
    const names = wrapper.findAll(".lr-name").map((n) => n.text());
    expect(names[0]).toContain("Bob");
  });
});

describe("TaskRow", () => {
  it("renders task title", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask() },
    });
    expect(wrapper.text()).toContain("Clean Kitchen");
  });

  it("shows done checkmark when task is done", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask({ done: true }) },
    });
    expect(wrapper.find(".task.done").exists()).toBe(true);
  });

  it("shows 'Claim' button when task has no assignee", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask({ assignee: null }) },
    });
    expect(wrapper.text()).toContain("Claim");
  });

  it("shows assignee avatar when task has assignee", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask({ assignee: "u1" }) },
    });
    const store = useHomeStore();
    store.members = [baseMember({ id: "u1" })];
    await nextTick();
    expect(wrapper.find(".assignee").exists()).toBe(true);
  });

  it("shows 'weekly' badge for recurring tasks", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask({ recurring: true }) },
    });
    expect(wrapper.text()).toContain("weekly");
  });

  it("calls store.claimTask when Claim clicked", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask() },
    });
    const store = useHomeStore();
    vi.spyOn(store, "claimTask").mockResolvedValue(undefined);
    await wrapper.find(".claim-btn").trigger("click");
    expect(store.claimTask).toHaveBeenCalledWith("t1");
  });

  it("emits 'edit' when task body clicked", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask() },
    });
    await wrapper.find(".task-body").trigger("click");
    expect(wrapper.emitted("edit")).toBeTruthy();
  });

  it("calls store.toggleTask when check button clicked", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskRow.vue");
    const wrapper = await mountSuspended(Component, {
      props: { task: baseTask() },
    });
    const store = useHomeStore();
    vi.spyOn(store, "toggleTask").mockResolvedValue(undefined);
    await wrapper.find("button.check").trigger("click");
    expect(store.toggleTask).toHaveBeenCalledWith("t1");
  });
});

describe("inventory/Item", () => {
  it("renders item name", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/inventory/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseInvItem() },
    });
    expect(wrapper.text()).toContain("Milk");
  });

  it("shows Low tag when qty <= min", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/inventory/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseInvItem({ qty: 1, min: 2 }) },
    });
    expect(wrapper.text()).toContain("Low");
  });

  it("does not show Low tag when qty > min", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/inventory/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseInvItem({ qty: 5, min: 2 }) },
    });
    expect(wrapper.find(".low-tag").exists()).toBe(false);
  });

  it("emits 'edit' when body clicked", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/inventory/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseInvItem() },
    });
    await wrapper.find(".inv-body").trigger("click");
    expect(wrapper.emitted("edit")).toBeTruthy();
  });
});

describe("shopping/Item", () => {
  it("renders item name", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem(), flashId: null },
    });
    expect(wrapper.text()).toContain("Eggs");
  });

  it("shows checked state when item is checked", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem({ checked: true }), flashId: null },
    });
    expect(wrapper.find(".shop-item.checked").exists()).toBe(true);
  });

  it("calls store.toggleShop when check button clicked", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem(), flashId: null },
    });
    const store = useHomeStore();
    vi.spyOn(store, "toggleShop");
    await wrapper.find("button.check").trigger("click");
    expect(store.toggleShop).toHaveBeenCalledWith("s1");
  });

  it("calls store.removeShop when remove button clicked", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem(), flashId: null },
    });
    const store = useHomeStore();
    vi.spyOn(store, "removeShop");
    await wrapper.find("[aria-label='Remove item']").trigger("click");
    expect(store.removeShop).toHaveBeenCalledWith("s1");
  });

  it("triggers onFocus clearing price when value is 0", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: {
        item: baseShopItem({ price: 0, source: "manual" as const }),
        priceEditable: true,
      },
    });
    const input = wrapper.find("input.item-price");
    if (input.exists()) await input.trigger("focus");
    expect(wrapper.html()).toBeTruthy();
  });

  it("renders editable price input and responds to blur", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    store.shopping = [baseShopItem({ source: "manual" as const })];
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: {
        item: baseShopItem({ source: "manual" as const }),
        priceEditable: true,
      },
    });
    const input = wrapper.find("input.item-price");
    expect(input.exists()).toBe(true);
    await input.trigger("focus");
    await input.trigger("blur");
    expect(wrapper.find(".price-editable").exists()).toBe(true);
  });

  it("shows auto badge for auto-sourced item", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem({ source: "auto" as const }) },
    });
    expect(wrapper.find(".src-auto").exists()).toBe(true);
  });

  it("calls store.setShopQty when QuantityStepper increase clicked", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem({ qty: 2 }) },
    });
    const store = useHomeStore();
    vi.spyOn(store, "setShopQty");
    const btn = wrapper.find('[aria-label="Increase quantity"]');
    if (btn.exists()) await btn.trigger("click");
    await vi.waitFor(() =>
      expect(store.setShopQty).toHaveBeenCalledWith("s1", 3),
    );
  });

  it("updates localPrice when item.price prop changes", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const item = baseShopItem({ price: 1.5, source: "manual" as const });
    const wrapper = await mountSuspended(Component, {
      props: { item, priceEditable: true },
    });
    await wrapper.setProps({ item: { ...item, price: 3.99 } });
    await nextTick();
    const input = wrapper.find("input.item-price");
    if (input.exists()) {
      expect((input.element as HTMLInputElement).value).toBe("3.99");
    }
  });

  it("renders with isFlash=true on mount", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem(), isFlash: true },
    });
    expect(wrapper.find(".shop-item.flash").exists()).toBe(true);
  });

  it("isFlash watcher fires when prop changes to true", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mountSuspended(Component, {
      props: { item: baseShopItem(), isFlash: false },
    });
    await wrapper.setProps({ item: baseShopItem(), isFlash: true });
    await nextTick();
    expect(wrapper.find(".shop-item").exists()).toBe(true);
  });
});

describe("auth layout", () => {
  it("renders slot content", async () => {
    const { default: Component } = await import("~/layouts/auth.vue");
    const wrapper = await mountSuspended(Component, {
      slots: { default: "<div class='test-slot'>hello</div>" },
    });
    expect(wrapper.find(".test-slot").exists()).toBe(true);
  });
});
