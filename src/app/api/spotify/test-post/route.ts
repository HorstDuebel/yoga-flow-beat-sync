import { NextResponse } from "next/server";

/** Nur POST – testet ob POST-Requests funktionieren. */
export async function POST() {
  return NextResponse.json({ ok: true, method: "POST" });
}
