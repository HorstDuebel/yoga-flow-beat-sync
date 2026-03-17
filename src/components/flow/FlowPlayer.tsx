"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Flow } from "@/types/flow";
import type { Song } from "@/types/editor";

type Props = {
  flow: Flow;
};

function parseTimeToSeconds(timeMMSS: string): number {
  const trimmed = timeMMSS.trim();
  if (!trimmed) return 0;
  const parts = trimmed.split(":");
  if (parts.length === 1) {
    const sec = parseInt(parts[0], 10);
    return isNaN(sec) ? 0 : sec;
  }
  if (parts.length === 2) {
    const [m, s] = parts.map((p) => parseInt(p, 10));
    return isNaN(m) || isNaN(s) ? 0 : m * 60 + s;
  }
  return 0;
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

const getInitialSeconds = (slots: Flow["slots"]) =>
  slots[0] ? parseTimeToSeconds(slots[0].timeMMSS) : 0;

export function FlowPlayer({ flow }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    getInitialSeconds(flow.slots)
  );
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(() =>
    getInitialSeconds(flow.slots)
  );

  const slot = flow.slots[currentIndex];
  const currentSong: Song | null = slot?.songs?.[0] ?? null;

  const startCurrentSlot = useCallback(() => {
    if (!slot) return;
    const sec = parseTimeToSeconds(slot.timeMMSS);
    setTotalSeconds(sec);
    setSecondsLeft(sec);
    setIsRunning(true);
  }, [slot]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          setCurrentIndex((i) => Math.min(i + 1, flow.slots.length - 1));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, secondsLeft, flow.slots.length]);

  useEffect(() => {
    const s = flow.slots[currentIndex];
    if (s) {
      const sec = parseTimeToSeconds(s.timeMMSS);
      setSecondsLeft(sec);
      setTotalSeconds(sec);
    }
  }, [currentIndex, flow.slots]);

  const handleStart = () => {
    if (currentIndex === 0 && !isRunning) {
      startCurrentSlot();
    }
  };

  const handleNext = () => {
    setIsRunning(false);
    setCurrentIndex((i) => Math.min(i + 1, flow.slots.length - 1));
    const nextSlot = flow.slots[Math.min(currentIndex + 1, flow.slots.length - 1)];
    if (nextSlot) {
      const sec = parseTimeToSeconds(nextSlot.timeMMSS);
      setSecondsLeft(sec);
      setTotalSeconds(sec);
    }
  };

  const handlePrev = () => {
    setIsRunning(false);
    setCurrentIndex((i) => Math.max(i - 1, 0));
    const prevSlot = flow.slots[Math.max(currentIndex - 1, 0)];
    if (prevSlot) {
      const sec = parseTimeToSeconds(prevSlot.timeMMSS);
      setSecondsLeft(sec);
      setTotalSeconds(sec);
    }
  };

  if (!slot) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-text/70">Keine Übungen in diesem Flow.</p>
        <Link href="/flows" className="mt-4 text-primary">
          Zurück zur Übersicht
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between px-4 py-3">
        <Link href="/flows" className="text-sm font-medium text-primary">
          Zurück
        </Link>
        <span className="text-sm text-text/70">
          {currentIndex + 1} / {flow.slots.length}
        </span>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col justify-center px-4 py-6">
          {/* Große Karte */}
          <div className="flex flex-col rounded-2xl border border-text/15 bg-background p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-text">
              Übung {slot.index}
            </h2>

            {/* Countdown */}
            <div className="mb-6 flex justify-center">
              <div
                className={`text-6xl font-mono font-bold tabular-nums tracking-tight md:text-7xl ${
                  secondsLeft <= 10 ? "text-primary" : "text-text"
                }`}
              >
                {formatCountdown(secondsLeft)}
              </div>
            </div>

            {/* Progress-Balken */}
            {totalSeconds > 0 && (
              <div className="mb-6 h-2 overflow-hidden rounded-full bg-text/10">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-1000"
                  style={{
                    width: `${(secondsLeft / totalSeconds) * 100}%`,
                  }}
                />
              </div>
            )}

            {/* Aktueller Song (Platz 1) */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text/60">
                Aktueller Song
              </p>
              {currentSong ? (
                <div className="flex items-center gap-3">
                  {currentSong.imageUrl ? (
                    <img
                      src={currentSong.imageUrl}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-14 w-14 shrink-0 rounded-lg bg-primary/20" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-text">
                      {currentSong.title ?? "—"}
                    </p>
                    <p className="truncate text-sm text-text/60">
                      {currentSong.artist ?? "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-text/60">Kein Song gewählt</p>
              )}
            </div>
          </div>

          {/* Steuerung */}
          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full border border-text/20 px-6 py-3 font-medium text-text disabled:opacity-40"
            >
              Zurück
            </button>
            {!isRunning && currentIndex === 0 && secondsLeft === totalSeconds ? (
              <button
                type="button"
                onClick={handleStart}
                className="rounded-full bg-primary px-8 py-3 font-medium text-background"
              >
                Start
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (isRunning ? setIsRunning(false) : startCurrentSlot())}
                className="rounded-full bg-primary px-8 py-3 font-medium text-background"
              >
                {isRunning ? "Pause" : "Weiter"}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= flow.slots.length - 1}
              className="rounded-full border border-text/20 px-6 py-3 font-medium text-text disabled:opacity-40"
            >
              Weiter
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
