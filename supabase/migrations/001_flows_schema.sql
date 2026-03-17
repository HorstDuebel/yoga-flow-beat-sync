-- KundaFlow-Beat-Sync: Flows & Exercise Slots Schema
-- In Supabase SQL Editor ausführen oder: supabase db push

-- Flows (Haupttabelle)
CREATE TABLE IF NOT EXISTS flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise Slots (Übungen pro Flow)
CREATE TABLE IF NOT EXISTS exercise_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  time_mm_ss TEXT NOT NULL DEFAULT '',
  genre TEXT,
  bpm TEXT,
  lyrics TEXT,
  graphic_url TEXT,
  songs JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON flows(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_slots_flow_id ON exercise_slots(flow_id);

-- RLS (optional, falls Supabase Auth genutzt wird)
-- ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exercise_slots ENABLE ROW LEVEL SECURITY;
