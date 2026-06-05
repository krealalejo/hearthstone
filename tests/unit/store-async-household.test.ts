import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";

vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("$fetch", vi.fn());

function makeFetch(returnValue: unknown = {}) {
  return vi.mocked($fetch).mockResolvedValue(returnValue as never);
}

function makeFetchFail(statusCode = 500) {
  const err = Object.assign(new Error("fetch failed"), { statusCode });
  return vi.mocked($fetch).mockRejectedValue(err);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
});

describe("renameHousehold", () => {
  it("updates name optimistically", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Old Name", emoji: "🏠" };

    await store.renameHousehold("New Name");

    expect(store.household.name).toBe("New Name");
  });

  it("reverts on failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Old Name", emoji: "🏠" };

    await store.renameHousehold("New Name");

    expect(store.household.name).toBe("Old Name");
    expect(store.toasts[0]!.title).toBe("Failed to rename household");
  });
});
