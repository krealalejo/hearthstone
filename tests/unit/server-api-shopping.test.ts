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

const mockShoppingFind = vi.fn();
const mockShoppingCreate = vi.fn();
const mockShoppingFindOneAndUpdate = vi.fn();
const mockShoppingDeleteOne = vi.fn();

vi.mock("#server/models/ShoppingItem", () => ({
  ShoppingItem: {
    find: mockShoppingFind,
    create: mockShoppingCreate,
    findOneAndUpdate: mockShoppingFindOneAndUpdate,
    deleteOne: mockShoppingDeleteOne,
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

describe("shopping.get", () => {
  it("returns serialized shopping list", async () => {
    mockShoppingFind.mockReturnValue({
      lean: () =>
        Promise.resolve([{ _id: { toHexString: () => "s1" }, name: "Bread" }]),
    });
    const { default: handler } = await import("#server/api/shopping.get");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual([{ id: "s1", name: "Bread" }]);
  });
});

describe("shopping.post", () => {
  it("creates shopping item", async () => {
    mockReadBody.mockResolvedValue({ name: "Milk", source: "manual" });
    mockShoppingCreate.mockResolvedValue(fakeDoc("s_new", { name: "Milk" }));
    const { default: handler } = await import("#server/api/shopping.post");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("s_new");
  });

  it("throws 400 when name missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/shopping.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});

describe("shopping.patch", () => {
  it("updates shopping item", async () => {
    mockReadBody.mockResolvedValue({ id: "s1", checked: true });
    mockShoppingFindOneAndUpdate.mockResolvedValue(
      fakeDoc("s1", { checked: true }),
    );
    const { default: handler } = await import("#server/api/shopping.patch");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("s1");
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/shopping.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when not found", async () => {
    mockReadBody.mockResolvedValue({ id: "s1" });
    mockShoppingFindOneAndUpdate.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/shopping.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("shopping.delete", () => {
  it("deletes shopping item and returns ok", async () => {
    mockReadBody.mockResolvedValue({ id: "s1" });
    mockShoppingDeleteOne.mockResolvedValue({ deletedCount: 1 });
    const { default: handler } = await import("#server/api/shopping.delete");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ ok: true });
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/shopping.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when not found", async () => {
    mockReadBody.mockResolvedValue({ id: "s1" });
    mockShoppingDeleteOne.mockResolvedValue({ deletedCount: 0 });
    const { default: handler } = await import("#server/api/shopping.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
