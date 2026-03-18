import type { NextApiRequest, NextApiResponse } from "next";
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

function sendJson(res: NextApiResponse, status: number, data: object) {
  res.setHeader("Content-Type", "application/json");
  res.status(status).json(data);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  try {
    const session = await auth(req, res);
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;
    if (!session || !accessToken) {
      return sendJson(res, 401, { error: "Nicht angemeldet" });
    }

    const body = req.body as RecommendationsParams;
    const {
      timeMMSS,
      genre,
      bpm,
      lyrics,
      limit = 20,
      excludeTrackIds = [],
    } = body ?? {};

    const seedGenre =
      genre && GENRE_TO_SPOTIFY[genre] ? GENRE_TO_SPOTIFY[genre] : "ambient";

    const params = new URLSearchParams();
    params.set("seed_genres", seedGenre);
    params.set("limit", String(Math.min(100, Math.max(1, limit))));
    params.set("market", "DE");

    const durationMs = timeMMSS ? parseTimeToMs(timeMMSS) : null;
    if (durationMs && durationMs > 0) {
      const { min_duration_ms, max_duration_ms, target_duration_ms } =
        durationMsWithTolerance(durationMs);
      params.set("min_duration_ms", String(min_duration_ms));
      params.set("max_duration_ms", String(max_duration_ms));
      params.set("target_duration_ms", String(target_duration_ms));
    }

    const { min_tempo, max_tempo } = parseBpmRange(bpm);
    if (min_tempo != null) params.set("min_tempo", String(min_tempo));
    if (max_tempo != null) params.set("max_tempo", String(max_tempo));

    const { min_instrumentalness, max_instrumentalness } =
      parseLyricsFilter(lyrics);
    if (min_instrumentalness != null)
      params.set("min_instrumentalness", String(min_instrumentalness));
    if (max_instrumentalness != null)
      params.set("max_instrumentalness", String(max_instrumentalness));

    const url = `https://api.spotify.com/v1/recommendations?${params.toString()}`;

    const spotifyRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!spotifyRes.ok) {
      const err = await spotifyRes.text();
      return sendJson(res, spotifyRes.status, {
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

    return sendJson(res, 200, { tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[recommendations] Fehler:", err);
    return sendJson(res, 500, {
      error: "Serverfehler",
      details: msg,
    });
  }
}
