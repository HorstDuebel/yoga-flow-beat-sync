import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Minimal: Ein Track von Spotify Recommendations. Token im Header. */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

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
      return NextResponse.json(
        { error: "Spotify Fehler", details: err },
        { status: spotifyRes.status }
      );
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
