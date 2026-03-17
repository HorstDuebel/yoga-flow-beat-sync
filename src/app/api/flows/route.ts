import { NextResponse } from "next/server";
import { auth } from "auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ExerciseSlot, Song } from "@/types/editor";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id ?? session.user.email ?? "";
  if (!userId) {
    return NextResponse.json({ error: "User-ID fehlt" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase nicht konfiguriert. .env.local prüfen." },
      { status: 503 }
    );
  }

  const supabase = getSupabase();
  const { data: flows, error } = await supabase
    .from("flows")
    .select("id, name, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Supabase Fehler", details: error.message },
      { status: 500 }
    );
  }

  const flowsWithSlots = await Promise.all(
    (flows ?? []).map(async (f) => {
      const { data: slots } = await getSupabase()
        .from("exercise_slots")
        .select("*")
        .eq("flow_id", f.id)
        .order("index");
      return {
        id: f.id,
        name: f.name,
        slots: mapDbSlotsToSlots(slots ?? []),
      };
    })
  );

  return NextResponse.json(flowsWithSlots);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const userId = (session.user as { id?: string }).id ?? session.user.email ?? "";
  if (!userId) {
    return NextResponse.json({ error: "User-ID fehlt" }, { status: 400 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase nicht konfiguriert. .env.local prüfen." },
      { status: 503 }
    );
  }

  let body: { name: string; slots: ExerciseSlot[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger Body" }, { status: 400 });
  }

  const { name, slots } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "Flow-Name erforderlich" }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data: flow, error: flowError } = await supabase
    .from("flows")
    .insert({
      name: name.trim(),
      user_id: userId,
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (flowError || !flow) {
    return NextResponse.json(
      { error: "Flow konnte nicht erstellt werden", details: flowError?.message },
      { status: 500 }
    );
  }

  const slotsToInsert = slots.map((s, i) => ({
    flow_id: flow.id,
    index: i + 1,
    time_mm_ss: s.timeMMSS ?? "",
    genre: s.genre ?? null,
    bpm: s.bpm ?? null,
    lyrics: s.lyrics ?? null,
    graphic_url: s.graphicUrl ?? null,
    songs: s.songs ?? [],
    updated_at: new Date().toISOString(),
  }));

  const { error: slotsError } = await getSupabase()
    .from("exercise_slots")
    .insert(slotsToInsert);

  if (slotsError) {
    await getSupabase().from("flows").delete().eq("id", flow.id);
    return NextResponse.json(
      { error: "Übungen konnten nicht gespeichert werden", details: slotsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: flow.id, name: name.trim() });
}

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
}>): ExerciseSlot[] {
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
