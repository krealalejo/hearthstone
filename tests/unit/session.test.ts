import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import {
  refreshSession,
  accessTokenFrom,
  withAccessToken,
} from "~/utils/session";

mockNuxtImport("$fetch", () => vi.fn());

beforeEach(() => {
  vi.mocked($fetch).mockReset();
});

describe("accessTokenFrom", () => {
  it("returns the access token pair without its attributes", () => {
    expect(
      accessTokenFrom([
        "refresh_token=r1; Path=/; HttpOnly",
        "access_token=a1; Path=/; Max-Age=3600; HttpOnly",
      ]),
    ).toBe("access_token=a1");
  });

  it("returns null when no access token is present", () => {
    expect(accessTokenFrom(["refresh_token=r1; Path=/"])).toBeNull();
    expect(accessTokenFrom([])).toBeNull();
  });
});

describe("withAccessToken", () => {
  it("replaces an existing access token and keeps the rest", () => {
    expect(
      withAccessToken("theme=dark; access_token=old; refresh_token=r1", "access_token=new"),
    ).toBe("theme=dark; refresh_token=r1; access_token=new");
  });

  it("appends when the header has no access token", () => {
    expect(withAccessToken("theme=dark", "access_token=new")).toBe(
      "theme=dark; access_token=new",
    );
  });

  it("handles an empty cookie header", () => {
    expect(withAccessToken("", "access_token=new")).toBe("access_token=new");
  });
});

describe("refreshSession on the client", () => {
  it("returns true when the refresh endpoint succeeds", async () => {
    vi.mocked($fetch).mockResolvedValue({ ok: true } as never);

    await expect(refreshSession()).resolves.toBe(true);
    expect(vi.mocked($fetch)).toHaveBeenCalledWith("/api/auth/refresh", {
      method: "POST",
    });
  });

  it("returns false when the refresh endpoint rejects", async () => {
    vi.mocked($fetch).mockRejectedValue(
      Object.assign(new Error("nope"), { statusCode: 401 }),
    );

    await expect(refreshSession()).resolves.toBe(false);
  });

  it("shares one in-flight request across concurrent callers", async () => {
    let resolveRefresh: (v: unknown) => void = () => {};
    vi.mocked($fetch).mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve;
      }) as never,
    );

    const both = Promise.all([refreshSession(), refreshSession()]);
    resolveRefresh({ ok: true });

    await expect(both).resolves.toEqual([true, true]);
    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(1);
  });

  it("starts a new request once the previous one settled", async () => {
    vi.mocked($fetch).mockResolvedValue({ ok: true } as never);

    await refreshSession();
    await refreshSession();

    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(2);
  });
});
