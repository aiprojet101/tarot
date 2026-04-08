import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Whether Supabase is actually configured
export const isSupabaseConfigured =
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  tarot_elo: number;
  tarot_games_played: number;
  tarot_wins: number;
  tarot_best_elo: number;
  created_at: string;
  updated_at: string;
}
