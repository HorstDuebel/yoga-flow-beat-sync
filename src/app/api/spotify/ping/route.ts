import { NextResponse } from "next/server";

/** Minimale Test-Route – prüft ob /api/spotify/ erreichbar ist. */
export async function GET() {
  return NextResponse.json({ ok: true, route: "spotify/ping" });
}
