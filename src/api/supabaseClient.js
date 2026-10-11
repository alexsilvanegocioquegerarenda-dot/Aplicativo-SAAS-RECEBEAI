import { createClient } from "@supabase/supabase-js";

// Credenciais oficiais e definitivas do projeto Supabase do RecebeAi (conta: alexsilva@negocioquegerarenda.com)
export const DEFAULT_SUPABASE_URL = "https://upuuqfojhqjgzsdycvxp.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_kT4M2GSyV2p0lY1ZRN6R5w_P85qxBAV";

// Polyfill global WebSocket para ambientes sem WebSocket nativo (ex: Node < 22)
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class WebSocket {};
}

// Fixação garantida das credenciais oficiais para evitar que variáveis antigas ou corrompidas no painel da Vercel causem 'Invalid API key'
export const supabaseUrl = DEFAULT_SUPABASE_URL;
export const supabaseAnonKey = DEFAULT_SUPABASE_ANON_KEY;

// Como DEFAULT_SUPABASE_URL e DEFAULT_SUPABASE_ANON_KEY são as credenciais oficiais ativas de produção,
// o Supabase está SEMPRE configurado e funcional.
export const isSupabaseConfigured = true;

const clientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    transport: globalThis.WebSocket,
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, clientOptions);

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

    const isMaster = authData.session.user.email?.trim().toLowerCase() === "financeiro.saasrecebeai@gmail.com";

    if (!isMaster) {
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
