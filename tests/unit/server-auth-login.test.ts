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
const mockUserFindById = vi.fn();

vi.mock("#server/models/User", () => ({
  User: {
    findOne: mockUserFindOne,
    findById: mockUserFindById,
    create: vi.fn(),
  },
}));

vi.mock("#server/models/Household", () => ({
  Household: { create: vi.fn() },
}));

vi.mock("#server/models/PendingInvite", () => ({
  PendingInvite: { findOne: vi.fn(), deleteOne: vi.fn() },
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

describe("auth/login.post", () => {
  it("throws 400 when email or password missing", async () => {
    mockReadBody.mockResolvedValue({ email: "" });
    const { default: handler } = await import("#server/api/auth/login.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 401 when user not found", async () => {
    mockReadBody.mockResolvedValue({ email: "x@x.com", password: "pass" });
    mockUserFindOne.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/auth/login.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("throws 401 when password invalid", async () => {
    mockReadBody.mockResolvedValue({
      email: "alice@example.com",
      password: "wrong",
    });
    mockUserFindOne.mockResolvedValue(fakeUser());
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never);
    const { default: handler } = await import("#server/api/auth/login.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("sets cookies and returns ok on valid credentials", async () => {
    mockReadBody.mockResolvedValue({
      email: "alice@example.com",
      password: "correct",
    });
    mockUserFindOne.mockResolvedValue(fakeUser());
    const bcrypt = await import("bcryptjs");
    vi.mocked(bcrypt.default.compare).mockResolvedValue(true as never);
    const { default: handler } = await import("#server/api/auth/login.post");
    const result = await (handler as Function)(mockEvent());
    expect(mockSetCookie).toHaveBeenCalled();
    expect(result).toMatchObject({ user: { role: "admin" } });
  });
});

describe("auth/refresh.post", () => {
  it("throws 401 when no refresh token cookie", async () => {
    mockGetCookie.mockReturnValue(undefined);
    const { default: handler } = await import("#server/api/auth/refresh.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("throws 401 when refresh token is invalid", async () => {
    mockGetCookie.mockReturnValue("bad.token.value");
    const { default: handler } = await import("#server/api/auth/refresh.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("throws 401 when user not found", async () => {
    mockGetCookie.mockReturnValue("any.valid.token");
    mockUserFindById.mockResolvedValue(null);
    const { default: handler } = await import("#server/api/auth/refresh.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("issues new access token and returns ok", async () => {
    mockGetCookie.mockReturnValue("any.valid.token");
    mockUserFindById.mockResolvedValue(fakeUser());
    const { default: handler } = await import("#server/api/auth/refresh.post");
    const result = await (handler as Function)(mockEvent());
    expect(mockSetCookie).toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });
});
