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

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("AppAvatar", () => {
  const AppAvatar = () => import("~/components/AppAvatar.vue");

  it("renders default account icon when no member", async () => {
    const Component = (await AppAvatar()).default;
    const wrapper = await mountSuspended(Component, {
      props: { member: null },
    });
    expect(wrapper.find(".avatar").exists()).toBe(true);
  });

  it("renders initials when member has name but no emoji/image", async () => {
    const Component = (await AppAvatar()).default;
    const member = baseMember({
      avatarEmoji: undefined,
      avatarImage: undefined,
    });
    const wrapper = await mountSuspended(Component, { props: { member } });
    expect(wrapper.text()).toContain("AS");
  });

  it("renders emoji when member has avatarEmoji", async () => {
    const Component = (await AppAvatar()).default;
    const member = baseMember({ avatarEmoji: "🐱", avatarImage: undefined });
    const wrapper = await mountSuspended(Component, { props: { member } });
    expect(wrapper.text()).toContain("🐱");
  });

  it("renders img when member has avatarImage", async () => {
    const Component = (await AppAvatar()).default;
    const member = baseMember({
      avatarImage: "cat.png",
      avatarEmoji: undefined,
    });
    const wrapper = await mountSuspended(Component, { props: { member } });
    expect(wrapper.find("img").exists()).toBe(true);
  });

  it("applies size class", async () => {
    const Component = (await AppAvatar()).default;
    const wrapper = await mountSuspended(Component, {
      props: { member: null, size: "lg" },
    });
    expect(wrapper.find(".lg").exists()).toBe(true);
  });

  it("renders email icon when member has no name", async () => {
    const Component = (await AppAvatar()).default;
    const member = baseMember({
      name: "",
      avatarEmoji: undefined,
      avatarImage: undefined,
    });
    const wrapper = await mountSuspended(Component, { props: { member } });
    expect(wrapper.find(".avatar").exists()).toBe(true);
  });
});

describe("AppTabBar", () => {
  it("renders 5 nav tabs", async () => {
    const { default: Component } = await import("~/components/AppTabBar.vue");
    const wrapper = await mountSuspended(Component);
    expect(wrapper.findAll("button.tab")).toHaveLength(5);
  });

  it("shows inventory badge when lowCount > 0", async () => {
    const { default: Component } = await import("~/components/AppTabBar.vue");
    const wrapper = await mountSuspended(Component);
    const store = useHomeStore();
    store.inventory = [baseInvItem({ qty: 0, min: 1 })];
    await nextTick();
    const badges = wrapper.findAll(".tab-badge");
    expect(badges.length).toBeGreaterThan(0);
  });

  it("shows no badge when counts are 0", async () => {
    const { default: Component } = await import("~/components/AppTabBar.vue");
    const wrapper = await mountSuspended(Component);
    const store = useHomeStore();
    store.inventory = [];
    store.shopping = [];
    await nextTick();
    expect(wrapper.findAll(".tab-badge")).toHaveLength(0);
  });
});

describe("AppTopbar", () => {
  it("renders topbar with week number", async () => {
    const { default: Component } = await import("~/components/AppTopbar.vue");
    const wrapper = await mountSuspended(Component);
    expect(wrapper.find(".topbar").exists()).toBe(true);
    expect(wrapper.text()).toContain("Week");
  });
});
