import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { generateKeyPairSync } from "node:crypto";
import { decodeJwt } from "jose";
import {
  isFcmConfigured,
  resetFcmTokenCache,
  sendPush,
} from "#server/utils/fcm";

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));
mockNuxtImport("$fetch", () => mockFetch);

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const config = {
  fcmProjectId: "proj",
  fcmClientEmail: "svc@proj.iam.gserviceaccount.com",
  fcmPrivateKey: (
    privateKey.export({ type: "pkcs8", format: "pem" }) as string
  ).replace(/\n/g, "\\n"),
};
const message = { title: "T", body: "B", data: { route: "/todos" } };

function mockToken() {
  mockFetch.mockImplementation(async (url: string) =>
    url.includes("oauth2")
      ? { access_token: "access", expires_in: 3600 }
      : { name: "projects/proj/messages/1" },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  resetFcmTokenCache();
  mockToken();
});

describe("isFcmConfigured", () => {
  it("requires all three values", () => {
    expect(isFcmConfigured(config)).toBe(true);
    expect(isFcmConfigured({ ...config, fcmProjectId: "" })).toBe(false);
    expect(isFcmConfigured({})).toBe(false);
  });
});

describe("sendPush", () => {
  it("signs a service account assertion and sends the message", async () => {
    expect(await sendPush(config, "tok", message)).toBe("sent");

    const [tokenUrl, tokenOpts] = mockFetch.mock.calls[0]!;
    expect(tokenUrl).toBe("https://oauth2.googleapis.com/token");
    const params = tokenOpts.body as URLSearchParams;
    expect(params.get("grant_type")).toBe(
      "urn:ietf:params:oauth:grant-type:jwt-bearer",
    );
    const claims = decodeJwt(params.get("assertion")!);
    expect(claims).toMatchObject({
      iss: config.fcmClientEmail,
      aud: "https://oauth2.googleapis.com/token",
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://fcm.googleapis.com/v1/projects/proj/messages:send",
      {
        method: "POST",
        headers: { Authorization: "Bearer access" },
        body: {
          message: {
            token: "tok",
            notification: { title: "T", body: "B" },
            data: { route: "/todos" },
            android: { priority: "high" },
          },
        },
      },
    );
  });

  it("reuses the access token until it expires", async () => {
    await sendPush(config, "a", message);
    await sendPush(config, "b", { title: "T", body: "B" });
    const tokenCalls = mockFetch.mock.calls.filter(([url]) =>
      String(url).includes("oauth2"),
    );
    expect(tokenCalls).toHaveLength(1);
    expect(mockFetch.mock.calls.at(-1)![1].body.message.data).toEqual({});
  });

  it("reports unregistered tokens", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("oauth2")) return { access_token: "a", expires_in: 3600 };
      throw Object.assign(new Error("gone"), { status: 404 });
    });
    expect(await sendPush(config, "tok", message)).toBe("unregistered");

    resetFcmTokenCache();
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("oauth2")) return { access_token: "a", expires_in: 3600 };
      throw Object.assign(new Error("bad"), {
        status: 400,
        data: { error: { details: [{ errorCode: "UNREGISTERED" }] } },
      });
    });
    expect(await sendPush(config, "tok", message)).toBe("unregistered");
  });

  it("reports other errors as failed", async () => {
    mockFetch.mockRejectedValue(Object.assign(new Error("x"), { status: 500 }));
    expect(await sendPush(config, "tok", message)).toBe("failed");
  });
});
