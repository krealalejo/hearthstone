import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_SECRET = "test-secret-for-unit-tests-32chars-ok";

vi.mock("#server/utils/jwt", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#server/utils/jwt")>();
  return {
    ...actual,
    signAccessToken: vi.fn().mockResolvedValue("mock.access.token"),
    signRefreshToken: vi.fn().mockResolvedValue("mock.refresh.token"),
    verifyToken: vi.fn().mockResolvedValue({ sub: "u1" }),
  };
});

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
const mockGetCookie = vi.fn();
const mockSetCookie = vi.fn();
const mockDeleteCookie = vi.fn();

vi.stubGlobal("defineEventHandler", (fn: (event: unknown) => unknown) => fn);
vi.stubGlobal("readBody", mockReadBody);
vi.stubGlobal("createError", mockCreateError);
vi.stubGlobal("getCookie", mockGetCookie);
vi.stubGlobal("setCookie", mockSetCookie);
vi.stubGlobal("deleteCookie", mockDeleteCookie);
vi.stubGlobal("useRuntimeConfig", () => ({ jwtSecret: TEST_SECRET }));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    defineEventHandler: (fn: (event: unknown) => unknown) => fn,
    readBody: mockReadBody,
    createError: mockCreateError,
    getCookie: mockGetCookie,
    setCookie: mockSetCookie,
    deleteCookie: mockDeleteCookie,
  };
});

vi.mock("#imports", async () => ({
  useRuntimeConfig: vi.fn(() => ({ jwtSecret: TEST_SECRET })),
}));

const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();

vi.mock("#server/models/User", () => ({
  User: {
    findOne: mockUserFindOne,
    findById: vi.fn(),
    create: mockUserCreate,
  },
}));

const mockHouseholdCreate = vi.fn();

vi.mock("#server/models/Household", () => ({
  Household: { create: mockHouseholdCreate },
}));

const mockPendingInviteFindOne = vi.fn();
const mockPendingInviteDeleteOne = vi.fn();

vi.mock("#server/models/PendingInvite", () => ({
  PendingInvite: {
    findOne: mockPendingInviteFindOne,
    deleteOne: mockPendingInviteDeleteOne,
  },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn(), hash: vi.fn(), genSalt: vi.fn() },
}));

function mockEvent(extra: Record<string, unknown> = {}) {
  return {
    context: { user: { userId: "u1", householdId: "hh1", role: "admin" } },
    ...extra,
  };
}

function fakeUser(overrides = {}) {
  return {
    _id: { toString: () => "u1" },
    householdId: { toString: () => "hh1" },
    email: "alice@example.com",
    passwordHash: "$2a$10$hashedpassword",
    role: "admin",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth/register.post", () => {
  function fakeHousehold() {
    return { _id: { toString: () => "hh2" } };
  }

  function fakeNewUser(overrides = {}) {
    return {
      _id: { toString: () => "u2" },
      name: "Bob",
      email: "bob@example.com",
      role: "admin",
      ...overrides,
    };
  }

  it("throws 400 when required fields missing", async () => {
    mockReadBody.mockResolvedValue({ email: "bob@example.com" });
    const { default: handler } = await import("#server/api/auth/register.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 409 when email already registered", async () => {
    mockReadBody.mockResolvedValue({
      name: "Bob",
      email: "bob@example.com",
      password: "Pass1word!",
    });
    mockUserFindOne.mockResolvedValue(fakeUser());
    const { default: handler } = await import("#server/api/auth/register.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("creates household and user when no pending invite", async () => {
    mockReadBody.mockResolvedValue({
      name: "Bob",
      email: "bob@example.com",
      password: "Pass1word!",
    });
    mockUserFindOne.mockResolvedValue(null);
    mockPendingInviteFindOne.mockResolvedValue(null);
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.hash).mockResolvedValue("hashed" as never);
    mockHouseholdCreate.mockResolvedValue(fakeHousehold());
    mockUserCreate.mockResolvedValue(fakeNewUser());
    const { default: handler } = await import("#server/api/auth/register.post");
    const result = await (handler as Function)(mockEvent());
    expect(mockHouseholdCreate).toHaveBeenCalled();
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin" }),
    );
    expect(mockSetCookie).toHaveBeenCalled();
    expect(result).toMatchObject({ user: { role: "admin" } });
  });

  it("joins existing household when pending invite found", async () => {
    mockReadBody.mockResolvedValue({
      name: "Bob",
      email: "bob@example.com",
      password: "Pass1word!",
    });
    mockUserFindOne.mockResolvedValue(null);
    mockPendingInviteFindOne.mockResolvedValue({
      householdId: { toString: () => "hh1" },
      role: "member",
      _id: "inv1",
    });
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.hash).mockResolvedValue("hashed" as never);
    mockUserCreate.mockResolvedValue(fakeNewUser({ role: "member" }));
    const { default: handler } = await import("#server/api/auth/register.post");
    const result = await (handler as Function)(mockEvent());
    expect(mockHouseholdCreate).not.toHaveBeenCalled();
    expect(mockPendingInviteDeleteOne).toHaveBeenCalled();
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "member", householdId: "hh1" }),
    );
    expect(result).toMatchObject({ user: { role: "member" } });
  });
});
