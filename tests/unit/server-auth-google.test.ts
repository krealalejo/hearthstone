import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_SECRET = "test-secret-for-unit-tests-32chars-ok";

vi.mock("#server/utils/jwt", async (importOriginal) => {
  const actual = await importOriginal<typeof import("#server/utils/jwt")>();
  return {
    ...actual,
    signAccessToken: vi.fn().mockResolvedValue("mock.access.token"),
    signRefreshToken: vi.fn().mockResolvedValue("mock.refresh.token"),
  };
});

const mockGetQuery = vi.fn();
const mockGetCookie = vi.fn();
const mockSetCookie = vi.fn();
const mockDeleteCookie = vi.fn();
const mockSendRedirect = vi.fn();
const mockCreateError = vi.fn(
  (opts: { statusCode: number; statusMessage?: string }) => {
    const err = new Error(opts.statusMessage ?? "Error") as Error & {
      statusCode?: number;
    };
    err.statusCode = opts.statusCode;
    return err;
  },
);
const mockGetRequestURL = vi.fn(() => new URL("http://localhost:3000"));

vi.stubGlobal("defineEventHandler", (fn: (event: unknown) => unknown) => fn);
vi.stubGlobal("getCookie", mockGetCookie);
vi.stubGlobal("setCookie", mockSetCookie);
vi.stubGlobal("deleteCookie", mockDeleteCookie);
vi.stubGlobal("getQuery", mockGetQuery);
vi.stubGlobal("sendRedirect", mockSendRedirect);
vi.stubGlobal("createError", mockCreateError);
vi.stubGlobal("getRequestURL", mockGetRequestURL);
vi.stubGlobal("useRuntimeConfig", () => ({
  jwtSecret: TEST_SECRET,
  googleClientId: "test-client-id",
  googleClientSecret: "test-client-secret",
  googleRedirectUri: "http://localhost:3000/api/auth/google/callback",
}));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    defineEventHandler: (fn: (event: unknown) => unknown) => fn,
    getCookie: mockGetCookie,
    setCookie: mockSetCookie,
    deleteCookie: mockDeleteCookie,
    getQuery: mockGetQuery,
    sendRedirect: mockSendRedirect,
    createError: mockCreateError,
    getRequestURL: mockGetRequestURL,
  };
});

vi.mock("#imports", () => ({
  useRuntimeConfig: vi.fn(() => ({
    jwtSecret: TEST_SECRET,
    googleClientId: "test-client-id",
    googleClientSecret: "test-client-secret",
    googleRedirectUri: "http://localhost:3000/api/auth/google/callback",
  })),
}));

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  return {
    ...actual,
    randomBytes: vi.fn(() => ({ toString: () => "deadbeef1234abcd" })),
  };
});

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

const mockUserFindOne = vi.fn();
const mockUserCreate = vi.fn();
const mockUserSave = vi.fn();

vi.mock("#server/models/User", () => ({
  User: {
    findOne: mockUserFindOne,
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

function mockEvent(extra: Record<string, unknown> = {}) {
  return { context: {}, ...extra };
}

function fakeUser(overrides = {}) {
  return {
    _id: { toString: () => "u1" },
    householdId: { toString: () => "hh1" },
    email: "alice@example.com",
    googleId: "google-sub-123",
    role: "admin" as const,
    save: mockUserSave,
    ...overrides,
  };
}

function fakeProfile(overrides = {}) {
  return {
    sub: "google-sub-123",
    email: "alice@example.com",
    email_verified: true,
    name: "Alice Smith",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("auth/google.get", () => {
  it("sets oauth_state cookie and redirects to Google auth URL", async () => {
    const { default: handler } = await import("#server/api/auth/google.get");
    await (handler as Function)(mockEvent());

    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "oauth_state",
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockSendRedirect).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining("accounts.google.com/o/oauth2/v2/auth"),
    );
  });

  it("includes required OAuth params in redirect URL", async () => {
    const { default: handler } = await import("#server/api/auth/google.get");
    await (handler as Function)(mockEvent());

    const redirectUrl = new URL(mockSendRedirect.mock.calls[0][1] as string);
    expect(redirectUrl.searchParams.get("response_type")).toBe("code");
    expect(redirectUrl.searchParams.get("scope")).toBe("openid email profile");
    expect(redirectUrl.searchParams.get("prompt")).toBe("select_account");
    expect(redirectUrl.searchParams.has("client_id")).toBe(true);
  });

  it("includes state param matching the cookie value", async () => {
    const { default: handler } = await import("#server/api/auth/google.get");
    await (handler as Function)(mockEvent());

    const stateInCookie = mockSetCookie.mock.calls[0][2] as string;
    const redirectUrl = mockSendRedirect.mock.calls[0][1] as string;
    expect(redirectUrl).toContain(`state=${stateInCookie}`);
  });
});

describe("auth/google/callback.get", () => {
  it("throws 400 when code is missing", async () => {
    mockGetQuery.mockReturnValue({ state: "abc" });
    mockGetCookie.mockReturnValue("abc");
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when state is missing", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode" });
    mockGetCookie.mockReturnValue("expected-state");
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when state does not match cookie", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "wrong-state" });
    mockGetCookie.mockReturnValue("expected-state");
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when oauth_state cookie is absent", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "some-state" });
    mockGetCookie.mockReturnValue(undefined);
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 401 when Google email is not verified", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "valid-state" });
    mockGetCookie.mockReturnValue("valid-state");
    mockFetch
      .mockResolvedValueOnce({ access_token: "goog-token" })
      .mockResolvedValueOnce(fakeProfile({ email_verified: false }));
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it("redirects to /dashboard and sets auth cookies for existing user", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "valid-state" });
    mockGetCookie.mockReturnValue("valid-state");
    mockFetch
      .mockResolvedValueOnce({ access_token: "goog-token" })
      .mockResolvedValueOnce(fakeProfile());
    mockUserFindOne.mockResolvedValue(fakeUser());
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await (handler as Function)(mockEvent());

    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "access_token",
      "mock.access.token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      "refresh_token",
      "mock.refresh.token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(mockSendRedirect).toHaveBeenCalledWith(
      expect.anything(),
      "/dashboard",
    );
  });

  it("links googleId to existing user found by email when googleId absent", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "valid-state" });
    mockGetCookie.mockReturnValue("valid-state");
    mockFetch
      .mockResolvedValueOnce({ access_token: "goog-token" })
      .mockResolvedValueOnce(fakeProfile());
    const existingUser = fakeUser({ googleId: undefined });
    mockUserFindOne.mockResolvedValue(existingUser);
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await (handler as Function)(mockEvent());

    expect(mockUserSave).toHaveBeenCalled();
    expect(existingUser.googleId).toBe("google-sub-123");
  });

  it("creates new user + household when no existing user and no pending invite", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "valid-state" });
    mockGetCookie.mockReturnValue("valid-state");
    mockFetch
      .mockResolvedValueOnce({ access_token: "goog-token" })
      .mockResolvedValueOnce(fakeProfile());
    mockUserFindOne.mockResolvedValue(null);
    mockPendingInviteFindOne.mockResolvedValue(null);
    mockHouseholdCreate.mockResolvedValue({
      _id: { toString: () => "new-hh" },
    });
    mockUserCreate.mockResolvedValue(fakeUser());
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await (handler as Function)(mockEvent());

    expect(mockHouseholdCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Alice's Home" }),
    );
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin", googleId: "google-sub-123" }),
    );
  });

  it("creates new user with pending invite role and cleans up invite", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "valid-state" });
    mockGetCookie.mockReturnValue("valid-state");
    mockFetch
      .mockResolvedValueOnce({ access_token: "goog-token" })
      .mockResolvedValueOnce(fakeProfile());
    mockUserFindOne.mockResolvedValue(null);
    mockPendingInviteFindOne.mockResolvedValue({
      _id: "inv1",
      householdId: { toString: () => "existing-hh" },
      role: "member",
    });
    mockPendingInviteDeleteOne.mockResolvedValue({});
    mockUserCreate.mockResolvedValue(fakeUser({ role: "member" }));
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await (handler as Function)(mockEvent());

    expect(mockHouseholdCreate).not.toHaveBeenCalled();
    expect(mockPendingInviteDeleteOne).toHaveBeenCalledWith({ _id: "inv1" });
    expect(mockUserCreate).toHaveBeenCalledWith(
      expect.objectContaining({ role: "member" }),
    );
  });

  it("deletes oauth_state cookie regardless of outcome", async () => {
    mockGetQuery.mockReturnValue({ code: "authcode", state: "valid-state" });
    mockGetCookie.mockReturnValue("valid-state");
    mockFetch
      .mockResolvedValueOnce({ access_token: "goog-token" })
      .mockResolvedValueOnce(fakeProfile());
    mockUserFindOne.mockResolvedValue(fakeUser());
    const { default: handler } =
      await import("#server/api/auth/google/callback.get");
    await (handler as Function)(mockEvent());

    expect(mockDeleteCookie).toHaveBeenCalledWith(
      expect.anything(),
      "oauth_state",
      expect.objectContaining({ path: "/" }),
    );
  });
});
