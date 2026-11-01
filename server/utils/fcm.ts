import { SignJWT, importPKCS8 } from "jose";

export interface FcmConfig {
  fcmProjectId: string;
  fcmClientEmail: string;
  fcmPrivateKey: string;
}

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export type PushResult = "sent" | "unregistered" | "failed";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

let cachedToken: { value: string; expiresAt: number } | null = null;

export function isFcmConfigured(config: Partial<FcmConfig>): boolean {
  return Boolean(
    config.fcmProjectId && config.fcmClientEmail && config.fcmPrivateKey,
  );
}

export function resetFcmTokenCache() {
  cachedToken = null;
}

async function accessToken(config: FcmConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const key = await importPKCS8(
    config.fcmPrivateKey.replace(/\\n/g, "\n"),
    "RS256",
  );
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(config.fcmClientEmail)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const res = await $fetch<{ access_token: string; expires_in: number }>(
    TOKEN_URL,
    {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    },
  );
  cachedToken = {
    value: res.access_token,
    expiresAt: Date.now() + res.expires_in * 1000,
  };
  return res.access_token;
}

interface FcmError {
  status?: number;
  data?: { error?: { details?: { errorCode?: string }[] } };
}

function isUnregistered(err: FcmError): boolean {
  if (err.status === 404) return true;
  return (
    err.data?.error?.details?.some((d) => d.errorCode === "UNREGISTERED") ??
    false
  );
}

export async function sendPush(
  config: FcmConfig,
  token: string,
  message: PushMessage,
): Promise<PushResult> {
  try {
    const bearer = await accessToken(config);
    await $fetch(
      `https://fcm.googleapis.com/v1/projects/${config.fcmProjectId}/messages:send`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${bearer}` },
        body: {
          message: {
            token,
            notification: { title: message.title, body: message.body },
            data: message.data ?? {},
            android: { priority: "high" },
          },
        },
      },
    );
    return "sent";
  } catch (err) {
    return isUnregistered(err as FcmError) ? "unregistered" : "failed";
  }
}
