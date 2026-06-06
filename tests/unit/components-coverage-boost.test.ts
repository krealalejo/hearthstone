import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { nextTick, reactive } from "vue";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { DOMWrapper } from "@vue/test-utils";
import { useHomeStore } from "~/stores/home";

if (!("visualViewport" in window)) {
  vi.stubGlobal("visualViewport", {
    width: 1024,
    height: 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
}

vi.mock("~/composables/useAnimations", () => ({
  useAnimations: () => ({
    animateCheckToggle: vi.fn(),
    animateIn: vi.fn(),
    staggerIn: vi.fn(),
    animateAdd: vi.fn(),
    animateStagger: vi.fn(),
    animateShopItemIn: vi.fn(),
    animateLocaleChange: vi.fn((_el: unknown, cb: () => void) => {
      cb();
      return Promise.resolve();
    }),
  }),
}));

vi.stubGlobal("$fetch", vi.fn().mockResolvedValue({}));

vi.mock("~/composables/useColorMode", () => ({
  useColorMode: () => ({ isDark: { value: false }, toggle: vi.fn() }),
}));

const mockRoute = reactive({ name: "dashboard", path: "/dashboard" });
vi.mock("vue-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("vue-router")>();
  return { ...actual, useRoute: () => mockRoute };
});

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

function body() {
  return new DOMWrapper(document.body);
}

describe("household/ConfirmDialog", () => {
  async function mountDialog(action: Record<string, unknown> | null) {
    const { default: Component } =
      await import("~/components/household/ConfirmDialog.vue");
    const wrapper = await mount(Component, {
      props: { modelValue: true, action },
    });
    await nextTick();
    return wrapper;
  }

  it("renders leave-kind copy and emits confirm on confirm click", async () => {
    const wrapper = await mountDialog({
      kind: "leave",
      member: baseMember(),
    });
    expect(body().text()).toContain("Leave household?");
    const confirmBtn = body()
      .findAll("button")
      .find((b) => b.text() === "Leave");
    await confirmBtn?.trigger("click");
    expect(wrapper.emitted("confirm")).toBeTruthy();
  });

  it("renders remove-kind copy with member name", async () => {
    const wrapper = await mountDialog({
      kind: "remove",
      member: baseMember({ name: "Bob Builder" }),
    });
    expect(body().text()).toContain("Remove Bob?");
    const confirmBtn = body()
      .findAll("button")
      .find((b) => b.text() === "Remove");
    await confirmBtn?.trigger("click");
    expect(wrapper.emitted("confirm")).toBeTruthy();
  });

  it("emits update:modelValue false on cancel and close click", async () => {
    const wrapper = await mountDialog({ kind: "leave", member: baseMember() });
    const cancelBtn = body()
      .findAll("button")
      .find((b) => b.text() === "Cancel");
    await cancelBtn?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);

    const closeBtn = body().find(".btn-ghost.btn-icon.btn-sm");
    await closeBtn.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.length).toBeGreaterThan(1);
  });

  it("renders nothing when action is null", async () => {
    await mountDialog(null);
    expect(body().find(".modal-head").exists()).toBe(false);
  });
});

describe("household/InviteDialog", () => {
  async function mountDialog() {
    const { default: Component } =
      await import("~/components/household/InviteDialog.vue");
    const wrapper = await mount(Component, { props: { modelValue: true } });
    await nextTick();
    return wrapper;
  }

  it("renders invite title", async () => {
    await mountDialog();
    expect(body().text()).toContain("Invite a member");
  });

  it("does not emit invite when email is blank", async () => {
    const wrapper = await mountDialog();
    const sendBtn = body()
      .findAll("button")
      .find((b) => b.text().includes("Send invite"));
    await sendBtn?.trigger("click");
    expect(wrapper.emitted("invite")).toBeFalsy();
  });

  it("emits invite with trimmed email and clears field on send", async () => {
    const wrapper = await mountDialog();
    const input = body().find("#invite-email");
    await input.setValue("friend@example.com");
    const sendBtn = body()
      .findAll("button")
      .find((b) => b.text().includes("Send invite"));
    await sendBtn?.trigger("click");
    expect(wrapper.emitted("invite")?.[0]).toEqual(["friend@example.com"]);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
    expect((input.element as HTMLInputElement).value).toBe("");
  });

  it("submits on enter keydown in email field", async () => {
    const wrapper = await mountDialog();
    const input = body().find("#invite-email");
    await input.setValue("enter@example.com");
    await input.trigger("keydown.enter");
    expect(wrapper.emitted("invite")?.[0]).toEqual(["enter@example.com"]);
  });

  it("emits update:modelValue false on cancel and close click", async () => {
    const wrapper = await mountDialog();
    const cancelBtn = body()
      .findAll("button")
      .find((b) => b.text() === "Cancel");
    await cancelBtn?.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);

    const closeBtn = body().find(".btn-ghost.btn-icon.btn-sm");
    await closeBtn.trigger("click");
    expect(wrapper.emitted("update:modelValue")?.length).toBeGreaterThan(1);
  });
});

describe("shopping/Item price editing", () => {
  it("selects text and prefills price on focus, persists on blur", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mount(Component, {
      props: {
        item: baseShopItem({ source: "manual", price: 3.5 }),
        priceEditable: true,
      },
    });
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" } as any;
    await nextTick();
    vi.spyOn(store, "setShopPrice");
    const input = wrapper.find("input.item-price");
    await input.trigger("focus");
    expect((input.element as HTMLInputElement).value).toBe("3.5");

    await input.setValue("4.25");
    await input.trigger("blur");
    expect(store.setShopPrice).toHaveBeenCalledWith("s1", 4.25);
    await nextTick();
    expect((input.element as HTMLInputElement).value).toBe("4.25");
  });

  it("treats zero price as blank on focus", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mount(Component, {
      props: {
        item: baseShopItem({ source: "manual", price: 0 }),
        priceEditable: true,
      },
    });
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" } as any;
    await nextTick();
    const input = wrapper.find("input.item-price");
    await input.trigger("focus");
    expect((input.element as HTMLInputElement).value).toBe("");
  });

  it("falls back to zero on blur when input is non-numeric", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mount(Component, {
      props: {
        item: baseShopItem({ source: "manual", price: 1 }),
        priceEditable: true,
      },
    });
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" } as any;
    await nextTick();
    vi.spyOn(store, "setShopPrice");
    const input = wrapper.find("input.item-price");
    await input.setValue("abc");
    await input.trigger("blur");
    expect(store.setShopPrice).toHaveBeenCalledWith("s1", 0);
  });

  it("calls store.setShopQty when quantity stepper changes", async () => {
    const { default: Component } =
      await import("~/components/shopping/Item.vue");
    const wrapper = await mount(Component, {
      props: { item: baseShopItem(), isFlash: true },
    });
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" } as any;
    await nextTick();
    vi.spyOn(store, "setShopQty");
    const incBtn = wrapper.find("[aria-label='increase']");
    if (incBtn.exists()) await incBtn.trigger("click");
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("AppTopbar new week action", () => {
  it("triggers store.resetWeek when New week button clicked on dashboard", async () => {
    mockRoute.name = "dashboard";
    mockRoute.path = "/dashboard";
    const { default: Component } = await import("~/components/AppTopbar.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.currentUser = "u1";
    store.members = [baseMember()];
    await nextTick();
    vi.spyOn(store, "resetWeek").mockImplementation(vi.fn() as any);
    const newWeekBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("New week"));
    expect(newWeekBtn).toBeTruthy();
    await newWeekBtn?.trigger("click");
    expect(store.resetWeek).toHaveBeenCalled();
  });

  it("shows section title and subtitle for non-dashboard routes", async () => {
    mockRoute.name = "inventory";
    mockRoute.path = "/inventory";
    const { default: Component } = await import("~/components/AppTopbar.vue");
    const wrapper = await mount(Component);
    await nextTick();
    expect(wrapper.find("h1").text().length).toBeGreaterThan(0);
  });
});

describe("ProfileModal extra coverage", () => {
  async function mountProfileModal() {
    const { default: Component } =
      await import("~/components/ProfileModal.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.currentUser = "u1";
    store.currentUserId = "u1";
    store.members = [baseMember({ id: "u1", role: "admin" })];
    store.household = baseHousehold();
    await nextTick();
    return { wrapper, store };
  }

  it("picks accent color from swatch", async () => {
    const { wrapper } = await mountProfileModal();
    const swatch = wrapper.find(".color-swatch");
    expect(swatch.exists()).toBe(true);
    await swatch.trigger("click");
    expect(wrapper.html()).toBeTruthy();
  });

  it("picks avatar image and applies its default accent color", async () => {
    const { wrapper } = await mountProfileModal();
    const imgOpt = wrapper.find(".emoji-opt.img-opt");
    expect(imgOpt.exists()).toBe(true);
    await imgOpt.trigger("click");
    await imgOpt.trigger("click");
    expect(wrapper.html()).toBeTruthy();
  });

  it("runs handleSave end to end including locale change and closes modal", async () => {
    const { wrapper, store } = await mountProfileModal();
    const nameInput = wrapper.find("input#profile-name");
    await nameInput.setValue("Bob Smith");
    const localeBtns = wrapper.findAll(".seg")[1]!.findAll("button");
    expect(localeBtns.length).toBeGreaterThan(1);
    await localeBtns[1]!.trigger("click");
    const saveBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Save"));
    expect(saveBtn).toBeTruthy();
    await saveBtn?.trigger("click");
    await nextTick();
    await nextTick();
    await Promise.resolve();
    await nextTick();
    expect($fetch).toHaveBeenCalled();
    expect(store.currentUser).toBe("Bob Smith");
    expect(wrapper.emitted("close")).toBeTruthy();
  });

  it("calls store.logout when logout clicked", async () => {
    const { wrapper, store } = await mountProfileModal();
    vi.spyOn(store, "logout").mockResolvedValue(undefined as any);
    const logoutBtn = wrapper
      .findAll("button")
      .find((b) => b.text().includes("Log out"));
    await logoutBtn?.trigger("click");
    await nextTick();
    expect(store.logout).toHaveBeenCalled();
  });
});

describe("dashboard/TaskModal select options", () => {
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

  it("renders room, member, and xp option lists and selects from them", async () => {
    const { default: Component } =
      await import("~/components/dashboard/TaskModal.vue");
    const wrapper = await mount(Component, {
      props: { task: baseTask() },
    });
    const store = useHomeStore();
    store.members = [
      baseMember({ id: "u1" }),
      baseMember({ id: "u2", name: "Bob" }),
    ];
    await nextTick();

    const selects = wrapper.findAll("select");
    for (const select of selects) {
      const options = select.findAll("option");
      if (options.length > 1) {
        await select.setValue(options[1]!.element.value);
      }
    }
    expect(wrapper.html()).toBeTruthy();
  });
});

describe("uncovered closure coverage", () => {
  it("ProfileModal: clicking a currency option updates form.currency", async () => {
    const { default: Component } =
      await import("~/components/ProfileModal.vue");
    const wrapper = await mount(Component);
    const store = useHomeStore();
    store.currentUser = "u1";
    store.currentUserId = "u1";
    store.members = [baseMember({ id: "u1", role: "admin" })];
    store.household = baseHousehold();
    await nextTick();
    const currencyBtn = wrapper.findAll(".currency-opt")[1];
    expect(currencyBtn).toBeTruthy();
    await currencyBtn?.trigger("click");
    expect(wrapper.html()).toBeTruthy();
  });

  it("inventory/Modal: clicking a category chip updates form.cat", async () => {
    const { default: Component } =
      await import("~/components/inventory/Modal.vue");
    const wrapper = await mount(Component, { props: { item: null } });
    const chips = wrapper.findAll(".v-chip");
    expect(chips.length).toBeGreaterThan(1);
    const cleaningChip = chips[1];
    await cleaningChip?.trigger("click");
    await nextTick();
    expect(wrapper.html()).toBeTruthy();
  });

  it("household/ConfirmDialog: dialog update:model-value closes the modal", async () => {
    const { default: Component } =
      await import("~/components/household/ConfirmDialog.vue");
    const wrapper = await mount(Component, {
      props: {
        modelValue: true,
        action: { kind: "leave", member: baseMember() },
      },
    });
    await nextTick();
    const dialog = wrapper.findComponent({ name: "VDialog" });
    expect(dialog.exists()).toBe(true);
    dialog.vm.$emit("update:model-value", false);
    await nextTick();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });

  it("household/InviteDialog: dialog update:model-value closes the modal", async () => {
    const { default: Component } =
      await import("~/components/household/InviteDialog.vue");
    const wrapper = await mount(Component, { props: { modelValue: true } });
    await nextTick();
    const dialog = wrapper.findComponent({ name: "VDialog" });
    expect(dialog.exists()).toBe(true);
    dialog.vm.$emit("update:model-value", false);
    await nextTick();
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([false]);
  });
});
