"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Song } from "@/types/editor";

type Props = {
  id: string;
  song: Song | null;
  onPlay: (previewUrl: string) => void;
  onLoadNew: () => void;
};

export function SongCard({ id, song, onPlay, onLoadNew }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex min-h-[100px] min-w-[120px] flex-col rounded-lg border border-text/20 bg-background p-3 transition-shadow ${
        isDragging ? "z-50 opacity-90 shadow-lg" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex flex-1 cursor-grab flex-col active:cursor-grabbing"
      >
        {song ? (
          <>
            {song.imageUrl ? (
              <img
                src={song.imageUrl}
                alt=""
                className="mb-2 h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="mb-2 h-12 w-12 rounded bg-primary/20" />
            )}
            <p className="truncate text-xs font-medium text-text">
              {song.title ?? "—"}
            </p>
            <p className="truncate text-xs text-text/60">
              {song.artist ?? "—"}
            </p>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-text/40">
            Leer
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        <button
          type="button"
          onClick={() => song?.previewUrl && onPlay(song.previewUrl)}
          disabled={!song?.previewUrl}
          className="flex-1 rounded bg-primary px-2 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          title="Preview abspielen"
        >
          Play
        </button>
        <button
          type="button"
          onClick={onLoadNew}
          className="rounded border border-primary/50 px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
          title="Neuen Song laden"
        >
          Load New
        </button>
      </div>
    </div>
  );
}
