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

vi.stubGlobal("defineEventHandler", (fn: (event: unknown) => unknown) => fn);
vi.stubGlobal("readBody", mockReadBody);
vi.stubGlobal("createError", mockCreateError);
vi.stubGlobal("useRuntimeConfig", () => ({
  resendApiKey: "test-key",
  public: { baseUrl: "http://localhost:3000" },
}));

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    defineEventHandler: (fn: (event: unknown) => unknown) => fn,
    readBody: mockReadBody,
    createError: mockCreateError,
  };
});

vi.mock("#imports", async () => ({
  useRuntimeConfig: vi.fn(() => ({
    resendApiKey: "test-key",
    public: { baseUrl: "http://localhost:3000" },
  })),
}));

const mockUserFindOne = vi.fn();
const mockUserUpdateOne = vi.fn();

vi.mock("#server/models/User", () => ({
  User: {
    findOne: mockUserFindOne,
    updateOne: mockUserUpdateOne,
  },
}));

const mockTokenDeleteMany = vi.fn();
const mockTokenCreate = vi.fn();
const mockTokenFindOne = vi.fn();
const mockTokenDeleteOne = vi.fn();

vi.mock("#server/models/PasswordResetToken", () => ({
  PasswordResetToken: {
    deleteMany: mockTokenDeleteMany,
    create: mockTokenCreate,
    findOne: mockTokenFindOne,
    deleteOne: mockTokenDeleteOne,
  },
}));

const mockResendSend = vi.fn();
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: mockResendSend },
  })),
}));

vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("$2a$12$newhash") },
}));

function mockEvent() {
  return { context: {} };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockResendSend.mockResolvedValue({ id: "email-id" });
  mockTokenDeleteMany.mockResolvedValue({});
  mockTokenCreate.mockResolvedValue({});
  mockUserUpdateOne.mockResolvedValue({});
  mockTokenDeleteOne.mockResolvedValue({});
});

describe("auth/forgot-password.post", () => {
  it("throws 400 when email missing", async () => {
    mockReadBody.mockResolvedValue({});
    const { default: handler } =
      await import("#server/api/auth/forgot-password.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("returns ok without sending email when user not found", async () => {
    mockReadBody.mockResolvedValue({ email: "nobody@example.com" });
    mockUserFindOne.mockResolvedValue(null);
    const { default: handler } =
      await import("#server/api/auth/forgot-password.post");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ ok: true });
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockTokenCreate).not.toHaveBeenCalled();
  });

  it("clears existing tokens, creates new token, sends email when user found", async () => {
    mockReadBody.mockResolvedValue({ email: "alice@example.com" });
    const fakeUser = {
      _id: "u1",
      email: "alice@example.com",
      name: "Alice",
    };
    mockUserFindOne.mockResolvedValue(fakeUser);
    const { default: handler } =
      await import("#server/api/auth/forgot-password.post");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ ok: true });
    expect(mockTokenDeleteMany).toHaveBeenCalledWith({ userId: "u1" });
    expect(mockTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "u1",
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    );
    expect(mockResendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "Hearthstone <hi@krealalejo.dev>",
        to: "alice@example.com",
        subject: "Reset your password",
      }),
    );
  });

  it("reset URL in email contains token and base URL", async () => {
    mockReadBody.mockResolvedValue({ email: "alice@example.com" });
    mockUserFindOne.mockResolvedValue({
      _id: "u1",
      email: "alice@example.com",
      name: "Alice",
    });
    const { default: handler } =
      await import("#server/api/auth/forgot-password.post");
    await (handler as Function)(mockEvent());
    const call = mockResendSend.mock.calls[0][0];
    expect(call.html).toContain("http://localhost:3000/reset-password?token=");
  });

  it("stores hash not raw token", async () => {
    mockReadBody.mockResolvedValue({ email: "alice@example.com" });
    mockUserFindOne.mockResolvedValue({
      _id: "u1",
      email: "alice@example.com",
      name: "Alice",
    });
    const { default: handler } =
      await import("#server/api/auth/forgot-password.post");
    await (handler as Function)(mockEvent());

    const emailCall = mockResendSend.mock.calls[0][0];
    const tokenInEmail = emailCall.html.match(/token=([a-f0-9]+)/)?.[1];
    const storedHash = mockTokenCreate.mock.calls[0][0].tokenHash;

    expect(tokenInEmail).toBeDefined();
    expect(storedHash).not.toBe(tokenInEmail);
    expect(storedHash).toHaveLength(64);
  });
});

describe("auth/reset-password.post", () => {
  it("throws 400 when body invalid", async () => {
    mockReadBody.mockResolvedValue({ token: "", password: "weak" });
    const { default: handler } =
      await import("#server/api/auth/reset-password.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when password too weak", async () => {
    mockReadBody.mockResolvedValue({
      token: "sometoken",
      password: "nouppernumber",
    });
    const { default: handler } =
      await import("#server/api/auth/reset-password.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("throws 400 when token not found or expired", async () => {
    mockReadBody.mockResolvedValue({
      token: "validformattoken",
      password: "NewPass1!",
    });
    mockTokenFindOne.mockResolvedValue(null);
    const { default: handler } =
      await import("#server/api/auth/reset-password.post");
    await expect((handler as Function)(mockEvent())).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("updates password hash and deletes token on success", async () => {
    mockReadBody.mockResolvedValue({
      token: "validtoken",
      password: "NewPass1!",
    });
    const fakeRecord = { _id: "tok1", userId: "u1" };
    mockTokenFindOne.mockResolvedValue(fakeRecord);
    const { default: handler } =
      await import("#server/api/auth/reset-password.post");
    const result = await (handler as Function)(mockEvent());
    expect(result).toEqual({ ok: true });
    expect(mockUserUpdateOne).toHaveBeenCalledWith(
      { _id: "u1" },
      { passwordHash: "$2a$12$newhash" },
    );
    expect(mockTokenDeleteOne).toHaveBeenCalledWith({ _id: "tok1" });
  });

  it("looks up token by SHA-256 hash of raw token", async () => {
    const crypto = await import("node:crypto");
    const rawToken = "abc123rawtoken";
    const expectedHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    mockReadBody.mockResolvedValue({ token: rawToken, password: "NewPass1!" });
    mockTokenFindOne.mockResolvedValue({ _id: "tok1", userId: "u1" });
    const { default: handler } =
      await import("#server/api/auth/reset-password.post");
    await (handler as Function)(mockEvent());
    expect(mockTokenFindOne).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: expectedHash }),
    );
  });
});
