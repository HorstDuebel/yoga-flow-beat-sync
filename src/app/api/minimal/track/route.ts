import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimal: Ein Track von Spotify Recommendations. Token im Header. */
export async function GET(req: NextRequest) {
  try {
    // Debug: Ohne Spotify-Fetch prüfen ob Route überhaupt erreicht wird
    if (req.headers.get("x-test-mode") === "1") {
      return NextResponse.json({ ok: true, route: "minimal/track" });
    }

    // Token aus X-Spotify-Token (Authorization-Header verursacht 404 auf Vercel)
    const accessToken =
      req.headers.get("x-spotify-token") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;

    if (!accessToken) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const url =
      "https://api.spotify.com/v1/recommendations?seed_genres=ambient&limit=1&market=DE";

    const spotifyRes = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!spotifyRes.ok) {
      const err = await spotifyRes.text();
      let msg = "Spotify Fehler";
      if (spotifyRes.status === 401) msg = "Token abgelaufen – bitte abmelden und erneut anmelden.";
      else if (spotifyRes.status === 403) msg = "Keine Berechtigung.";
      else if (spotifyRes.status === 429) msg = "Zu viele Anfragen – bitte warten.";
      else {
        try {
          const parsed = JSON.parse(err) as { error?: { message?: string } };
          if (parsed.error?.message) msg = parsed.error.message;
        } catch {
          if (err.length < 100) msg = err;
        }
      }
      return NextResponse.json({ error: msg }, { status: spotifyRes.status });
    }

    const data = (await spotifyRes.json()) as {
      tracks?: Array<{
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        preview_url: string | null;
        album: { images: Array<{ url: string }> };
      }>;
    };

    const t = data.tracks?.[0];
    if (!t) {
      return NextResponse.json({ error: "Kein Track gefunden" }, { status: 404 });
    }

    return NextResponse.json({
      track: {
        id: t.id,
        title: t.name,
        artist: t.artists[0]?.name,
        previewUrl: t.preview_url ?? undefined,
        imageUrl: t.album?.images?.[0]?.url,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[minimal/track] Fehler:", err);
    return NextResponse.json(
      { error: "Serverfehler", details: msg },
      { status: 500 }
    );
  }
}
