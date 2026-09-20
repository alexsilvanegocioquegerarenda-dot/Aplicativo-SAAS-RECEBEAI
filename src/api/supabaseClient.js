import { createClient } from '@supabase/supabase-js';

// Credenciais oficiais do projeto Supabase do RecebeAi (conta: alexsilva@negocioquegerarenda.com)
const DEFAULT_SUPABASE_URL = "https://upuuqfojhqjgzsdycvxp.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_kT4M2GSyV2p0lY1ZRN6R5w_P85qxBAV";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey.length > 10 &&
  !supabaseUrl.includes("placeholder-project")
);

// Inicializa o cliente Supabase conectado à nuvem
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://placeholder-project.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder");

/**
 * Testa a conectividade real com a nuvem Supabase em tempo de execução
 */
export async function testarConexaoSupabase() {
  if (!isSupabaseConfigured) {
    return { ok: false, mensagem: "Credenciais do Supabase não configuradas." };
  }

  const inicio = performance.now();
  try {
    const { data, error } = await supabase.from("clientes").select("id").limit(1);
    const duracao = Math.round(performance.now() - inicio);

    if (error && error.code !== "PGRST116" && error.code !== "42501") {
      return { ok: false, mensagem: `Erro retornado pelo Supabase: ${error.message} (Código ${error.code})`, duracao };
    }

    return {
      ok: true,
      url: supabaseUrl,
      duracao,
      mensagem: "Conexão com PostgreSQL Supabase estabelecida com sucesso!",
    };
  } catch (err) {
    return {
      ok: false,
      mensagem: `Falha na comunicação de rede com o Supabase: ${err.message}`,
    };
  }
}