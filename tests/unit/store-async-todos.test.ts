import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useHomeStore } from "~/stores/home";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";

mockNuxtImport("$fetch", () => vi.fn());

vi.stubGlobal("navigateTo", vi.fn());

function makeFetchFail(statusCode = 500) {
  const err = Object.assign(new Error("fetch failed"), { statusCode });
  return vi.mocked($fetch).mockRejectedValue(err);
}

beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
});

describe("addTodo", () => {
  it("ignores blank text", async () => {
    const store = useHomeStore();
    await store.addTodo("   ");
    expect(store.todos).toHaveLength(0);
    expect($fetch).not.toHaveBeenCalled();
  });

  it("adds optimistically and swaps in the persisted id", async () => {
    vi.mocked($fetch).mockResolvedValue({ id: "t1", text: "Call", done: false });
    const store = useHomeStore();
    await store.addTodo("  Call ");
    expect(store.todos).toEqual([{ id: "t1", text: "Call", done: false }]);
    expect($fetch).toHaveBeenCalledWith("/api/todos", {
      method: "POST",
      body: { text: "Call" },
    });
  });

  it("removes the item and toasts on failure", async () => {
    makeFetchFail();
    const store = useHomeStore();
    await store.addTodo("Call");
    expect(store.todos).toHaveLength(0);
    expect(store.toasts).toHaveLength(1);
  });
});

describe("toggleTodo", () => {
  it("flips done and patches", async () => {
    vi.mocked($fetch).mockResolvedValue({});
    const store = useHomeStore();
    store.todos = [{ id: "t1", text: "Call", done: false }];
    await store.toggleTodo("t1");
    expect(store.todos[0]!.done).toBe(true);
    expect($fetch).toHaveBeenCalledWith("/api/todos", {
      method: "PATCH",
      body: { id: "t1", done: true },
    });
  });

  it("reverts on failure", async () => {
    makeFetchFail();
    const store = useHomeStore();
    store.todos = [{ id: "t1", text: "Call", done: false }];
    await store.toggleTodo("t1");
    expect(store.todos[0]!.done).toBe(false);
    expect(store.toasts).toHaveLength(1);
  });
});

describe("renameTodo", () => {
  it("skips unchanged or blank text", async () => {
    const store = useHomeStore();
    store.todos = [{ id: "t1", text: "Call", done: false }];
    await store.renameTodo("t1", " Call ");
    await store.renameTodo("t1", "  ");
    expect($fetch).not.toHaveBeenCalled();
    expect(store.todos[0]!.text).toBe("Call");
  });

  it("reverts on failure", async () => {
    makeFetchFail();
    const store = useHomeStore();
    store.todos = [{ id: "t1", text: "Call", done: false }];
    await store.renameTodo("t1", "Email");
    expect(store.todos[0]!.text).toBe("Call");
  });
});

describe("removeTodo", () => {
  it("restores the item at its position on failure", async () => {
    makeFetchFail();
    const store = useHomeStore();
    store.todos = [
      { id: "t1", text: "A", done: false },
      { id: "t2", text: "B", done: false },
    ];
    await store.removeTodo("t1");
    expect(store.todos.map((t) => t.id)).toEqual(["t1", "t2"]);
  });
});

describe("clearDoneTodos", () => {
  it("deletes every done item", async () => {
    vi.mocked($fetch).mockResolvedValue({ ok: true });
    const store = useHomeStore();
    store.todos = [
      { id: "t1", text: "A", done: true },
      { id: "t2", text: "B", done: false },
      { id: "t3", text: "C", done: true },
    ];
    await store.clearDoneTodos();
    expect(store.todos.map((t) => t.id)).toEqual(["t2"]);
    expect($fetch).toHaveBeenCalledTimes(2);
  });

  it("puts back only the items that failed to delete", async () => {
    (vi.mocked($fetch) as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(
        Object.assign(new Error("fail"), { statusCode: 500 }),
      );
    const store = useHomeStore();
    store.todos = [
      { id: "t1", text: "A", done: true },
      { id: "t2", text: "B", done: true },
    ];
    await store.clearDoneTodos();
    expect(store.todos.map((t) => t.id)).toEqual(["t2"]);
    expect(store.toasts).toHaveLength(1);
  });
});
