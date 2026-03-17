"use client";

/** Einfache Strichmännchen-Platzhalter für Yoga-Posen (Schritte 1–5) */
export function PosePlaceholder({ index }: { index: number }) {
  const poses: Record<number, React.ReactNode> = {
    1: (
      <svg viewBox="0 0 60 80" className="h-full w-full">
        <circle cx="30" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="20" x2="30" y2="50" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="15" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="45" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="50" x2="15" y2="75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="50" x2="45" y2="75" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    2: (
      <svg viewBox="0 0 60 80" className="h-full w-full">
        <circle cx="30" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="20" x2="30" y2="50" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="15" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="45" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="50" x2="15" y2="75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="50" x2="45" y2="65" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    3: (
      <svg viewBox="0 0 60 80" className="h-full w-full">
        <circle cx="30" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="20" x2="30" y2="45" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="30" x2="15" y2="25" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="30" x2="45" y2="25" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="45" x2="20" y2="70" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="45" x2="40" y2="70" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    4: (
      <svg viewBox="0 0 60 80" className="h-full w-full">
        <circle cx="30" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="20" x2="30" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="15" y2="50" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="45" y2="50" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="55" x2="25" y2="75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="55" x2="35" y2="75" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    5: (
      <svg viewBox="0 0 60 80" className="h-full w-full">
        <circle cx="30" cy="15" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="23" x2="30" y2="45" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="15" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <line x1="30" y1="35" x2="45" y2="55" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 20 55 Q 30 70 40 55" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  };

  return (
    <div className="flex h-full w-full items-center justify-center text-text/40">
      {poses[index] ?? <span className="text-xs">Grafik</span>}
    </div>
  );
}
