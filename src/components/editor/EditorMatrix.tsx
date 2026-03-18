"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { ExerciseRow } from "./ExerciseRow";
import type { ExerciseSlot, Song } from "@/types/editor";

const SEARCH_DEBOUNCE_MS = 600;

const createInitialSlots = (): ExerciseSlot[] =>
  Array.from({ length: 20 }, (_, i) => ({
    id: `row-${i}`,
    index: i + 1,
    timeMMSS: ["02:05", "03:50", "02:45", "06:30", "11:10"][i] ?? "",
    songs: [null, null, null, null, null],
  }));

export function EditorMatrix() {
  const router = useRouter();
  const [flowName, setFlowName] = useState("");
  const [slots, setSlots] = useState<ExerciseSlot[]>(createInitialSlots);
  const [nextRowId, setNextRowId] = useState(20);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null);

  const handleAddExercise = useCallback(() => {
    const newSlot: ExerciseSlot = {
      id: `row-${nextRowId}`,
      index: slots.length + 1,
      timeMMSS: "",
      songs: [null, null, null, null, null],
    };
    setSlots((prev) => [...prev, newSlot]);
    setNextRowId((n) => n + 1);
  }, [nextRowId, slots.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Row drag: reorder slots
    if (activeId.startsWith("row-") && !activeId.includes("-song-")) {
      const overRowId = overId.includes("-song-")
        ? overId.split("-song-")[0]
        : overId;
      if (!overId.startsWith("row-")) return;

      setSlots((prev) => {
        const oldIdx = prev.findIndex((s) => s.id === activeId);
        const newIdx = prev.findIndex((s) => s.id === overRowId);
        if (oldIdx === -1 || newIdx === -1) return prev;
        const reordered = arrayMove(prev, oldIdx, newIdx);
        return reordered.map((s, i) => ({ ...s, index: i + 1 }));
      });
      return;
    }

    // Song drag: reorder within row
    if (activeId.includes("-song-")) {
      const [rowId] = activeId.split("-song-");
      const [overRowId] = overId.split("-song-");
      if (rowId !== overRowId) return;

      const activeSongIdx = parseInt(activeId.split("-song-")[1], 10);
      const overSongIdx = parseInt(overId.split("-song-")[1], 10);

      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.id !== rowId) return slot;
          const newSongs = arrayMove(
            slot.songs,
            activeSongIdx,
            overSongIdx
          );
          return { ...slot, songs: newSongs };
        })
      );
    }
  }, []);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchRecommendations = useCallback(
    async (
      slot: ExerciseSlot,
      excludeIds: string[] = [],
      limit = 5
    ): Promise<{ tracks: Song[]; error?: string }> => {
      const res = await fetch("/api/spotify/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeMMSS: slot.timeMMSS || undefined,
          genre: slot.genre || undefined,
          bpm: slot.bpm || undefined,
          lyrics: slot.lyrics || undefined,
          limit,
          excludeTrackIds: excludeIds,
        }),
      });
      const data = (await res.json()) as { tracks?: Song[]; error?: string; details?: string };
      if (!res.ok) {
        const msg =
          res.status === 401
            ? "Bitte mit Spotify anmelden."
            : data.error ?? data.details ?? "Spotify-Fehler";
        return { tracks: [], error: msg };
      }
      return { tracks: data.tracks ?? [] };
    },
    []
  );

  const runSearchForSlot = useCallback(
    (slot: ExerciseSlot) => {
      fetchRecommendations(slot).then(({ tracks }) => {
        if (tracks.length === 0) return;
        setSlots((prev) =>
          prev.map((s) => {
            if (s.id !== slot.id) return s;
            const newSongs: (Song | null)[] = [...s.songs];
            for (let i = 0; i < 5 && i < tracks.length; i++) {
              newSongs[i] = tracks[i];
            }
            return { ...s, songs: newSongs };
          })
        );
      });
    },
    [fetchRecommendations]
  );

  const scheduleSearch = useCallback(
    (slot: ExerciseSlot) => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        searchTimeoutRef.current = null;
        runSearchForSlot(slot);
      }, SEARCH_DEBOUNCE_MS);
    },
    [runSearchForSlot]
  );

  const handleTimeChange = useCallback(
    (id: string, value: string) => {
      setSlots((prev) => {
        const slot = prev.find((s) => s.id === id);
        if (!slot) return prev;
        const updated = { ...slot, timeMMSS: value };
        scheduleSearch(updated);
        return prev.map((s) => (s.id === id ? updated : s));
      });
    },
    [scheduleSearch]
  );

  const handleFilterChange = useCallback(
    (id: string, filter: "genre" | "bpm" | "lyrics", value: string) => {
      setSlots((prev) => {
        const slot = prev.find((s) => s.id === id);
        if (!slot) return prev;
        const updated = { ...slot, [filter]: value || undefined };
        scheduleSearch(updated);
        return prev.map((s) => (s.id === id ? updated : s));
      });
    },
    [scheduleSearch]
  );

  const handlePlayPreview = useCallback((url: string) => {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.src = "";
    }
    const audio = new Audio(url);
    audio.play();
    setPreviewAudio(audio);
  }, [previewAudio]);

  const handleLoadNewSong = useCallback(
    async (rowId: string, slotIndex: number) => {
      const slot = slots.find((s) => s.id === rowId);
      if (!slot) return;
      setLoadError(null);
      setLoadingSlot(`${rowId}-${slotIndex}`);
      const excludeIds = slot.songs
        .filter((s): s is Song => s != null)
        .map((s) => s.id);
      const { tracks, error } = await fetchRecommendations(slot, excludeIds, 10);
      setLoadingSlot(null);
      if (error) {
        setLoadError(error);
        return;
      }
      const newTrack = tracks.find((t) => !excludeIds.includes(t.id)) ?? tracks[0];
      if (!newTrack) {
        setLoadError("Keine passenden Songs gefunden. Filter anpassen oder später erneut versuchen.");
        return;
      }
      setLoadError(null);
      setSlots((prev) =>
        prev.map((s) => {
          if (s.id !== rowId) return s;
          const newSongs = [...s.songs];
          newSongs[slotIndex] = newTrack;
          return { ...s, songs: newSongs };
        })
      );
    },
    [slots, fetchRecommendations]
  );

  const handleSave = useCallback(async () => {
    const name = flowName.trim();
    if (!name) {
      setSaveError("Bitte einen Flow-Namen eingeben.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slots: slots.map((s) => ({
            ...s,
            songs: s.songs,
          })),
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string; details?: string };
      if (!res.ok) {
        setSaveError(data.error ?? data.details ?? "Speichern fehlgeschlagen");
        return;
      }
      if (data.id) router.push(`/flows`);
    } catch {
      setSaveError("Netzwerkfehler beim Speichern.");
    } finally {
      setIsSaving(false);
    }
  }, [flowName, slots, router]);

  const rowIds = slots.map((s) => s.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        {/* Header */}
        <div className="grid min-w-[800px] grid-cols-[48px_120px_100px_1fr] gap-4 border-b-2 border-text/20 py-3 font-medium text-text md:grid-cols-[48px_140px_120px_repeat(5,1fr)]">
          <div className="text-center">Nr.</div>
          <div>Grafische Flow Darstellung</div>
          <div>Zeitliche Flow Infos</div>
          <div className="col-span-1 md:col-span-5">
            <div className="mb-1 font-medium">Musik zum Flow</div>
            <div className="flex gap-2 text-xs font-normal text-text/70">
              <span>Vorschlag 1</span>
              <span>Vorschlag 2</span>
              <span>Vorschlag 3</span>
              <span>Vorschlag 4</span>
              <span>Vorschlag 5</span>
            </div>
          </div>
        </div>

        <SortableContext
          items={rowIds}
          strategy={verticalListSortingStrategy}
        >
          {slots.map((slot) => (
            <ExerciseRow
              key={slot.id}
              slot={slot}
              onTimeChange={handleTimeChange}
              onFilterChange={handleFilterChange}
              onPlayPreview={handlePlayPreview}
              onLoadNewSong={handleLoadNewSong}
              loadingSlot={loadingSlot}
            />
          ))}
        </SortableContext>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-wrap items-end gap-4">
            <div className="min-w-[200px]">
              <label htmlFor="flow-name" className="mb-1 block text-sm font-medium text-text">
                Flow-Name
              </label>
              <input
                id="flow-name"
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="z.B. Morgen-Flow"
                className="w-full rounded-lg border border-text/20 bg-background px-3 py-2 text-text"
              />
            </div>
            <button
              type="button"
              onClick={handleAddExercise}
              className="rounded-lg border border-primary bg-primary/10 px-4 py-2 font-medium text-primary transition-colors hover:bg-primary/20"
            >
              + Add Übung
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg bg-primary px-6 py-2 font-medium text-background transition-opacity hover:bg-primary/90 disabled:opacity-60"
          >
            {isSaving ? "Speichern…" : "Speichern"}
          </button>
        </div>
        {(saveError || loadError) && (
          <p className="mt-2 text-sm text-red-600">{saveError ?? loadError}</p>
        )}
      </div>
    </DndContext>
  );
}
