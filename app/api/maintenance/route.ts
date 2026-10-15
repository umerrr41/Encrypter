import { NextResponse } from "next/server";
import Maintenance from "@/MODELS/Maintenance";
import { connectToDatabase } from "@/lib/mongodb";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

function getSession(request: Request) {
  const cookie = request.headers.get("cookie")?.split(";").map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  return verifySessionToken(cookie);
}

export async function GET(request: Request) {
  if (getSession(request)?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const state = await Maintenance.findOneAndUpdate(
      { key: "server" },
      { $setOnInsert: { key: "server" } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    return NextResponse.json({ enabled: state.enabled, progress: state.progress, message: state.message });
  } catch (error) {
    console.error("Could not load maintenance settings:", error);
    return NextResponse.json({ error: "Maintenance settings are unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  if (getSession(request)?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let body: { enabled?: unknown; progress?: unknown; message?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Send valid maintenance settings." }, { status: 400 });
  }

  if (
    typeof body.enabled !== "boolean" ||
    typeof body.progress !== "number" || !Number.isInteger(body.progress) || body.progress < 0 || body.progress > 100 ||
    typeof body.message !== "string" || body.message.trim().length < 1 || body.message.length > 160
  ) {
    return NextResponse.json({ error: "Use a progress value from 0 to 100 and a message up to 160 characters." }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const state = await Maintenance.findOneAndUpdate(
      { key: "server" },
      { $set: { enabled: body.enabled, progress: body.progress, message: body.message.trim() } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();
    return NextResponse.json({ enabled: state.enabled, progress: state.progress, message: state.message });
  } catch (error) {
    console.error("Could not save maintenance settings:", error);
    return NextResponse.json({ error: "Maintenance settings could not be saved." }, { status: 503 });
  }
}