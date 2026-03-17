"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SongCard } from "./SongCard";
import { PosePlaceholder } from "./PosePlaceholder";
import type { ExerciseSlot } from "@/types/editor";
import {
  GENRE_OPTIONS,
  BPM_OPTIONS,
  LYRICS_OPTIONS,
} from "@/types/editor";

type Props = {
  slot: ExerciseSlot;
  onTimeChange: (id: string, value: string) => void;
  onFilterChange: (
    id: string,
    filter: "genre" | "bpm" | "lyrics",
    value: string
  ) => void;
  onPlayPreview: (url: string) => void;
  onLoadNewSong: (rowId: string, slotIndex: number) => void;
};

export function ExerciseRow({
  slot,
  onTimeChange,
  onFilterChange,
  onPlayPreview,
  onLoadNewSong,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const songIds = slot.songs.map(
    (_, i) => `${slot.id}-song-${i}`
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[48px_120px_100px_1fr] gap-4 border-b border-text/10 py-4 align-top md:grid-cols-[48px_140px_120px_repeat(5,1fr)] ${
        isDragging ? "z-40 bg-primary/5" : ""
      }`}
    >
      {/* Index + Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-center active:cursor-grabbing"
      >
        <span className="text-lg font-semibold text-text">
          {slot.index}
        </span>
      </div>

      {/* Grafik-Platzhalter */}
      <div className="flex h-20 w-full items-center justify-center rounded border border-dashed border-text/30 bg-text/5">
        {slot.graphicUrl ? (
          <img
            src={slot.graphicUrl}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <PosePlaceholder index={slot.index} />
        )}
      </div>

      {/* Zeit + Filter */}
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={slot.timeMMSS}
          onChange={(e) => onTimeChange(slot.id, e.target.value)}
          placeholder="MM:SS"
          className="rounded border border-text/20 bg-background px-2 py-1.5 text-sm text-text"
        />
        <select
          value={slot.genre ?? ""}
          onChange={(e) => onFilterChange(slot.id, "genre", e.target.value)}
          className="rounded border border-text/20 bg-background px-2 py-1 text-xs text-text"
        >
          <option value="">Genre</option>
          {GENRE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={slot.bpm ?? ""}
          onChange={(e) => onFilterChange(slot.id, "bpm", e.target.value)}
          className="rounded border border-text/20 bg-background px-2 py-1 text-xs text-text"
        >
          <option value="">BPM</option>
          {BPM_OPTIONS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          value={slot.lyrics ?? ""}
          onChange={(e) => onFilterChange(slot.id, "lyrics", e.target.value)}
          className="rounded border border-text/20 bg-background px-2 py-1 text-xs text-text"
        >
          <option value="">Lyrics</option>
          {LYRICS_OPTIONS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* 5 Song-Slots */}
      <SortableContext
        items={songIds}
        strategy={horizontalListSortingStrategy}
      >
        <div className="col-span-1 flex gap-2 overflow-x-auto md:col-span-5">
          {slot.songs.map((song, i) => (
            <SongCard
              key={`${slot.id}-song-${i}`}
              id={`${slot.id}-song-${i}`}
              song={song}
              onPlay={onPlayPreview}
              onLoadNew={() => onLoadNewSong(slot.id, i)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
