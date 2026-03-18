"use server";

export type Track = {
  id: string;
  title?: string;
  artist?: string;
  previewUrl?: string;
  imageUrl?: string;
};

export async function fetchTrack(accessToken: string): Promise<
  | { track: Track }
  | { error: string; details?: string }
> {
  try {
    const url =
      "https://api.spotify.com/v1/recommendations?seed_genres=ambient&limit=1&market=DE";

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.text();
      let msg = "Spotify Fehler";
      if (res.status === 401) {
        msg = "Token abgelaufen – bitte abmelden und erneut anmelden.";
      } else if (res.status === 403) {
        msg = "Keine Berechtigung – Spotify-Bereiche prüfen.";
      } else if (res.status === 429) {
        msg = "Zu viele Anfragen – bitte kurz warten.";
      } else {
        try {
          const parsed = JSON.parse(err) as { error?: { message?: string } };
          if (parsed.error?.message) msg = parsed.error.message;
        } catch {
          if (err.length < 100) msg = err;
        }
      }
      return { error: msg, details: err };
    }

    const data = (await res.json()) as {
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
      return { error: "Kein Track gefunden" };
    }

    return {
      track: {
        id: t.id,
        title: t.name,
        artist: t.artists[0]?.name,
        previewUrl: t.preview_url ?? undefined,
        imageUrl: t.album?.images?.[0]?.url,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[minimal fetchTrack] Fehler:", err);
    return { error: "Serverfehler", details: msg };
  }
}
