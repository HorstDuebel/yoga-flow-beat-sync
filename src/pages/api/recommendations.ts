import type { NextApiRequest, NextApiResponse } from "next";
import { GENRE_TO_SPOTIFY } from "@/lib/spotify";
import type { Song } from "@/types/editor";

type RecommendationsParams = {
  accessToken?: string;
  genre?: string;
  limit?: number;
  excludeTrackIds?: string[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = (req.body ?? {}) as RecommendationsParams;
    const { accessToken, genre, limit = 20, excludeTrackIds = [] } = body;

    if (!accessToken) {
      return res.status(401).json({ error: "Nicht angemeldet" });
    }

    const seedGenre =
      genre && GENRE_TO_SPOTIFY[genre] ? GENRE_TO_SPOTIFY[genre] : "ambient";

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
      return res.status(spotifyRes.status).json({
        error: "Spotify API Fehler",
        details: err,
      });
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
    const tracks: Song[] = (data.tracks ?? [])
      .filter((t) => !excludeSet.has(t.id))
      .slice(0, limit)
      .map((t) => ({
        id: t.id,
        title: t.name,
        artist: t.artists[0]?.name,
        previewUrl: t.preview_url ?? undefined,
        imageUrl: t.album?.images?.[0]?.url,
      }));

    return res.status(200).json({ tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[recommendations] Fehler:", err);
    return res.status(500).json({
      error: "Serverfehler",
      details: msg,
    });
  }
}
