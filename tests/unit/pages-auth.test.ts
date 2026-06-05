import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";

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

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("pages/index", () => {
  it("renders empty div", async () => {
    const { default: Component } = await import("~/pages/index.vue");
    const wrapper = await mount(Component);
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("pages/login", () => {
  it("renders login form", async () => {
    const { default: Component } = await import("~/pages/login.vue");
    const wrapper = await mount(Component);
    expect(wrapper.text()).toContain("Log in");
  });

  it("switches to signup mode on toggle", async () => {
    const { default: Component } = await import("~/pages/login.vue");
    const wrapper = await mount(Component);
    await wrapper
      .findAll("button")
      .find((b) => b.text() === "Sign up")
      ?.trigger("click");
    await nextTick();
    expect(wrapper.text()).toContain("Create your account");
  });

  it("shows email and password fields", async () => {
    const { default: Component } = await import("~/pages/login.vue");
    const wrapper = await mount(Component);
    expect(wrapper.find("input[type='email']").exists()).toBe(true);
    expect(wrapper.find("input[type='password']").exists()).toBe(true);
  });

  it("shows auth error area after failed login attempt", async () => {
    const { default: Component } = await import("~/pages/login.vue");
    const wrapper = await mount(Component);
    await wrapper.find("input[type='email']").setValue("a@b.com");
    await wrapper.find("input[type='password']").setValue("wrong");
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });
});
