import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase URL und Key müssen in .env.local gesetzt sein.");
  }
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

/** Prüft, ob Supabase konfiguriert ist (für Build-Zeit) */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

export type DbFlow = {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type DbExerciseSlot = {
  id: string;
  flow_id: string;
  index: number;
  time_mm_ss: string;
  genre: string | null;
  bpm: string | null;
  lyrics: string | null;
  graphic_url: string | null;
  songs: unknown;
};
