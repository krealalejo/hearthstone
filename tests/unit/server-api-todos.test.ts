import { describe, it, expect, vi, beforeEach } from "vitest";

const mockReadBody = vi.fn();
const mockCreateError = vi.fn(
  (opts: { statusCode: number; statusMessage?: string }) => {
    const err = new Error(opts.statusMessage ?? "Error") as Error & {
      statusCode?: number;
    };
    err.statusCode = opts.statusCode;
    return err;
  },
);
const mockGetQuery = vi.fn();

vi.stubGlobal("defineEventHandler", (fn: (event: unknown) => unknown) => fn);
vi.stubGlobal("readBody", mockReadBody);
vi.stubGlobal("createError", mockCreateError);
vi.stubGlobal("getQuery", mockGetQuery);

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    defineEventHandler: (fn: (event: unknown) => unknown) => fn,
    readBody: mockReadBody,
    createError: mockCreateError,
    getQuery: mockGetQuery,
    setCookie: vi.fn(),
  };
});

const mockTodoFind = vi.fn();
const mockTodoCreate = vi.fn();
const mockTodoFindOneAndUpdate = vi.fn();
const mockTodoDeleteOne = vi.fn();

vi.mock("#server/models/TodoItem", () => ({
  TodoItem: {
    find: mockTodoFind,
    create: mockTodoCreate,
    findOneAndUpdate: mockTodoFindOneAndUpdate,
    deleteOne: mockTodoDeleteOne,
  },
}));

function mockEvent(user: Record<string, unknown> = {}) {
  return {
    context: {
      user: { userId: "u1", householdId: "hh1", role: "admin", ...user },
    },
  };
}

function fakeDoc(id = "doc1", extra = {}) {
  return {
    _id: { toString: () => id },
    toJSON: () => ({ _id: id, id, ...extra }),
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("todos.get", () => {
  it("returns serialized todos sorted by creation", async () => {
    const sort = vi.fn(() => ({
      lean: () =>
        Promise.resolve([{ _id: { toHexString: () => "t1" }, text: "Call" }]),
    }));
    mockTodoFind.mockReturnValue({ sort });
    const { default: handler } = await import("#server/api/todos.get");
    const result = await (handler as Function)(mockEvent());
    expect(mockTodoFind).toHaveBeenCalledWith({ householdId: "hh1" });
    expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
    expect(result).toEqual([{ id: "t1", text: "Call" }]);
  });
});

describe("todos.post", () => {
  it("creates a todo scoped to the household", async () => {
    mockReadBody.mockResolvedValue({ text: "  Call plumber  " });
    mockTodoCreate.mockResolvedValue(fakeDoc("t_new", { text: "Call plumber" }));
    const { default: handler } = await import("#server/api/todos.post");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(mockTodoCreate).toHaveBeenCalledWith({
      householdId: "hh1",
      text: "Call plumber",
      done: undefined,
    });
    expect(result["id"]).toBe("t_new");
  });

  it("throws 400 when text is blank", async () => {
    mockReadBody.mockResolvedValue({ text: "   " });
    const { default: handler } = await import("#server/api/todos.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe("todos.patch", () => {
  it("updates only allowed fields", async () => {
    mockReadBody.mockResolvedValue({ id: "t1", done: true, householdId: "x" });
    mockTodoFindOneAndUpdate.mockResolvedValue(fakeDoc("t1", { done: true }));
    const { default: handler } = await import("#server/api/todos.patch");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(mockTodoFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: "t1", householdId: "hh1" },
      { done: true },
      { returnDocument: "after" },
    );
    expect(result["id"]).toBe("t1");
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({ done: true });
    const { default: handler } = await import("#server/api/todos.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when not found", async () => {
    mockReadBody.mockResolvedValue({ id: "t1", done: false });
    mockTodoFindOneAndUpdate.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/todos.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("todos.delete", () => {
  it("deletes a todo and returns ok", async () => {
    mockReadBody.mockResolvedValue({ id: "t1" });
    mockTodoDeleteOne.mockResolvedValue({ deletedCount: 1 });
    const { default: handler } = await import("#server/api/todos.delete");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ ok: true });
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/todos.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when not found", async () => {
    mockReadBody.mockResolvedValue({ id: "t1" });
    mockTodoDeleteOne.mockResolvedValue({ deletedCount: 0 });
    const { default: handler } = await import("#server/api/todos.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
