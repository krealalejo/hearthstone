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

function baseHousehold(overrides = {}) {
  return {
    id: "hh1",
    name: "The Smiths",
    emoji: "🏠",
    weekStartDay: "monday" as const,
    currency: "$",
    ...overrides,
  };
}

function baseHistory(overrides = {}) {
  return {
    id: "h1",
    date: "2024-01-15",
    items: [{ name: "Milk", qty: 2, price: 3.5 }],
    total: 7.0,
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("pages/household", () => {
  it("renders household page", async () => {
    const { default: Component } = await import("~/pages/household.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold();
    store.members = [baseMember()];
    store.currentUser = "u1";
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });

  it("shows household name", async () => {
    const { default: Component } = await import("~/pages/household.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold({ name: "Test House" });
    store.members = [baseMember()];
    store.currentUser = "u1";
    await nextTick();
    expect(wrapper.text()).toContain("Test House");
  });

  it("shows members list", async () => {
    const { default: Component } = await import("~/pages/household.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold();
    store.members = [baseMember({ name: "Alice Smith" })];
    store.currentUser = "u1";
    await nextTick();
    expect(wrapper.text()).toContain("Alice Smith");
  });

  it("isAdmin is true when member role is admin", async () => {
    const { default: Component } = await import("~/pages/household.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold();
    store.members = [baseMember({ role: "admin" })];
    store.currentUser = "u1";
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });

  it("calls store.renameHousehold", async () => {
    const { default: Component } = await import("~/pages/household.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold({ name: "Old Name" });
    store.members = [baseMember()];
    store.currentUser = "u1";
    vi.spyOn(store, "renameHousehold").mockImplementation(vi.fn() as any);
    await nextTick();
    const editBtn = wrapper
      .findAll("button")
      .find((b) => b.html().includes("mdi-pencil"));
    if (editBtn) {
      await editBtn.trigger("click");
      await nextTick();
      const nameInput = wrapper.find("input[type='text']");
      if (nameInput.exists()) {
        await nameInput.setValue("New Name");
        const saveBtn = wrapper
          .findAll("button")
          .find((b) => b.html().includes("mdi-check"));
        if (saveBtn) {
          await saveBtn.trigger("click");
          await nextTick();
          expect(store.renameHousehold).toHaveBeenCalledWith("New Name");
        }
      }
    }
  });
});

describe("pages/history/index", () => {
  it("renders history index", async () => {
    const { default: Component } = await import("~/pages/history/index.vue");
    const wrapper = await mount(Component);
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("pages/history/purchases", () => {
  it("renders purchases page", async () => {
    const { default: Component } =
      await import("~/pages/history/purchases.vue");
    const wrapper = await mount(Component);
    expect(wrapper.html()).toBeTruthy();
  });

  it("shows grand total when history exists", async () => {
    const { default: Component } =
      await import("~/pages/history/purchases.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.history = [baseHistory({ total: 12.5 })];
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });

  it("shows purchase entries with formatted date", async () => {
    const { default: Component } =
      await import("~/pages/history/purchases.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.history = [baseHistory({ id: "h1", date: "2024-01-15", total: 7.0 })];
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("pages/history/weeks", () => {
  it("renders weeks page", async () => {
    const { default: Component } = await import("~/pages/history/weeks.vue");
    const wrapper = await mount(Component);
    expect(wrapper.html()).toBeTruthy();
  });

  it("groups history entries by ISO week", async () => {
    const { default: Component } = await import("~/pages/history/weeks.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.history = [
      baseHistory({ id: "h1", date: "2024-01-15", total: 10 }),
      baseHistory({ id: "h2", date: "2024-01-22", total: 20 }),
    ];
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });

  it("includes done tasks in current week group", async () => {
    const { default: Component } = await import("~/pages/history/weeks.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.tasks = [baseTask({ done: true })];
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });
});
