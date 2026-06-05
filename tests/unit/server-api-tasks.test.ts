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

const mockTaskFind = vi.fn();
const mockTaskCreate = vi.fn();
const mockTaskFindOneAndUpdate = vi.fn();
const mockTaskDeleteOne = vi.fn();

vi.mock("#server/models/Task", () => ({
  Task: {
    find: mockTaskFind,
    create: mockTaskCreate,
    findOneAndUpdate: mockTaskFindOneAndUpdate,
    deleteOne: mockTaskDeleteOne,
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

describe("tasks.get", () => {
  it("returns serialized tasks for household", async () => {
    mockTaskFind.mockReturnValue({
      lean: () =>
        Promise.resolve([{ _id: { toHexString: () => "t1" }, title: "Clean" }]),
    });
    const { default: handler } = await import("#server/api/tasks.get");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual([{ id: "t1", title: "Clean" }]);
  });
});

describe("tasks.post", () => {
  it("creates task and returns with id", async () => {
    mockReadBody.mockResolvedValue({ title: "Mop", xp: 10 });
    mockTaskCreate.mockResolvedValue(fakeDoc("t_new", { title: "Mop" }));
    const { default: handler } = await import("#server/api/tasks.post");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("t_new");
    expect(result["title"]).toBe("Mop");
  });

  it("throws 400 when title missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/tasks.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe("tasks.patch", () => {
  it("updates task and returns result", async () => {
    mockReadBody.mockResolvedValue({ id: "t1", done: true });
    mockTaskFindOneAndUpdate.mockResolvedValue(fakeDoc("t1", { done: true }));
    const { default: handler } = await import("#server/api/tasks.patch");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("t1");
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/tasks.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when task not found", async () => {
    mockReadBody.mockResolvedValue({ id: "t1" });
    mockTaskFindOneAndUpdate.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/tasks.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("tasks.delete", () => {
  it("deletes task and returns ok", async () => {
    mockReadBody.mockResolvedValue({ id: "t1" });
    mockTaskDeleteOne.mockResolvedValue({ deletedCount: 1 });
    const { default: handler } = await import("#server/api/tasks.delete");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ ok: true });
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/tasks.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when not found", async () => {
    mockReadBody.mockResolvedValue({ id: "t1" });
    mockTaskDeleteOne.mockResolvedValue({ deletedCount: 0 });
    const { default: handler } = await import("#server/api/tasks.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
