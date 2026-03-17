import { NextResponse } from "next/server";

/** Nur für lokales Debugging – prüft ob Auth-Env geladen ist. */
export async function GET() {
  const hasSecret = !!process.env.AUTH_SECRET?.length;
  const hasClientId = !!process.env.SPOTIFY_CLIENT_ID?.length;
  const hasClientSecret = !!process.env.SPOTIFY_CLIENT_SECRET?.length;
  const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;

  return NextResponse.json({
    ok: hasSecret && hasClientId && hasClientSecret,
    hasSecret,
    hasClientId,
    hasClientSecret,
    authUrl,
    callbackUrl: authUrl ? `${authUrl}/api/auth/callback/spotify` : null,
  });
}
