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

const mockInventoryFind = vi.fn();
const mockInventoryCreate = vi.fn();
const mockInventoryFindOneAndUpdate = vi.fn();
const mockInventoryDeleteOne = vi.fn();

vi.mock("#server/models/InventoryItem", () => ({
  InventoryItem: {
    find: mockInventoryFind,
    create: mockInventoryCreate,
    findOneAndUpdate: mockInventoryFindOneAndUpdate,
    deleteOne: mockInventoryDeleteOne,
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

describe("inventory.get", () => {
  it("returns serialized inventory", async () => {
    mockInventoryFind.mockReturnValue({
      lean: () =>
        Promise.resolve([{ _id: { toHexString: () => "i1" }, name: "Milk" }]),
    });
    const { default: handler } = await import("#server/api/inventory.get");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual([{ id: "i1", name: "Milk" }]);
  });
});

describe("inventory.post", () => {
  it("creates item and returns with id", async () => {
    mockReadBody.mockResolvedValue({ name: "Eggs", qty: 6 });
    mockInventoryCreate.mockResolvedValue(fakeDoc("i_new", { name: "Eggs" }));
    const { default: handler } = await import("#server/api/inventory.post");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("i_new");
  });

  it("throws 400 when name missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/inventory.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe("inventory.patch", () => {
  it("updates item and returns result", async () => {
    mockReadBody.mockResolvedValue({ id: "i1", qty: 5 });
    mockInventoryFindOneAndUpdate.mockResolvedValue(fakeDoc("i1", { qty: 5 }));
    const { default: handler } = await import("#server/api/inventory.patch");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("i1");
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/inventory.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when not found", async () => {
    mockReadBody.mockResolvedValue({ id: "i1" });
    mockInventoryFindOneAndUpdate.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/inventory.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("inventory.delete", () => {
  it("deletes item and returns ok", async () => {
    mockReadBody.mockResolvedValue({ id: "i1" });
    mockInventoryDeleteOne.mockResolvedValue({ deletedCount: 1 });
    const { default: handler } = await import("#server/api/inventory.delete");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ ok: true });
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/inventory.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when not found", async () => {
    mockReadBody.mockResolvedValue({ id: "i1" });
    mockInventoryDeleteOne.mockResolvedValue({ deletedCount: 0 });
    const { default: handler } = await import("#server/api/inventory.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
