import { SignJWT, jwtVerify } from "jose";

function getSecret(jwtSecret: string): Uint8Array {
  return new TextEncoder().encode(jwtSecret);
}

export async function signAccessToken(
  payload: Record<string, unknown>,
  jwtSecret: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret(jwtSecret));
}

export async function signRefreshToken(
  payload: Record<string, unknown>,
  jwtSecret: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret(jwtSecret));
}

export async function verifyToken(token: string, jwtSecret: string) {
  const { payload } = await jwtVerify(token, getSecret(jwtSecret));
  return payload;
}
