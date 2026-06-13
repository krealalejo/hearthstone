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

function baseTask(overrides = {}) {
  return {
    id: "t1",
    title: "Clean",
    desc: "",
    roomId: "kitchen",
    assignee: null,
    xp: 20,
    recurring: false,
    done: false,
    doneBy: null,
    ...overrides,
  };
}

function baseMember(overrides = {}) {
  return {
    id: "u1",
    name: "Alice",
    email: "a@a.com",
    role: "admin" as const,
    status: "active" as const,
    weekXp: 0,
    totalXp: 0,
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
});

describe("toggleTask", () => {
  it("marks task done optimistically and shows xp toast", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask()];
    store.members = [baseMember()];
    store.currentUserId = "u1";

    await store.toggleTask("t1");

    expect(store.tasks[0]!.done).toBe(true);
    expect(store.tasks[0]!.doneBy).toBe("u1");
    expect(store.toasts[0]!.kind).toBe("xp");
  });

  it("un-marks task when already done", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask({ done: true, doneBy: "u1" })];
    store.members = [baseMember()];
    store.currentUserId = "u1";

    await store.toggleTask("t1");

    expect(store.tasks[0]!.done).toBe(false);
    expect(store.tasks[0]!.doneBy).toBeNull();
    expect(store.toasts).toHaveLength(0);
  });

  it("updates member xp on mark done", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask({ xp: 30 })];
    store.members = [baseMember({ weekXp: 10, totalXp: 50 })];
    store.currentUserId = "u1";

    await store.toggleTask("t1");

    expect(store.members[0]!.weekXp).toBe(40);
    expect(store.members[0]!.totalXp).toBe(80);
  });

  it("reverts on API failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.tasks = [baseTask()];
    store.members = [baseMember({ weekXp: 0, totalXp: 0 })];
    store.currentUserId = "u1";

    await store.toggleTask("t1");

    expect(store.tasks[0]!.done).toBe(false);
    expect(store.members[0]!.weekXp).toBe(0);
    expect(store.toasts.some((t) => t.title === "Update failed")).toBe(true);
  });

  it("calls _handle401 on 401 error without throwing", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.tasks = [baseTask()];
    store.currentUserId = "u1";

    await expect(store.toggleTask("t1")).resolves.toBeUndefined();
  });

  it("does nothing for unknown task id", async () => {
    const store = useHomeStore();
    store.tasks = [];
    await store.toggleTask("nonexistent");
    expect($fetch).not.toHaveBeenCalled();
  });

  it("celebrate flag true when xp >= 30", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask({ xp: 30 })];
    store.members = [baseMember()];
    store.currentUserId = "u1";

    await store.toggleTask("t1");

    expect(store.toasts[0]!.celebrate).toBe(true);
  });

  it("marks task done when member not found (no xp update)", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask({ xp: 10 })];
    store.members = [];
    store.currentUserId = "u1";

    await store.toggleTask("t1");

    expect(store.tasks[0]!.done).toBe(true);
    expect(store.toasts[0]!.kind).toBe("xp");
  });
});

describe("claimTask", () => {
  it("sets assignee optimistically", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask()];
    store.currentUserId = "u1";

    await store.claimTask("t1");

    expect(store.tasks[0]!.assignee).toBe("u1");
  });

  it("reverts assignee on failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.tasks = [baseTask({ assignee: "u2" })];
    store.currentUserId = "u1";

    await store.claimTask("t1");

    expect(store.tasks[0]!.assignee).toBe("u2");
    expect(store.toasts[0]!.title).toBe("Update failed");
  });

  it("does nothing for unknown id", async () => {
    const store = useHomeStore();
    store.tasks = [];
    await store.claimTask("nonexistent");
    expect($fetch).not.toHaveBeenCalled();
  });

  it("calls _handle401 on 401 error", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.tasks = [baseTask()];
    store.currentUserId = "u1";

    await expect(store.claimTask("t1")).resolves.toBeUndefined();
  });
});

describe("saveTask", () => {
  it("creates new task via POST and pushes to state", async () => {
    const created = baseTask({ id: "t_new", title: "Mop" });
    makeFetch(created);
    const store = useHomeStore();

    await store.saveTask({ title: "Mop" });

    expect(store.tasks).toHaveLength(1);
    expect(store.tasks[0]!.id).toBe("t_new");
  });

  it("updates existing task via PATCH optimistically", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask({ title: "Clean" })];

    await store.saveTask({ id: "t1", title: "Deep Clean" });

    expect(store.tasks[0]!.title).toBe("Deep Clean");
  });

  it("reverts existing task on PATCH failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.tasks = [baseTask({ title: "Clean" })];

    await store.saveTask({ id: "t1", title: "Deep Clean" });

    expect(store.tasks[0]!.title).toBe("Clean");
    expect(store.toasts[0]!.title).toBe("Update failed");
  });

  it("shows toast on create failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();

    await store.saveTask({ title: "New Task" });

    expect(store.tasks).toHaveLength(0);
    expect(store.toasts[0]!.title).toBe("Failed to create task");
  });

  it("calls _handle401 on 401 error (create)", async () => {
    makeFetchFail(401);
    const store = useHomeStore();

    await expect(store.saveTask({ title: "New" })).resolves.toBeUndefined();
  });

  it("calls _handle401 on 401 error (update)", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.tasks = [baseTask()];

    await expect(
      store.saveTask({ id: "t1", title: "Updated" })
    ).resolves.toBeUndefined();
  });

  it("does not revert when task idx not found during update failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.tasks = [];

    await store.saveTask({ id: "nonexistent", title: "Ghost" });

    expect(store.toasts[0]!.title).toBe("Update failed");
  });
});

describe("deleteTask", () => {
  it("removes task optimistically", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.tasks = [baseTask()];

    await store.deleteTask("t1");

    expect(store.tasks).toHaveLength(0);
  });

  it("reverts on failure", async () => {
    makeFetchFail(500);
    const store = useHomeStore();
    store.tasks = [baseTask()];

    await store.deleteTask("t1");

    expect(store.tasks).toHaveLength(1);
    expect(store.toasts[0]!.title).toBe("Delete failed");
  });

  it("calls _handle401 on 401 error", async () => {
    makeFetchFail(401);
    const store = useHomeStore();
    store.tasks = [baseTask()];

    await expect(store.deleteTask("t1")).resolves.toBeUndefined();
  });
});

describe("resetWeek", () => {
  it("removes non-recurring tasks, resets recurring, clears weekXp", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (vi.mocked($fetch) as any).mockResolvedValue({});
    const store = useHomeStore();
    store.tasks = [
      baseTask({ id: "t1", recurring: false }),
      baseTask({ id: "t2", recurring: true, done: true, doneBy: "u1" }),
    ];
    store.members = [baseMember({ weekXp: 50 })];
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };

    await store.resetWeek();

    expect(store.tasks).toHaveLength(1);
    expect(store.tasks[0]!.id).toBe("t2");
    expect(store.tasks[0]!.done).toBe(false);
    expect(store.members[0]!.weekXp).toBe(0);
  });
});

describe("checkAutoReset", () => {
  it("sets lastResetWeek when unset", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };

    await store.checkAutoReset();

    expect(store.household.lastResetWeek).toBeTruthy();
    expect($fetch).toHaveBeenCalled();
  });

  it("does nothing when lastResetWeek matches current", async () => {
    const store = useHomeStore();
    store.household = { id: "hh1", name: "Home", emoji: "🏠" };
    await store.checkAutoReset();
    vi.mocked($fetch).mockReset();

    await store.checkAutoReset();

    expect($fetch).not.toHaveBeenCalled();
  });

  it("calls resetWeek when lastResetWeek is stale", async () => {
    makeFetch({});
    const store = useHomeStore();
    store.household = {
      id: "hh1",
      name: "Home",
      emoji: "🏠",
      lastResetWeek: "M-1990-01-01",
    };
    vi.spyOn(store, "resetWeek").mockResolvedValue(undefined as never);

    await store.checkAutoReset();

    expect(store.resetWeek).toHaveBeenCalled();
  });
});
