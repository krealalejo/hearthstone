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

const mockHouseholdFindById = vi.fn();
const mockHouseholdFindByIdAndUpdate = vi.fn();
const mockHouseholdFind = vi.fn();

vi.mock("#server/models/Household", () => ({
  Household: {
    find: mockHouseholdFind,
    findById: mockHouseholdFindById,
    findByIdAndUpdate: mockHouseholdFindByIdAndUpdate,
  },
}));

const mockUserFindOne = vi.fn();
const mockUserFindOneAndUpdate = vi.fn();
const mockUserDeleteOne = vi.fn();

vi.mock("#server/models/User", () => ({
  User: {
    findOne: mockUserFindOne,
    findOneAndUpdate: mockUserFindOneAndUpdate,
    deleteOne: mockUserDeleteOne,
  },
}));

const mockPendingInviteCreate = vi.fn();

vi.mock("#server/models/PendingInvite", () => ({
  PendingInvite: {
    create: mockPendingInviteCreate,
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

describe("household.get", () => {
  it("returns household by id", async () => {
    mockHouseholdFind.mockReturnValue({
      lean: () =>
        Promise.resolve([
          { _id: { toHexString: () => "hh1" }, name: "My Home" },
        ]),
    });
    vi.mocked((await import("#server/models/Household")).Household).find =
      mockHouseholdFind as never;
    const { default: handler } = await import("#server/api/household.get");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("hh1");
    expect(result["name"]).toBe("My Home");
  });

  it("throws 404 when household not found", async () => {
    mockHouseholdFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    vi.mocked((await import("#server/models/Household")).Household).find =
      mockHouseholdFind as never;
    const { default: handler } = await import("#server/api/household.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("household.patch", () => {
  it("updates household name", async () => {
    mockReadBody.mockResolvedValue({ name: "New Name" });
    mockHouseholdFindByIdAndUpdate.mockResolvedValue(
      fakeDoc("hh1", { name: "New Name" }),
    );
    const { default: handler } = await import("#server/api/household.patch");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["name"]).toBe("New Name");
  });

  it("throws 400 when no fields provided", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/household.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 404 when household not found", async () => {
    mockReadBody.mockResolvedValue({ name: "X" });
    mockHouseholdFindByIdAndUpdate.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/household.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("members.get", () => {
  it("returns serialized members", async () => {
    mockUserFindOne.mockReturnValue({ lean: vi.fn() });
    const mockUserFind = vi.fn().mockReturnValue({
      lean: () =>
        Promise.resolve([{ _id: { toHexString: () => "u1" }, name: "Alice" }]),
    });
    vi.mocked(await import("#server/models/User")).User.find =
      mockUserFind as never;
    const { default: handler } = await import("#server/api/members.get");
    const result = await (handler as Function)(mockEvent());
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("members.post", () => {
  it("throws 403 when caller is not admin", async () => {
    mockReadBody.mockResolvedValue({ email: "b@b.com" });
    const { default: handler } = await import("#server/api/members.post");
    await expect(
      (handler as Function)(mockEvent({ role: "member" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 400 when email missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/members.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 409 when user already member", async () => {
    mockReadBody.mockResolvedValue({ email: "b@b.com" });
    mockUserFindOne.mockResolvedValue({ id: "u2" });
    const { default: handler } = await import("#server/api/members.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("creates invite when valid", async () => {
    mockReadBody.mockResolvedValue({ email: "new@b.com" });
    mockUserFindOne.mockResolvedValue(null);
    mockPendingInviteCreate.mockResolvedValue(
      fakeDoc("inv1", { email: "new@b.com" }),
    );
    const { default: handler } = await import("#server/api/members.post");
    const result = (await (handler as Function)(mockEvent())) as Record<
      string,
      unknown
    >;
    expect(result["id"]).toBe("inv1");
  });
});

describe("members.patch", () => {
  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/members.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 403 when non-admin tries to update role", async () => {
    mockReadBody.mockResolvedValue({ id: "u2", role: "admin" });
    const { default: handler } = await import("#server/api/members.patch");
    await expect(
      (handler as Function)(mockEvent({ role: "member", userId: "u1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 403 when non-admin updates another's profile", async () => {
    mockReadBody.mockResolvedValue({ id: "u2", name: "Bob" });
    const { default: handler } = await import("#server/api/members.patch");
    await expect(
      (handler as Function)(mockEvent({ role: "member", userId: "u1" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("updates member and returns result", async () => {
    mockReadBody.mockResolvedValue({ id: "u1", name: "Alice Updated" });
    mockUserFindOneAndUpdate.mockResolvedValue(
      fakeDoc("u1", { name: "Alice Updated" }),
    );
    const { default: handler } = await import("#server/api/members.patch");
    const result = (await (handler as Function)(
      mockEvent({ userId: "u1" }),
    )) as Record<string, unknown>;
    expect(result["id"]).toBe("u1");
  });

  it("throws 404 when member not found", async () => {
    mockReadBody.mockResolvedValue({ id: "u1", weekXp: 10 });
    mockUserFindOneAndUpdate.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/members.patch");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("members.delete", () => {
  it("throws 403 when caller is not admin", async () => {
    mockReadBody.mockResolvedValue({ id: "u2" });
    const { default: handler } = await import("#server/api/members.delete");
    await expect(
      (handler as Function)(mockEvent({ role: "member" })),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("throws 400 when id missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } = await import("#server/api/members.delete");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when trying to remove yourself", async () => {
    mockReadBody.mockResolvedValue({ id: "u1" });
    const { default: handler } = await import("#server/api/members.delete");
    await expect(
      (handler as Function)(mockEvent({ userId: "u1" })),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("deletes member and returns ok", async () => {
    mockReadBody.mockResolvedValue({ id: "u2" });
    mockUserDeleteOne.mockResolvedValue({ deletedCount: 1 });
    const { default: handler } = await import("#server/api/members.delete");
    const result = await (handler as Function)(mockEvent({ userId: "u1" }));
    expect(result).toEqual({ ok: true });
  });

  it("throws 404 when member not found", async () => {
    mockReadBody.mockResolvedValue({ id: "u2" });
    mockUserDeleteOne.mockResolvedValue({ deletedCount: 0 });
    const { default: handler } = await import("#server/api/members.delete");
    await expect(
      (handler as Function)(mockEvent({ userId: "u1" })),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
