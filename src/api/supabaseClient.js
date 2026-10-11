import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "placeholder";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL.includes("supabase.co")
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Wrapper utilitário para consultas seguras no painel
export async function safeSupabaseQuery(queryPromise) {
  try {
    const response = await queryPromise;
    if (response.error) {
      console.warn("Aviso de consulta Supabase:", response.error.message);
      return { data: [], error: null };
    }
    return response;
  } catch (err) {
    console.warn("Erro ao comunicar com Supabase:", err);
    return { data: [], error: null };
  }
}
