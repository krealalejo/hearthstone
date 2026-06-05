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

const mockHistoryFind = vi.fn();
const mockHistoryCreate = vi.fn();

vi.mock("#server/models/HistoryEntry", () => ({
  HistoryEntry: {
    find: mockHistoryFind,
    create: mockHistoryCreate,
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

describe("history.get", () => {
  it("returns serialized history", async () => {
    mockHistoryFind.mockReturnValue({
      lean: () =>
        Promise.resolve([{ _id: { toHexString: () => "h1" }, total: 5 }]),
    });
    const { default: handler } = await import("#server/api/history.get");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual([{ id: "h1", total: 5 }]);
  });
});

describe("history.post", () => {
  it("creates history entry", async () => {
    mockReadBody.mockResolvedValue({ date: "2024-01-01", items: [], total: 0 });
    mockHistoryCreate.mockResolvedValue(
      fakeDoc("h_new", { date: "2024-01-01" }),
    );
    const { default: handler } = await import("#server/api/history.post");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("h_new");
  });

  it("throws 400 when date missing", async () => {
    mockReadBody.mockResolvedValue({ total: 0 });
    const { default: handler } = await import("#server/api/history.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
