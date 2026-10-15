import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "glyph_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type SessionProfile = {
  username: "ADMIN" | "Umer" | "Saim";
  role: "admin" | "member";
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

export function createSessionToken(profile: Omit<SessionProfile, "expiresAt">) {
  const payload = Buffer.from(
    JSON.stringify({ ...profile, expiresAt: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): SessionProfile | null {
  if (!token) return null;

  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expected = Buffer.from(sign(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionProfile;
    const validUsername = ["ADMIN", "Umer", "Saim"].includes(session.username);
    const validRole = session.username === "ADMIN" ? session.role === "admin" : session.role === "member";
    if (!validUsername || !validRole || session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return session;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}