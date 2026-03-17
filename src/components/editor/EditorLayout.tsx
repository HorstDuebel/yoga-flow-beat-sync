"use client";

import Link from "next/link";
import { EditorMatrix } from "./EditorMatrix";

export function EditorLayout() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between border-b border-text/10 pb-6">
        <Link href="/" className="text-xl font-semibold text-text">
          KundaFlow-Beat-Sync
        </Link>
        <nav className="flex gap-4">
          <Link
            href="/"
            className="text-sm text-text/70 hover:text-primary"
          >
            Start
          </Link>
        </nav>
      </header>

      <main className="rounded-xl border border-text/10 bg-background p-6 shadow-sm">
        <h2 className="mb-2 text-2xl font-semibold text-text">
          Kundalini-Yoga-Flow
        </h2>
        <p className="mb-6 text-text/70">
          Übungen vertikal sortieren, Songs horizontal pro Zeile. Zeit (MM:SS) und Filter pro Slot.
        </p>

        <EditorMatrix />
      </main>
    </div>
  );
}
