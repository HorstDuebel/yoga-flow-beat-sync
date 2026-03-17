import { NextResponse } from "next/server";
import { auth } from "auth";
import {
  GENRE_TO_SPOTIFY,
  parseBpmRange,
  parseLyricsFilter,
  parseTimeToMs,
  durationMsWithTolerance,
} from "@/lib/spotify";
import type { Song } from "@/types/editor";

type RecommendationsParams = {
  timeMMSS?: string;
  genre?: string;
  bpm?: string;
  lyrics?: string;
  limit?: number;
  excludeTrackIds?: string[];
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: RecommendationsParams;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const { timeMMSS, genre, bpm, lyrics, limit = 20, excludeTrackIds = [] } = body;

  // Mindestens ein Seed erforderlich
  const seedGenre = genre && GENRE_TO_SPOTIFY[genre] ? GENRE_TO_SPOTIFY[genre] : "ambient";

  const params = new URLSearchParams();
  params.set("seed_genres", seedGenre);
  params.set("limit", String(Math.min(100, Math.max(1, limit))));
  params.set("market", "DE");

  // Zeit: target_duration_ms mit +/- 10 Sek
  const durationMs = timeMMSS ? parseTimeToMs(timeMMSS) : null;
  if (durationMs && durationMs > 0) {
    const { min_duration_ms, max_duration_ms, target_duration_ms } = durationMsWithTolerance(durationMs);
    params.set("min_duration_ms", String(min_duration_ms));
    params.set("max_duration_ms", String(max_duration_ms));
    params.set("target_duration_ms", String(target_duration_ms));
  }

  const { min_tempo, max_tempo } = parseBpmRange(bpm);
  if (min_tempo != null) params.set("min_tempo", String(min_tempo));
  if (max_tempo != null) params.set("max_tempo", String(max_tempo));

  const { min_instrumentalness, max_instrumentalness } = parseLyricsFilter(lyrics);
  if (min_instrumentalness != null) params.set("min_instrumentalness", String(min_instrumentalness));
  if (max_instrumentalness != null) params.set("max_instrumentalness", String(max_instrumentalness));

  const url = `https://api.spotify.com/v1/recommendations?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json(
      { error: "Spotify API Fehler", details: err },
      { status: res.status }
    );
  }

  const data = (await res.json()) as { tracks?: Array<{
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    preview_url: string | null;
    album: { images: Array<{ url: string }> };
  }> };

  const excludeSet = new Set(excludeTrackIds);
  const tracks: Song[] = (data.tracks ?? [])
    .filter((t) => !excludeSet.has(t.id) && t.preview_url)
    .slice(0, limit)
    .map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artists[0]?.name,
      previewUrl: t.preview_url ?? undefined,
      imageUrl: t.album?.images?.[0]?.url,
    }));

  return NextResponse.json({ tracks });
}
