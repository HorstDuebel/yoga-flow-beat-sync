import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Flow } from "@/types/flow";
import type { Song } from "@/types/editor";

function normalizeSong(raw: unknown): Song | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!o.id || typeof o.id !== "string") return null;
  return {
    id: o.id,
    title: typeof o.title === "string" ? o.title : undefined,
    artist: typeof o.artist === "string" ? o.artist : undefined,
    previewUrl: typeof o.previewUrl === "string" ? o.previewUrl : undefined,
    imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : undefined,
  };
}

function mapDbSlotsToSlots(dbSlots: Array<{
  id: string;
  index: number;
  time_mm_ss: string;
  genre: string | null;
  bpm: string | null;
  lyrics: string | null;
  graphic_url: string | null;
  songs: unknown;
}>): Flow["slots"] {
  return dbSlots.map((s) => {
    const rawSongs = Array.isArray(s.songs) ? s.songs : [];
    const songs: (Song | null)[] = [];
    for (let i = 0; i < 5; i++) {
      songs.push(normalizeSong(rawSongs[i]));
    }
    return {
      id: s.id,
      index: s.index,
      timeMMSS: s.time_mm_ss ?? "",
      genre: s.genre ?? undefined,
      bpm: s.bpm ?? undefined,
      lyrics: s.lyrics ?? undefined,
      graphicUrl: s.graphic_url ?? undefined,
      songs,
    };
  });
}

/** Flow anhand der ID laden (aus Supabase) */
export async function getFlowById(id: string): Promise<Flow | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabase();
    const { data: flow, error: flowError } = await supabase
      .from("flows")
      .select("id, name")
      .eq("id", id)
      .single();

    if (flowError || !flow) return null;

    const { data: slots, error: slotsError } = await getSupabase()
      .from("exercise_slots")
      .select("*")
      .eq("flow_id", flow.id)
      .order("index");

    if (slotsError) return null;

    return {
      id: flow.id,
      name: flow.name,
      slots: mapDbSlotsToSlots(slots ?? []),
    };
  } catch {
    return null;
  }
}

/** Alle Flows eines Users laden */
export async function getFlows(userId: string): Promise<Flow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data: flows, error: flowError } = await supabase
      .from("flows")
      .select("id, name")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (flowError || !flows?.length) return [];

    const result: Flow[] = [];
    for (const f of flows) {
      const flow = await getFlowById(f.id);
      if (flow) result.push(flow);
    }
    return result;
  } catch {
    return [];
  }
}
