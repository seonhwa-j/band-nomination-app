import { createClient } from "@supabase/supabase-js";

const cleanEnv = (value: string | undefined) => (value || "").trim().replace(/^["']|["']$/g, "");

const isValidSupabaseUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".supabase.co") && !url.hostname.includes("YOUR_PROJECT_REF");
  } catch {
    return false;
  }
};

export const supabaseConfig = {
  url: cleanEnv(import.meta.env.VITE_SUPABASE_URL).replace(/\/$/, ""),
  anonKey: cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY),
};

export const isSupabaseConfigured = Boolean(isValidSupabaseUrl(supabaseConfig.url) && supabaseConfig.anonKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseConfig.url, supabaseConfig.anonKey) : null;
