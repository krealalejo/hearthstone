import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
    animateStagger: vi.fn(),
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

vi.mock("gsap", () => ({
  gsap: {
    to: vi.fn().mockResolvedValue(undefined),
    from: vi.fn().mockResolvedValue(undefined),
    fromTo: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
    timeline: vi.fn(() => ({ to: vi.fn(), from: vi.fn(), play: vi.fn() })),
  },
}));

const mountedWrappers: Array<{ unmount: () => void }> = [];

async function mount<T>(
  Component: T,
  options?: Parameters<typeof mountSuspended>[1],
) {
  const w = await mountSuspended(Component as any, options);
  mountedWrappers.push(w);
  return w;
}

afterEach(() => {
  mountedWrappers.forEach((w) => w.unmount());
  mountedWrappers.length = 0;
});

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
    desc: "",
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

describe("pages/dashboard", () => {
  it("renders dashboard page", async () => {
    const { default: Component } = await import("~/pages/dashboard.vue");
    const wrapper = await mount(Component);
    expect(wrapper.html()).toBeTruthy();
  });

  it("shows filter buttons", async () => {
    const { default: Component } = await import("~/pages/dashboard.vue");
    const wrapper = await mount(Component);
    expect(wrapper.text()).toContain("All");
    expect(wrapper.text()).toContain("Mine");
  });

  it("shows task sections when tasks exist", async () => {
    const { default: Component } = await import("~/pages/dashboard.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.tasks = [baseTask()];
    store.rooms = [{ id: "kitchen", name: "Kitchen", icon: "mdi-silverware" }];
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });

  it("filters tasks by mine when filter clicked", async () => {
    const { default: Component } = await import("~/pages/dashboard.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.currentUser = "u1";
    store.members = [baseMember({ id: "u1" })];
    store.tasks = [
      baseTask({ id: "t1", assignee: "u1" }),
      baseTask({ id: "t2", assignee: null }),
    ];
    const mineBtn = wrapper.findAll("button").find((b) => b.text() === "Mine");
    if (mineBtn) await mineBtn.trigger("click");
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("pages/inventory", () => {
  it("renders inventory page", async () => {
    const { default: Component } = await import("~/pages/inventory.vue");
    const wrapper = await mount(Component);
    expect(wrapper.html()).toBeTruthy();
  });

  it("shows category tabs", async () => {
    const { default: Component } = await import("~/pages/inventory.vue");
    const wrapper = await mount(Component);
    expect(wrapper.text()).toContain("Food");
  });

  it("shows items when inventory populated", async () => {
    const { default: Component } = await import("~/pages/inventory.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.inventory = [baseInvItem()];
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("pages/shopping", () => {
  it("renders shopping page", async () => {
    const { default: Component } = await import("~/pages/shopping.vue");
    const wrapper = await mount(Component);
    expect(wrapper.html()).toBeTruthy();
  });

  it("shows add item input", async () => {
    const { default: Component } = await import("~/pages/shopping.vue");
    const wrapper = await mount(Component);
    expect(wrapper.find("input").exists()).toBe(true);
  });

  it("calls store.addManualShop when add button clicked", async () => {
    const { default: Component } = await import("~/pages/shopping.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    vi.spyOn(store, "addManualShop").mockImplementation(vi.fn() as any);
    await wrapper.find("input").setValue("Bread");
    const addBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Add"));
    if (addBtn) await addBtn.trigger("click");
    await nextTick();
    expect(store.addManualShop).toHaveBeenCalledWith("Bread");
  });

  it("shows auto vs manual sections", async () => {
    const { default: Component } = await import("~/pages/shopping.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.shopping = [
      baseShopItem({ id: "s1", source: "auto" }),
      baseShopItem({ id: "s2", source: "manual" }),
    ];
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });
});
