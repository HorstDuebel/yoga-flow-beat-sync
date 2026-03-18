import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { GENRE_TO_SPOTIFY } from "@/lib/spotify";
import type { Song } from "@/types/editor";

/** NextApiRequest-Header für getToken lesbar machen */
function toHeadersRecord(
  headers: NextApiRequest["headers"]
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  for (const [k, v] of Object.entries(headers)) {
    if (v != null) out[k] = Array.isArray(v) ? v[0] ?? "" : String(v);
  }
  return out;
}

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
    const token = await getToken({
      req: { headers: toHeadersRecord(req.headers) },
      secret: process.env.AUTH_SECRET,
      secureCookie: true,
    });
    const accessToken = (token as { accessToken?: string } | null)?.accessToken;
    if (!token || !accessToken) {
      return sendJson(res, 401, { error: "Nicht angemeldet" });
    }

    const body = req.body as RecommendationsParams;
    const { genre, limit = 20, excludeTrackIds = [] } = body ?? {};

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
