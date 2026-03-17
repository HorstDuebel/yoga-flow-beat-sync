export type Song = {
  id: string;
  title?: string;
  artist?: string;
  previewUrl?: string;
  imageUrl?: string;
};

export type ExerciseSlot = {
  id: string;
  index: number;
  graphicUrl?: string;
  timeMMSS: string;
  genre?: string;
  bpm?: string;
  lyrics?: string;
  songs: (Song | null)[];
};

export const GENRE_OPTIONS = [
  "Ambient",
  "Meditation",
  "World",
  "Acoustic",
  "Electronic",
  "Classical",
  "Nature",
] as const;

export const BPM_OPTIONS = [
  "60-80",
  "80-100",
  "100-120",
  "120-140",
  "140+",
] as const;

export const LYRICS_OPTIONS = ["Instrumental", "Vocal", "Mantra", "Mix"] as const;
