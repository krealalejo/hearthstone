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
const mockSendRedirect = vi.fn((_event, url: string) => ({ redirect: url }));
const mockGetQuery = vi.fn();
const mockGetRequestURL = vi.fn(() => new URL("https://hearth.test/"));

vi.stubGlobal("defineEventHandler", (fn: (event: unknown) => unknown) => fn);
vi.stubGlobal("createError", mockCreateError);
vi.stubGlobal("getCookie", mockGetCookie);
vi.stubGlobal("setCookie", mockSetCookie);
vi.stubGlobal("deleteCookie", mockDeleteCookie);
vi.stubGlobal("sendRedirect", mockSendRedirect);
vi.stubGlobal("getQuery", mockGetQuery);
vi.stubGlobal("getRequestURL", mockGetRequestURL);
vi.stubGlobal("$fetch", vi.fn());
vi.stubGlobal("useRuntimeConfig", () => ({
  jwtSecret: TEST_SECRET,
  googleClientId: "client-id",
  googleClientSecret: "client-secret",
  googleRedirectUri: "",
}));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    defineEventHandler: (fn: (event: unknown) => unknown) => fn,
    createError: mockCreateError,
    getCookie: mockGetCookie,
    setCookie: mockSetCookie,
    deleteCookie: mockDeleteCookie,
    sendRedirect: mockSendRedirect,
    getQuery: mockGetQuery,
    getRequestURL: mockGetRequestURL,
  };
});

vi.mock("#imports", async () => ({
  useRuntimeConfig: vi.fn(() => ({
    jwtSecret: TEST_SECRET,
    googleClientId: "client-id",
    googleClientSecret: "client-secret",
    googleRedirectUri: "",
  })),
}));

const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();
const mockHouseholdCreate = vi.fn();
const mockPendingInviteFindOne = vi.fn();
const mockPendingInviteDeleteOne = vi.fn();

vi.mock("#server/models/User", () => ({
  User: { findOne: mockUserFindOne, findById: vi.fn(), create: mockUserCreate },
}));

vi.mock("#server/models/Household", () => ({
  Household: { create: mockHouseholdCreate },
}));

vi.mock("#server/models/PendingInvite", () => ({
  PendingInvite: {
    findOne: mockPendingInviteFindOne,
    deleteOne: mockPendingInviteDeleteOne,
  },
}));

function mockEvent(extra: Record<string, unknown> = {}) {
  return { context: {}, ...extra };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth/google.get", () => {
  it("sets oauth_state cookie and redirects to google auth url", async () => {
    const { default: handler } = await import("#server/api/auth/google.get");
    const result = await (handler as Function)(mockEvent());
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "oauth_state",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, path: "/" }),
    );
    expect(mockSendRedirect).toHaveBeenCalled();
    const url = (result as { redirect: string }).redirect;
    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("response_type=code");
    expect(url).toContain("scope=openid");
    expect(url).toContain("prompt=select_account");
    expect(url).toMatch(/state=[0-9a-f]{32}/);
  });
});

describe("auth/google/callback.get", () => {
  function fakeUser(overrides = {}) {
    return {
      _id: { toString: () => "u1" },
      householdId: { toString: () => "hh1" },
      googleId: "google-sub-1",
      role: "admin",
      save: vi.fn(),
      ...overrides,
    };
  }

  it("throws 400 when code or state missing", async () => {
    mockGetQuery.mockReturnValue({});
    mockGetCookie.mockReturnValue(undefined);
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when state does not match cookie", async () => {
    mockGetQuery.mockReturnValue({ code: "abc", state: "state-a" });
    mockGetCookie.mockReturnValue("state-b");
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 401 when google email not verified", async () => {
    mockGetQuery.mockReturnValue({ code: "abc", state: "state-a" });
    mockGetCookie.mockReturnValue("state-a");
    vi.mocked($fetch)
      .mockResolvedValueOnce({ access_token: "g-access" })
      .mockResolvedValueOnce({
        sub: "google-sub-1",
        email: "alice@example.com",
        email_verified: false,
        name: "Alice Example",
      });
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("links googleId to existing user without one and redirects", async () => {
    mockGetQuery.mockReturnValue({ code: "abc", state: "state-a" });
    mockGetCookie.mockReturnValue("state-a");
    vi.mocked($fetch)
      .mockResolvedValueOnce({ access_token: "g-access" })
      .mockResolvedValueOnce({
        sub: "google-sub-1",
        email: "alice@example.com",
        email_verified: true,
        name: "Alice Example",
      });
    const existingUser = fakeUser({ googleId: undefined });
    mockUserFindOne.mockResolvedValue(existingUser);
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    const result = await (handler as Function)(mockEvent());
    expect(existingUser.googleId).toBe("google-sub-1");
    expect(existingUser.save).toHaveBeenCalled();
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "access_token",
      "mock.access.token",
      expect.any(Object),
    );
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "refresh_token",
      "mock.refresh.token",
      expect.any(Object),
    );
    expect((result as { redirect: string }).redirect).toBe("/dashboard");
  });

  it("creates household and admin user when no pending invite exists", async () => {
    mockGetQuery.mockReturnValue({ code: "abc", state: "state-a" });
    mockGetCookie.mockReturnValue("state-a");
    vi.mocked($fetch)
      .mockResolvedValueOnce({ access_token: "g-access" })
      .mockResolvedValueOnce({
        sub: "google-sub-2",
        email: "bob@example.com",
        email_verified: true,
        name: "Bob Builder",
      });
    mockUserFindOne.mockResolvedValue(null);
    mockPendingInviteFindOne.mockResolvedValue(null);
    mockHouseholdCreate.mockResolvedValue({ _id: { toString: () => "hh2" } });
    mockUserCreate.mockResolvedValue(
      fakeUser({ _id: { toString: () => "u2" } }),
    );
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    const result = await (handler as Function)(mockEvent());
    expect(mockHouseholdCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Bob's Home" }),
    );
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "bob@example.com",
        householdId: "hh2",
        role: "admin",
      }),
    );
    expect((result as { redirect: string }).redirect).toBe("/dashboard");
  });

  it("consumes pending invite and creates user with invited role", async () => {
    mockGetQuery.mockReturnValue({ code: "abc", state: "state-a" });
    mockGetCookie.mockReturnValue("state-a");
    vi.mocked($fetch)
      .mockResolvedValueOnce({ access_token: "g-access" })
      .mockResolvedValueOnce({
        sub: "google-sub-3",
        email: "carol@example.com",
        email_verified: true,
        name: "Carol Client",
      });
    mockUserFindOne.mockResolvedValue(null);
    mockPendingInviteFindOne.mockResolvedValue({
      _id: "invite-1",
      householdId: { toString: () => "hh3" },
      role: "member",
    });
    mockUserCreate.mockResolvedValue(
      fakeUser({ _id: { toString: () => "u3" } }),
    );
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await (handler as Function)(mockEvent());
    expect(mockPendingInviteDeleteOne).toHaveBeenCalledWith({
      _id: "invite-1",
    });
    expect(mockHouseholdCreate).not.toHaveBeenCalled();
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "carol@example.com",
        householdId: "hh3",
        role: "member",
      }),
    );
  });
});
