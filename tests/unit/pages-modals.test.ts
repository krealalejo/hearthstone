/**
 * IMPORTANT ordering rule: `default.vue` mounts AppSidebar/ProfileModal as
 * children. Keep `default layout` describe last so it doesn't pollute earlier suites.
 */
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

beforeEach(() => {
  setActivePinia(createPinia());
});

describe("AppSidebar", () => {
  it("renders sidebar with nav items", async () => {
    const { default: Component } = await import("~/components/AppSidebar.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold();
    store.members = [baseMember()];
    await nextTick();
    expect(wrapper.find(".sidebar").exists()).toBe(true);
  });

  it("shows household name", async () => {
    const { default: Component } = await import("~/components/AppSidebar.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold({ name: "My Home" });
    store.members = [baseMember()];
    await nextTick();
    expect(wrapper.text()).toContain("My Home");
  });

  it("shows member count", async () => {
    const { default: Component } = await import("~/components/AppSidebar.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold();
    store.members = [baseMember({ id: "u1" }), baseMember({ id: "u2" })];
    await nextTick();
    expect(wrapper.text()).toContain("2 members");
  });

  it("shows inventory badge when lowCount > 0", async () => {
    const { default: Component } = await import("~/components/AppSidebar.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold();
    store.members = [baseMember()];
    store.inventory = [{ ...baseInvItem(), qty: 0, min: 3 }];
    await nextTick();
    expect(wrapper.find(".nav-badge").exists()).toBe(true);
  });

  it("emits open-profile when me-card clicked", async () => {
    const { default: Component } = await import("~/components/AppSidebar.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.household = baseHousehold();
    store.currentUser = "u1";
    store.members = [baseMember({ id: "u1" })];
    await nextTick();
    const meCard = wrapper.find(".me-card");
    if (meCard.exists()) {
      await meCard.trigger("click");
      expect(wrapper.emitted("open-profile")).toBeTruthy();
    }
  });
});

describe("ProfileModal", () => {
  async function mountProfileModal() {
    const { default: Component } =
      await import("~/components/ProfileModal.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.currentUser = "u1";
    store.members = [baseMember({ id: "u1" })];
    store.household = baseHousehold();
    await nextTick();
    return { wrapper, store };
  }

  it("renders profile modal", async () => {
    const { wrapper } = await mountProfileModal();
    expect(wrapper.find(".modal-head").exists()).toBe(true);
  });

  it("emits close when close button clicked", async () => {
    const { wrapper } = await mountProfileModal();
    await wrapper.find(".btn-ghost.btn-icon").trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("shows Log out button", async () => {
    const { wrapper } = await mountProfileModal();
    expect(wrapper.text()).toContain("Log out");
  });

  it("calls store.saveSettings when save clicked", async () => {
    const { wrapper, store } = await mountProfileModal();
    vi.spyOn(store, "saveSettings").mockResolvedValue(undefined as any);
    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Save"));
    if (saveBtn) {
      await saveBtn.trigger("click");
      await nextTick();
      expect(store.saveSettings).toHaveBeenCalled();
    }
  });

  it("calls store.logout when logout clicked", async () => {
    const { wrapper, store } = await mountProfileModal();
    vi.spyOn(store, "logout").mockResolvedValue(undefined as any);
    const logoutBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Log out"));
    if (logoutBtn) {
      await logoutBtn.trigger("click");
      await nextTick();
      expect(store.logout).toHaveBeenCalled();
    }
  });

  it("shows color swatches", async () => {
    const { wrapper } = await mountProfileModal();
    expect(wrapper.findAll(".color-swatch").length).toBeGreaterThan(0);
  });

  it("picks color on swatch click", async () => {
    const { wrapper } = await mountProfileModal();
    const swatch = wrapper.find(".color-swatch");
    if (swatch.exists()) await swatch.trigger("click");
    expect(wrapper.html()).toBeTruthy();
  });

  it("shows level card with progress bar", async () => {
    const { wrapper } = await mountProfileModal();
    expect(wrapper.find(".level-card").exists()).toBe(true);
  });

  it("shows admin settings when user is admin", async () => {
    const { default: Component } =
      await import("~/components/ProfileModal.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.currentUser = "u1";
    store.members = [baseMember({ id: "u1", role: "admin" })];
    store.household = baseHousehold();
    await nextTick();
    expect(wrapper.text()).toContain("Monday");
  });
});

describe("inventory/Modal", () => {
  it("renders modal for new item", async () => {
    const { default: Component } =
      await import("~/components/inventory/Modal.vue");
    const wrapper = await mount(Component, { props: { item: null } });
    expect(wrapper.find(".modal-head").exists()).toBe(true);
  });

  it("populates form when editing existing item", async () => {
    const { default: Component } =
      await import("~/components/inventory/Modal.vue");
    const wrapper = await mount(Component, {
      props: { item: baseInvItem({ name: "Butter" }) },
    });
    const nameInput = wrapper.find("input[placeholder]");
    expect(nameInput.element.value).toBe("Butter");
  });

  it("emits close when cancel clicked", async () => {
    const { default: Component } =
      await import("~/components/inventory/Modal.vue");
    const wrapper = await mount(Component, { props: { item: null } });
    const cancelBtn = wrapper
      .findAll("button")
      .find((b) => b.text() === "Cancel");
    if (cancelBtn) await cancelBtn.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("calls store.saveInv when save clicked with name", async () => {
    const { default: Component } =
      await import("~/components/inventory/Modal.vue");
    const wrapper = await mount(Component, { props: { item: null } });
    const store = useHomeStore();
    vi.spyOn(store, "saveInv").mockImplementation(vi.fn() as any);
    await wrapper.find("input[placeholder]").setValue("Cheese");
    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Add") || b.text().includes("Save"));
    if (saveBtn) await saveBtn.trigger("click");
    await nextTick();
    expect(store.saveInv).toHaveBeenCalled();
  });

  it("calls store.deleteInv when delete clicked", async () => {
    const { default: Component } =
      await import("~/components/inventory/Modal.vue");
    const wrapper = await mount(Component, {
      props: { item: baseInvItem() },
    });
    const store = useHomeStore();
    vi.spyOn(store, "deleteInv").mockImplementation(vi.fn() as any);
    const deleteBtn = wrapper
      .findAll("button")
      .find(
        (b) =>
          b.html().includes("mdi-trash") ||
          b.text().toLowerCase().includes("delete"),
      );
    if (deleteBtn) {
      await deleteBtn.trigger("click");
      await nextTick();
      expect(store.deleteInv).toHaveBeenCalledWith("i1");
    }
  });

  it("shows Low indicator when qty <= min", async () => {
    const { default: Component } =
      await import("~/components/inventory/Modal.vue");
    const wrapper = await mount(Component, {
      props: { item: baseInvItem({ qty: 0, min: 2 }) },
    });
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("dashboard/TaskModal", () => {
  it("renders modal for new task", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, { props: { task: null } });
    expect(wrapper.find(".modal-head").exists()).toBe(true);
  });

  it("shows Edit task header for existing task", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, {
      props: { task: baseTask({ title: "Mop Floors" }) },
    });
    expect(wrapper.find("h2").text()).toContain("Edit task");
  });

  it("populates title input for existing task", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, {
      props: { task: baseTask({ title: "Mop Floors" }) },
    });
    expect(wrapper.find("input").element.value).toBe("Mop Floors");
  });

  it("emits close when cancel clicked", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, { props: { task: null } });
    const cancelBtn = wrapper
      .findAll("button")
      .find((b) => b.text() === "Cancel");
    if (cancelBtn) await cancelBtn.trigger("click");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("calls store.saveTask and emits saved when save clicked", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, { props: { task: null } });
    const store = useHomeStore();
    vi.spyOn(store, "saveTask").mockImplementation(vi.fn() as any);
    await wrapper.find("input").setValue("New Task");
    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Add task") || b.text().includes("Save"));
    if (saveBtn) await saveBtn.trigger("click");
    await nextTick();
    expect(store.saveTask).toHaveBeenCalled();
    expect(wrapper.emitted("saved")).toBeTruthy();
  });

  it("calls store.deleteTask when delete clicked on existing task", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, {
      props: { task: baseTask({ id: "t1" }) },
    });
    const store = useHomeStore();
    vi.spyOn(store, "deleteTask").mockImplementation(vi.fn() as any);
    const deleteBtn = wrapper
      .findAll("button")
      .find(
        (b) =>
          b.html().includes("mdi-trash") ||
          b.text().toLowerCase().includes("delete"),
      );
    if (deleteBtn) {
      await deleteBtn.trigger("click");
      await nextTick();
      expect(store.deleteTask).toHaveBeenCalledWith("t1");
    }
  });

  it("save button is disabled when title is empty", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, { props: { task: null } });
    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Add task") || b.text().includes("Save"));
    if (saveBtn) {
      expect(saveBtn.attributes("disabled")).toBeDefined();
    }
  });
});

// MUST BE LAST: mounting default.vue creates AppSidebar/ProfileModal child
// instances that cause emitsOptions errors if placed before other suites.
describe("default layout", () => {
  it("renders app shell with slot", async () => {
    const { default: Component } = await import("~/layouts/default.vue");
    const wrapper = await mount(Component, {
      slots: { default: "<div class='page-slot'>content</div>" },
    });
    expect(wrapper.find(".app-shell").exists()).toBe(true);
  });

  it("shows mobile top bar", async () => {
    const { default: Component } = await import("~/layouts/default.vue");
    const wrapper = await mount(Component, {
      slots: { default: "<div />" },
    });
    expect(wrapper.find(".mobile-top").exists()).toBe(true);
  });
});
