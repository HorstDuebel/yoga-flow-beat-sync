import { NextRequest, NextResponse } from "next/server";

// Vercel: Serverless-Funktion explizit als Node.js markieren (behebt 404 bei manchen Deployments)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENRE_MAP: Record<string, string> = {
  Ambient: "ambient",
  Meditation: "meditation",
  World: "world-music",
  Acoustic: "acoustic",
  Electronic: "electronic",
  Classical: "classical",
  Nature: "ambient",
};

/**
 * GET: Empfängt Recommendations (Workaround: POST liefert 404 auf Vercel).
 * - accessToken: im Header "Authorization: Bearer <token>"
 * - genre, limit, excludeTrackIds: als Query-Parameter
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!accessToken) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const genre = searchParams.get("genre") ?? undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
    const excludeParam = searchParams.get("excludeTrackIds");
    const excludeTrackIds = excludeParam ? excludeParam.split(",").filter(Boolean) : [];

    const seedGenre = genre && GENRE_MAP[genre] ? GENRE_MAP[genre] : "ambient";

    const params = new URLSearchParams();
    params.set("seed_genres", seedGenre);
    params.set("limit", String(limit));
    params.set("market", "DE");

    const url = `https://api.spotify.com/v1/recommendations?${params.toString()}`;

    const spotifyRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!spotifyRes.ok) {
      const err = await spotifyRes.text();
      return NextResponse.json(
        { error: "Spotify API Fehler", details: err },
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

    const excludeSet = new Set(excludeTrackIds);
    const tracks = (data.tracks ?? [])
      .filter((t) => !excludeSet.has(t.id))
      .slice(0, limit)
      .map((t) => ({
        id: t.id,
        title: t.name,
        artist: t.artists[0]?.name,
        previewUrl: t.preview_url ?? undefined,
        imageUrl: t.album?.images?.[0]?.url,
      }));

    return NextResponse.json({ tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[recommendations] Fehler:", err);
    return NextResponse.json(
      { error: "Serverfehler", details: msg },
      { status: 500 }
    );
  }
}
