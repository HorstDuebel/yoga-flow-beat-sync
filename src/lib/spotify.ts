/** Mapping unserer Genre-Optionen zu Spotify seed_genres */
export const GENRE_TO_SPOTIFY: Record<string, string> = {
  Ambient: "ambient",
  Meditation: "meditation",
  World: "world-music",
  Acoustic: "acoustic",
  Electronic: "electronic",
  Classical: "classical",
  Nature: "ambient", // Fallback, "nature" existiert nicht
};

/** BPM-Range zu min/max Tempo */
export function parseBpmRange(bpm?: string): { min_tempo?: number; max_tempo?: number } {
  if (!bpm) return {};
  if (bpm === "140+") return { min_tempo: 140 };
  const [min, max] = bpm.split("-").map(Number);
  if (isNaN(min) || isNaN(max)) return {};
  return { min_tempo: min, max_tempo: max };
}

/** Lyrics zu instrumentalness (0=vocal, 1=instrumental) */
export function parseLyricsFilter(lyrics?: string): { min_instrumentalness?: number; max_instrumentalness?: number } {
  if (!lyrics) return {};
  switch (lyrics) {
    case "Instrumental":
      return { min_instrumentalness: 0.7 };
    case "Vocal":
      return { max_instrumentalness: 0.3 };
    case "Mantra":
      return { min_instrumentalness: 0.2, max_instrumentalness: 0.8 };
    case "Mix":
    default:
      return {};
  }
}

/** MM:SS zu Millisekunden */
export function parseTimeToMs(timeMMSS: string): number | null {
  const trimmed = timeMMSS.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(":");
  if (parts.length === 1) {
    const sec = parseInt(parts[0], 10);
    if (isNaN(sec)) return null;
    return sec * 1000;
  }
  if (parts.length === 2) {
    const [m, s] = parts.map((p) => parseInt(p, 10));
    if (isNaN(m) || isNaN(s)) return null;
    return (m * 60 + s) * 1000;
  }
  return null;
}

/** target_duration_ms mit +/- 10 Sek Toleranz */
export function durationMsWithTolerance(ms: number): { min_duration_ms: number; max_duration_ms: number; target_duration_ms: number } {
  const tolerance = 10 * 1000;
  return {
    min_duration_ms: Math.max(0, ms - tolerance),
    max_duration_ms: ms + tolerance,
    target_duration_ms: ms,
  };
}
