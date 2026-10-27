import { setCookie, type H3Event } from "h3";
import { Household } from "#server/models/Household";
import { PendingInvite } from "#server/models/PendingInvite";
import { signAccessToken, signRefreshToken } from "#server/utils/jwt";

const ACCESS_TOKEN_MAX_AGE_SECONDS = 3600;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 2592000;

export interface SessionClaims {
  sub: string;
  householdId: unknown;
  role: unknown;
}

export interface HouseholdMembership {
  householdId: string;
  role: "admin" | "member";
}

function setAuthCookie(
  event: H3Event,
  name: string,
  value: string,
  maxAge: number,
) {
  setCookie(event, name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function setAccessTokenCookie(event: H3Event, accessToken: string) {
  setAuthCookie(event, "access_token", accessToken, ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export async function startSession(
  event: H3Event,
  claims: SessionClaims,
  jwtSecret: string,
) {
  const accessToken = await signAccessToken({ ...claims }, jwtSecret);
  const refreshToken = await signRefreshToken({ sub: claims.sub }, jwtSecret);

  setAccessTokenCookie(event, accessToken);
  setAuthCookie(
    event,
    "refresh_token",
    refreshToken,
    REFRESH_TOKEN_MAX_AGE_SECONDS,
  );
}

export async function joinOrCreateHousehold(
  email: string,
  name: string,
): Promise<HouseholdMembership> {
  const pendingInvite = await PendingInvite.findOne({
    email: email.toLowerCase(),
  });

  if (pendingInvite) {
    await PendingInvite.deleteOne({ _id: pendingInvite._id });
    return {
      householdId: pendingInvite.householdId.toString(),
      role: pendingInvite.role,
    };
  }

  const household = await Household.create({
    name: `${name.split(" ")[0]}'s Home`,
    emoji: "mdi-home",
  });
  return { householdId: household._id.toString(), role: "admin" };
}
