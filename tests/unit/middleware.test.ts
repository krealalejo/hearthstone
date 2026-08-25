import { describe, it, expect, vi } from "vitest";
import { signAccessToken } from "#server/utils/jwt";

const TEST_SECRET = "test-secret-for-unit-tests-32chars-ok";

vi.mock("h3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("h3")>();
  return {
    ...actual,
    getCookie: vi.fn(),
    createError: vi.fn((opts) => {
      const err = new Error(opts.statusMessage || "Error");
      (err as Error & { statusCode?: number }).statusCode = opts.statusCode;
      return err;
    }),
    getRequestURL: vi.fn(),
  };
});

vi.mock("#imports", async () => ({
  useRuntimeConfig: vi.fn(() => ({ jwtSecret: TEST_SECRET })),
}));

describe("auth middleware", () => {
  it("skips verification for /api/auth/login (public route)", async () => {
    const { getCookie, getRequestURL } = await import("h3");
    const { default: authMiddleware } = await import("#server/middleware/auth");

    const mockEvent = {
      context: {} as Record<string, unknown>,
    };

    vi.mocked(getRequestURL).mockReturnValue({
      pathname: "/api/auth/login",
    } as URL);

    await expect(authMiddleware(mockEvent as never)).resolves.toBeUndefined();
    expect(getCookie).not.toHaveBeenCalled();
  });

  it("protects /api/auth/me (not a public route)", async () => {
    const { getCookie, getRequestURL, createError } = await import("h3");
    const { default: authMiddleware } = await import("#server/middleware/auth");

    const mockEvent = {
      context: {} as Record<string, unknown>,
    };

    vi.mocked(getRequestURL).mockReturnValue({
      pathname: "/api/auth/me",
    } as URL);
    vi.mocked(getCookie).mockReturnValue(undefined);

    await expect(authMiddleware(mockEvent as never)).rejects.toThrow();
    expect(createError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it("throws 401 when access_token cookie is absent", async () => {
    const { getCookie, getRequestURL, createError } = await import("h3");
    const { default: authMiddleware } = await import("#server/middleware/auth");

    const mockEvent = {
      context: {} as Record<string, unknown>,
    };

    vi.mocked(getRequestURL).mockReturnValue({
      pathname: "/api/tasks",
    } as URL);
    vi.mocked(getCookie).mockReturnValue(undefined);

    await expect(authMiddleware(mockEvent as never)).rejects.toThrow();
    expect(createError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it("throws 401 for invalid/expired access_token", async () => {
    const { getCookie, getRequestURL, createError } = await import("h3");
    const { default: authMiddleware } = await import("#server/middleware/auth");

    const mockEvent = {
      context: {} as Record<string, unknown>,
    };

    vi.mocked(getRequestURL).mockReturnValue({
      pathname: "/api/tasks",
    } as URL);
    vi.mocked(getCookie).mockReturnValue("invalid.token.value");

    await expect(authMiddleware(mockEvent as never)).rejects.toThrow();
    expect(createError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });
});
