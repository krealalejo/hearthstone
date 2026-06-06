import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";

vi.stubGlobal("navigateTo", vi.fn());
vi.stubGlobal("$fetch", vi.fn());

function makeFetch(returnValue: unknown = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (vi.mocked($fetch) as any).mockResolvedValue(returnValue);
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

describe("invite", () => {
  it("adds pending member with given email and posts toast", async () => {
    makeFetch({});
    const store = useHomeStore();

    await store.invite("bob@example.com");

    expect(store.members).toHaveLength(1);
    expect(store.members[0]!.email).toBe("bob@example.com");
    expect(store.members[0]!.status).toBe("pending");
    expect(store.toasts).toHaveLength(1);
    expect(store.toasts[0]!.kind).toBe("info");
  });

  it("ignores empty string", async () => {
    const store = useHomeStore();

    await store.invite("   ");

    expect(store.members).toHaveLength(0);
  });

  it("rolls back member and toasts on failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();

    await store.invite("bob@example.com");

    expect(store.members).toHaveLength(0);
    expect(store.toasts[0]!.title).toBe("Invite failed");
  });

  it("calls _handle401 when invite fails with 401", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    const handle401 = vi
      .spyOn(store, "_handle401")
      .mockResolvedValue(undefined as any);

    await store.invite("bob@example.com");

    expect(handle401).toHaveBeenCalled();
  });
});
