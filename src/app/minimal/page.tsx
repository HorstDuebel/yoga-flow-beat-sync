"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Track = {
  id: string;
  title?: string;
  artist?: string;
  previewUrl?: string;
  imageUrl?: string;
};

export default function MinimalPage() {
  const { data: session, status } = useSession();
  const [track, setTrack] = useState<Track | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadTrack = async () => {
    const token = (session as { accessToken?: string } | null)?.accessToken;
    if (!token) {
      setError("Bitte mit Spotify anmelden.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/minimal/track", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { track?: Track; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Fehler beim Laden");
        setTrack(null);
        return;
      }
      setTrack(data.track ?? null);
    } catch {
      setError("Netzwerkfehler");
      setTrack(null);
    } finally {
      setIsLoading(false);
    }
  };

  const playTrack = () => {
    if (!track?.previewUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(track.previewUrl);
    audioRef.current = audio;
    audio.play();
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text/60">Laden…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold text-text">Minimal Proof</h1>
        <p className="text-text/70">Bitte mit Spotify anmelden.</p>
        <Link
          href="/"
          className="rounded-lg bg-primary px-4 py-2 font-medium text-background"
        >
          Zur Startseite
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-text">Minimal Proof</h1>
          <Link
            href="/"
            className="text-sm text-primary hover:underline"
          >
            ← Zurück
          </Link>
        </div>

        <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-start">
          {/* Nr. */}
          <div className="flex items-center justify-center pt-4">
            <span className="text-2xl font-bold text-text">1</span>
          </div>

          {/* Yoga-Übung (Platzhalter) */}
          <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-text/20 bg-background/50">
            <div className="text-4xl text-text/30">🧘</div>
          </div>

          {/* Musik-Karte */}
          <div className="flex flex-col rounded-lg border border-text/20 bg-background p-4">
            <p className="mb-3 text-xs font-medium text-text/60">Vorschlag 1</p>
            {track ? (
              <>
                {track.imageUrl ? (
                  <img
                    src={track.imageUrl}
                    alt=""
                    className="mb-2 h-14 w-14 rounded object-cover"
                  />
                ) : (
                  <div className="mb-2 h-14 w-14 rounded bg-primary/20" />
                )}
                <p className="truncate text-sm font-medium text-text">
                  {track.title ?? "—"}
                </p>
                <p className="truncate text-xs text-text/60">
                  {track.artist ?? "—"}
                </p>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center py-6 text-text/40">
                Leer
              </div>
            )}

            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={playTrack}
                disabled={!track?.previewUrl}
                className="flex-1 rounded bg-primary px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Play
              </button>
              <button
                type="button"
                onClick={loadTrack}
                disabled={isLoading}
                className="rounded border border-primary/50 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "…" : "Load New"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
