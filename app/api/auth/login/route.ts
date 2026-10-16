import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import Profile from "@/MODELS/Profile";
import { connectToDatabase } from "@/lib/mongodb";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

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