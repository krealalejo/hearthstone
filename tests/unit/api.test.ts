import { describe, it, expect, beforeEach, vi } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { api, statusOf } from "~/utils/api";

mockNuxtImport("$fetch", () => vi.fn());

const refreshSession = vi.fn();

vi.mock("~/utils/session", () => ({
  refreshSession: () => refreshSession(),
}));

function unauthorized() {
  return Object.assign(new Error("Unauthorized"), { statusCode: 401 });
}

beforeEach(() => {
  vi.mocked($fetch).mockReset();
  refreshSession.mockReset();
});

describe("statusOf", () => {
  it("reads statusCode, then status", () => {
    expect(statusOf({ statusCode: 404 })).toBe(404);
    expect(statusOf({ status: 500 })).toBe(500);
    expect(statusOf(new Error("plain"))).toBeUndefined();
    expect(statusOf(null)).toBeUndefined();
  });
});

describe("api", () => {
  it("passes the response through when the call succeeds", async () => {
    vi.mocked($fetch).mockResolvedValue({ id: "x" } as never);

    await expect(api("/api/tasks")).resolves.toEqual({ id: "x" });
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("refreshes and retries once on a 401", async () => {
    vi.mocked($fetch)
      .mockRejectedValueOnce(unauthorized())
      .mockResolvedValueOnce({ id: "x" } as never);
    refreshSession.mockResolvedValue(true);

    await expect(api("/api/tasks", { method: "PATCH" })).resolves.toEqual({
      id: "x",
    });
    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(2);
  });

  it("rethrows the original error when the refresh fails", async () => {
    vi.mocked($fetch).mockRejectedValue(unauthorized());
    refreshSession.mockResolvedValue(false);

    await expect(api("/api/tasks")).rejects.toMatchObject({ statusCode: 401 });
    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(1);
  });

  it("surfaces the retry failure when the retried call also 401s", async () => {
    vi.mocked($fetch).mockRejectedValue(unauthorized());
    refreshSession.mockResolvedValue(true);

    await expect(api("/api/tasks")).rejects.toMatchObject({ statusCode: 401 });
    expect(vi.mocked($fetch)).toHaveBeenCalledTimes(2);
  });

  it("does not refresh on non-401 errors", async () => {
    vi.mocked($fetch).mockRejectedValue(
      Object.assign(new Error("boom"), { statusCode: 500 }),
    );

    await expect(api("/api/tasks")).rejects.toMatchObject({ statusCode: 500 });
    expect(refreshSession).not.toHaveBeenCalled();
  });
});
