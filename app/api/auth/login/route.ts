import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import Profile from "@/MODELS/Profile";
import { connectToDatabase } from "@/lib/mongodb";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const configuredProfiles = [
  { username: "ADMIN", role: "admin", password: process.env.ADMIN_PASSWORD },
  { username: "Umer", role: "member", password: process.env.UMER_PASSWORD },
  { username: "Saim", role: "member", password: process.env.SAIM_PASSWORD },
] as const;

async function ensureProfiles() {
  if (configuredProfiles.some((profile) => !profile.password || profile.password.length < 8)) {
    throw new Error("Set ADMIN_PASSWORD, UMER_PASSWORD, and SAIM_PASSWORD to values of at least 8 characters.");
  }

  for (const profile of configuredProfiles) {
    const password = profile.password;
    if (!password) throw new Error("A configured profile password is missing.");
    const existing = await Profile.findOne({ username: profile.username }).select("+passwordHash");
    if (existing) continue;

    try {
      await Profile.create({
        username: profile.username,
        role: profile.role,
        passwordHash: await bcrypt.hash(password, 12),
      });
    } catch (error) {
      if (!(typeof error === "object" && error !== null && "code" in error && error.code === 11000)) throw error;
    }
  }
}

export async function POST(request: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Enter a profile and password." }, { status: 400 });
  }

  if (
    typeof body.username !== "string" ||
    !["ADMIN", "Umer", "Saim"].includes(body.username) ||
    typeof body.password !== "string" ||
    body.password.length > 200
  ) {
    return NextResponse.json({ error: "Enter a valid profile and password." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    await ensureProfiles();
    const profile = await Profile.findOne({ username: body.username }).select("+passwordHash");
    if (!profile || !(await bcrypt.compare(body.password, profile.passwordHash))) {
      return NextResponse.json({ error: "That profile or password is incorrect." }, { status: 401 });
    }

    const response = NextResponse.json({ username: profile.username, role: profile.role });
    response.cookies.set(SESSION_COOKIE, createSessionToken({ username: profile.username, role: profile.role }), sessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login could not connect to the profile store:", error);
    return NextResponse.json({ error: "Login is unavailable. Check the server database configuration." }, { status: 503 });
  }
}