import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "#server/utils/jwt";

const TEST_SECRET = "test-secret-for-unit-tests-32chars-ok";
const WRONG_SECRET = "wrong-secret-for-unit-tests-32chars-ok";

describe("jwt utils", () => {
  it("signAccessToken produces a verifiable token with correct sub", async () => {
    const payload = { sub: "user123", householdId: "hh1", role: "admin" };
    const token = await signAccessToken(payload, TEST_SECRET);
    const result = await verifyToken(token, TEST_SECRET);
    expect(result.sub).toBe("user123");
  });

  it("signAccessToken exp is approximately 1h from now (within ±100s)", async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signAccessToken({ sub: "user1" }, TEST_SECRET);
    const payload = await verifyToken(token, TEST_SECRET);
    const exp = payload.exp as number;
    expect(exp).toBeGreaterThan(now + 3500);
    expect(exp).toBeLessThan(now + 3700);
  });

  it("signRefreshToken exp is approximately 30 days from now (within ±100s)", async () => {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60;
    const token = await signRefreshToken({ sub: "user1" }, TEST_SECRET);
    const payload = await verifyToken(token, TEST_SECRET);
    const exp = payload.exp as number;
    expect(exp).toBeGreaterThan(now + thirtyDays - 100);
    expect(exp).toBeLessThan(now + thirtyDays + 100);
  });

  it("verifyToken throws when given a token signed with a different secret", async () => {
    const token = await signAccessToken({ sub: "user1" }, TEST_SECRET);
    await expect(verifyToken(token, WRONG_SECRET)).rejects.toThrow();
  });

  it("verifyToken throws when given a malformed string", async () => {
    await expect(verifyToken("not.a.valid.jwt", TEST_SECRET)).rejects.toThrow();
  });

  it("tokens are signed with alg HS256", async () => {
    const token = await signAccessToken({ sub: "user1" }, TEST_SECRET);
    const headerB64 = token.split(".")[0]!;
    const header = JSON.parse(
      Buffer.from(headerB64, "base64url").toString("utf-8"),
    );
    expect(header.alg).toBe("HS256");
  });
});
