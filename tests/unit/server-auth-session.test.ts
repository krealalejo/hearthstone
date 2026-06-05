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

vi.mock("#server/models/User", () => ({
  User: { findOne: vi.fn(), findById: vi.fn(), create: vi.fn() },
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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth/logout.post", () => {
  it("deletes both cookies and returns ok", async () => {
    const { default: handler } = await import("#server/api/auth/logout.post");
    const result = await (handler as Function)(mockEvent());
    expect(mockDeleteCookie).toHaveBeenCalledWith(
      expect.anything(),
      "access_token",
    );
    expect(mockDeleteCookie).toHaveBeenCalledWith(
      expect.anything(),
      "refresh_token",
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("auth/me.get", () => {
  it("returns event.context.user", async () => {
    const { default: handler } = await import("#server/api/auth/me.get");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ userId: "u1", householdId: "hh1", role: "admin" });
  });
});
