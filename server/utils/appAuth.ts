import { createHash } from "node:crypto";

export const APP_AUTH_CALLBACK_URL = "com.heartshtone.app://auth";

const PKCE_VALUE_PATTERN = /^[A-Za-z0-9_-]{43,128}$/;

export function isPkceValue(value: unknown): value is string {
  return typeof value === "string" && PKCE_VALUE_PATTERN.test(value);
}

export function pkceChallengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function appChallengeFromState(state: string): string | undefined {
  const challenge = state.split(".")[1];
  return isPkceValue(challenge) ? challenge : undefined;
}
