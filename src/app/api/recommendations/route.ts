import { NextRequest, NextResponse } from "next/server";

const GENRE_MAP: Record<string, string> = {
  Ambient: "ambient",
  Meditation: "meditation",
  World: "world-music",
  Acoustic: "acoustic",
  Electronic: "electronic",
  Classical: "classical",
  Nature: "ambient",
};

type RecommendationsBody = {
  accessToken?: string;
  genre?: string;
  limit?: number;
  excludeTrackIds?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecommendationsBody;
    const { accessToken, genre, limit = 20, excludeTrackIds = [] } = body;

    if (!accessToken) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const seedGenre = genre && GENRE_MAP[genre] ? GENRE_MAP[genre] : "ambient";

    const params = new URLSearchParams();
    params.set("seed_genres", seedGenre);
    params.set("limit", String(Math.min(100, Math.max(1, limit))));
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
