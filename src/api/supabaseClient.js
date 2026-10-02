import { createClient } from '@supabase/supabase-js';

// Credenciais oficiais do projeto Supabase do RecebeAi (conta: alexsilva@negocioquegerarenda.com)
const DEFAULT_SUPABASE_URL = "https://upuuqfojhqjgzsdycvxp.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_kT4M2GSyV2p0lY1ZRN6R5w_P85qxBAV";

// Polyfill global WebSocket para ambientes sem WebSocket nativo (ex: Node < 22)
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class WebSocket {};
}

const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? import.meta.env
    : typeof process !== "undefined" && process.env
    ? process.env
    : {};

const supabaseUrl = env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("http") &&
  supabaseAnonKey.length > 10 &&
  !supabaseUrl.includes("placeholder-project")
);

const clientOptions = {
  auth: { persistSession: true },
  realtime: {
    transport: globalThis.WebSocket,
  },
};

// Inicializa o cliente Supabase conectado à nuvem
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, clientOptions)
  : createClient("https://placeholder-project.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder", clientOptions);

/**
 * Testa a conectividade real com a nuvem Supabase em tempo de execução
 */
export async function testarConexaoSupabase() {
  if (!isSupabaseConfigured) {
    return { ok: false, status: "not_configured", mensagem: "Credenciais do Supabase não configuradas." };
  }

  const inicio = performance.now();
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError || !authData?.session) {
      return {
        ok: false,
        status: "permission_error",
        mensagem: authError?.message || "Nenhuma sessão autenticada do Supabase está ativa.",
        duracao: Math.round(performance.now() - inicio),
      };
    }

    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", authData.session.user.id)
      .maybeSingle();

    if (empresaError || !empresa) {
      const permissionError = !empresaError || ["42501", "PGRST301", "401", "403"].includes(String(empresaError.code || empresaError.status));
      return {
        ok: false,
        status: permissionError ? "permission_error" : "connection_error",
        mensagem: empresaError?.message || "A sessão não está vinculada a uma empresa no Supabase.",
        duracao: Math.round(performance.now() - inicio),
      };
    }

    const { data, error } = await supabase.from("clientes").select("id").limit(1);
    const duracao = Math.round(performance.now() - inicio);

    if (error) {
      const permissionError = ["42501", "PGRST301", "401", "403"].includes(String(error.code || error.status));
      return {
        ok: false,
        status: permissionError ? "permission_error" : "connection_error",
        mensagem: `Erro retornado pelo Supabase: ${error.message} (Código ${error.code || error.status || "desconhecido"})`,
        duracao,
      };
    }

    return {
      ok: true,
      status: "connected",
      url: supabaseUrl,
      duracao,
      mensagem: "Conexão com PostgreSQL Supabase estabelecida com sucesso!",
    };
  } catch (err) {
    return {
      ok: false,
      status: "connection_error",
      mensagem: `Falha na comunicação de rede com o Supabase: ${err.message}`,
    };
  }
}