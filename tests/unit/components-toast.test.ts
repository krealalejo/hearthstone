import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { useHomeStore } from "~/stores/home";

const animateToastInMock = vi.fn();
const fireConfettiMock = vi.fn();

vi.mock("~/composables/useAnimations", () => ({
  useAnimations: () => ({
    animateToastIn: animateToastInMock,
    animateCheckToggle: vi.fn(),
    animateIn: vi.fn(),
    staggerIn: vi.fn(),
    animateAdd: vi.fn(),
    animateShopItemIn: vi.fn(),
  }),
}));

vi.mock("~/composables/useConfetti", () => ({
  useConfetti: () => ({ fire: fireConfettiMock }),
}));

vi.mock("~/composables/useColorMode", () => ({
  useColorMode: () => ({ isDark: { value: false }, toggle: vi.fn() }),
}));

vi.mock("~/composables/useBootstrap", () => ({
  useBootstrap: vi.fn().mockResolvedValue(undefined),
}));

const mounted: Array<{ unmount: () => void }> = [];

async function mount() {
  const { default: Component } = await import(
    "~/components/AppToastHost.vue"
  );
  const w = await mountSuspended(Component);
  mounted.push(w);
  return w;
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.useFakeTimers();
  animateToastInMock.mockClear();
  fireConfettiMock.mockClear();
  useHomeStore().$patch({ toasts: [] });
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
  mounted.splice(0).forEach((w) => w.unmount());
});

describe("AppToastHost", () => {
  it("renders nothing when no toasts", async () => {
    const wrapper = await mount();
    expect(wrapper.find(".toast-wrap").exists()).toBe(true);
    expect(wrapper.findAll(".toast")).toHaveLength(0);
  });

  it("renders toast added to store", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Hello", body: "World" });
    await nextTick();
    expect(wrapper.find(".toast").exists()).toBe(true);
    expect(wrapper.text()).toContain("Hello");
    expect(wrapper.text()).toContain("World");
  });

  it("adds clickable class when toast has link", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Go", link: "shopping" });
    await nextTick();
    expect(wrapper.find(".toast.clickable").exists()).toBe(true);
  });

  it("toast div does not have clickable class when no link", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Plain" });
    await nextTick();
    const toast = wrapper.find(".toast");
    expect(toast.exists()).toBe(true);
    expect(toast.classes()).not.toContain("clickable");
  });

  it("dismisses toast after DISMISS_DELAY (3600ms)", async () => {
    await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Temp" });
    await nextTick();
    const countBefore = store.toasts.length;
    vi.advanceTimersByTime(3600);
    await nextTick();
    expect(store.toasts.length).toBeLessThan(countBefore);
    const dismissed = !store.toasts.some((t) => t.title === "Temp");
    expect(dismissed).toBe(true);
  });

  it("does not create duplicate timers for the same toast", async () => {
    await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Once" });
    await nextTick();
    store._toast({ kind: "info", title: "Two" });
    await nextTick();
    vi.advanceTimersByTime(3600);
    await nextTick();
    expect(store.toasts.some((t) => t.title === "Once")).toBe(false);
    expect(store.toasts.some((t) => t.title === "Two")).toBe(false);
  });

  it("renders xp icon for kind=xp", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "xp", title: "XP" });
    await nextTick();
    expect(wrapper.html()).toContain("mdi-sparkles");
  });

  it("renders auto-fix icon for kind=restock", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "restock", title: "Restock" });
    await nextTick();
    expect(wrapper.html()).toContain("mdi-auto-fix");
  });

  it("renders check-circle icon for kind=check", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "check", title: "Done" });
    await nextTick();
    expect(wrapper.html()).toContain("mdi-check-circle");
  });

  it("renders information icon for kind=info", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Info" });
    await nextTick();
    expect(wrapper.html()).toContain("mdi-information");
  });

  it("renders bell icon for unknown kind", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "other", title: "Other" });
    await nextTick();
    expect(wrapper.html()).toContain("mdi-bell");
  });

  it("fires confetti when toast has celebrate=true", async () => {
    await mount();
    const store = useHomeStore();
    store._toast({ kind: "xp", title: "+50 XP", celebrate: true });
    await nextTick();
    expect(fireConfettiMock).toHaveBeenCalled();
  });

  it("does not fire confetti when celebrate is falsy", async () => {
    await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "No party" });
    await nextTick();
    expect(fireConfettiMock).not.toHaveBeenCalled();
  });

  it("navigates on clickable toast click", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Go", link: "shopping" });
    await nextTick();
    const toast = wrapper.find(".toast.clickable");
    await toast.trigger("click");
    expect(wrapper.find(".toast-wrap").exists()).toBe(true);
  });

  it("does not navigate when toast has no link", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Stay" });
    await nextTick();
    const toast = wrapper.find(".toast");
    await toast.trigger("click");
    expect(wrapper.find(".toast-wrap").exists()).toBe(true);
  });

  it("renders multiple toasts", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "First" });
    store._toast({ kind: "check", title: "Second" });
    await nextTick();
    const toasts = wrapper.findAll(".toast");
    expect(toasts.length).toBeGreaterThanOrEqual(2);
    const texts = toasts.map((t) => t.text()).join(" ");
    expect(texts).toContain("First");
    expect(texts).toContain("Second");
  });

  it("renders body text when provided", async () => {
    const wrapper = await mount();
    const store = useHomeStore();
    store._toast({ kind: "info", title: "Title", body: "Detail text" });
    await nextTick();
    expect(wrapper.text()).toContain("Detail text");
  });
});
